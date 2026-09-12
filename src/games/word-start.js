import { WORDS, SIMPLE_WORDS } from '../data/words.js';
import { HIRAGANA } from '../data/hiragana.js';
import { sample, pick } from '../core/random.js';
import { buildChoices, clampLevel } from './_helpers.js';

export const meta = {
  id: 'word-start',
  title: 'あたまの もじ',
  subtitle: 'かくれた もじは なに？',
  domain: 'ことば',
  color: '#ffb703',
  icon: 'assets/icons/game-word-start.svg',
  intro: 'かくれた もじを あててね',
};

const SMALL = 'ぁぃぅぇぉっゃゅょー';

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const askTail = lv === 3;
  const source = lv === 1 ? SIMPLE_WORDS : WORDS;
  const pool = askTail
    ? source.filter((w) => w.yomi.length >= 2 && !SMALL.includes(w.yomi[w.yomi.length - 1]))
    : source;
  const questions = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let word = pick(rng, pool);
    let guard = 0;
    while (used.has(word.yomi) && guard++ < 40) word = pick(rng, pool);
    used.add(word.yomi);
    const index = askTail ? word.yomi.length - 1 : 0;
    const target = word.yomi[index];
    const masked = [...word.yomi].map((c, idx) => (idx === index ? '◯' : c)).join('');
    const wrong = sample(rng, HIRAGANA.filter((c) => c !== target), 3);
    const { choices, answer } = buildChoices(rng, 'text', target, wrong);
    questions.push({
      id: `${meta.id}-${i}`,
      ask: {
        text: askTail ? 'さいごの もじは どれ？' : 'さいしょの もじは どれ？',
        speak: `${word.yomi}。${askTail ? 'さいごの' : 'さいしょの'} もじは どれかな`,
        lang: 'ja-JP',
      },
      stage: { kind: 'emoji-word', emoji: word.emoji, word: masked },
      choices,
      answer,
      layout: 'grid4',
    });
  }
  return questions;
}
