import { h, clear } from './core/ui.js';
import { createStore, recordSession, awardSticker, starsFor } from './core/state.js';
import { configureAudio, unlockAudio, sfx, speak, cancelSpeech } from './core/audio.js';
import { startQuiz } from './core/quiz.js';
import { GAMES, gameById } from './games/index.js';
import { renderHome } from './screens/home.js';
import { renderResult } from './screens/result.js';
import { renderStickerBook } from './screens/stickers.js';
import { renderParent } from './screens/parent.js';

const root = document.getElementById('app');
const store = createStore(window.localStorage);
configureAudio(store.get().settings);

let dispose = null;

function cleanup() {
  if (typeof dispose === 'function') dispose();
  dispose = null;
  cancelSpeech();
}

function goStart() {
  cleanup();
  const screen = h(
    'div',
    { class: 'screen screen-start' },
    h(
      'div',
      { class: 'start-card' },
      h('img', { class: 'start-logo', src: 'assets/icons/app-icon.svg', alt: 'きっずトライ', draggable: 'false' }),
      h('h1', { class: 'start-title' }, 'きっずトライ'),
      h('p', { class: 'start-sub' }, '5さいの まなび あそび'),
      h(
        'button',
        {
          class: 'start-btn',
          type: 'button',
          onclick: () => {
            unlockAudio();
            sfx.start();
            speak('きっずトライ。あそぼう', 'ja-JP');
            goHome();
          },
        },
        'はじめる',
      ),
    ),
  );
  clear(root).append(screen);
}

function goHome() {
  cleanup();
  renderHome({
    root,
    state: store.get(),
    onPlay: goQuiz,
    onStickers: goStickers,
    onParent: goParent,
  });
}

function goQuiz(gameId) {
  cleanup();
  const game = gameById(gameId);
  if (!game) return goHome();
  dispose = startQuiz({
    root,
    game,
    level: store.get().profile.level,
    onExit: goHome,
    onFinish: (result) => finishQuiz(game, result),
  });
}

function finishQuiz(game, result) {
  cleanup();
  const stars = starsFor(result.firstTryCorrect, result.questions);
  let next = recordSession(store.get(), result);
  const awarded = awardSticker(next);
  next = awarded.state;
  store.set(next);
  renderResult({
    root,
    game,
    stars,
    firstTryCorrect: result.firstTryCorrect,
    questions: result.questions,
    sticker: awarded.sticker,
    onRetry: () => goQuiz(game.id),
    onHome: goHome,
    onStickers: goStickers,
  });
}

function goStickers() {
  cleanup();
  renderStickerBook({ root, state: store.get(), onHome: goHome });
}

function goParent() {
  cleanup();
  renderParent({
    root,
    store,
    onHome: goHome,
    onReset: () => { store.reset(); configureAudio(store.get().settings); goHome(); },
  });
}

// さいしょの タップで おとを つかえる ように する
window.addEventListener('pointerdown', unlockAudio, { once: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) cancelSpeech(); });
// ダブルタップ かくだい を ふせぐ
document.addEventListener('gesturestart', (e) => e.preventDefault());

store.subscribe((state) => configureAudio(state.settings));

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* オフライン きのう なしで うごく */ });
  });
}

goStart();

// じどう テスト から つかう
window.__kidstry = { store, goHome, goQuiz, goStart, goStickers, goParent, gameIds: GAMES.map((g) => g.id) };
