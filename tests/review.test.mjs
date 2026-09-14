import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewQuestions } from '../src/core/quiz.js';
import { createRng } from '../src/core/random.js';
import { GAMES } from '../src/games/index.js';

function sampleQuestions() {
  return [
    { id: 'q0', ask: { text: 'A' }, stage: { kind: 'none' }, layout: 'grid4', answer: 'c2',
      choices: [{ key: 'c0', value: 'あ' }, { key: 'c1', value: 'い' }, { key: 'c2', value: 'う' }, { key: 'c3', value: 'え' }] },
    { id: 'q1', ask: { text: 'B' }, stage: { kind: 'none' }, layout: 'grid2', answer: 'c1',
      choices: [{ key: 'c0', value: 1 }, { key: 'c1', value: 2 }] },
    { id: 'q2', ask: { text: 'C' }, stage: { kind: 'none' }, layout: 'grid4', answer: 'c0',
      choices: [{ key: 'c0', value: '🐶' }, { key: 'c1', value: '🐱' }, { key: 'c2', value: '🐰' }, { key: 'c3', value: '🐻' }] },
  ];
}

const answerValue = (q) => q.choices.find((c) => c.key === q.answer).value;

test('まちがえた もんだいだけが、でた じゅんばんの まま かえる', () => {
  const qs = sampleQuestions();
  // わざと ばらばらの じゅんばんで わたす
  const review = buildReviewQuestions(qs, ['q2', 'q0'], createRng(1));
  assert.deepEqual(review.map((q) => q.id), ['q0', 'q2'], 'もとの じゅんばんに ならんで いない');
  assert.equal(buildReviewQuestions(qs, [], createRng(1)).length, 0, 'まちがい 0けんで からに ならない');
  assert.equal(buildReviewQuestions(qs, ['ない'], createRng(1)).length, 0, 'しらない id を ひろって いる');
  assert.equal(buildReviewQuestions(qs, ['q0', 'q1', 'q2'], createRng(1)).length, 3);
});

test('せんたくしは ならびだけ かわり、なかみは かわらない', () => {
  const qs = sampleQuestions();
  const review = buildReviewQuestions(qs, ['q0', 'q1', 'q2'], createRng(7));
  for (const q of review) {
    const before = qs.find((x) => x.id === q.id);
    assert.equal(q.choices.length, before.choices.length);
    assert.deepEqual(
      [...q.choices].map((c) => c.key).sort(),
      [...before.choices].map((c) => c.key).sort(),
      'せんたくしが ふえたり へったり して いる',
    );
    assert.deepEqual(
      [...q.choices].map((c) => String(c.value)).sort(),
      [...before.choices].map((c) => String(c.value)).sort(),
      'せんたくしの なかみが かわって いる',
    );
    // もんだいぶん・え・ならべかたは そのまま
    assert.equal(q.ask.text, before.ask.text);
    assert.deepEqual(q.stage, before.stage);
    assert.equal(q.layout, before.layout);
    assert.equal(q.answer, before.answer, 'こたえの キーが かわって いる');
  }
});

test('ならびを かえても こたえは おなじ せんたくしを さす（いちばん たいせつ）', () => {
  const qs = sampleQuestions();
  for (let seed = 1; seed <= 50; seed++) {
    const review = buildReviewQuestions(qs, ['q0', 'q1', 'q2'], createRng(seed));
    for (const q of review) {
      const before = qs.find((x) => x.id === q.id);
      assert.equal(answerValue(q), answerValue(before), `seed ${seed}: こたえが ずれた`);
      assert.equal(q.choices.filter((c) => c.key === q.answer).length, 1, 'こたえが 1つ でない');
    }
  }
});

test('もとの もんだいを こわさない', () => {
  const qs = sampleQuestions();
  const snapshot = JSON.stringify(qs);
  buildReviewQuestions(qs, ['q0', 'q1', 'q2'], createRng(3));
  assert.equal(JSON.stringify(qs), snapshot, 'もとの はいれつを ならべかえて しまって いる');
});

test('おなじ シードなら おなじ けっかに なる', () => {
  const a = buildReviewQuestions(sampleQuestions(), ['q0', 'q2'], createRng(42));
  const b = buildReviewQuestions(sampleQuestions(), ['q0', 'q2'], createRng(42));
  assert.deepEqual(a, b);
});

test('ほんものの もんだいでも こたえが ずれない', () => {
  for (const game of GAMES) {
    const rng = createRng(game.id.length * 31);
    const questions = game.generate(2, rng, 10);
    const ids = questions.filter((_, i) => i % 3 === 0).map((q) => q.id);
    const review = buildReviewQuestions(questions, ids, rng);
    assert.equal(review.length, ids.length, `${game.id}: かずが あわない`);
    for (const q of review) {
      const before = questions.find((x) => x.id === q.id);
      assert.equal(
        JSON.stringify(answerValue(q)),
        JSON.stringify(answerValue(before)),
        `${game.id}: こたえが ずれた`,
      );
    }
  }
});
