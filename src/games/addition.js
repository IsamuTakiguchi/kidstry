import { pick, randInt } from '../core/random.js';
import { buildChoices, numberDistractors, clampLevel } from './_helpers.js';

export const meta = {
  id: 'addition',
  title: 'たしざん',
  subtitle: 'あわせて いくつ？',
  domain: 'かず',
  color: '#80ed99',
  icon: 'assets/icons/game-addition.svg',
  intro: 'あわせて いくつか かんがえてね',
};

const MAX_SUM = { 1: 5, 2: 10, 3: 20 };
const EMOJIS = ['🍎', '⭐', '🐟', '🎈', '🍪', '🌸'];

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const maxSum = MAX_SUM[lv];
  const questions = [];
  for (let i = 0; i < count; i++) {
    const a = randInt(rng, 1, Math.max(1, maxSum - 1));
    const b = randInt(rng, 1, Math.max(1, maxSum - a));
    const sum = a + b;
    const wrong = numberDistractors(rng, sum, 3, 1, maxSum + 2);
    const { choices, answer } = buildChoices(rng, 'number', sum, wrong);
    questions.push({
      id: `${meta.id}-${i}`,
      ask: { text: `${a} + ${b} は いくつ？`, speak: `${a} たす ${b} は いくつ`, lang: 'ja-JP' },
      stage: { kind: 'addition', a, b, emoji: pick(rng, EMOJIS) },
      choices,
      answer,
      layout: 'grid4',
    });
  }
  return questions;
}
