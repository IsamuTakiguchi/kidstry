import { h, clear } from '../core/ui.js';
import { sfx, speak } from '../core/audio.js';
import { STICKERS } from '../data/stickers.js';
import { GAMES } from '../games/index.js';
import { stickerBookComplete, stickersLeft, hasMedal, medalCount, STICKER_GOAL } from '../core/state.js';

export function renderStickerBook({ root, state, onHome, tab = null }) {
  const owned = new Set(state.stickers);
  const complete = stickerBookComplete(state);
  const medals = medalCount(state, GAMES);
  // さいしょに ひらく タブは「いまの もくひょう」
  const active = tab || (complete ? 'medal' : 'sticker');

  const stickerCells = STICKERS.map((s) => {
    const has = owned.has(s.id);
    return h(
      'button',
      {
        class: `sticker-cell ${has ? 'is-owned' : 'is-locked'}`,
        type: 'button',
        style: { '--sticker-color': s.color },
        'aria-label': has ? s.name : 'まだ もって いない シール',
        onclick: () => { sfx.tap(); if (has) speak(s.name, 'ja-JP'); },
      },
      h('span', { class: 'sticker-emoji' }, has ? s.emoji : '？'),
      h('span', { class: 'sticker-name' }, has ? s.name : 'ひみつ'),
    );
  });

  const medalCells = GAMES.map((game) => {
    const got = hasMedal(state, game.id);
    const playable = !game.locked || complete;
    return h(
      'button',
      {
        class: `medal-cell ${got ? 'is-owned' : playable ? 'is-empty' : 'is-locked'}`,
        type: 'button',
        style: { '--game-color': game.color },
        'aria-label': got ? `${game.title} きんメダル` : `${game.title} まだ`,
        onclick: () => {
          sfx.tap();
          speak(got ? `${game.title} きんメダル` : `${game.title}で ほし3つを とろう`, 'ja-JP');
        },
      },
      h('span', { class: 'medal-ring' }, h('img', { class: 'medal-icon', src: game.icon, alt: '', draggable: 'false' })),
      h('span', { class: 'medal-name' }, game.title),
    );
  });

  const tabButton = (key, label) => h(
    'button',
    {
      class: `collection-tab ${active === key ? 'is-active' : ''}`,
      type: 'button',
      onclick: () => { sfx.tap(); renderStickerBook({ root, state, onHome, tab: key }); },
    },
    label,
  );

  const section = active === 'sticker'
    ? h(
        'section',
        { class: 'collection-section' },
        h('p', { class: 'collection-note' },
          complete
            ? 'ぜんぶ あつまったね！ あたらしい あそびが ふえたよ。'
            : `1かい あそぶと 1まい もらえるよ。あと ${stickersLeft(state)}まい！`),
        h('div', { class: 'sticker-grid' }, stickerCells),
      )
    : h(
        'section',
        { class: 'collection-section' },
        h('p', { class: 'collection-note' },
          medals >= GAMES.length
            ? 'ぜんぶ あつまった！ すごい！'
            : 'それぞれの あそびで ★を 3つ とると もらえるよ。'),
        h('div', { class: 'medal-grid' }, medalCells),
      );

  const screen = h(
    'div',
    { class: 'screen screen-stickers' },
    h(
      'header',
      { class: 'sub-header' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'ホームに もどる', onclick: () => { sfx.tap(); onHome(); } }, '🏠'),
      h('h1', { class: 'sub-title' }, 'コレクション'),
      h(
        'div',
        { class: 'collection-tabs' },
        tabButton('sticker', `⭐ シール ${owned.size}/${STICKER_GOAL}`),
        tabButton('medal', `🏅 メダル ${medals}/${GAMES.length}`),
      ),
    ),
    h('div', { class: 'collection-body' }, section),
  );
  clear(root).append(screen);
}
