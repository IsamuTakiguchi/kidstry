import { h, clear } from './core/ui.js';
import {
  createStore, recordSession, awardSticker, starsFor,
  stickerBookComplete, sessionRewards, hasSeenLesson, markLessonSeen,
} from './core/state.js';
import { configureAudio, unlockAudio, sfx, speak, cancelSpeech } from './core/audio.js';
import { startQuiz } from './core/quiz.js';
import { GAMES, LOCKED_GAMES, gameById } from './games/index.js';
import { renderHome } from './screens/home.js';
import { startLesson } from './screens/lesson.js';
import { lessonFor, LESSONS } from './data/lessons.js';
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
    onLesson: goLesson,
    onStickers: goStickers,
    onParent: goParent,
  });
}

/** かいせつを みせる（みおわったら そのまま あそびへ） */
function goLesson(gameId, { thenPlay = true } = {}) {
  cleanup();
  const game = gameById(gameId);
  const lesson = game && lessonFor(gameId);
  if (!game || !lesson) return goQuiz(gameId);
  store.update((s) => markLessonSeen(s, gameId));
  dispose = startLesson({
    root,
    game,
    lesson,
    onExit: goHome,
    onFinish: () => (thenPlay ? goQuiz(gameId, { skipLesson: true }) : goHome()),
  });
}

function goQuiz(gameId, { skipLesson = false } = {}) {
  cleanup();
  const game = gameById(gameId);
  if (!game) return goHome();
  if (game.locked && !stickerBookComplete(store.get())) return goHome();

  // はじめての あそびは、さきに かいせつを みせる
  if (!skipLesson && lessonFor(gameId) && !hasSeenLesson(store.get(), gameId)) {
    return goLesson(gameId);
  }

  dispose = startQuiz({
    root,
    game,
    level: store.get().profile.level,
    onExit: goHome,
    onLesson: lessonFor(gameId) ? () => goLesson(gameId) : null,
    onFinish: (result) => finishQuiz(game, result),
  });
}

function finishQuiz(game, result) {
  cleanup();
  const before = store.get();
  const stars = starsFor(result.firstTryCorrect, result.questions);
  let next = recordSession(before, result);
  const awarded = awardSticker(next);
  next = awarded.state;
  store.set(next);

  // 「はじめての きんメダル」と「シール ぜんぶ あつめた」を みつける
  const { newMedal, justUnlocked } = sessionRewards(before, next, game.id);

  renderResult({
    root,
    game,
    stars,
    firstTryCorrect: result.firstTryCorrect,
    questions: result.questions,
    sticker: awarded.sticker,
    newMedal,
    unlockedGames: justUnlocked ? LOCKED_GAMES : null,
    onRetry: () => goQuiz(game.id, { skipLesson: true }),
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

// あたらしい ばんが でたら、つぎの きどうを またずに その場で よみこみ なおす
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  // すでに うごいて いた ばあいだけ よみこみ なおす（はじめての とうろくでは なにも しない）
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });

  window.addEventListener('load', () => {
    // updateViaCache: 'none' … sw.js を HTTP キャッシュごしに よまない（さいだい10ぷんの おくれを なくす）
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        registration.update().catch(() => {});
        // アプリに もどって きた ときにも あたらしい ばんを たしかめる
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) registration.update().catch(() => {});
        });
      })
      .catch(() => { /* オフライン きのう なしで うごく */ });
  });
}

goStart();

// じどう テスト から つかう
window.__kidstry = { store, goHome, goQuiz, goLesson, goStart, goStickers, goParent, gameIds: GAMES.map((g) => g.id), lockedIds: LOCKED_GAMES.map((g) => g.id), lessonIds: Object.keys(LESSONS) };
