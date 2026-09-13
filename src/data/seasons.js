// きせつ と しぜん
export const SEASONS = [
  {
    key: 'spring',
    name: 'はる',
    color: '#ffc0cb',
    items: [
      { emoji: '🌸', name: 'さくら' },
      { emoji: '🍓', name: 'いちご' },
      { emoji: '🦋', name: 'ちょうちょ' },
      { emoji: '🌷', name: 'ちゅーりっぷ' },
    ],
  },
  {
    key: 'summer',
    name: 'なつ',
    color: '#4cc9f0',
    items: [
      { emoji: '🍉', name: 'すいか' },
      { emoji: '🎆', name: 'はなび' },
      { emoji: '🌻', name: 'ひまわり' },
      { emoji: '🏖️', name: 'うみ' },
    ],
  },
  {
    key: 'autumn',
    name: 'あき',
    color: '#ffa94d',
    items: [
      { emoji: '🍁', name: 'もみじ' },
      { emoji: '🌰', name: 'くり' },
      { emoji: '🍠', name: 'さつまいも' },
      { emoji: '🎑', name: 'おつきみ' },
    ],
  },
  {
    key: 'winter',
    name: 'ふゆ',
    color: '#a5d8ff',
    items: [
      { emoji: '⛄', name: 'ゆきだるま' },
      { emoji: '🎄', name: 'くりすます' },
      { emoji: '🧤', name: 'てぶくろ' },
      { emoji: '❄️', name: 'ゆき' },
    ],
  },
];

export function seasonByKey(key) {
  return SEASONS.find((s) => s.key === key) || null;
}
