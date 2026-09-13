import { WORDS, SIMPLE_WORDS } from '../data/words.js';
import { pick, sample, shuffle } from '../core/random.js';
import { buildChoices, clampLevel } from './_helpers.js';

export const meta = {
  id: 'shiritori',
  title: 'しりとり',
  subtitle: 'つぎの ことばは？',
  domain: 'ことば',
  color: '#f783ac',
  icon: 'assets/icons/game-shiritori.svg',
  intro: 'しりとりを しよう',
  locked: true,
};

/** かしらもじ ごとに ことばを まとめる */
function indexByHead(words) {
  const map = new Map();
  for (const w of words) {
    if (!map.has(w.head)) map.set(w.head, []);
    map.get(w.head).push(w);
  }
  return map;
}

/** だくおん・はんだくおん の ペア（レベル3の まぎらわしい はずれ） */
const NEAR = {
  か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご',
  さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ',
  た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど',
  は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ',
};

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const pool = lv === 1 ? SIMPLE_WORDS : WORDS;
  const byHead = indexByHead(WORDS);
  // 「ん」で おわらず、つづきの ことばが ある ものだけを もんだいに する
  const starters = pool.filter((w) => w.tail !== 'ん' && (byHead.get(w.tail) || []).some((x) => x.yomi !== w.yomi));

  const questions = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let word = pick(rng, starters);
    let guard = 0;
    while (used.has(word.yomi) && guard++ < 60) word = pick(rng, starters);
    used.add(word.yomi);

    const nexts = byHead.get(word.tail).filter((x) => x.yomi !== word.yomi);
    const answer = pick(rng, nexts);

    // はずれは「つぎの もじで はじまらない」ことばだけ
    const wrongPool = WORDS.filter((x) => x.head !== word.tail && x.yomi !== word.yomi);
    let wrong;
    if (lv === 3 && NEAR[word.tail]) {
      const tricky = wrongPool.filter((x) => x.head === NEAR[word.tail]);
      wrong = shuffle(rng, [...sample(rng, tricky, 1), ...sample(rng, wrongPool, 3)]).slice(0, 3);
    } else {
      wrong = sample(rng, wrongPool, 3);
    }

    const { choices, answer: key } = buildChoices(
      rng,
      'emoji',
      answer.emoji,
      wrong.map((w) => w.emoji),
      (emoji) => ({ label: (WORDS.find((w) => w.emoji === emoji) || {}).yomi || '' }),
    );

    questions.push({
      id: `${meta.id}-${i}`,
      ask: {
        text: `「${word.yomi}」の つぎは どれ？`,
        speak: `${word.yomi}。つぎは ${word.tail} から はじまる ことばだよ`,
        lang: 'ja-JP',
      },
      stage: { kind: 'chain', emoji: word.emoji, word: word.yomi, tail: word.tail },
      choices,
      answer: key,
      layout: 'grid4',
    });
  }
  return questions;
}
