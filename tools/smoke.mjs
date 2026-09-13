#!/usr/bin/env node
// じどう どうさ かくにん：Chromium を CDP で うごかして あそびを さいごまで すすめる。
// npm install ふよう（Node ないぞうの WebSocket を つかう）。
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { launchBrowser, findChromium, waitFor, sleep } from './cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.SHOT_DIR || join(ROOT, 'docs/screenshots');
const PORT = Number(process.env.PORT || 4173);
const SITE_PATH = process.env.SITE_PATH || '/';
const BASE = `http://127.0.0.1:${PORT}${SITE_PATH}`;
const DEVTOOLS_PORT = Number(process.env.CDP_PORT || 9333);

/** スクリーンショットを ファイルに のこせる ように する */
async function launch(width, height) {
  const session = await launchBrowser({ width, height, port: DEVTOOLS_PORT });
  session.cdp.shot = async (name) => {
    await writeFile(join(OUT, `${name}.png`), await session.cdp.screenshot());
    console.log(`  📸 ${name}.png`);
  };
  return session;
}

async function startServer() {
  const proc = spawn(process.execPath, [join(ROOT, 'tools/serve.mjs')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
  await waitFor(async () => (await fetch(BASE)).ok, { label: 'サーバーの きどう' });
  return () => proc.kill('SIGKILL');
}

/** localStorage の きろくを さしかえて アプリを よみこみ なおす */
async function seedState(cdp, patch) {
  await cdp.eval(`(() => {
    const key = 'kidstry:v1';
    const cur = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...cur, ...${JSON.stringify(patch)} }));
    return true;
  })()`);
  await cdp.send('Page.reload');
  await waitFor(() => cdp.eval("!!document.querySelector('.start-btn')"), { label: 'よみこみ なおし' });
  await cdp.eval("document.querySelector('.start-btn').click()");
  await waitFor(() => cdp.eval("!!document.querySelector('.tile')"), { label: 'ホーム' });
  await sleep(250);
}

async function gotoApp(cdp) {
  await cdp.send('Page.navigate', { url: BASE });
  await waitFor(() => cdp.eval("!!document.querySelector('.start-btn')"), { label: 'スタート がめん' });
  await sleep(300);
}

/** せいかいするまで まだ おせる せんたくしを じゅんばんに おす */
async function playThrough(cdp, maxClicks = 120) {
  for (let i = 0; i < maxClicks; i++) {
    const done = await cdp.eval("!!document.querySelector('.screen-result')");
    if (done) return true;
    const clicked = await cdp.eval(`(() => {
      const btn = [...document.querySelectorAll('.choice')].find((b) => !b.disabled && !b.classList.contains('is-correct'));
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    await sleep(clicked ? 260 : 500);
  }
  return cdp.eval("!!document.querySelector('.screen-result')");
}

/** Service Worker が とうろく され、つうしん なしでも ひらくか たしかめる */
async function checkOffline(cdp) {
  const controlled = await waitFor(
    () => cdp.eval('!!navigator.serviceWorker && !!navigator.serviceWorker.controller'),
    { label: 'Service Worker が ページを うけもつ', timeout: 15000 },
  ).catch(() => false);
  if (!controlled) return ['Service Worker が とうろく されない'];

  const cached = await cdp.eval(`(async () => {
    const keys = await caches.keys();
    const name = keys.find((k) => k.startsWith('kidstry'));
    if (!name) return 0;
    return (await (await caches.open(name)).keys()).length;
  })()`);
  if (!cached || cached < 30) return [`キャッシュが たりない（${cached}こ）`];
  console.log(`  ✓ キャッシュ ${cached}こ`);

  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
  });
  await cdp.send('Page.reload', { ignoreCache: false });
  const opened = await waitFor(() => cdp.eval("!!document.querySelector('.start-btn')"), {
    label: 'オフラインでの さいよみこみ', timeout: 15000,
  }).catch(() => false);
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
  });
  if (!opened) return ['オフラインで アプリが ひらかない'];
  console.log('  ✓ オフラインでも きどう する');

  await cdp.send('Page.reload');
  await waitFor(() => cdp.eval("!!document.querySelector('.start-btn')"), { label: 'オンライン ふっき' });
  return [];
}

/** きろくの かきだし・よみこみ を たしかめる */
async function checkBackup(cdp, workDir) {
  const failures = [];
  await cdp.eval('window.__kidstry.goParent()');
  await waitFor(() => cdp.eval("!!document.querySelector('.backup-actions')"), { label: 'ほぞん ボタン' });

  // かきだし：ほんものの ダウンロードが おきるか
  const downloadDir = join(workDir, 'downloads');
  await mkdir(downloadDir, { recursive: true });
  let downloadReady = true;
  try {
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });
  } catch {
    try {
      await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });
    } catch {
      downloadReady = false;
    }
  }
  if (downloadReady) {
    await cdp.eval("[...document.querySelectorAll('.pill-action')].find((b) => b.textContent.includes('ほぞん')).click()");
    const saved = await waitFor(async () => {
      const files = await readdir(downloadDir).catch(() => []);
      return files.find((f) => f.endsWith('.json'));
    }, { label: 'きろくファイルの かきだし', timeout: 10000 }).catch(() => null);
    if (!saved) {
      failures.push('きろくファイルが かきだせない');
    } else {
      const text = await readFile(join(downloadDir, saved), 'utf8');
      const parsed = JSON.parse(text);
      if (parsed.app !== 'kidstry' || !parsed.state) failures.push('かきだした ファイルの なかみが おかしい');
      else console.log(`  ✓ かきだし（${saved}）`);
    }
  } else {
    console.log('  - ダウンロードの かくにんは スキップ');
  }

  // よみこみ：べつの きろくを わたして おきかわるか
  const fixture = join(workDir, 'restore.json');
  await writeFile(fixture, JSON.stringify({
    app: 'kidstry',
    version: 1,
    exportedAt: '2026-01-15T00:00:00.000Z',
    state: {
      version: 1,
      profile: { name: 'テスト', level: 2 },
      settings: { sound: true, speech: true },
      stickers: ['st01', 'st02', 'st03'],
      lastPlayDate: '2026-01-15',
      streak: 7,
      totalPlayMs: 1234000,
      games: { clock: { plays: 5, firstTryCorrect: 40, questions: 50, bestStars: 3, lastPlayed: '2026-01-15' } },
    },
  }), 'utf8');

  await cdp.setFileInput('.screen-parent input[type=file]', fixture);
  const asked = await waitFor(() => cdp.eval("!!document.querySelector('.modal-card')"), {
    label: 'よみこみ かくにん ダイアログ', timeout: 8000,
  }).catch(() => false);
  if (!asked) {
    failures.push('よみこみの かくにん ダイアログが でない');
    return failures;
  }
  const shown = await cdp.eval("document.querySelector('.modal-card').textContent");
  if (!shown.includes('5回') || !shown.includes('3まい')) {
    failures.push(`かくにん ダイアログに なかみが でて いない: ${shown.slice(0, 80)}`);
  }

  // 「やめる」では かわらない こと
  await cdp.eval("document.querySelector('.modal-btn-cancel').click()");
  await sleep(200);
  const untouched = await cdp.eval("(JSON.parse(localStorage.getItem('kidstry:v1')).games.clock || {}).plays || 0");
  if (untouched === 5) failures.push('やめる を おしたのに よみこまれた');

  // もういちど わたして こんどは よみこむ
  await cdp.setFileInput('.screen-parent input[type=file]', fixture);
  await waitFor(() => cdp.eval("!!document.querySelector('.modal-btn-ok')"), { label: 'よみこむ ボタン' });
  await sleep(400);
  await cdp.shot('11-backup-confirm');
  await cdp.eval("document.querySelector('.modal-btn-ok').click()");
  await sleep(400);

  const after = await cdp.eval("JSON.parse(localStorage.getItem('kidstry:v1'))");
  if (after.games.clock?.plays !== 5) failures.push('よみこんだ きろくが はんえい されない');
  if (after.stickers.length !== 3) failures.push('よみこんだ シールが はんえい されない');
  if (after.profile.name !== 'テスト') failures.push('よみこんだ なまえが はんえい されない');
  if (!failures.length) console.log('  ✓ よみこみ（きろくが おきかわる）');

  // おわりの おしらせを とじて、がめんが こわれて いない ことを たしかめる
  const done = await cdp.eval("!!document.querySelector('.modal-card')");
  if (done) await cdp.eval("document.querySelector('.modal-btn-ok').click()");
  await sleep(200);
  const stillThere = await cdp.eval("!!document.querySelector('.backup-actions')");
  if (!stillThere) failures.push('よみこみ後に がめんが こわれた');
  await cdp.eval("document.querySelector('.backup-actions').scrollIntoView({ block: 'center' })");
  await sleep(350);
  await cdp.shot('12-backup-card');
  return failures;
}

/** シールを あつめると あたらしい あそびが ふえるか たしかめる */
async function checkUnlock(cdp, gameIds, lockedIds) {
  const failures = [];
  const allStickers = Array.from({ length: 24 }, (_, i) => `st${String(i + 1).padStart(2, '0')}`);

  // あと1まい の じょうたいから あそんで、おいわいが でるか
  await seedState(cdp, { stickers: allStickers.slice(0, 23) });
  await cdp.eval(`window.__kidstry.goQuiz('counting')`);
  await waitFor(() => cdp.eval("!!document.querySelector('.choice')"), { label: 'さいごの 1まいの ため の あそび' });
  if (!await playThrough(cdp)) failures.push('さいごまで すすめ られなかった');
  const celebrated = await waitFor(() => cdp.eval("!!document.querySelector('.bonus-unlock')"), {
    label: 'あそびが ふえた おいわい', timeout: 12000,
  }).catch(() => false);
  if (!celebrated) {
    failures.push('シールを ぜんぶ あつめても おいわいが でない');
  } else {
    const text = await cdp.eval("document.querySelector('.bonus-unlock').textContent");
    if (!text.includes('しりとり')) failures.push('おいわいに あたらしい あそびが のって いない');
    await sleep(400);
    await cdp.shot('13-unlock');
    console.log('  ✓ おいわいが でた');
  }

  // ふえた あそびが じっさいに ひらくか
  await cdp.eval("window.__kidstry.goHome()");
  await sleep(250);
  if (await cdp.eval("document.querySelectorAll('.tile-locked').length") !== 0) {
    failures.push('かいきん ごも タイルに かぎが かかった まま');
  }
  if (await cdp.eval("document.querySelectorAll('.tile').length") !== gameIds.length) {
    failures.push(`タイルの かずが ${gameIds.length}こ に ならない`);
  }
  await cdp.shot('14-home-unlocked');

  for (const id of lockedIds) {
    await cdp.eval(`window.__kidstry.goQuiz(${JSON.stringify(id)})`);
    const ok = await waitFor(() => cdp.eval("!!document.querySelector('.choice')"), { label: `${id}`, timeout: 6000 })
      .catch(() => false);
    if (!ok) failures.push(`${id}: かいきん ごも あそべない`);
    else console.log(`  ✓ ${id}（あそべる ように なった）`);
    if (id === 'shiritori') {
      await sleep(300);
      await cdp.shot('15-shiritori');
    }
  }

  // きんメダル：★3を とった あそびが コレクションに のるか
  await seedState(cdp, {
    stickers: allStickers,
    games: {
      clock: { plays: 3, firstTryCorrect: 30, questions: 30, bestStars: 3, lastPlayed: '2026-09-13' },
      counting: { plays: 2, firstTryCorrect: 12, questions: 20, bestStars: 2, lastPlayed: '2026-09-13' },
    },
  });
  await cdp.eval("window.__kidstry.goStickers()");
  await waitFor(() => cdp.eval("!!document.querySelector('.collection-tab')"), { label: 'コレクション' });
  // シールが そろって いれば メダルの タブが さいしょから ひらく
  if (!await cdp.eval("!!document.querySelector('.medal-grid')")) {
    failures.push('シール コンプリート後も メダルの タブが ひらかない');
    await cdp.eval("[...document.querySelectorAll('.collection-tab')].find((b) => b.textContent.includes('メダル')).click()");
  }
  await waitFor(() => cdp.eval("!!document.querySelector('.medal-grid')"), { label: 'メダルの たな' });
  const owned = await cdp.eval("document.querySelectorAll('.medal-cell.is-owned').length");
  if (owned !== 1) failures.push(`きんメダルが ${owned}こ（★3の 1こ のはず）`);
  const slots = await cdp.eval("document.querySelectorAll('.medal-cell').length");
  if (slots !== gameIds.length) failures.push(`メダルの たなが ${slots}こ（${gameIds.length}こ のはず）`);
  await sleep(300);
  await cdp.shot('16-medals');
  if (!failures.length) console.log('  ✓ きんメダルが コレクションに のる');
  return failures;
}

async function run() {
  if (!findChromium()) {
    console.warn('⚠ Chromium が みつからないので スモークテストは スキップします。');
    console.warn('  CHROMIUM_PATH=/path/to/chrome npm run smoke で じっこう できます。');
    return;
  }
  await mkdir(OUT, { recursive: true });
  const stopServer = await startServer();
  const failures = [];
  let session;
  try {
    console.log('▶ タブレット よこむき（1024x768）で かくにん');
    session = await launch(1024, 768);
    const { cdp } = session;
    await gotoApp(cdp);
    await cdp.shot('01-start');

    await cdp.eval("document.querySelector('.start-btn').click()");
    await waitFor(() => cdp.eval("!!document.querySelector('.tile')"), { label: 'ホーム' });
    await sleep(300);
    await cdp.shot('02-home');

    // かぎの かかって いない あそびは ひらけて、かかって いる ものは ひらけない
    const gameIds = await cdp.eval('window.__kidstry.gameIds');
    const lockedIds = await cdp.eval('window.__kidstry.lockedIds');
    if (lockedIds.length !== 3) failures.push(`かぎつきの あそびが ${lockedIds.length}こ（3こ のはず）`);

    for (const id of gameIds.filter((g) => !lockedIds.includes(g))) {
      await cdp.eval(`window.__kidstry.goQuiz(${JSON.stringify(id)})`);
      const ok = await waitFor(() => cdp.eval("!!document.querySelector('.choice')"), { label: `${id} の がめん`, timeout: 6000 })
        .catch(() => false);
      if (!ok) failures.push(`${id}: もんだいが ひょうじ されない`);
      else console.log(`  ✓ ${id}`);
    }
    for (const id of lockedIds) {
      await cdp.eval("window.__kidstry.goHome()");
      await sleep(150);
      await cdp.eval(`window.__kidstry.goQuiz(${JSON.stringify(id)})`);
      await sleep(400);
      if (await cdp.eval("!!document.querySelector('.choice')")) {
        failures.push(`${id}: シールを あつめる まえに あそべて しまう`);
      } else {
        console.log(`  ✓ ${id}（まだ あそべない）`);
      }
    }
    await cdp.eval("window.__kidstry.goHome()");
    await waitFor(() => cdp.eval("document.querySelectorAll('.tile-locked').length === 3"), { label: 'かぎの ついた タイル' });
    await sleep(200);
    await cdp.shot('02b-home-locked');

    // ひらがな さがしを さいごまで
    await cdp.eval("window.__kidstry.goQuiz('hiragana-find')");
    await waitFor(() => cdp.eval("!!document.querySelector('.choice')"), { label: 'クイズ' });
    await sleep(400);
    await cdp.shot('03-quiz');
    const finished = await playThrough(cdp);
    if (!finished) failures.push('さいごまで すすめ られなかった');
    await sleep(1800);
    await cdp.shot('04-result');

    await cdp.eval("window.__kidstry.goStickers()");
    await sleep(400);
    await cdp.shot('05-stickers');

    // おうちのかたページは 3びょう ながおし でしか ひらけない
    await cdp.eval("window.__kidstry.goHome()");
    await waitFor(() => cdp.eval("!!document.querySelector('.pill-parent')"), { label: 'ホーム（ながおし まえ）' });
    await cdp.eval(`(() => {
      const btn = document.querySelector('.pill-parent');
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      return true;
    })()`);
    await sleep(800);
    if (await cdp.eval("!!document.querySelector('.screen-parent')")) {
      failures.push('おうちのかたページが ながおし なしで ひらいた');
    }
    await sleep(2600);
    const parentOpened = await waitFor(() => cdp.eval("!!document.querySelector('.screen-parent')"), { label: 'おうちのかたページ', timeout: 5000 })
      .catch(() => false);
    if (!parentOpened) failures.push('3びょう ながおし で おうちのかたページが ひらかない');
    await sleep(300);
    await cdp.shot('06-parent');

    // かずの あそびも え を のこす
    await cdp.eval("window.__kidstry.goQuiz('counting')");
    await sleep(500);
    await cdp.shot('07-counting');
    await cdp.eval("window.__kidstry.goQuiz('clock')");
    await sleep(500);
    await cdp.shot('08-clock');

    // ようびの おびと、みぎ・ひだりの おびが えがかれて いるか
    await cdp.eval("window.__kidstry.goQuiz('weekday')");
    await waitFor(() => cdp.eval("!!document.querySelector('.week-strip')"), { label: 'ようびの おび' });
    const weekCells = await cdp.eval("document.querySelectorAll('.week-cell').length");
    if (weekCells !== 7) failures.push(`ようびの おびが ${weekCells}マス（7マス のはず）`);
    if (await cdp.eval("document.querySelectorAll('.week-cell.is-ask').length") !== 1) {
      failures.push('ようびの おびに ？が 1つ ない');
    }
    await sleep(400);
    await cdp.shot('17-weekday');

    await cdp.eval("window.__kidstry.goQuiz('left-right')");
    await waitFor(() => cdp.eval("!!document.querySelector('.dir-band')"), { label: 'みぎ・ひだりの おび' });
    const dirText = await cdp.eval("document.querySelector('.dir-band').textContent");
    if (!dirText.includes('ひだり') || !dirText.includes('みぎ')) failures.push('むきの おびの もじが たりない');
    await sleep(400);
    await cdp.shot('18-left-right');

    const saved = await cdp.eval("JSON.parse(localStorage.getItem('kidstry:v1')).games['hiragana-find'].plays");
    if (!saved) failures.push('きろくが ほぞん されて いない');

    console.log('▶ シール コンプリートで あそびが ふえるか');
    failures.push(...await checkUnlock(cdp, gameIds, lockedIds));

    console.log('▶ きろくの ほぞん・よみこみ の かくにん');
    failures.push(...await checkBackup(cdp, join(tmpdir(), `kidstry-backup-${Date.now()}`)));

    console.log('▶ PWA（オフライン）の かくにん');
    failures.push(...await checkOffline(cdp));

    if (cdp.errors.length) failures.push(...cdp.errors.map((e) => `コンソール エラー: ${e}`));
    await session.close();
    session = null;

    console.log('▶ スマホ たてむき（390x844）で かくにん');
    session = await launch(390, 844);
    await gotoApp(session.cdp);
    await session.cdp.eval("document.querySelector('.start-btn').click()");
    await waitFor(() => session.cdp.eval("!!document.querySelector('.tile')"), { label: 'ホーム（たて）' });
    await sleep(300);
    await session.cdp.shot('09-home-portrait');
    await session.cdp.eval("window.__kidstry.goQuiz('word-start')");
    await sleep(600);
    await session.cdp.shot('10-quiz-portrait');
    if (session.cdp.errors.length) failures.push(...session.cdp.errors.map((e) => `コンソール エラー(たて): ${e}`));
  } finally {
    if (session) await session.close();
    stopServer();
  }

  if (failures.length) {
    console.error('\n✗ しっぱい:');
    failures.forEach((f) => console.error('  -', f));
    process.exitCode = 1;
  } else {
    console.log('\n✓ すべて OK');
  }
}

await run();
