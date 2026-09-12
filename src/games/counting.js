import { COUNTABLES } from '../data/words.js';
import { pick, randInt } from '../core/random.js';
import { buildChoices, numberDistractors, clampLevel } from './_helpers.js';

export const meta = {
  id: 'counting',
  title: 'かずを かぞえよう',
  subtitle: 'いくつ あるかな',
  domain: 'かず',
  color: '#4cc9f0',
  icon: 'assets/icons/game-counting.svg',
  intro: 'いくつ あるか かぞえてね',
};

const RANGES = { 1: [1, 5], 2: [1, 10], 3: [6, 20] };

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const [min, max] = RANGES[lv];
  const questions = [];
  for (let i = 0; i < count; i++) {
    const n = randInt(rng, min, max);
    const emoji = pick(rng, COUNTABLES);
    const wrong = numberDistractors(rng, n, 3, Math.max(1, min - 1), max + 2);
    const { choices, answer } = buildChoices(rng, 'number', n, wrong);
    questions.push({
      id: `${meta.id}-${i}`,
      ask: { text: 'いくつ あるかな？', speak: 'いくつ あるかな', lang: 'ja-JP' },
      stage: { kind: 'group', emoji, count: n },
      choices,
      answer,
      layout: 'grid4',
    });
  }
  return questions;
}
