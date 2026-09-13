// ようび（にちようび から はじまる、こよみの ならび）
export const WEEKDAYS = [
  { key: 'sun', name: 'にちようび', short: 'にち', color: '#ff8787' },
  { key: 'mon', name: 'げつようび', short: 'げつ', color: '#ffd8a8' },
  { key: 'tue', name: 'かようび', short: 'か', color: '#ffe066' },
  { key: 'wed', name: 'すいようび', short: 'すい', color: '#b2f2bb' },
  { key: 'thu', name: 'もくようび', short: 'もく', color: '#99e9f2' },
  { key: 'fri', name: 'きんようび', short: 'きん', color: '#d0bfff' },
  { key: 'sat', name: 'どようび', short: 'ど', color: '#74c0fc' },
];

export const WEEK_LENGTH = WEEKDAYS.length;

/** i ばんめから n にち すすんだ（もどった）ようび。1しゅうかんで ぐるっと まわる */
export function shiftDay(index, offset) {
  return WEEKDAYS[(((index + offset) % WEEK_LENGTH) + WEEK_LENGTH) % WEEK_LENGTH];
}
