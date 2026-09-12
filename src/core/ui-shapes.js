// かたちの データ（DOM を つかわない ので テスト できる）
export const SHAPES = {
  circle: { name: 'まる', corners: 0, body: '<circle cx="50" cy="50" r="42"/>' },
  triangle: { name: 'さんかく', corners: 3, body: '<polygon points="50,7 93,88 7,88"/>' },
  square: { name: 'しかく', corners: 4, body: '<rect x="9" y="9" width="82" height="82" rx="8"/>' },
  diamond: { name: 'ひしがた', corners: 4, body: '<polygon points="50,5 95,50 50,95 5,50"/>' },
  star: {
    name: 'ほし',
    corners: 5,
    body: '<polygon points="50,5 61,37 95,37 67,57 78,90 50,70 22,90 33,57 5,37 39,37"/>',
  },
  heart: {
    name: 'はーと',
    corners: 0,
    body: '<path d="M50 89C22 70 7 54 7 37 7 23 18 13 31 13c8 0 15 4 19 10 4-6 11-10 19-10 13 0 24 10 24 24 0 17-15 33-43 52z"/>',
  },
};

export const SHAPE_KEYS = Object.keys(SHAPES);

export function shapeSvg(key, color = '#ff8fa3', size = 120) {
  const shape = SHAPES[key];
  if (!shape) return '';
  return `<svg class="shape-svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <g fill="${color}" stroke="rgba(0,0,0,.12)" stroke-width="2" stroke-linejoin="round">${shape.body}</g>
  </svg>`;
}
