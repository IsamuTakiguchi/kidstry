import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAMES } from '../src/games/index.js';
import { MASCOT_POSES } from '../src/core/ui.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, out = []) {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

test('あそびの アイコン ファイルが ある', () => {
  for (const game of GAMES) {
    assert.ok(existsSync(join(ROOT, game.icon)), `${game.id}: ${game.icon} が ない`);
  }
});

test('マスコットの え が そろっている', () => {
  for (const pose of MASCOT_POSES) {
    assert.ok(existsSync(join(ROOT, `assets/characters/mascot-${pose}.svg`)), `${pose} が ない`);
  }
});

test('アプリ アイコンと マニフェストの つじつまが あう', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.webmanifest'), 'utf8'));
  assert.ok(manifest.icons.length >= 3);
  for (const icon of manifest.icons) {
    assert.ok(existsSync(join(ROOT, icon.src)), `${icon.src} が ない`);
  }
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'), 'maskable アイコンが ない');
  assert.equal(manifest.start_url, './');
});

test('index.html が よぶ ファイルが すべて ある', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="((?!https?:)[^"#]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length >= 5);
  for (const ref of refs) {
    assert.ok(existsSync(join(ROOT, ref)), `index.html: ${ref} が ない`);
  }
});

test('Service Worker が すべての ファイルを キャッシュに いれている', () => {
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'([^']+)'/g)].map((m) => m[1]));
  const needed = [
    ...walk('src'),
    ...walk('styles'),
    ...walk('assets/icons'),
    ...walk('assets/characters'),
  ].map((p) => relative('.', p).replace(/\\/g, '/'));
  const missing = needed.filter((p) => !listed.has(p));
  assert.deepEqual(missing, [], `sw.js に かかれて いない ファイル: ${missing.join(', ')}`);
});

test('こうかい用ビルドに アプリの ファイルが すべて ふくまれる', async () => {
  const { INCLUDE } = await import('../tools/build-site.mjs');
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const block = sw.slice(sw.indexOf('const ASSETS = ['), sw.indexOf('];', sw.indexOf('const ASSETS = [')));
  const assets = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((p) => p !== './');
  assert.ok(assets.length > 30, `ASSETS を よみとれない（${assets.length}こ）`);
  const included = new Set(INCLUDE);
  for (const asset of assets) {
    const top = asset.split('/')[0];
    assert.ok(included.has(top), `ビルドに ${top} が はいって いない（${asset}）`);
  }
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  for (const m of html.matchAll(/(?:href|src)="((?!https?:)[^"#]+)"/g)) {
    const top = m[1].split('/')[0];
    assert.ok(included.has(top), `ビルドに ${top} が はいって いない（index.html: ${m[1]}）`);
  }
});
