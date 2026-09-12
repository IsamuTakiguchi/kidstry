import { EN_NOUNS, EN_COLORS, EN_NUMBERS } from '../data/english.js';
import { pick, sample } from '../core/random.js';
import { buildChoices, clampLevel } from './_helpers.js';

export const meta = {
  id: 'english',
  title: 'えいご ことば',
  subtitle: 'English words',
  domain: 'えいご',
  color: '#4dabf7',
  icon: 'assets/icons/game-english.svg',
  intro: 'えいごを きいて えらんでね',
};

const EASY_GROUPS = ['どうぶつ', 'たべもの'];

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const nouns = lv === 1 ? EN_NOUNS.filter((w) => EASY_GROUPS.includes(w.group)) : EN_NOUNS;
  const questions = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    const useColor = lv === 3 && i % 3 === 1;
    const useNumber = lv === 3 && i % 3 === 2;
    let q;
    if (useColor) {
      const target = pick(rng, EN_COLORS);
      const others = sample(rng, EN_COLORS.filter((c) => c.en !== target.en), 3);
      const { choices, answer } = buildChoices(rng, 'emoji', target.emoji, others.map((o) => o.emoji));
      q = { target: target.en, ja: target.ja, choices, answer, stage: { kind: 'none' } };
    } else if (useNumber) {
      const target = pick(rng, EN_NUMBERS.slice(0, 10));
      const others = sample(rng, EN_NUMBERS.filter((n) => n.n !== target.n), 3);
      const { choices, answer } = buildChoices(rng, 'number', target.n, others.map((o) => o.n));
      q = { target: target.en, ja: `${target.n}`, choices, answer, stage: { kind: 'none' } };
    } else {
      let word = pick(rng, nouns);
      let guard = 0;
      while (used.has(word.en) && guard++ < 40) word = pick(rng, nouns);
      used.add(word.en);
      const others = sample(rng, nouns.filter((w) => w.en !== word.en), 3);
      const { choices, answer } = buildChoices(rng, 'emoji', word.emoji, others.map((o) => o.emoji));
      q = { target: word.en, ja: word.yomi, choices, answer, stage: { kind: 'none' } };
    }
    questions.push({
      id: `${meta.id}-${i}`,
      ask: { text: q.target, speak: q.target, lang: 'en-US', sub: 'どれ かな？' },
      reveal: q.ja,
      stage: q.stage,
      choices: q.choices,
      answer: q.answer,
      layout: 'grid4',
    });
  }
  return questions;
}
