// シードつき かんたん乱数（テストで さいげん できるように）
export function createRng(seed = Date.now()) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function shuffle(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** list から n 個 じゅうふく なしで えらぶ */
export function sample(rng, list, n) {
  return shuffle(rng, list).slice(0, n);
}

/** except を のぞいた list から n 個 えらぶ */
export function sampleExcept(rng, list, n, isExcluded) {
  return sample(rng, list.filter((x) => !isExcluded(x)), n);
}
