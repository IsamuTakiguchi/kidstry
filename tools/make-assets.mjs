#!/usr/bin/env node
// SVG アセット（マスコット・アプリアイコン・ゲームアイコン）を まとめて つくる
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONT = "font-family=\"'Hiragino Maru Gothic ProN','Hiragino Sans','Noto Sans JP',system-ui,sans-serif\"";

const C = {
  body: '#8ed7f7',
  bodyDark: '#5cc2ec',
  belly: '#f2fbff',
  beak: '#ffb23f',
  beakDark: '#f59516',
  cheek: '#ffa5be',
  eye: '#2b3a4a',
  tuft: '#ffd166',
};

// ---- マスコット「トリィ」 ---------------------------------------------------
function eyes(pose) {
  if (pose === 'happy') {
    return `
      <path d="M72 92c4-7 12-7 16 0" fill="none" stroke="${C.eye}" stroke-width="6" stroke-linecap="round"/>
      <path d="M112 92c4-7 12-7 16 0" fill="none" stroke="${C.eye}" stroke-width="6" stroke-linecap="round"/>`;
  }
  if (pose === 'think') {
    return `
      <circle cx="80" cy="95" r="7.5" fill="${C.eye}"/>
      <circle cx="82.5" cy="92" r="2.6" fill="#fff"/>
      <path d="M112 95c4-5 12-5 16 0" fill="none" stroke="${C.eye}" stroke-width="6" stroke-linecap="round"/>`;
  }
  return `
    <circle cx="80" cy="95" r="8.5" fill="${C.eye}"/>
    <circle cx="83" cy="91.5" r="3" fill="#fff"/>
    <circle cx="120" cy="95" r="8.5" fill="${C.eye}"/>
    <circle cx="123" cy="91.5" r="3" fill="#fff"/>`;
}

function beak(pose) {
  if (pose === 'happy' || pose === 'cheer') {
    return `<path d="M100 104c11 0 18 6 18 12s-8 12-18 12-18-6-18-12 7-12 18-12z" fill="${C.beakDark}"/>
            <path d="M84 112h32c-1-5-7-8-16-8s-15 3-16 8z" fill="${C.beak}"/>`;
  }
  return `<path d="M100 104c9 0 16 5 16 10s-7 10-16 10-16-5-16-10 7-10 16-10z" fill="${C.beak}"/>
          <path d="M84 114c0-5 7-10 16-10s16 5 16 10z" fill="${C.beakDark}" opacity=".45"/>`;
}

function wings(pose) {
  if (pose === 'cheer') {
    return `<ellipse cx="34" cy="92" rx="17" ry="26" fill="${C.bodyDark}" transform="rotate(-32 34 92)"/>
            <ellipse cx="166" cy="92" rx="17" ry="26" fill="${C.bodyDark}" transform="rotate(32 166 92)"/>`;
  }
  return `<ellipse cx="38" cy="126" rx="16" ry="24" fill="${C.bodyDark}" transform="rotate(14 38 126)"/>
          <ellipse cx="162" cy="126" rx="16" ry="24" fill="${C.bodyDark}" transform="rotate(-14 162 126)"/>`;
}

function extras(pose) {
  if (pose === 'cheer') {
    return `<g fill="${C.tuft}">
        <path d="M22 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/>
        <path d="M178 52l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/>
      </g>`;
  }
  if (pose === 'think') {
    return `<text x="163" y="52" ${FONT} font-size="46" font-weight="700" fill="${C.beakDark}" text-anchor="middle">?</text>`;
  }
  return '';
}

export function mascotSvg(pose = 'normal') {
  const tilt = pose === 'think' ? 'rotate(-6 100 110)' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="トリィ">
  <g transform="${tilt}">
    <ellipse cx="100" cy="186" rx="46" ry="8" fill="#000" opacity=".08"/>
    <path d="M78 176l-8 12h22z" fill="${C.beakDark}"/>
    <path d="M122 176l8 12h-22z" fill="${C.beakDark}"/>
    ${wings(pose)}
    <ellipse cx="100" cy="112" rx="66" ry="64" fill="${C.body}"/>
    <ellipse cx="100" cy="128" rx="44" ry="42" fill="${C.belly}"/>
    <path d="M100 30c-4 10-12 14-12 14s10 6 12 14c2-8 12-14 12-14s-8-4-12-14z" fill="${C.tuft}"/>
    <circle cx="62" cy="118" r="11" fill="${C.cheek}" opacity=".75"/>
    <circle cx="138" cy="118" r="11" fill="${C.cheek}" opacity=".75"/>
    ${eyes(pose)}
    ${beak(pose)}
  </g>
  ${extras(pose)}
</svg>`;
}

// ---- アプリ アイコン -------------------------------------------------------
export function appIconSvg({ size = 512, maskable = false } = {}) {
  const radius = maskable ? 0 : 112;
  const scale = maskable ? 0.66 : 0.82;
  const mascotW = 512 * scale;
  const offsetX = (512 - mascotW) / 2;
  const offsetY = (512 - mascotW) / 2 + (maskable ? 18 : 24);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}" role="img" aria-label="きっずトライ">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd98a"/>
      <stop offset=".48" stop-color="#8be0c0"/>
      <stop offset="1" stop-color="#63c6f0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#bg)"/>
  <circle cx="256" cy="286" r="196" fill="#fff" opacity=".24"/>
  <g fill="#fff" opacity=".55">
    <circle cx="86" cy="92" r="18"/><circle cx="430" cy="124" r="12"/><circle cx="448" cy="398" r="16"/><circle cx="70" cy="404" r="11"/>
  </g>
  <g transform="translate(${offsetX} ${offsetY}) scale(${mascotW / 200})">
    ${mascotSvg('happy').replace(/<svg[^>]*>|<\/svg>/g, '')}
  </g>
  <g fill="#ff9f1c">
    <path d="M74 214l10 26 26 10-26 10-10 26-10-26-26-10 26-10z"/>
    <path d="M432 250l8 20 20 8-20 8-8 20-8-20-20-8 20-8z"/>
  </g>
</svg>`;
}

// ---- ゲーム アイコン -------------------------------------------------------
function tile(color, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img">
  <rect x="4" y="4" width="120" height="120" rx="30" fill="${color}"/>
  <rect x="4" y="4" width="120" height="120" rx="30" fill="#fff" opacity=".18"/>
  ${inner}
</svg>`;
}

const bigText = (t, size = 62, y = 86, fill = '#fff') =>
  `<text x="64" y="${y}" ${FONT} font-size="${size}" font-weight="800" fill="${fill}" text-anchor="middle">${t}</text>`;

const GAME_ICONS = {
  'game-hiragana-find': tile('#ff8fa3', `
    <rect x="26" y="22" width="76" height="84" rx="16" fill="#fff"/>
    ${bigText('あ', 58, 88, '#ff5c7a')}`),
  'game-word-start': tile('#ffb703', `
    <path d="M22 30h84a10 10 0 0 1 10 10v42a10 10 0 0 1-10 10H62l-20 18v-18H22a10 10 0 0 1-10-10V40a10 10 0 0 1 10-10z" fill="#fff"/>
    <text x="64" y="78" ${FONT} font-size="40" font-weight="800" fill="#e08700" text-anchor="middle">◯ん</text>`),
  'game-counting': tile('#4cc9f0', `
    <g fill="#fff"><circle cx="40" cy="44" r="13"/><circle cx="70" cy="44" r="13"/><circle cx="100" cy="44" r="13"/></g>
    ${bigText('3', 52, 104)}`),
  'game-addition': tile('#80ed99', `
    <g fill="#fff"><rect x="44" y="34" width="40" height="15" rx="7.5"/><rect x="56.5" y="21.5" width="15" height="40" rx="7.5"/></g>
    <g fill="#fff"><circle cx="32" cy="94" r="15"/><circle cx="64" cy="94" r="15"/><circle cx="96" cy="94" r="15"/></g>`),
  'game-clock': tile('#b197fc', `
    <circle cx="64" cy="64" r="42" fill="#fff"/>
    <circle cx="64" cy="64" r="36" fill="#fdfbff"/>
    <line x1="64" y1="64" x2="64" y2="40" stroke="#5b4b8a" stroke-width="7" stroke-linecap="round"/>
    <line x1="64" y1="64" x2="86" y2="64" stroke="#ff6b6b" stroke-width="5" stroke-linecap="round"/>
    <circle cx="64" cy="64" r="4" fill="#5b4b8a"/>`),
  'game-shapes': tile('#ffa8a8', `
    <circle cx="44" cy="46" r="20" fill="#fff"/>
    <polygon points="88,26 108,64 68,64" fill="#fff"/>
    <rect x="34" y="76" width="38" height="36" rx="8" fill="#fff"/>
    <polygon points="96,74 106,94 96,114 86,94" fill="#fff"/>`),
  'game-english': tile('#4dabf7', `
    <circle cx="64" cy="64" r="42" fill="#fff"/>
    <text x="64" y="80" ${FONT} font-size="34" font-weight="800" fill="#1971c2" text-anchor="middle">ABC</text>`),
  'game-pattern': tile('#ffd166', `
    <g><circle cx="30" cy="52" r="14" fill="#ff6b6b"/><circle cx="64" cy="52" r="14" fill="#4dabf7"/><circle cx="98" cy="52" r="14" fill="#ff6b6b"/></g>
    <text x="64" y="106" ${FONT} font-size="36" font-weight="800" fill="#fff" text-anchor="middle">？</text>`),
  'game-seikatsu': tile('#63e6be', `
    <g transform="rotate(-28 64 64)">
      <rect x="56" y="44" width="16" height="58" rx="8" fill="#fff"/>
      <rect x="45" y="31" width="38" height="15" rx="6" fill="#fff"/>
      <g fill="#fff"><rect x="47" y="22" width="4.5" height="11" rx="2.2"/><rect x="54.5" y="19" width="4.5" height="14" rx="2.2"/><rect x="62" y="18" width="4.5" height="15" rx="2.2"/><rect x="69.5" y="19" width="4.5" height="14" rx="2.2"/><rect x="77" y="22" width="4.5" height="11" rx="2.2"/></g>
    </g>
    <g fill="#fff" opacity=".9"><circle cx="99" cy="44" r="9"/><circle cx="112" cy="62" r="6"/><circle cx="97" cy="72" r="4.5"/></g>`),
};

// ---- しゅつりょく ----------------------------------------------------------
async function write(path, content) {
  const full = join(ROOT, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, `${content.trim()}\n`, 'utf8');
  return path;
}

export async function buildAssets() {
  const written = [];
  for (const pose of ['normal', 'happy', 'cheer', 'think']) {
    written.push(await write(`assets/characters/torii-${pose}.svg`, mascotSvg(pose)));
  }
  written.push(await write('assets/icons/app-icon.svg', appIconSvg()));
  written.push(await write('assets/icons/app-icon-maskable.svg', appIconSvg({ maskable: true })));
  for (const [name, svg] of Object.entries(GAME_ICONS)) {
    written.push(await write(`assets/icons/${name}.svg`, svg));
  }
  return written;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = await buildAssets();
  console.log(`つくった SVG: ${files.length}こ`);
  files.forEach((f) => console.log('  ', f));
}
