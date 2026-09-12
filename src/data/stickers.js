// ごほうび シール 24しゅるい（えもじ ＋ わくの いろ）
export const STICKERS = [
  { id: 'st01', emoji: '🦁', name: 'らいおん', color: '#ffb703' },
  { id: 'st02', emoji: '🐬', name: 'いるか', color: '#48cae4' },
  { id: 'st03', emoji: '🦄', name: 'ゆにこーん', color: '#f8a8d8' },
  { id: 'st04', emoji: '🚀', name: 'ろけっと', color: '#8ecae6' },
  { id: 'st05', emoji: '🍩', name: 'どーなつ', color: '#ffc8a2' },
  { id: 'st06', emoji: '🌈', name: 'にじ', color: '#c2e7b0' },
  { id: 'st07', emoji: '🐼', name: 'ぱんだ', color: '#d9e2ec' },
  { id: 'st08', emoji: '🍦', name: 'そふとくりーむ', color: '#ffe5b4' },
  { id: 'st09', emoji: '🐢', name: 'かめ', color: '#a3d9a5' },
  { id: 'st10', emoji: '🎡', name: 'かんらんしゃ', color: '#ffd6e0' },
  { id: 'st11', emoji: '🐝', name: 'はち', color: '#ffe066' },
  { id: 'st12', emoji: '🌻', name: 'ひまわり', color: '#ffd166' },
  { id: 'st13', emoji: '🐧', name: 'ぺんぎん', color: '#bde0fe' },
  { id: 'st14', emoji: '🍓', name: 'いちご', color: '#ffadad' },
  { id: 'st15', emoji: '🚂', name: 'きかんしゃ', color: '#b8c0ff' },
  { id: 'st16', emoji: '🎸', name: 'ぎたー', color: '#ffc6ff' },
  { id: 'st17', emoji: '🐙', name: 'たこ', color: '#ffafcc' },
  { id: 'st18', emoji: '⛄', name: 'ゆきだるま', color: '#caf0f8' },
  { id: 'st19', emoji: '🦖', name: 'きょうりゅう', color: '#9ae19d' },
  { id: 'st20', emoji: '🎁', name: 'ぷれぜんと', color: '#ffb5a7' },
  { id: 'st21', emoji: '🐳', name: 'くじら', color: '#90dbf4' },
  { id: 'st22', emoji: '🍀', name: 'よつば', color: '#b9fbc0' },
  { id: 'st23', emoji: '🎠', name: 'めりーごーらんど', color: '#fdc5f5' },
  { id: 'st24', emoji: '👑', name: 'おうかん', color: '#ffd700' },
];

export function stickerById(id) {
  return STICKERS.find((s) => s.id === id) || null;
}
