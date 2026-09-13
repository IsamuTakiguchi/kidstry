import test from 'node:test';
import assert from 'node:assert/strict';
import { HIRAGANA, KATAKANA, GOJUON, DAKUON, toKatakana } from '../src/data/hiragana.js';
import { WORDS, SIMPLE_WORDS, COUNTABLES } from '../src/data/words.js';
import { EN_NOUNS, EN_COLORS, EN_NUMBERS } from '../src/data/english.js';
import { STICKERS, stickerById } from '../src/data/stickers.js';
import { SHAPES, SHAPE_KEYS, shapeSvg } from '../src/core/ui-shapes.js';
import { createRng, sample, shuffle, randInt } from '../src/core/random.js';
import { numberDistractors, buildChoices, clampLevel } from '../src/games/_helpers.js';

test('ひらがな 46もじ', () => {
  assert.equal(HIRAGANA.length, 46);
  assert.equal(new Set(HIRAGANA).size, 46, 'じゅうふく が ある');
  assert.equal(GOJUON.length, 10);
  assert.equal(DAKUON.length, 25);
  assert.equal(toKatakana('あ'), 'ア');
  assert.equal(toKatakana('ん'), 'ン');
  assert.equal(toKatakana('A'), 'A', 'ひらがな いがいは そのまま');
  assert.equal(KATAKANA.length, 46);
  assert.equal(new Set(KATAKANA).size, 46);
});

test('ことばの データ', () => {
  assert.ok(WORDS.length >= 40);
  assert.equal(new Set(WORDS.map((w) => w.emoji)).size, WORDS.length, 'えもじが じゅうふく');
  assert.equal(new Set(WORDS.map((w) => w.yomi)).size, WORDS.length, 'よみが じゅうふく');
  for (const w of WORDS) {
    assert.equal(w.head, w.yomi[0]);
    assert.ok(w.tail && !'ぁぃぅぇぉっゃゅょー'.includes(w.tail), `${w.yomi}: おわりの もじが ちいさい`);
    assert.match(w.en, /^[a-z ]+$/, `${w.en}: えいごが おかしい`);
    assert.ok(w.group);
  }
  assert.ok(SIMPLE_WORDS.length >= 30);
  assert.ok(SIMPLE_WORDS.every((w) => !'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ'.includes(w.head)));
  assert.equal(new Set(COUNTABLES).size, COUNTABLES.length);
});

test('えいごの データ', () => {
  assert.ok(EN_NOUNS.length >= 20);
  assert.ok(EN_NOUNS.every((w) => !w.en.includes(' ')));
  assert.equal(new Set(EN_COLORS.map((c) => c.emoji)).size, EN_COLORS.length);
  assert.equal(EN_NUMBERS.length, 10);
  assert.deepEqual(EN_NUMBERS.map((n) => n.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('シールの データ', () => {
  assert.equal(STICKERS.length, 24);
  assert.equal(new Set(STICKERS.map((s) => s.id)).size, 24);
  assert.equal(new Set(STICKERS.map((s) => s.emoji)).size, 24);
  for (const s of STICKERS) assert.match(s.color, /^#[0-9a-f]{6}$/i);
  assert.equal(stickerById('st01').name, 'らいおん');
  assert.equal(stickerById('ない'), null);
});

test('かたちの データと SVG', () => {
  assert.equal(SHAPE_KEYS.length, 6);
  for (const key of SHAPE_KEYS) {
    assert.ok(SHAPES[key].name);
    const svg = shapeSvg(key, '#ff0000', 50);
    assert.match(svg, /^<svg/);
    assert.ok(svg.includes('#ff0000'));
    assert.ok(svg.includes('width="50"'));
  }
  assert.equal(shapeSvg('ない'), '');
});

test('らんすう：シードが おなじなら けっかも おなじ', () => {
  const a = createRng(1234);
  const b = createRng(1234);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
  const rng = createRng(99);
  const list = [1, 2, 3, 4, 5];
  assert.equal(sample(rng, list, 3).length, 3);
  assert.deepEqual([...shuffle(rng, list)].sort(), list);
  for (let i = 0; i < 100; i++) {
    const n = randInt(rng, 3, 7);
    assert.ok(n >= 3 && n <= 7);
  }
});

test('はずれの すうじは はんいない で せいかいと ちがう', () => {
  const rng = createRng(2026);
  for (let correct = 1; correct <= 20; correct++) {
    const wrong = numberDistractors(rng, correct, 3, 1, 20);
    assert.equal(wrong.length, 3, `${correct}: 3つ そろわない`);
    assert.equal(new Set(wrong).size, 3, 'じゅうふく');
    for (const n of wrong) {
      assert.ok(n >= 1 && n <= 20, 'はんい がい');
      assert.notEqual(n, correct);
    }
  }
});

test('せんたくし づくり：じゅうふくを のぞく', () => {
  const rng = createRng(5);
  const { choices, answer } = buildChoices(rng, 'text', 'あ', ['い', 'あ', 'う', 'い', 'え']);
  const values = choices.map((c) => c.value);
  assert.equal(new Set(values).size, values.length);
  assert.ok(values.includes('あ'));
  assert.equal(choices.find((c) => c.key === answer).value, 'あ');
  assert.ok(choices.every((c) => c.kind === 'text'));
});

test('レベルは 1〜3 に そろえる', () => {
  assert.equal(clampLevel(0), 1);
  assert.equal(clampLevel(-5), 1);
  assert.equal(clampLevel(9), 3);
  assert.equal(clampLevel('2'), 2);
  assert.equal(clampLevel(null), 1);
  assert.equal(clampLevel(undefined), 1);
  assert.equal(clampLevel(NaN), 1);
});

test('ようびの データ', async () => {
  const { WEEKDAYS, WEEK_LENGTH, shiftDay } = await import('../src/data/weekdays.js');
  assert.equal(WEEK_LENGTH, 7);
  assert.equal(WEEKDAYS.length, 7);
  assert.equal(WEEKDAYS[0].name, 'にちようび', 'にちようび から はじまる');
  assert.equal(new Set(WEEKDAYS.map((d) => d.name)).size, 7);
  assert.equal(new Set(WEEKDAYS.map((d) => d.short)).size, 7);
  for (const d of WEEKDAYS) {
    assert.ok(d.name.endsWith('ようび'), `${d.name} が ようびで おわって いない`);
    assert.match(d.color, /^#[0-9a-f]{6}$/i);
  }

  // 1しゅうかんで ぐるっと まわる
  for (let i = 0; i < 7; i++) {
    assert.equal(shiftDay(i, 0).name, WEEKDAYS[i].name);
    assert.equal(shiftDay(i, 7).name, WEEKDAYS[i].name, '7にち あとは おなじ ようび');
    assert.equal(shiftDay(i, -7).name, WEEKDAYS[i].name, '7にち まえも おなじ ようび');
  }
  assert.equal(shiftDay(6, 1).name, 'にちようび', 'どようびの つぎは にちようび');
  assert.equal(shiftDay(0, -1).name, 'どようび', 'にちようびの まえは どようび');
  assert.equal(shiftDay(5, 2).name, 'にちようび', 'きんようびの 2にち あとは にちようび');
});
