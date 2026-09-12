import { WORDS } from './words.js';

/** ものの なまえ（えいご） */
export const EN_NOUNS = WORDS.filter((w) => !w.en.includes(' '));

/** いろ */
export const EN_COLORS = [
  { emoji: '🟥', en: 'red', ja: 'あか' },
  { emoji: '🟦', en: 'blue', ja: 'あお' },
  { emoji: '🟨', en: 'yellow', ja: 'きいろ' },
  { emoji: '🟩', en: 'green', ja: 'みどり' },
  { emoji: '🟪', en: 'purple', ja: 'むらさき' },
  { emoji: '🟧', en: 'orange', ja: 'おれんじ' },
  { emoji: '⬛', en: 'black', ja: 'くろ' },
  { emoji: '⬜', en: 'white', ja: 'しろ' },
];

/** かず（えいご） */
export const EN_NUMBERS = [
  { n: 1, en: 'one' }, { n: 2, en: 'two' }, { n: 3, en: 'three' },
  { n: 4, en: 'four' }, { n: 5, en: 'five' }, { n: 6, en: 'six' },
  { n: 7, en: 'seven' }, { n: 8, en: 'eight' }, { n: 9, en: 'nine' },
  { n: 10, en: 'ten' },
];
