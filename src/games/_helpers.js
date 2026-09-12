import { shuffle } from '../core/random.js';

/**
 * せいかい 1つ ＋ はずれ から せんたくし を つくる。
 * values は じゅうふく しない こと。かえり値は { choices, answer }。
 */
export function buildChoices(rng, kind, correct, distractors, extra = () => ({})) {
  const seen = new Set([keyOf(correct)]);
  const wrong = [];
  for (const d of distractors) {
    const k = keyOf(d);
    if (seen.has(k)) continue;
    seen.add(k);
    wrong.push(d);
  }
  const all = shuffle(rng, [{ value: correct, correct: true }, ...wrong.map((v) => ({ value: v, correct: false }))]);
  let answer = null;
  const choices = all.map((item, i) => {
    const key = `c${i}`;
    if (item.correct) answer = key;
    return { key, kind, value: item.value, ...extra(item.value) };
  });
  return { choices, answer };
}

function keyOf(value) {
  return typeof value === 'object' && value !== null
    ? value.key ?? value.id ?? value.emoji ?? JSON.stringify(value)
    : String(value);
}

/** correct の ちかくの すうじ を はずれ に する（ちかい ものを ゆうせん） */
export function numberDistractors(rng, correct, count, min, max) {
  const near = [];
  for (let d = 1; d <= Math.max(4, max - min); d++) {
    if (correct - d >= min) near.push(correct - d);
    if (correct + d <= max) near.push(correct + d);
    if (near.length >= count * 2) break;
  }
  const unique = [...new Set(near)].filter((n) => n !== correct);
  return shuffle(rng, unique.slice(0, Math.max(count, count * 2))).slice(0, count);
}

export function clampLevel(level) {
  const n = Number(level);
  if (!Number.isFinite(n)) return 1;
  return Math.min(3, Math.max(1, Math.round(n)));
}
