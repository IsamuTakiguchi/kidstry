import * as hiraganaFind from './hiragana-find.js';
import * as wordStart from './word-start.js';
import * as counting from './counting.js';
import * as addition from './addition.js';
import * as clock from './clock.js';
import * as shapes from './shapes.js';
import * as english from './english.js';
import * as pattern from './pattern.js';
import * as seikatsu from './seikatsu.js';
import * as shiritori from './shiritori.js';
import * as oddOneOut from './odd-one-out.js';
import * as seasons from './seasons.js';

export const GAME_MODULES = [
  hiraganaFind, wordStart, counting, addition, clock, shapes, english, pattern, seikatsu,
  shiritori, oddOneOut, seasons,
];

export const GAMES = GAME_MODULES.map((m) => ({ ...m.meta, locked: Boolean(m.meta.locked), generate: m.generate }));

/** シールを ぜんぶ あつめると あそべるように なる あそび */
export const LOCKED_GAMES = GAMES.filter((g) => g.locked);

/** いま あそべる あそび（unlocked が true なら ぜんぶ） */
export function playableGames(unlocked) {
  return GAMES.filter((g) => unlocked || !g.locked);
}

export function gameById(id) {
  return GAMES.find((g) => g.id === id) || null;
}

export const DOMAINS = [...new Set(GAMES.map((g) => g.domain))];
