import { SEASONS } from '../data/seasons.js';
import { pick, sample } from '../core/random.js';
import { buildChoices, clampLevel } from './_helpers.js';

export const meta = {
  id: 'seasons',
  title: 'きせつ めぐり',
  subtitle: 'はる なつ あき ふゆ',
  domain: 'しぜん',
  color: '#69db7c',
  icon: 'assets/icons/game-seasons.svg',
  intro: 'きせつの ものを さがそう',
  locked: true,
};

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const questions = [];
  for (let i = 0; i < count; i++) {
    const season = pick(rng, SEASONS);
    const askSeason = lv < 3 || i % 2 === 0;

    if (askSeason) {
      // 「なつの ものは どれ？」→ きせつ ごとに 1つずつ ならべる
      const correct = pick(rng, season.items);
      const others = SEASONS.filter((s) => s.key !== season.key).map((s) => pick(rng, s.items));
      const { choices, answer } = buildChoices(
        rng,
        'emoji',
        correct.emoji,
        others.map((o) => o.emoji),
        (emoji) => {
          const found = SEASONS.flatMap((s) => s.items).find((it) => it.emoji === emoji);
          return { label: found ? found.name : '' };
        },
      );
      questions.push({
        id: `${meta.id}-${i}`,
        ask: { text: `${season.name}の ものは どれ？`, speak: `${season.name}の ものは どれかな`, lang: 'ja-JP' },
        stage: { kind: 'none' },
        choices,
        answer,
        layout: 'grid4',
      });
    } else {
      // 「これは どの きせつ？」→ きせつの なまえを えらぶ
      const item = pick(rng, season.items);
      const { choices, answer } = buildChoices(
        rng,
        'text',
        season.name,
        SEASONS.filter((s) => s.key !== season.key).map((s) => s.name),
      );
      questions.push({
        id: `${meta.id}-${i}`,
        ask: { text: 'これは どの きせつ？', speak: `${item.name}。これは どの きせつかな`, lang: 'ja-JP' },
        stage: { kind: 'emoji-word', emoji: item.emoji, word: item.name },
        choices,
        answer,
        layout: 'grid4',
      });
    }
  }
  return questions;
}
