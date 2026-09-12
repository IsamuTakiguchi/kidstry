#!/usr/bin/env node
// こうかい用の ファイルだけを _site/ に あつめる（かいはつ用の ファイルは いれない）
import { cp, rm, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, process.env.SITE_DIR || '_site');

// アプリの どうさに ひつような ものだけ
export const INCLUDE = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'styles',
  'src',
  'assets',
  'LICENSE',
];

export async function buildSite() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const copied = [];
  for (const entry of INCLUDE) {
    const from = join(ROOT, entry);
    if (!existsSync(from)) {
      throw new Error(`${entry} が みつかりません`);
    }
    await cp(from, join(OUT, entry), { recursive: true });
    copied.push(entry);
  }
  return { out: OUT, copied };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { out, copied } = await buildSite();
  const files = [];
  const walk = async (dir, base = '') => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (e.isDirectory()) await walk(join(dir, e.name), `${base}${e.name}/`);
      else files.push(`${base}${e.name}`);
    }
  };
  await walk(out);
  console.log(`${out} に ${files.length}こ の ファイルを あつめました`);
  console.log(`  ${copied.join(', ')}`);
}
