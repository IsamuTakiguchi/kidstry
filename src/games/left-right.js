import { pick, sample, randInt } from '../core/random.js';
import { clampLevel } from './_helpers.js';

export const meta = {
  id: 'left-right',
  title: 'みぎと ひだり',
  subtitle: 'なんばんめ かな',
  domain: 'ちえ',
  color: '#ffa94d',
  icon: 'assets/icons/game-left-right.svg',
  intro: 'みぎと ひだりを おぼえよう',
};

const ITEMS = [
  '🍎', '🐶', '🚗', '⭐', '🌸', '🐟', '🎈', '🍌', '🐱', '🚌',
  '🌻', '🐰', '🍇', '✈️', '🐻', '🍓', '🚲', '🦋', '🍊', '🐸',
];

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const size = lv === 3 ? 5 : 4;
  const questions = [];
  for (let i = 0; i < count; i++) {
    const items = sample(rng, ITEMS, size);
    const fromRight = rng() < 0.5;
    // レベル1は「いちばん はし」だけ。なれてきたら ○ばんめ を きく
    const ordinal = lv === 1 ? 1 : randInt(rng, 1, size);
    const index = fromRight ? size - ordinal : ordinal - 1;
    const side = fromRight ? 'みぎ' : 'ひだり';
    const text = ordinal === 1 ? `いちばん ${side}は どれ？` : `${side}から ${ordinal}ばんめは どれ？`;

    // せんたくしは ならんで いる じゅんばんの まま（ならびが もんだいの いちぶ）
    const choices = items.map((emoji, idx) => ({ key: `c${idx}`, kind: 'emoji', value: emoji }));

    questions.push({
      id: `${meta.id}-${i}`,
      ask: { text, speak: text.replace('どれ？', 'どれかな'), lang: 'ja-JP' },
      stage: { kind: 'direction' },
      choices,
      answer: `c${index}`,
      layout: size === 5 ? 'grid5' : 'grid4',
    });
  }
  return questions;
}
