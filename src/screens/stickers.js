import { h, clear } from '../core/ui.js';
import { sfx, speak } from '../core/audio.js';
import { STICKERS } from '../data/stickers.js';

export function renderStickerBook({ root, state, onHome }) {
  const owned = new Set(state.stickers);
  const cells = STICKERS.map((s) => {
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

  const screen = h(
    'div',
    { class: 'screen screen-stickers' },
    h(
      'header',
      { class: 'sub-header' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'ホームに もどる', onclick: () => { sfx.tap(); onHome(); } }, '🏠'),
      h('h1', { class: 'sub-title' }, 'シールちょう'),
      h('span', { class: 'chip' }, `${owned.size} / ${STICKERS.length}`),
    ),
    h('div', { class: 'sticker-grid' }, cells),
  );
  clear(root).append(screen);
}
