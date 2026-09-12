import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultState, starsFor, nextStreak, recordSession, awardSticker,
  accuracy, domainStats, totalPlays, migrate, createStore, todayKey, STORAGE_KEY,
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
