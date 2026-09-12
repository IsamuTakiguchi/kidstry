import { SHAPES, SHAPE_KEYS } from '../core/ui-shapes.js';
import { pick, sample } from '../core/random.js';
import { buildChoices, clampLevel } from './_helpers.js';

export const meta = {
  id: 'shapes',
  title: 'かたち あそび',
  subtitle: 'おなじ かたちは どれ',
  domain: 'かたち',
  color: '#ffa8a8',
  icon: 'assets/icons/game-shapes.svg',
  intro: 'かたちを さがしてね',
};

const COLORS = ['#ff8fa3', '#4cc9f0', '#ffd166', '#80ed99', '#b197fc', '#ffa94d'];

export function generate(level = 1, rng = Math.random, count = 10) {
  const lv = clampLevel(level);
  const questions = [];
  for (let i = 0; i < count; i++) {
    const target = pick(rng, SHAPE_KEYS);
    const shape = SHAPES[target];
    const byCorner = lv === 3 && shape.corners > 0;
    let others;
    if (byCorner) {
      // かどの かずで きく ときは、おなじ かどの かずの かたちを のぞく
      others = sample(rng, SHAPE_KEYS.filter((k) => SHAPES[k].corners !== shape.corners), 3);
    } else {
      others = sample(rng, SHAPE_KEYS.filter((k) => k !== target), 3);
    }
    const askText = byCorner ? `かどが ${shape.corners}つ ある かたちは どれ？` : `「${shape.name}」は どれ？`;
    const palette = sample(rng, COLORS, 4);
    const colorOf = new Map([target, ...others].map((k, idx) => [k, palette[idx % palette.length]]));
    const { choices, answer } = buildChoices(rng, 'shape', target, others, (key) => ({
      color: colorOf.get(key),
      label: SHAPES[key].name,
    }));
    questions.push({
      id: `${meta.id}-${i}`,
      ask: { text: askText, speak: byCorner ? `かどが ${shape.corners}つ ある かたちは どれ` : `${shape.name}は どれ`, lang: 'ja-JP' },
      stage: { kind: 'none' },
      choices,
      answer,
      layout: 'grid4',
    });
  }
  return questions;
}
