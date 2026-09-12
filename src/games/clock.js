import { randInt, pick, shuffle } from '../core/random.js';
import { buildChoices, clampLevel } from './_helpers.js';

export const meta = {
  id: 'clock',
  title: 'とけいを よもう',
  subtitle: 'なんじ かな？',
  domain: 'とけい',
  color: '#b197fc',
  icon: 'assets/icons/game-clock.svg',
  intro: 'とけいを よんでみよう',
};

function label(hour, minute) {
  return minute === 30 ? `${hour}じはん` : `${hour}じ`;
}

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const questions = [];
  for (let i = 0; i < count; i++) {
    const hour = randInt(rng, 1, 12);
    const minute = lv === 1 ? 0 : lv === 2 ? pick(rng, [0, 30]) : pick(rng, [0, 30, 30]);
    const correct = label(hour, minute);
    const pool = [];
    for (let d = 1; d <= 5; d++) {
      pool.push(label(((hour + d - 1) % 12) + 1, minute));
      pool.push(label(((hour - d + 11) % 12) + 1, minute));
    }
    if (lv >= 2) {
      pool.unshift(label(hour, minute === 30 ? 0 : 30));
      pool.unshift(label(((hour % 12) + 1), minute === 30 ? 0 : 30));
    }
    const wrong = [...new Set(pool)].filter((t) => t !== correct);
    const { choices, answer } = buildChoices(rng, 'text', correct, shuffle(rng, wrong).slice(0, 3));
    questions.push({
      id: `${meta.id}-${i}`,
      ask: { text: 'なんじ かな？', speak: 'なんじ かな', lang: 'ja-JP' },
      stage: { kind: 'clock', hour, minute },
      choices,
      answer,
      layout: 'grid4',
    });
  }
  return questions;
}
