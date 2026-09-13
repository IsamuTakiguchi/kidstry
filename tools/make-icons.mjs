#!/usr/bin/env node
// SVG から PNG アイコンを つくる（どうこんの Chromium を つかう。npm install ふよう）
//
// スクリーンショットでは なく canvas に えがいて とりだす。
// headless の スクリーンショットは ウィンドウの わくの ぶん したが かけるため。
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAssets } from './make-assets.mjs';
import { launchBrowser, findChromium } from './cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets/generated');

export { findChromium };

const TARGETS = [
  { src: 'assets/icons/app-icon.svg', out: 'icon-192.png', size: 192 },
  { src: 'assets/icons/app-icon.svg', out: 'icon-512.png', size: 512 },
  { src: 'assets/icons/app-icon.svg', out: 'icon-1024.png', size: 1024 },
  { src: 'assets/icons/app-icon.svg', out: 'apple-touch-icon.png', size: 180 },
  { src: 'assets/icons/app-icon.svg', out: 'favicon-32.png', size: 32 },
  { src: 'assets/icons/app-icon.svg', out: 'favicon-16.png', size: 16 },
  { src: 'assets/icons/app-icon-maskable.svg', out: 'icon-maskable-512.png', size: 512 },
];

/** PNG の IHDR から よこ・たてを よむ */
export function pngSize(buffer) {
  if (buffer.length < 24 || buffer.toString('binary', 1, 4) !== 'PNG') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/**
 * ブラウザの なかで SVG を canvas に えがき、PNG（base64）と
 * 「どこまで えが えがかれて いるか」を かえす。
 */
function renderScript(svg, size) {
  const encoded = Buffer.from(svg, 'utf8').toString('base64');
  return `(async () => {
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,${encoded}';
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = ${size};
    canvas.height = ${size};
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, ${size}, ${size});
    const { data } = ctx.getImageData(0, 0, ${size}, ${size});
    let lastRow = -1;
    let opaque = 0;
    for (let y = 0; y < ${size}; y++) {
      for (let x = 0; x < ${size}; x++) {
        if (data[(y * ${size} + x) * 4 + 3] > 8) { opaque++; if (y > lastRow) lastRow = y; }
      }
    }
    return {
      png: canvas.toDataURL('image/png').split(',')[1],
      lastRow,
      coverage: opaque / (${size} * ${size}),
    };
  })()`;
}

export async function makeIcons() {
  await buildAssets();
  await mkdir(OUT, { recursive: true });
  if (!findChromium()) {
    console.warn('⚠ Chromium が みつからないので PNG は つくりません（SVG アイコンだけで うごきます）。');
    console.warn('  CHROMIUM_PATH=/path/to/chrome npm run icons で つくれます。');
    return { made: [], problems: [] };
  }

  const session = await launchBrowser({ width: 600, height: 600 });
  const made = [];
  const problems = [];
  try {
    for (const t of TARGETS) {
      const svg = await readFile(join(ROOT, t.src), 'utf8');
      const result = await session.cdp.eval(renderScript(svg, t.size));
      const buffer = Buffer.from(result.png, 'base64');
      const dims = pngSize(buffer);

      // つくった ものが ただしいか その場で たしかめる
      if (!dims || dims.width !== t.size || dims.height !== t.size) {
        problems.push(`${t.out}: おおきさが ${dims ? `${dims.width}x${dims.height}` : 'ふめい'}（${t.size}x${t.size} のはず）`);
        continue;
      }
      if (result.lastRow < t.size - 2) {
        problems.push(`${t.out}: したが ${t.size - 1 - result.lastRow}px かけて いる`);
        continue;
      }
      if (result.coverage < 0.5) {
        problems.push(`${t.out}: えが すくなすぎる（${Math.round(result.coverage * 100)}%）`);
        continue;
      }

      await writeFile(join(OUT, t.out), buffer);
      made.push(t.out);
      console.log(`  ✓ ${t.out} (${t.size}px, ${Math.round(result.coverage * 100)}% ぬられて いる)`);
    }
  } finally {
    await session.close();
  }
  problems.forEach((p) => console.error(`  ✗ ${p}`));
  return { made, problems };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { made, problems } = await makeIcons();
  console.log(`つくった PNG: ${made.length}こ`);
  if (problems.length) process.exitCode = 1;
}
