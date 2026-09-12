import { h, clear, starsHtml, mascotImg } from '../core/ui.js';
import { sfx, speak } from '../core/audio.js';
import { GAMES } from '../games/index.js';

const GREETINGS = [
  'きょうも あそぼう！',
  'なにから はじめる？',
  'いっしょに がんばろう！',
  'よく きたね！',
];

export function renderHome({ root, state, onPlay, onStickers, onParent }) {
  const greeting = GREETINGS[new Date().getDate() % GREETINGS.length];
  const levelLabel = ['やさしい', 'ふつう', 'むずかしい'][state.profile.level - 1] || 'やさしい';

  const tiles = GAMES.map((game) => {
    const record = state.games[game.id];
    return h(
      'button',
      {
        class: 'tile',
        type: 'button',
        style: { '--game-color': game.color },
        'aria-label': game.title,
        onclick: () => { sfx.tap(); speak(game.intro || game.title, 'ja-JP'); onPlay(game.id); },
      },
      h('img', { class: 'tile-icon', src: game.icon, alt: '', draggable: 'false' }),
      h('span', { class: 'tile-title' }, game.title),
      h('span', { class: 'tile-sub' }, game.subtitle),
      h('span', { class: 'tile-stars', html: starsHtml(record ? record.bestStars : 0) }),
    );
  });

  const screen = h(
    'div',
    { class: 'screen screen-home' },
    h(
      'header',
      { class: 'home-header' },
      mascotImg('cheer', 'mascot mascot-home'),
      h(
        'div',
        { class: 'home-greeting' },
        h('h1', { class: 'app-title' }, 'きっずトライ'),
        h('p', { class: 'home-sub' }, greeting),
      ),
      h(
        'div',
        { class: 'home-actions' },
        h('span', { class: 'chip chip-streak' }, `れんぞく ${Math.max(state.streak, 0)}にち`),
        h('span', { class: 'chip chip-level' }, `むずかしさ：${levelLabel}`),
        h(
          'button',
          { class: 'pill-btn', type: 'button', onclick: () => { sfx.tap(); onStickers(); } },
          `⭐ シール ${state.stickers.length}/24`,
        ),
        parentButton(onParent),
      ),
    ),
    h('div', { class: 'tile-grid' }, tiles),
  );

  clear(root).append(screen);
}

/** 3びょう ながおし で おうちのかた ページへ（こどもの ごそうさ ぼうし） */
function parentButton(onParent) {
  let timer = null;
  let startedAt = 0;
  const btn = h('button', {
    class: 'pill-btn pill-parent',
    type: 'button',
    'aria-label': 'おうちのかた（3びょう ながおし）',
  }, '👪 おうちのかた');
  const fill = h('span', { class: 'hold-fill' });
  btn.append(fill);

  const start = (ev) => {
    ev.preventDefault();
    startedAt = Date.now();
    btn.classList.add('is-holding');
    timer = setTimeout(() => {
      btn.classList.remove('is-holding');
      sfx.tap();
      onParent();
    }, 3000);
  };
  const cancel = () => {
    clearTimeout(timer);
    btn.classList.remove('is-holding');
    if (Date.now() - startedAt < 3000) {
      btn.classList.add('is-hint');
      setTimeout(() => btn.classList.remove('is-hint'), 900);
    }
  };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', cancel);
  btn.addEventListener('pointerleave', cancel);
  btn.addEventListener('pointercancel', cancel);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  return btn;
}
