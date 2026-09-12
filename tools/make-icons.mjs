#!/usr/bin/env node
// SVG から PNG アイコンを つくる（どうこんの Chromium を つかう。インストール ふよう）
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildAssets } from './make-assets.mjs';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets/generated');

const TARGETS = [
  { src: 'assets/icons/app-icon.svg', out: 'icon-192.png', size: 192 },
  { src: 'assets/icons/app-icon.svg', out: 'icon-512.png', size: 512 },
  { src: 'assets/icons/app-icon.svg', out: 'icon-1024.png', size: 1024 },
  { src: 'assets/icons/app-icon.svg', out: 'apple-touch-icon.png', size: 180 },
  { src: 'assets/icons/app-icon.svg', out: 'favicon-32.png', size: 32 },
  { src: 'assets/icons/app-icon.svg', out: 'favicon-16.png', size: 16 },
  { src: 'assets/icons/app-icon-maskable.svg', out: 'icon-maskable-512.png', size: 512 },
];

export function findChromium() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    '/opt/pw-browsers/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) || null;
}

async function shot(chromium, html, outPath, size) {
  const dir = join(tmpdir(), `kidstry-icon-${process.pid}-${size}`);
  await mkdir(dir, { recursive: true });
  const page = join(dir, 'page.html');
  await writeFile(page, html, 'utf8');
  await run(chromium, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    `--screenshot=${outPath}`,
    `--window-size=${size},${size}`,
    `file://${page}`,
  ], { timeout: 60000 });
  await rm(dir, { recursive: true, force: true });
}

function pageFor(svg, size) {
  return `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}
svg{display:block;width:${size}px;height:${size}px}</style>
${svg.replace(/\swidth="\d+"|\sheight="\d+"/g, '')}`;
}

export async function makeIcons() {
  await buildAssets();
  const chromium = findChromium();
  await mkdir(OUT, { recursive: true });
  if (!chromium) {
    console.warn('⚠ Chromium が みつからないので PNG は つくりません（SVG アイコンだけで うごきます）。');
    console.warn('  CHROMIUM_PATH=/path/to/chrome npm run icons で つくれます。');
    return [];
  }
  const made = [];
  for (const t of TARGETS) {
    const svg = await readFile(join(ROOT, t.src), 'utf8');
    const outPath = join(OUT, t.out);
    try {
      await shot(chromium, pageFor(svg, t.size), outPath, t.size);
      made.push(t.out);
      console.log(`  ✓ ${t.out} (${t.size}px)`);
    } catch (err) {
      console.warn(`  ✗ ${t.out}: ${err.message}`);
    }
  }
  return made;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const made = await makeIcons();
  console.log(`つくった PNG: ${made.length}こ`);
}
