import { pick, sample } from '../core/random.js';
import { buildChoices, clampLevel } from './_helpers.js';

export const meta = {
  id: 'pattern',
  title: 'ならびの きまり',
  subtitle: 'つぎは どれ？',
  domain: 'ちえ',
  color: '#ffd166',
  icon: 'assets/icons/game-pattern.svg',
  intro: 'つぎに くるのは どれかな',
};

const SYMBOL_SETS = [
  ['🍎', '🍌', '🍇', '🍓'],
  ['🔴', '🔵', '🟡', '🟢'],
  ['⭐', '❤️', '🔷', '🍀'],
  ['🐶', '🐱', '🐰', '🐻'],
  ['🚗', '✈️', '🚢', '🚲'],
];

/** きまりの もと（0,1,2 は 1ばんめ・2ばんめ・3ばんめの え） */
const RULES = {
  1: [[0, 1]],
  2: [[0, 0, 1, 1], [0, 1, 1], [0, 1, 2]],
  3: [[0, 1, 2], [0, 0, 1, 1, 2, 2], [0, 1, 2, 1]],
};

const SHOWN = 6;

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const questions = [];
  for (let i = 0; i < count; i++) {
    const base = pick(rng, RULES[lv]);
    const set = pick(rng, SYMBOL_SETS);
    const symbolCount = Math.max(...base) + 1;
    const symbols = sample(rng, set, symbolCount);
    const seq = Array.from({ length: SHOWN + 1 }, (_, idx) => symbols[base[idx % base.length]]);
    const correct = seq[SHOWN];
    const extras = set.filter((s) => !symbols.includes(s));
    const wrong = [...symbols.filter((s) => s !== correct), ...extras].slice(0, 3);
    const { choices, answer } = buildChoices(rng, 'emoji', correct, wrong);
    questions.push({
      id: `${meta.id}-${i}`,
      ask: { text: 'つぎは どれ？', speak: 'つぎは どれかな', lang: 'ja-JP' },
      stage: { kind: 'sequence', items: seq.slice(0, SHOWN) },
      choices,
      answer,
      layout: 'grid4',
    });
  }
  return questions;
}
