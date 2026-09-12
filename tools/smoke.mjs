#!/usr/bin/env node
// じどう どうさ かくにん：Chromium を CDP で うごかして あそびを さいごまで すすめる。
// npm install ふよう（Node ないぞうの WebSocket を つかう）。
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { findChromium } from './make-icons.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.SHOT_DIR || join(ROOT, 'docs/screenshots');
const PORT = Number(process.env.PORT || 4173);
const BASE = `http://127.0.0.1:${PORT}/`;
const DEVTOOLS_PORT = Number(process.env.CDP_PORT || 9333);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, { timeout = 20000, interval = 200, label = 'じょうけん' } = {}) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    try {
      last = await fn();
      if (last) return last;
    } catch (err) { last = err.message; }
    await sleep(interval);
  }
  throw new Error(`タイムアウト: ${label}`);
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.errors = [];
    ws.addEventListener('message', (ev) => this.onMessage(JSON.parse(ev.data)));
  }

  onMessage(msg) {
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      this.errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      this.errors.push(`${msg.params.entry.text} (${msg.params.entry.url || ''})`);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      this.errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
    }
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP タイムアウト: ${method}`));
        }
      }, 30000);
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'evaluate しっぱい');
    }
    return res.result.value;
  }

  async shot(name) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const path = join(OUT, `${name}.png`);
    await writeFile(path, Buffer.from(data, 'base64'));
    console.log(`  📸 ${name}.png`);
    return path;
  }
}

async function launch(width, height) {
  const chromium = findChromium();
  if (!chromium) throw new Error('Chromium が みつかりません（CHROMIUM_PATH を してい して ください）');
  const profile = join(tmpdir(), `kidstry-smoke-${Date.now()}`);
  const proc = spawn(chromium, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--disable-dev-shm-usage',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${DEVTOOLS_PORT}`,
    `--window-size=${width},${height}`,
    'about:blank',
  ], { stdio: 'ignore' });

  const target = await waitFor(async () => {
    const res = await fetch(`http://127.0.0.1:${DEVTOOLS_PORT}/json/list`);
    const list = await res.json();
    return list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  }, { label: 'DevTools の きどう' });

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  const cdp = new Cdp(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  return {
    cdp,
    async close() {
      try { ws.close(); } catch { /* むし */ }
      proc.kill('SIGKILL');
      await rm(profile, { recursive: true, force: true }).catch(() => {});
    },
  };
}

async function startServer() {
  const proc = spawn(process.execPath, [join(ROOT, 'tools/serve.mjs')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
  await waitFor(async () => (await fetch(BASE)).ok, { label: 'サーバーの きどう' });
  return () => proc.kill('SIGKILL');
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

    // 9つの あそびが すべて ひらけるか
    const gameIds = await cdp.eval('window.__kidstry.gameIds');
    for (const id of gameIds) {
      await cdp.eval(`window.__kidstry.goQuiz(${JSON.stringify(id)})`);
      const ok = await waitFor(() => cdp.eval("!!document.querySelector('.choice')"), { label: `${id} の がめん`, timeout: 6000 })
        .catch(() => false);
      if (!ok) failures.push(`${id}: もんだいが ひょうじ されない`);
      else console.log(`  ✓ ${id}`);
    }

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

    const saved = await cdp.eval("JSON.parse(localStorage.getItem('kidstry:v1')).games['hiragana-find'].plays");
    if (!saved) failures.push('きろくが ほぞん されて いない');

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
