import { shuffle, pick } from '../core/random.js';
import { buildChoices, clampLevel } from './_helpers.js';

export const meta = {
  id: 'seikatsu',
  title: 'せいかつ めいじん',
  subtitle: 'ただしいのは どっち',
  domain: 'せいかつ',
  color: '#63e6be',
  icon: 'assets/icons/game-seikatsu.svg',
  intro: 'ただしい ほうを えらんでね',
};

const SCENES = [
  { q: 'ごはんの まえに することは？', good: ['🧼', 'てを あらう'], bad: [['🧸', 'おもちゃで あそぶ'], ['📺', 'てれびを みる']] },
  { q: 'そとから かえったら？', good: ['🤲', 'てあらい うがい'], bad: [['🛋️', 'そのまま すわる'], ['🍪', 'おかしを たべる']] },
  { q: 'ねる まえに することは？', good: ['🪥', 'はを みがく'], bad: [['🎮', 'げーむを する'], ['🍬', 'あめを たべる']] },
  { q: 'あさ おきたら まず？', good: ['👋', 'おはようと いう'], bad: [['😴', 'もういちど ねる'], ['📱', 'ごろごろ する']] },
  { q: 'あそんだ あとは？', good: ['🧺', 'おもちゃを かたづける'], bad: [['🚪', 'そのまま でかける'], ['🛏️', 'ねてしまう']] },
  { q: 'おうだんほどうを わたる ときは？', good: ['🚸', 'みぎひだりを みる'], bad: [['🏃', 'はしって わたる'], ['📖', 'ほんを よみながら']] },
  { q: 'くしゃみが でそうな ときは？', good: ['💨', 'ひじで くちを おさえる'], bad: [['😮', 'そのまま する'], ['👋', 'てを ふる']] },
  { q: 'ともだちに なにか もらったら？', good: ['🙏', 'ありがとうと いう'], bad: [['🤐', 'なにも いわない'], ['🏃', 'はしって いく']] },
  { q: 'たべものを こぼしたら？', good: ['🧽', 'じぶんで ふく'], bad: [['🙈', 'かくす'], ['🏃', 'にげる']] },
  { q: 'はみがきは いつ する？', good: ['🪥', 'ごはんの あと'], bad: [['🌧️', 'あめの ひだけ'], ['🎂', 'たんじょうびだけ']] },
  { q: 'よるは なんじに ねる？', good: ['🌙', 'はやく ねる'], bad: [['🌃', 'よふかし する'], ['📺', 'てれびを みつづける']] },
  { q: 'くつを ぬいだら？', good: ['👟', 'そろえて ならべる'], bad: [['🌀', 'ばらばらの まま'], ['🚀', 'なげる']] },
  { q: 'ごはんの ときの すわりかたは？', good: ['🪑', 'せすじを のばす'], bad: [['🛌', 'ねころぶ'], ['🤸', 'たちあがる']] },
  { q: 'ともだちと あそぶ ときは？', good: ['🤝', 'じゅんばんを まもる'], bad: [['😠', 'とりあげる'], ['🏃', 'ひとりで いく']] },
];

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const choiceCount = lv === 1 ? 2 : lv === 2 ? 2 : 3;
  const order = shuffle(rng, SCENES);
  const questions = [];
  for (let i = 0; i < count; i++) {
    const scene = order[i % order.length];
    const bads = shuffle(rng, scene.bad).slice(0, choiceCount - 1);
    const { choices, answer } = buildChoices(
      rng,
      'emoji',
      scene.good[0],
      bads.map((b) => b[0]),
      (emoji) => {
        const found = emoji === scene.good[0] ? scene.good : scene.bad.find((b) => b[0] === emoji);
        return { label: found ? found[1] : '' };
      },
    );
    questions.push({
      id: `${meta.id}-${i}`,
      ask: { text: scene.q, speak: scene.q, lang: 'ja-JP' },
      stage: { kind: 'none' },
      choices,
      answer,
      layout: choiceCount === 2 ? 'grid2' : 'grid3',
    });
  }
  return questions;
}
