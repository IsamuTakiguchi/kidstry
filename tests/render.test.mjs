import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStage, renderChoiceInner, lengthClass } from '../src/core/quiz.js';
import { clockSvg, clockLabel, emojiGroupHtml, starsHtml, formatDuration, MASCOT_POSES } from '../src/core/ui.js';

test('もんだいの え を HTML に できる', () => {
  assert.equal(renderStage({ kind: 'none' }), '');

  const word = renderStage({ kind: 'emoji-word', emoji: '🍎', word: '◯んご' });
  assert.ok(word.includes('🍎'));
  assert.ok(word.includes('class="blank"'), 'あなに しるしが ない');

  const group = renderStage({ kind: 'group', emoji: '⭐', count: 4 });
  assert.equal((group.match(/count-item/g) || []).length, 4);

  const add = renderStage({ kind: 'addition', a: 2, b: 3, emoji: '🍎' });
  assert.equal((add.match(/count-item/g) || []).length, 5);
  assert.ok(add.includes('＋') && add.includes('＝'));

  const clock = renderStage({ kind: 'clock', hour: 3, minute: 30 });
  assert.ok(clock.includes('<svg'));

  const seq = renderStage({ kind: 'sequence', items: ['🔴', '🔵', '🔴'] });
  assert.equal((seq.match(/seq-item/g) || []).length, 4, 'さいごの ？が ない');

  const week = renderStage({ kind: 'week', knownIndex: 1, askIndex: 2 });
  assert.equal((week.match(/week-cell/g) || []).length, 7, 'おびが 7マス でない');
  assert.equal((week.match(/is-known/g) || []).length, 1);
  assert.equal((week.match(/is-ask/g) || []).length, 1);
  assert.ok(week.includes('げつ'), 'わかって いる ようびが でて いない');
  assert.ok(!week.includes('>か<'), 'こたえの ようびが みえて しまって いる');

  const dir = renderStage({ kind: 'direction' });
  assert.ok(dir.includes('ひだり') && dir.includes('みぎ'));
});

test('ながい ことばの せんたくしは もじを ちいさく する', () => {
  assert.equal(lengthClass('あ'), '');
  assert.equal(lengthClass('3じ'), '');
  assert.equal(lengthClass('10じ'), 'len-m');
  assert.equal(lengthClass('3じはん'), 'len-l');
  assert.equal(lengthClass('もくようび'), 'len-xl');
  assert.equal(lengthClass('12じはん'), 'len-xl');
  assert.ok(renderChoiceInner({ kind: 'text', value: 'にちようび' }).includes('len-xl'));
  assert.ok(!renderChoiceInner({ kind: 'text', value: 'あ' }).includes('len-'));
});

test('せんたくしを HTML に できる', () => {
  assert.ok(renderChoiceInner({ kind: 'text', value: 'あ' }).includes('あ'));
  assert.ok(renderChoiceInner({ kind: 'number', value: 7 }).includes('7'));
  const emoji = renderChoiceInner({ kind: 'emoji', value: '🧼', label: 'てを あらう' });
  assert.ok(emoji.includes('🧼') && emoji.includes('てを あらう'));
  assert.ok(!renderChoiceInner({ kind: 'emoji', value: '🧼' }).includes('choice-label'));
  const shape = renderChoiceInner({ kind: 'shape', value: 'star', color: '#ffd166', label: 'ほし' });
  assert.ok(shape.includes('<svg') && shape.includes('#ffd166'));
});

test('とけいの え と よみかた', () => {
  const svg = clockSvg(3, 0);
  assert.match(svg, /^<svg/);
  assert.ok(svg.includes('rotate(90 50 50)'), '3じの みじかい はりが よこを むいて いない');
  assert.ok(clockSvg(6, 30).includes('rotate(180 50 50)'), '30ぷんの ながい はりが したを むいて いない');
  assert.equal(clockLabel(3, 0), '3じ');
  assert.equal(clockLabel(3, 30), '3じはん');
});

test('そのほかの ひょうじ', () => {
  assert.equal((emojiGroupHtml('🍎', 3).match(/count-item/g) || []).length, 3);
  assert.equal((starsHtml(2).match(/is-on/g) || []).length, 2);
  assert.equal((starsHtml(2).match(/is-off/g) || []).length, 1);
  assert.equal(formatDuration(0), '0ふん');
  assert.equal(formatDuration(90000), '2ふん');
  assert.equal(formatDuration(3600000), '1じかん');
  assert.equal(formatDuration(5400000), '1じかん 30ふん');
  assert.deepEqual(MASCOT_POSES, ['normal', 'happy', 'cheer', 'think']);
});
