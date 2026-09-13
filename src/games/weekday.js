import { WEEKDAYS, WEEK_LENGTH, shiftDay } from '../data/weekdays.js';
import { randInt, pick, sample } from '../core/random.js';
import { buildChoices, clampLevel } from './_helpers.js';

export const meta = {
  id: 'weekday',
  title: 'ようびの じゅんばん',
  subtitle: 'つぎは なにようび？',
  domain: 'とけい',
  color: '#74c0fc',
  icon: 'assets/icons/game-weekday.svg',
  intro: 'ようびの じゅんばんを おぼえよう',
};

/** レベルごとの きき かた（offset：+1 は つぎの ひ、-1 は まえの ひ） */
const OFFSETS = {
  1: [1],
  2: [1, -1],
  3: [1, -1, 2],
};

function askFor(day, offset) {
  if (offset === 1) return { text: `${day.name}の つぎは？`, speak: `${day.name}の つぎは なにようび` };
  if (offset === -1) return { text: `${day.name}の まえは？`, speak: `${day.name}の まえは なにようび` };
  return { text: `${day.name}の 2にち あとは？`, speak: `${day.name}の ふつか あとは なにようび` };
}

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const offsets = OFFSETS[lv];
  const questions = [];
  for (let i = 0; i < count; i++) {
    const index = randInt(rng, 0, WEEK_LENGTH - 1);
    const day = WEEKDAYS[index];
    const offset = pick(rng, offsets);
    const correct = shiftDay(index, offset);
    const wrong = sample(rng, WEEKDAYS.filter((d) => d.key !== correct.key), 3);
    const { choices, answer } = buildChoices(rng, 'text', correct.name, wrong.map((d) => d.name));
    const ask = askFor(day, offset);
    questions.push({
      id: `${meta.id}-${i}`,
      ask: { ...ask, lang: 'ja-JP' },
      stage: {
        kind: 'week',
        knownIndex: index,
        askIndex: (((index + offset) % WEEK_LENGTH) + WEEK_LENGTH) % WEEK_LENGTH,
      },
      choices,
      answer,
      layout: 'grid4',
    });
  }
  return questions;
}
