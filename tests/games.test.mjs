import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/core/random.js';
import { GAMES, LOCKED_GAMES, playableGames } from '../src/games/index.js';
import { SHAPES } from '../src/core/ui-shapes.js';
import { WORDS } from '../src/data/words.js';
import { SEASONS } from '../src/data/seasons.js';

const LEVELS = [1, 2, 3];
const LAYOUTS = new Set(['grid2', 'grid3', 'grid4']);

function valueOf(choice) {
  return typeof choice.value === 'object' ? JSON.stringify(choice.value) : String(choice.value);
}

test('すべての あそびが きほんの かたちを まもる', () => {
  for (const game of GAMES) {
    for (const level of LEVELS) {
      const rng = createRng(level * 977 + game.id.length);
      const questions = game.generate(level, rng, 10);
      assert.equal(questions.length, 10, `${game.id} lv${level}: 10もん でない`);
      for (const q of questions) {
        assert.ok(q.ask.text.length > 0, `${game.id}: といが からっぽ`);
        assert.ok(q.choices.length >= 2, `${game.id}: せんたくしが すくない`);
        assert.ok(LAYOUTS.has(q.layout), `${game.id}: ならべかたが ふめい (${q.layout})`);
        const matching = q.choices.filter((c) => c.key === q.answer);
        assert.equal(matching.length, 1, `${game.id}: せいかいが 1つ でない`);
        const values = q.choices.map(valueOf);
        assert.equal(new Set(values).size, values.length, `${game.id}: せんたくしが じゅうふく`);
        const keys = q.choices.map((c) => c.key);
        assert.equal(new Set(keys).size, keys.length, `${game.id}: キーが じゅうふく`);
        for (const c of q.choices) {
          assert.ok(c.value !== undefined && c.value !== null && c.value !== '', `${game.id}: せんたくしが からっぽ`);
          if (c.kind === 'number') assert.ok(Number.isFinite(c.value), `${game.id}: すうじが NaN`);
        }
      }
    }
  }
});

test('メタじょうほうが そろっている', () => {
  const ids = new Set();
  for (const game of GAMES) {
    assert.match(game.id, /^[a-z-]+$/);
    assert.ok(!ids.has(game.id), 'id が じゅうふく');
    ids.add(game.id);
    assert.ok(game.title && game.subtitle && game.domain);
    assert.match(game.color, /^#[0-9a-f]{6}$/i);
    assert.match(game.icon, /^assets\/icons\/.+\.svg$/);
  }
  assert.equal(GAMES.length, 12);
});

test('かずを かぞえよう：レベルごとの はんい', () => {
  const game = GAMES.find((g) => g.id === 'counting');
  const ranges = { 1: [1, 5], 2: [1, 10], 3: [6, 20] };
  for (const [level, [min, max]] of Object.entries(ranges)) {
    for (const q of game.generate(Number(level), createRng(42), 30)) {
      assert.ok(q.stage.count >= min && q.stage.count <= max, `lv${level}: ${q.stage.count} が はんい がい`);
      const answer = q.choices.find((c) => c.key === q.answer);
      assert.equal(answer.value, q.stage.count);
      for (const c of q.choices) assert.ok(c.value >= 1, 'せんたくしが 1みまん');
    }
  }
});

test('たしざん：ごうけいが レベルの うわげん いない', () => {
  const game = GAMES.find((g) => g.id === 'addition');
  const maxSum = { 1: 5, 2: 10, 3: 20 };
  for (const [level, max] of Object.entries(maxSum)) {
    for (const q of game.generate(Number(level), createRng(7), 30)) {
      const { a, b } = q.stage;
      assert.ok(a >= 1 && b >= 1, 'たす かずが 1いじょう でない');
      assert.ok(a + b <= max, `lv${level}: ごうけい ${a + b} が おおきすぎる`);
      assert.equal(q.choices.find((c) => c.key === q.answer).value, a + b);
    }
  }
});

test('とけい：ふんは 0 か 30、レベル1は ちょうど の じかん', () => {
  const game = GAMES.find((g) => g.id === 'clock');
  for (const level of LEVELS) {
    for (const q of game.generate(level, createRng(5), 30)) {
      assert.ok([0, 30].includes(q.stage.minute), 'ふんが 0/30 でない');
      assert.ok(q.stage.hour >= 1 && q.stage.hour <= 12, 'じが 1〜12 でない');
      if (level === 1) assert.equal(q.stage.minute, 0, 'レベル1に 30ぷんが ある');
      const expected = q.stage.minute === 30 ? `${q.stage.hour}じはん` : `${q.stage.hour}じ`;
      assert.equal(q.choices.find((c) => c.key === q.answer).value, expected);
    }
  }
});

test('かたち：かどの かずで きく ときは こたえが ひとつに きまる', () => {
  const game = GAMES.find((g) => g.id === 'shapes');
  for (const q of game.generate(3, createRng(19), 40)) {
    const m = q.ask.text.match(/かどが (\d+)つ/);
    if (!m) continue;
    const corners = Number(m[1]);
    const matches = q.choices.filter((c) => SHAPES[c.value].corners === corners);
    assert.equal(matches.length, 1, `かどが ${corners}つ の かたちが ${matches.length}こ ある`);
    assert.equal(matches[0].key, q.answer);
  }
});

test('ならびの きまり：こたえが きまりに あっている', () => {
  const game = GAMES.find((g) => g.id === 'pattern');
  for (const level of LEVELS) {
    for (const q of game.generate(level, createRng(23), 30)) {
      assert.equal(q.stage.items.length, 6, 'ならびが 6こ でない');
      const answer = q.choices.find((c) => c.key === q.answer).value;
      const full = [...q.stage.items, answer];
      // くりかえしの ながさを さがして、ぜんぶ あって いるか たしかめる
      const period = [2, 3, 4, 6].find((n) => full.every((v, i) => i < n || v === full[i - n]));
      assert.ok(period, `きまりが みつからない: ${full.join('')}`);
    }
  }
});

test('えいご：もんだいは えいごで よみあげる', () => {
  const game = GAMES.find((g) => g.id === 'english');
  for (const level of LEVELS) {
    for (const q of game.generate(level, createRng(31), 20)) {
      assert.equal(q.ask.lang, 'en-US');
      assert.match(q.ask.text, /^[a-z ]+$/i, `えいご でない: ${q.ask.text}`);
    }
  }
});

test('あたまの もじ：かくれた もじが こたえと おなじ', () => {
  const game = GAMES.find((g) => g.id === 'word-start');
  for (const level of LEVELS) {
    for (const q of game.generate(level, createRng(11), 30)) {
      const blanks = [...q.stage.word].filter((c) => c === '◯');
      assert.equal(blanks.length, 1, 'あなが 1つ でない');
      const idx = [...q.stage.word].indexOf('◯');
      assert.equal(idx, level === 3 ? q.stage.word.length - 1 : 0, 'あなの ばしょが ちがう');
      assert.ok(q.choices.find((c) => c.key === q.answer).value.length === 1, 'こたえが 1もじ でない');
    }
  }
});

test('せいかつ：レベル3は 3たく、それいがいは 2たく', () => {
  const game = GAMES.find((g) => g.id === 'seikatsu');
  for (const level of LEVELS) {
    const expected = level === 3 ? 3 : 2;
    for (const q of game.generate(level, createRng(13), 20)) {
      assert.equal(q.choices.length, expected);
      for (const c of q.choices) assert.ok(c.label && c.label.length > 0, 'せつめいが ない');
    }
  }
});

test('レベルが へんな あたいでも おちない', () => {
  for (const game of GAMES) {
    for (const level of [0, -3, 9, null, undefined, NaN, '2']) {
      const questions = game.generate(level, createRng(3), 4);
      assert.equal(questions.length, 4, `${game.id}: level=${level} で しっぱい`);
    }
  }
});

test('かぎの かかった あそびは シールを あつめるまで あそべない', () => {
  assert.equal(LOCKED_GAMES.length, 3);
  assert.deepEqual(LOCKED_GAMES.map((g) => g.id).sort(), ['odd-one-out', 'seasons', 'shiritori']);
  assert.equal(playableGames(false).length, GAMES.length - 3);
  assert.equal(playableGames(true).length, GAMES.length);
  assert.ok(playableGames(false).every((g) => !g.locked));
  // メダルは あそびの かず ぶん ある
  assert.equal(GAMES.length, 12);
});

test('しりとり：こたえの あたまの もじが もんだいの おわりの もじ', () => {
  const game = GAMES.find((g) => g.id === 'shiritori');
  for (const level of LEVELS) {
    for (const q of game.generate(level, createRng(77), 30)) {
      const { tail } = q.stage;
      assert.notEqual(tail, 'ん', '「ん」で おわる ことばを だして いる');
      const answer = q.choices.find((c) => c.key === q.answer);
      assert.equal(answer.label[0], tail, `${q.stage.word} → ${answer.label} が つながって いない`);
      for (const c of q.choices) {
        if (c.key === q.answer) continue;
        assert.notEqual(c.label[0], tail, `はずれ「${c.label}」も つながって しまう`);
      }
      assert.ok(q.stage.word.includes(tail), 'おわりの もじが ことばに ない');
    }
  }
});

test('なかまはずれ：こたえだけ グループが ちがう', () => {
  const game = GAMES.find((g) => g.id === 'odd-one-out');
  for (const level of LEVELS) {
    for (const q of game.generate(level, createRng(88), 30)) {
      const groups = q.choices.map((c) => WORDS.find((w) => w.emoji === c.value).group);
      const answerGroup = groups[q.choices.findIndex((c) => c.key === q.answer)];
      const others = groups.filter((_, i) => q.choices[i].key !== q.answer);
      assert.equal(new Set(others).size, 1, 'なかまが そろって いない');
      assert.notEqual(answerGroup, others[0], 'こたえが なかまに なって いる');
    }
  }
});

test('きせつ：こたえが ただしい きせつの もの', () => {
  const game = GAMES.find((g) => g.id === 'seasons');
  const itemSeason = new Map();
  for (const s of SEASONS) for (const it of s.items) itemSeason.set(it.emoji, s.name);
  for (const level of LEVELS) {
    for (const q of game.generate(level, createRng(55), 30)) {
      const answer = q.choices.find((c) => c.key === q.answer);
      const m = q.ask.text.match(/^(はる|なつ|あき|ふゆ)の ものは どれ/);
      if (m) {
        assert.equal(itemSeason.get(answer.value), m[1], `${answer.value} は ${m[1]} では ない`);
        const seasonsShown = q.choices.map((c) => itemSeason.get(c.value));
        assert.equal(new Set(seasonsShown).size, 4, 'きせつが かぶって いる');
      } else {
        assert.equal(itemSeason.get(q.stage.emoji), answer.value, 'えらぶ きせつが ちがう');
      }
    }
  }
});
