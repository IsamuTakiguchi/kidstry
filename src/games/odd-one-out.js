import { WORDS, GROUPS } from '../data/words.js';
import { pick, sample } from '../core/random.js';
import { buildChoices, clampLevel } from './_helpers.js';

export const meta = {
  id: 'odd-one-out',
  title: 'なかまはずれ',
  subtitle: 'ちがうのは どれ',
  domain: 'ちえ',
  color: '#9775fa',
  icon: 'assets/icons/game-odd-one-out.svg',
  intro: 'なかまじゃ ないものを さがそう',
  locked: true,
};

/** レベル1は とくに くべつ しやすい くみあわせ */
const EASY_PAIRS = [
  ['どうぶつ', 'のりもの'],
  ['たべもの', 'のりもの'],
  ['どうぶつ', 'たべもの'],
];

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const questions = [];
  for (let i = 0; i < count; i++) {
    let mainGroup;
    let oddGroup;
    if (lv === 1) {
      [mainGroup, oddGroup] = pick(rng, EASY_PAIRS);
      if (rng() < 0.5) [mainGroup, oddGroup] = [oddGroup, mainGroup];
    } else {
      mainGroup = pick(rng, GROUPS);
      oddGroup = pick(rng, GROUPS.filter((g) => g !== mainGroup));
    }
    const mates = sample(rng, WORDS.filter((w) => w.group === mainGroup), 3);
    const odd = pick(rng, WORDS.filter((w) => w.group === oddGroup));

    const { choices, answer } = buildChoices(
      rng,
      'emoji',
      odd.emoji,
      mates.map((m) => m.emoji),
      (emoji) => ({ label: (WORDS.find((w) => w.emoji === emoji) || {}).yomi || '' }),
    );

    questions.push({
      id: `${meta.id}-${i}`,
      ask: { text: 'なかまじゃ ないのは どれ？', speak: 'なかまじゃ ないのは どれかな', lang: 'ja-JP' },
      stage: { kind: 'none' },
      choices,
      answer,
      layout: 'grid4',
    });
  }
  return questions;
}
