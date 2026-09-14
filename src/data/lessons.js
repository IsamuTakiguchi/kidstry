// 「おしえて」… クイズの まえに みる アニメ かいせつ
//
// step の かたち:
//   kind   … どんな えを だすか（screens/lesson.js が えがく）
//   text   … がめんに だす もじ
//   speak  … よみあげる ことば
//   ms     … つぎに すすむまでの ながさ（ミリびょう）
import { WEEKDAYS } from './weekdays.js';

/** つかえる え の しゅるい（テストで たしかめる） */
export const STEP_KINDS = new Set(['week', 'row', 'clock', 'count', 'shape', 'title']);

const weekdayLesson = {
  title: 'ようびを おぼえよう',
  steps: [
    { kind: 'title', emoji: '📅', text: 'ようびは 7つ あるよ', speak: 'ようびは ななつ あるよ', ms: 2600 },
    ...WEEKDAYS.map((day, i) => ({
      kind: 'week',
      upto: i,
      highlight: i,
      text: day.name,
      speak: day.name,
      ms: 1500,
    })),
    {
      kind: 'week',
      upto: 6,
      text: 'これで 1しゅうかん！',
      speak: 'これで いっしゅうかん',
      ms: 2600,
    },
    {
      kind: 'week',
      upto: 6,
      highlight: 1,
      next: 2,
      text: 'げつようびの つぎは かようび',
      speak: 'げつようびの つぎは かようび',
      ms: 3000,
    },
    {
      kind: 'week',
      upto: 6,
      highlight: 6,
      next: 0,
      text: 'どようびの つぎは、また にちようび',
      speak: 'どようびの つぎは、また にちようびに もどるよ',
      ms: 3400,
    },
  ],
};

const leftRightLesson = {
  title: 'みぎと ひだりを おぼえよう',
  steps: [
    { kind: 'title', emoji: '👉', text: 'みぎと ひだりを おぼえよう', speak: 'みぎと ひだりを おぼえよう', ms: 2600 },
    {
      kind: 'row',
      items: ['🐶', '🐱', '🐰', '🐻'],
      mark: 0,
      side: 'left',
      text: 'いちばん ひだり',
      speak: 'こちらが ひだり。いちばん ひだりは いぬ',
      ms: 3000,
    },
    {
      kind: 'row',
      items: ['🐶', '🐱', '🐰', '🐻'],
      mark: 3,
      side: 'right',
      text: 'いちばん みぎ',
      speak: 'こちらが みぎ。いちばん みぎは くま',
      ms: 3000,
    },
    {
      kind: 'row',
      items: ['🐶', '🐱', '🐰', '🐻'],
      mark: 3,
      count: [3],
      side: 'right',
      text: 'みぎから 1ばんめ',
      speak: 'みぎから かぞえるよ。1ばんめ',
      ms: 2000,
    },
    {
      kind: 'row',
      items: ['🐶', '🐱', '🐰', '🐻'],
      mark: 2,
      count: [3, 2],
      side: 'right',
      text: 'みぎから 2ばんめ',
      speak: '2ばんめは うさぎ',
      ms: 2600,
    },
    {
      kind: 'row',
      items: ['🐶', '🐱', '🐰', '🐻'],
      mark: 1,
      count: [0, 1],
      side: 'left',
      text: 'ひだりから 2ばんめ',
      speak: 'ひだりから 2ばんめは ねこ',
      ms: 3000,
    },
  ],
};

const clockLesson = {
  title: 'とけいの よみかた',
  steps: [
    { kind: 'title', emoji: '⏰', text: 'とけいを よんで みよう', speak: 'とけいを よんで みよう', ms: 2400 },
    { kind: 'clock', hour: 3, minute: 0, point: 'hour', text: 'みじかい はりが「じ」', speak: 'みじかい はりが、じ を おしえて くれるよ', ms: 3200 },
    { kind: 'clock', hour: 3, minute: 0, point: 'minute', text: 'ながい はりが「ふん」', speak: 'ながい はりが、ふん を おしえて くれるよ', ms: 3200 },
    { kind: 'clock', hour: 3, minute: 0, text: 'ながい はりが うえ むきは「ちょうど」', speak: 'ながい はりが うえを むいて いるから、3じ ちょうど', ms: 3400 },
    { kind: 'clock', hour: 3, minute: 30, text: 'ながい はりが した むきは「はん」', speak: 'ながい はりが したを むくと、3じはん', ms: 3400 },
    { kind: 'clock', hour: 8, minute: 0, text: 'これは なんじ？ → 8じ', speak: 'これは 8じ', ms: 3000 },
    { kind: 'clock', hour: 8, minute: 30, text: 'これは？ → 8じはん', speak: 'これは 8じはん', ms: 3000 },
  ],
};

const countingLesson = {
  title: 'かずを かぞえよう',
  steps: [
    { kind: 'title', emoji: '🔢', text: 'ひとつずつ かぞえよう', speak: 'ひとつずつ かぞえて みよう', ms: 2400 },
    ...[1, 2, 3, 4, 5].map((n) => ({
      kind: 'count',
      emoji: '🍎',
      count: n,
      text: `${n}`,
      speak: String(n),
      ms: 1300,
    })),
    { kind: 'count', emoji: '🍎', count: 5, text: 'ぜんぶで 5こ', speak: 'ぜんぶで ごこ', ms: 2600 },
    ...[6, 7, 8, 9, 10].map((n) => ({
      kind: 'count',
      emoji: '⭐',
      count: n,
      text: `${n}`,
      speak: String(n),
      ms: 1300,
    })),
    { kind: 'count', emoji: '⭐', count: 10, text: 'ぜんぶで 10こ！', speak: 'ぜんぶで じゅっこ', ms: 2800 },
  ],
};

const shapesLesson = {
  title: 'かたちの なまえ',
  steps: [
    { kind: 'title', emoji: '🔷', text: 'かたちの なまえを おぼえよう', speak: 'かたちの なまえを おぼえよう', ms: 2400 },
    { kind: 'shape', shape: 'circle', color: '#ff8fa3', text: 'まる：かどが ないよ', speak: 'まる。かどが ないよ', ms: 2600 },
    { kind: 'shape', shape: 'triangle', color: '#4cc9f0', text: 'さんかく：かどが 3つ', speak: 'さんかく。かどが みっつ', ms: 2600 },
    { kind: 'shape', shape: 'square', color: '#ffd166', text: 'しかく：かどが 4つ', speak: 'しかく。かどが よっつ', ms: 2600 },
    { kind: 'shape', shape: 'diamond', color: '#80ed99', text: 'ひしがた：かども 4つ', speak: 'ひしがた。かどは よっつ', ms: 2600 },
    { kind: 'shape', shape: 'star', color: '#ffa94d', text: 'ほし：とがりが 5つ', speak: 'ほし。とがりが いつつ', ms: 2600 },
    { kind: 'shape', shape: 'heart', color: '#f783ac', text: 'はーと', speak: 'はーと', ms: 2200 },
  ],
};

export const LESSONS = {
  weekday: weekdayLesson,
  'left-right': leftRightLesson,
  clock: clockLesson,
  counting: countingLesson,
  shapes: shapesLesson,
};

export function lessonFor(gameId) {
  return LESSONS[gameId] || null;
}

export function hasLesson(gameId) {
  return Boolean(LESSONS[gameId]);
}
