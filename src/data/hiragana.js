// せいおん 46もじ（ぎょう ごとに まとめる）
export const GOJUON = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', 'ゆ', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', 'を', 'ん'],
];

export const HIRAGANA = GOJUON.flat();

export const DAKUON = [
  'が', 'ぎ', 'ぐ', 'げ', 'ご',
  'ざ', 'じ', 'ず', 'ぜ', 'ぞ',
  'だ', 'ぢ', 'づ', 'で', 'ど',
  'ば', 'び', 'ぶ', 'べ', 'ぼ',
  'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ',
];

/** ひらがな → カタカナ */
export function toKatakana(ch) {
  const code = ch.codePointAt(0);
  if (code >= 0x3041 && code <= 0x3096) return String.fromCodePoint(code + 0x60);
  return ch;
}

export const KATAKANA = HIRAGANA.map(toKatakana);

/** よみあげ用：「ん」など たんどくで よみにくい もじを おぎなう */
export function speakChar(ch) {
  if (ch === 'ん') return 'ん、の ん';
  if (ch === 'を') return 'を';
  return ch;
}
