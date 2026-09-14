// あそんだ きろく（localStorage）と、じゅんすいな けいさん かんすう
import { STICKERS } from '../data/stickers.js';

export const STORAGE_KEY = 'kidstry:v1';
export const STATE_VERSION = 1;
export const QUESTIONS_PER_SESSION = 10;

export function defaultState() {
  return {
    version: STATE_VERSION,
    profile: { name: '', level: 1 },
    settings: { sound: true, speech: true },
    stickers: [],
    lessonsSeen: [],
    lastPlayDate: null,
    streak: 0,
    totalPlayMs: 0,
    games: {},
  };
}

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ほし の かず（1〜3）。10もんちゅう「1かいめで せいかい」した かず で きめる */
export function starsFor(firstTryCorrect, questions = QUESTIONS_PER_SESSION) {
  if (questions <= 0) return 1;
  const ratio = firstTryCorrect / questions;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  return 1;
}

/** きのう から つづいて いれば れんぞく きろく を のばす */
export function nextStreak(lastPlayDate, streak, today) {
  if (!lastPlayDate) return 1;
  if (lastPlayDate === today) return Math.max(streak, 1);
  const prev = new Date(`${lastPlayDate}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  const diffDays = Math.round((now - prev) / 86400000);
  if (diffDays === 1) return streak + 1;
  if (diffDays <= 0) return Math.max(streak, 1);
  return 1;
}

/** 1かい あそびおわった きろく を くわえた あたらしい state を かえす */
export function recordSession(state, result) {
  const {
    gameId,
    firstTryCorrect = 0,
    questions = QUESTIONS_PER_SESSION,
    durationMs = 0,
    today = todayKey(),
  } = result;
  const stars = starsFor(firstTryCorrect, questions);
  const prev = state.games[gameId] || {
    plays: 0, firstTryCorrect: 0, questions: 0, bestStars: 0, lastPlayed: null,
  };
  return {
    ...state,
    lastPlayDate: today,
    streak: nextStreak(state.lastPlayDate, state.streak, today),
    totalPlayMs: state.totalPlayMs + Math.max(0, durationMs),
    games: {
      ...state.games,
      [gameId]: {
        plays: prev.plays + 1,
        firstTryCorrect: prev.firstTryCorrect + firstTryCorrect,
        questions: prev.questions + questions,
        bestStars: Math.max(prev.bestStars, stars),
        lastPlayed: today,
      },
    },
  };
}

/** まだ もって いない シール を 1まい わたす。ぜんぶ そろって いたら null */
export function awardSticker(state, random = Math.random) {
  const owned = new Set(state.stickers);
  const rest = STICKERS.filter((s) => !owned.has(s.id));
  if (rest.length === 0) return { state, sticker: null };
  const sticker = rest[Math.floor(random() * rest.length)];
  return { state: { ...state, stickers: [...state.stickers, sticker.id] }, sticker };
}

/** ゲームごとの せいかいりつ（0〜1）。あそんで いなければ null */
export function accuracy(state, gameId) {
  const g = state.games[gameId];
  if (!g || g.questions === 0) return null;
  return g.firstTryCorrect / g.questions;
}

/** りょういき（ことば・かず など）ごとの せいかいりつ */
export function domainStats(state, gameList) {
  const acc = new Map();
  for (const game of gameList) {
    const g = state.games[game.id];
    if (!g || g.questions === 0) continue;
    const cur = acc.get(game.domain) || { correct: 0, total: 0, plays: 0 };
    cur.correct += g.firstTryCorrect;
    cur.total += g.questions;
    cur.plays += g.plays;
    acc.set(game.domain, cur);
  }
  return [...acc.entries()].map(([domain, v]) => ({
    domain,
    plays: v.plays,
    total: v.total,
    correct: v.correct,
    rate: v.total ? v.correct / v.total : 0,
  }));
}

export function totalPlays(state) {
  return Object.values(state.games).reduce((sum, g) => sum + g.plays, 0);
}

/** こわれた／ふるい データ でも おちない ように なおす */
export function migrate(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    version: STATE_VERSION,
    profile: { ...base.profile, ...(raw.profile || {}) },
    settings: { ...base.settings, ...(raw.settings || {}) },
    stickers: Array.isArray(raw.stickers) ? raw.stickers.filter((id) => typeof id === 'string') : [],
    lessonsSeen: Array.isArray(raw.lessonsSeen) ? raw.lessonsSeen.filter((id) => typeof id === 'string') : [],
    games: raw.games && typeof raw.games === 'object' ? raw.games : {},
    totalPlayMs: Number.isFinite(raw.totalPlayMs) ? raw.totalPlayMs : 0,
    streak: Number.isFinite(raw.streak) ? raw.streak : 0,
  };
}

export function loadState(storage) {
  try {
    return migrate(JSON.parse(storage.getItem(STORAGE_KEY)));
  } catch {
    return defaultState();
  }
}

export function saveState(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** かんたんな ストア（へんこう を きいて ほぞん する） */
export function createStore(storage) {
  let state = loadState(storage);
  const listeners = new Set();
  return {
    get() { return state; },
    set(next) {
      state = next;
      saveState(storage, state);
      listeners.forEach((fn) => fn(state));
      return state;
    },
    update(fn) { return this.set(fn(state)); },
    reset() { return this.set(defaultState()); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

// ---- きろくの ほぞん／よみこみ（バックアップ） ------------------------------
export const BACKUP_APP = 'kidstry';

/** ファイルに かきだす なかみ */
export function exportPayload(state, now = new Date()) {
  return {
    app: BACKUP_APP,
    version: STATE_VERSION,
    exportedAt: now.toISOString(),
    state,
  };
}

export function backupFileName(now = new Date()) {
  return `kidstry-kiroku-${todayKey(now)}.json`;
}

/** がめんに みせる ようやく */
export function backupSummary(state) {
  return {
    plays: totalPlays(state),
    stickers: state.stickers.length,
    totalPlayMs: state.totalPlayMs,
    lastPlayDate: state.lastPlayDate,
    games: Object.keys(state.games).length,
  };
}

/**
 * よみこんだ もじれつを たしかめて state に する。
 * こわれて いたら { ok: false, error } を かえす（れいがいは なげない）。
 */
export function parseBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'ファイルの なかみを よみとれませんでした（JSON では ありません）。' };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'きっずトライの きろく ファイルでは ないようです。' };
  }
  if (raw.app !== BACKUP_APP) {
    return { ok: false, error: 'きっずトライの きろく ファイルでは ないようです。' };
  }
  if (!raw.state || typeof raw.state !== 'object' || Array.isArray(raw.state)) {
    return { ok: false, error: 'きろくの なかみが 入って いません。' };
  }
  const state = migrate(raw.state);
  return {
    ok: true,
    state,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : null,
    summary: backupSummary(state),
  };
}

// ---- あたらしい あそびの かいきん と きんメダル --------------------------
export const STICKER_GOAL = STICKERS.length;

/** シールを ぜんぶ あつめたか（あたらしい あそびが ふえる じょうけん） */
export function stickerBookComplete(state) {
  return state.stickers.length >= STICKER_GOAL;
}

export function stickersLeft(state) {
  return Math.max(0, STICKER_GOAL - state.stickers.length);
}

/** きんメダルは「その あそびで ★3を とった」ことで もらえる（ほぞん しない みちびき値） */
export function hasMedal(state, gameId) {
  return state.games[gameId]?.bestStars === 3;
}

export function medalCount(state, gameList) {
  return gameList.filter((g) => hasMedal(state, g.id)).length;
}

/** 1かい あそびおわった あとの「あたらしい ごほうび」を みつける */
export function sessionRewards(before, after, gameId) {
  return {
    newMedal: !hasMedal(before, gameId) && hasMedal(after, gameId),
    justUnlocked: !stickerBookComplete(before) && stickerBookComplete(after),
  };
}

// ---- 「おしえて」を みた きろく --------------------------------------------
export function hasSeenLesson(state, gameId) {
  return state.lessonsSeen.includes(gameId);
}

/** おなじ ものを 2ど いれない */
export function markLessonSeen(state, gameId) {
  if (state.lessonsSeen.includes(gameId)) return state;
  return { ...state, lessonsSeen: [...state.lessonsSeen, gameId] };
}
