import { h, clear, starsHtml, mascotImg, showModal } from '../core/ui.js';
import { sfx, speak } from '../core/audio.js';
import { GAMES } from '../games/index.js';
import { hasLesson } from '../data/lessons.js';
import { stickerBookComplete, stickersLeft, hasMedal, medalCount, STICKER_GOAL } from '../core/state.js';

const GREETINGS = [
  'きょうも あそぼう！',
  'なにから はじめる？',
  'いっしょに がんばろう！',
  'よく きたね！',
];

export function renderHome({ root, state, onPlay, onLesson, onStickers, onParent }) {
  const greeting = GREETINGS[new Date().getDate() % GREETINGS.length];
  const levelLabel = ['やさしい', 'ふつう', 'むずかしい'][state.profile.level - 1] || 'やさしい';

  const unlocked = stickerBookComplete(state);
  const left = stickersLeft(state);

  const tiles = GAMES.map((game) => {
    const record = state.games[game.id];
    const isLocked = game.locked && !unlocked;
    if (isLocked) {
      return h(
        'button',
        {
          class: 'tile tile-locked',
          type: 'button',
          style: { '--game-color': game.color },
          'aria-label': `${game.title}（まだ あそべません）`,
          onclick: () => {
            sfx.tap();
            speak(`シールを あと ${left}まい あつめると あそべるよ`, 'ja-JP');
            showModal({
              title: 'もうすこしで あそべるよ！',
              lines: [
                `シールを あと ${left}まい あつめると、「${game.title}」が できるように なります。`,
                'いまの あそびで シールを あつめてね。',
              ],
              okLabel: 'わかった',
              cancelLabel: null,
            });
          },
        },
        h('span', { class: 'tile-lock' }, '🔒'),
        h('img', { class: 'tile-icon', src: game.icon, alt: '', draggable: 'false' }),
        h('span', { class: 'tile-title' }, game.title),
        h('span', { class: 'tile-sub' }, `シール あと ${left}まい`),
      );
    }
    return h(
      'button',
      {
        class: 'tile',
        type: 'button',
        style: { '--game-color': game.color },
        'aria-label': game.title,
        onclick: () => { sfx.tap(); speak(game.intro || game.title, 'ja-JP'); onPlay(game.id); },
      },
      hasMedal(state, game.id) && h('span', { class: 'tile-medal', title: 'きんメダル' }, '🏅'),
      // button の なかに button は おけないので span。
      // stopPropagation で「バッジ＝かいせつ／タイル＝あそぶ」を わける。
      hasLesson(game.id) && h('span', {
        class: 'tile-lesson',
        role: 'button',
        'aria-label': `${game.title}の おしえて`,
        onclick: (ev) => { ev.stopPropagation(); sfx.tap(); onLesson(game.id); },
      }, '▶ おしえて'),
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
          unlocked
            ? `🏅 メダル ${medalCount(state, GAMES)}/${GAMES.length}`
            : `⭐ シール ${state.stickers.length}/${STICKER_GOAL}`,
        ),
        parentButton(onParent),
      ),
    ),
    h('div', { class: 'tile-grid', style: tileGridSize(GAMES.length) }, tiles),
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

/**
 * あそびの かずから タイルの れつ・ぎょうを きめる。
 * よこむきは 1ぎょう 5つまで。ぜんぶが 1がめんに おさまる かたちを えらぶ。
 */
export function tileGridSize(count, maxCols = 5) {
  const cols = Math.min(maxCols, Math.max(1, Math.ceil(count / Math.ceil(count / maxCols))));
  return { '--tile-cols': String(cols), '--tile-rows': String(Math.ceil(count / cols)) };
}
