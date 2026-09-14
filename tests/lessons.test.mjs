import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, STEP_KINDS, lessonFor, hasLesson } from '../src/data/lessons.js';
import { renderLessonStep } from '../src/screens/lesson.js';
import { GAMES } from '../src/games/index.js';
import { SHAPES } from '../src/core/ui-shapes.js';
import { WEEKDAYS } from '../src/data/weekdays.js';

test('かいせつは じっさいの あそびに ついて いる', () => {
  const ids = new Set(GAMES.map((g) => g.id));
  const lessonIds = Object.keys(LESSONS);
  assert.equal(lessonIds.length, 5);
  for (const id of lessonIds) {
    assert.ok(ids.has(id), `${id} という あそびが ない`);
    assert.ok(hasLesson(id));
    assert.equal(lessonFor(id), LESSONS[id]);
  }
  assert.equal(lessonFor('ない あそび'), null);
  assert.equal(hasLesson('ない あそび'), false);
});

test('どの ステップにも もじ・よみあげ・ながさが ある', () => {
  for (const [id, lesson] of Object.entries(LESSONS)) {
    assert.ok(lesson.title, `${id}: タイトルが ない`);
    assert.ok(lesson.steps.length >= 5, `${id}: ステップが すくない`);
    for (const [i, step] of lesson.steps.entries()) {
      const where = `${id} の ${i}ばんめ`;
      assert.ok(STEP_KINDS.has(step.kind), `${where}: しらない kind「${step.kind}」`);
      assert.ok(step.text && step.text.length > 0, `${where}: もじが ない`);
      assert.ok(step.speak && step.speak.length > 0, `${where}: よみあげが ない`);
      assert.ok(Number.isFinite(step.ms) && step.ms >= 1000 && step.ms <= 6000, `${where}: ながさが へん（${step.ms}）`);
      assert.ok(!/[一-龠]/.test(step.text), `${where}: かんじが まざって いる「${step.text}」`);
    }
  }
});

test('どの ステップも え を えがける', () => {
  for (const [id, lesson] of Object.entries(LESSONS)) {
    for (const [i, step] of lesson.steps.entries()) {
      const html = renderLessonStep(step);
      assert.ok(html.length > 0, `${id} の ${i}ばんめ: え が からっぽ`);
      assert.ok(html.startsWith('<'), `${id} の ${i}ばんめ: HTML に なって いない`);
    }
  }
  assert.equal(renderLessonStep({ kind: 'しらない' }), '');
});

test('ステップの なかみが データと あって いる', () => {
  // ようび：うしろの ほうほど たくさん うまって いる
  const week = LESSONS.weekday.steps.filter((s) => s.kind === 'week');
  for (const step of week) {
    assert.ok(step.upto >= 0 && step.upto < WEEKDAYS.length, `upto が はんい がい: ${step.upto}`);
    const html = renderLessonStep(step);
    assert.equal((html.match(/week-cell/g) || []).length, 7);
    assert.equal((html.match(/is-known/g) || []).length, step.upto + 1);
  }

  // みぎひだり：mark も count も ならびの なかを ゆびして いる
  for (const step of LESSONS['left-right'].steps.filter((s) => s.kind === 'row')) {
    assert.ok(step.mark >= 0 && step.mark < step.items.length, 'mark が はんい がい');
    assert.equal(new Set(step.items).size, step.items.length, 'ならびが じゅうふく');
    for (const i of step.count || []) {
      assert.ok(i >= 0 && i < step.items.length, 'count が はんい がい');
    }
    assert.ok(['left', 'right'].includes(step.side), 'むきが ない');
  }

  // とけい：はりの いちが ただしい
  for (const step of LESSONS.clock.steps.filter((s) => s.kind === 'clock')) {
    assert.ok(step.hour >= 1 && step.hour <= 12, 'じが はんい がい');
    assert.ok([0, 30].includes(step.minute), 'ふんが 0/30 でない');
    assert.ok(renderLessonStep(step).includes('<svg'));
  }

  // かず：1こずつ ふえて いく
  const counts = LESSONS.counting.steps.filter((s) => s.kind === 'count').map((s) => s.count);
  assert.deepEqual(counts, [1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10, 10]);
  for (const step of LESSONS.counting.steps.filter((s) => s.kind === 'count')) {
    assert.equal((renderLessonStep(step).match(/count-item/g) || []).length, step.count);
  }

  // かたち：ぜんぶ じつざいする かたち
  const shapes = LESSONS.shapes.steps.filter((s) => s.kind === 'shape');
  assert.equal(shapes.length, Object.keys(SHAPES).length, 'かたちが ぜんぶ でて いない');
  for (const step of shapes) {
    assert.ok(SHAPES[step.shape], `${step.shape} という かたちは ない`);
    assert.ok(renderLessonStep(step).includes(step.color));
  }
});

test('1つの かいせつは ながすぎない（5さいじの しゅうちゅうりょく）', () => {
  for (const [id, lesson] of Object.entries(LESSONS)) {
    const total = lesson.steps.reduce((sum, s) => sum + s.ms, 0);
    assert.ok(total <= 40000, `${id}: ${Math.round(total / 1000)}びょうは ながすぎる`);
    assert.ok(total >= 8000, `${id}: ${Math.round(total / 1000)}びょうは みじかすぎる`);
  }
});
