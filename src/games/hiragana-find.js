import { HIRAGANA, DAKUON, toKatakana, speakChar } from '../data/hiragana.js';
import { sample, pick } from '../core/random.js';
import { buildChoices, clampLevel } from './_helpers.js';

export const meta = {
  id: 'hiragana-find',
  title: 'ひらがな さがし',
  subtitle: 'よんだ もじを さがそう',
  domain: 'ことば',
  color: '#ff8fa3',
  icon: 'assets/icons/game-hiragana-find.svg',
  intro: 'よんだ もじを さがしてね',
};

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const pool = lv === 1 ? HIRAGANA : lv === 2 ? [...HIRAGANA, ...DAKUON] : HIRAGANA;
  const katakana = lv === 3;
  const questions = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let target = pick(rng, pool);
    let guard = 0;
    while (used.has(target) && guard++ < 40) target = pick(rng, pool);
    used.add(target);
    const wrong = sample(rng, pool.filter((c) => c !== target), 3);
    const display = (c) => (katakana ? toKatakana(c) : c);
    const { choices, answer } = buildChoices(rng, 'text', display(target), wrong.map(display));
    questions.push({
      id: `${meta.id}-${i}`,
      ask: {
        text: katakana ? `「${target}」と よむ カタカナは どれ？` : `「${target}」は どれ？`,
        speak: `${speakChar(target)}、は どれかな`,
        lang: 'ja-JP',
      },
      stage: { kind: 'none' },
      choices,
      answer,
      layout: 'grid4',
    });
  }
  return questions;
}
