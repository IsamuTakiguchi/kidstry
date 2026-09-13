import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultState, starsFor, nextStreak, recordSession, awardSticker,
  accuracy, domainStats, totalPlays, migrate, createStore, todayKey, STORAGE_KEY,
  exportPayload, parseBackup, backupFileName,
  stickerBookComplete, stickersLeft, hasMedal, medalCount, sessionRewards, STICKER_GOAL,
} from '../src/core/state.js';
import { STICKERS } from '../src/data/stickers.js';
import { GAMES } from '../src/games/index.js';

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

test('ほしの かず', () => {
  assert.equal(starsFor(10, 10), 3);
  assert.equal(starsFor(9, 10), 3);
  assert.equal(starsFor(8, 10), 2);
  assert.equal(starsFor(7, 10), 2);
  assert.equal(starsFor(6, 10), 1);
  assert.equal(starsFor(0, 10), 1);
  assert.equal(starsFor(0, 0), 1, 'もんだいが 0でも おちない');
});

test('れんぞく きろく', () => {
  assert.equal(nextStreak(null, 0, '2026-09-12'), 1, 'はじめては 1にち');
  assert.equal(nextStreak('2026-09-11', 3, '2026-09-12'), 4, 'きのうから つづくと +1');
  assert.equal(nextStreak('2026-09-12', 3, '2026-09-12'), 3, 'おなじ日は そのまま');
  assert.equal(nextStreak('2026-09-09', 5, '2026-09-12'), 1, 'あいたら 1に もどる');
  assert.equal(nextStreak('2026-03-01', 2, '2026-03-02'), 3, 'つきを またいでも つづく');
  assert.equal(nextStreak('2026-12-31', 2, '2027-01-01'), 3, 'としを またいでも つづく');
});

test('あそんだ きろくを ためる', () => {
  let s = defaultState();
  s = recordSession(s, { gameId: 'counting', firstTryCorrect: 9, questions: 10, durationMs: 60000, today: '2026-09-12' });
  assert.equal(s.games.counting.plays, 1);
  assert.equal(s.games.counting.bestStars, 3);
  assert.equal(s.totalPlayMs, 60000);
  s = recordSession(s, { gameId: 'counting', firstTryCorrect: 3, questions: 10, durationMs: 30000, today: '2026-09-13' });
  assert.equal(s.games.counting.plays, 2);
  assert.equal(s.games.counting.bestStars, 3, 'さいこう きろくは さがらない');
  assert.equal(s.streak, 2);
  assert.equal(totalPlays(s), 2);
  assert.equal(accuracy(s, 'counting'), 12 / 20);
  assert.equal(accuracy(s, 'clock'), null, 'あそんで いない ゲームは null');
});

test('もとの state を こわさない', () => {
  const before = defaultState();
  const snapshot = JSON.stringify(before);
  recordSession(before, { gameId: 'clock', firstTryCorrect: 5, questions: 10, today: '2026-09-12' });
  assert.equal(JSON.stringify(before), snapshot);
});

test('シールは じゅうふく せず、ぜんぶ そろうと null', () => {
  let s = defaultState();
  const got = new Set();
  for (let i = 0; i < STICKERS.length; i++) {
    const r = awardSticker(s, () => 0);
    assert.ok(r.sticker, `${i}まいめが もらえない`);
    assert.ok(!got.has(r.sticker.id), 'おなじ シールが 2まい');
    got.add(r.sticker.id);
    s = r.state;
  }
  assert.equal(s.stickers.length, STICKERS.length);
  assert.equal(awardSticker(s, () => 0).sticker, null, 'ぜんぶ そろったら null');
});

test('りょういき べつの せいかいりつ', () => {
  let s = defaultState();
  s = recordSession(s, { gameId: 'counting', firstTryCorrect: 8, questions: 10, today: '2026-09-12' });
  s = recordSession(s, { gameId: 'addition', firstTryCorrect: 2, questions: 10, today: '2026-09-12' });
  const stats = domainStats(s, GAMES);
  const kazu = stats.find((x) => x.domain === 'かず');
  assert.equal(kazu.plays, 2);
  assert.equal(kazu.rate, 10 / 20);
  assert.equal(stats.length, 1, 'あそんで いない りょういきは でない');
});

test('こわれた データを なおして よみこむ', () => {
  assert.deepEqual(migrate(null), defaultState());
  assert.deepEqual(migrate('こわれてる'), defaultState());
  const fixed = migrate({ stickers: ['st01', 42, null], totalPlayMs: 'あ', streak: undefined, profile: { level: 3 } });
  assert.deepEqual(fixed.stickers, ['st01']);
  assert.equal(fixed.totalPlayMs, 0);
  assert.equal(fixed.streak, 0);
  assert.equal(fixed.profile.level, 3);
  assert.equal(fixed.settings.sound, true, 'ない せっていは きほんちに なる');
});

test('ストア：ほぞん と よみこみ と リセット', () => {
  const storage = fakeStorage();
  const store = createStore(storage);
  let notified = 0;
  store.subscribe(() => { notified += 1; });
  store.update((s) => ({ ...s, profile: { ...s.profile, level: 2 } }));
  assert.equal(notified, 1);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).profile.level, 2);
  assert.equal(createStore(storage).get().profile.level, 2, 'よみこみ なおせる');
  store.reset();
  assert.equal(store.get().profile.level, 1);
});

test('ストア：ほぞん できなくても おちない', () => {
  const broken = {
    getItem: () => { throw new Error('だめ'); },
    setItem: () => { throw new Error('だめ'); },
  };
  const store = createStore(broken);
  assert.deepEqual(store.get(), defaultState());
  assert.doesNotThrow(() => store.update((s) => ({ ...s, streak: 5 })));
  assert.equal(store.get().streak, 5);
});

test('きょうの ひづけ', () => {
  assert.equal(todayKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.match(todayKey(), /^\d{4}-\d{2}-\d{2}$/);
});

test('バックアップ：かきだして よみこむと もとに もどる', () => {
  let s = defaultState();
  s = recordSession(s, { gameId: 'clock', firstTryCorrect: 8, questions: 10, durationMs: 120000, today: '2026-09-12' });
  s = recordSession(s, { gameId: 'english', firstTryCorrect: 6, questions: 10, durationMs: 90000, today: '2026-09-13' });
  s = awardSticker(s, () => 0).state;
  s = { ...s, profile: { name: 'たろう', level: 3 }, settings: { sound: false, speech: true } };

  const json = JSON.stringify(exportPayload(s, new Date('2026-09-13T09:00:00Z')));
  const result = parseBackup(json);
  assert.equal(result.ok, true);
  assert.deepEqual(result.state, s, 'よみこんだ きろくが もとと ちがう');
  assert.equal(result.exportedAt, '2026-09-13T09:00:00.000Z');
  assert.deepEqual(result.summary, {
    plays: 2, stickers: 1, totalPlayMs: 210000, lastPlayDate: '2026-09-13', games: 2,
  });
});

test('バックアップ：ファイル名', () => {
  assert.equal(backupFileName(new Date(2026, 8, 12)), 'kidstry-kiroku-2026-09-12.json');
  assert.match(backupFileName(), /^kidstry-kiroku-\d{4}-\d{2}-\d{2}\.json$/);
});

test('バックアップ：かきだす なかみに めじるしが つく', () => {
  const payload = exportPayload(defaultState());
  assert.equal(payload.app, 'kidstry');
  assert.equal(payload.version, 1);
  assert.match(payload.exportedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(payload.state);
});

test('バックアップ：おかしな ファイルは れいがいを なげずに ことわる', () => {
  const bad = [
    ['{{こわれたJSON', 'JSON では ありません'],
    ['null', 'ファイルでは ないようです'],
    ['[1,2,3]', 'ファイルでは ないようです'],
    ['"ただのもじれつ"', 'ファイルでは ないようです'],
    ['{"app":"otherapp","state":{}}', 'ファイルでは ないようです'],
    ['{"app":"kidstry"}', 'なかみが 入って いません'],
    ['{"app":"kidstry","state":[]}', 'なかみが 入って いません'],
    ['{"app":"kidstry","state":"あ"}', 'なかみが 入って いません'],
  ];
  for (const [text, expected] of bad) {
    const r = parseBackup(text);
    assert.equal(r.ok, false, `${text} を うけいれて しまった`);
    assert.ok(r.error.includes(expected), `${text}: メッセージが ちがう（${r.error}）`);
  }
});

test('バックアップ：こわれた なかみでも なおして よみこむ', () => {
  const r = parseBackup(JSON.stringify({
    app: 'kidstry',
    state: { stickers: ['st01', 99, null], totalPlayMs: 'あ', games: null, profile: { level: 2 } },
  }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.state.stickers, ['st01']);
  assert.equal(r.state.totalPlayMs, 0);
  assert.deepEqual(r.state.games, {});
  assert.equal(r.state.profile.level, 2);
  assert.equal(r.state.settings.sound, true);
  assert.equal(r.exportedAt, null);
});

test('バックアップ：あたらしい きろくを よみこんでも 2どめで ふえない', () => {
  let s = defaultState();
  s = recordSession(s, { gameId: 'clock', firstTryCorrect: 9, questions: 10, today: '2026-09-12' });
  const json = JSON.stringify(exportPayload(s));
  const first = parseBackup(json).state;
  const second = parseBackup(JSON.stringify(exportPayload(first))).state;
  assert.deepEqual(second, first, 'よみこむ たびに きろくが かわる');
  assert.equal(second.games.clock.plays, 1);
});

test('シールを ぜんぶ あつめると あたらしい あそびが ふえる', () => {
  const empty = defaultState();
  assert.equal(STICKER_GOAL, STICKERS.length);
  assert.equal(stickerBookComplete(empty), false);
  assert.equal(stickersLeft(empty), STICKER_GOAL);

  const almost = { ...empty, stickers: STICKERS.slice(0, STICKER_GOAL - 1).map((s) => s.id) };
  assert.equal(stickerBookComplete(almost), false);
  assert.equal(stickersLeft(almost), 1);

  const done = { ...empty, stickers: STICKERS.map((s) => s.id) };
  assert.equal(stickerBookComplete(done), true);
  assert.equal(stickersLeft(done), 0);
});

test('きんメダルは ★3で もらえる（ほぞん せず きろくから みちびく）', () => {
  let s = defaultState();
  assert.equal(hasMedal(s, 'clock'), false);
  assert.equal(medalCount(s, GAMES), 0);

  s = recordSession(s, { gameId: 'clock', firstTryCorrect: 8, questions: 10, today: '2026-09-12' });
  assert.equal(hasMedal(s, 'clock'), false, '★2では もらえない');

  s = recordSession(s, { gameId: 'clock', firstTryCorrect: 10, questions: 10, today: '2026-09-12' });
  assert.equal(hasMedal(s, 'clock'), true);
  assert.equal(medalCount(s, GAMES), 1);

  s = recordSession(s, { gameId: 'clock', firstTryCorrect: 1, questions: 10, today: '2026-09-12' });
  assert.equal(hasMedal(s, 'clock'), true, 'いちど とった メダルは なくならない');

  assert.equal(medalCount(s, GAMES) <= GAMES.length, true);
});

test('ごほうびの はんてい：1どだけ おいわいする', () => {
  const base = defaultState();
  const withMedal = recordSession(base, { gameId: 'clock', firstTryCorrect: 10, questions: 10, today: '2026-09-12' });
  assert.deepEqual(sessionRewards(base, withMedal, 'clock'), { newMedal: true, justUnlocked: false });

  const again = recordSession(withMedal, { gameId: 'clock', firstTryCorrect: 10, questions: 10, today: '2026-09-12' });
  assert.deepEqual(sessionRewards(withMedal, again, 'clock'), { newMedal: false, justUnlocked: false }, '2どめは おいわい しない');

  const almost = { ...base, stickers: STICKERS.slice(0, STICKER_GOAL - 1).map((s) => s.id) };
  const complete = awardSticker(almost, () => 0).state;
  assert.deepEqual(sessionRewards(almost, complete, 'counting'), { newMedal: false, justUnlocked: true });
  assert.deepEqual(sessionRewards(complete, complete, 'counting'), { newMedal: false, justUnlocked: false });
});
