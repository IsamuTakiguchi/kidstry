#!/usr/bin/env node
// SVG アセット（マスコット・アプリアイコン・ゲームアイコン）を まとめて つくる
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONT = "font-family=\"'Hiragino Maru Gothic ProN','Hiragino Sans','Noto Sans JP',system-ui,sans-serif\"";

const C = {
  body: '#7bd88f',
  bodyDark: '#4fc079',
  belly: '#effbf1',
  spike: '#ffb703',
  spikeDark: '#f08c00',
  cheek: '#ffa5be',
  eye: '#2b3a4a',
  mouth: '#d95f6b',
};
// ---- マスコット「ガオくん」（きょうりゅう） ---------------------------------
function eyes(pose) {
  if (pose === 'happy' || pose === 'cheer') {
    return `
      <path d="M70 88c5-8 14-8 19 0" fill="none" stroke="${C.eye}" stroke-width="6" stroke-linecap="round"/>
      <path d="M111 88c5-8 14-8 19 0" fill="none" stroke="${C.eye}" stroke-width="6" stroke-linecap="round"/>`;
  }
  if (pose === 'think') {
    return `
      <circle cx="79" cy="90" r="8" fill="${C.eye}"/>
      <circle cx="82" cy="86.5" r="2.8" fill="#fff"/>
      <path d="M111 90c5-6 14-6 19 0" fill="none" stroke="${C.eye}" stroke-width="6" stroke-linecap="round"/>`;
  }
  return `
    <circle cx="79" cy="90" r="9" fill="${C.eye}"/>
    <circle cx="82.2" cy="86" r="3.2" fill="#fff"/>
    <circle cx="121" cy="90" r="9" fill="${C.eye}"/>
    <circle cx="124.2" cy="86" r="3.2" fill="#fff"/>`;
}

/** はなさきと くち */
function muzzle(pose) {
  const open = pose === 'happy' || pose === 'cheer';
  const mouth = open
    ? `<path d="M86 122c0-4 28-4 28 0 0 9-6 15-14 15s-14-6-14-15z" fill="${C.mouth}"/>
       <path d="M92 133c3-3 13-3 16 0-2 3-6 5-8 5s-6-2-8-5z" fill="#ff9aa8"/>`
    : `<path d="M88 124c4 6 8 8 12 8s8-2 12-8" fill="none" stroke="${C.eye}" stroke-width="4.5" stroke-linecap="round"/>`;
  return `
    <ellipse cx="100" cy="118" rx="30" ry="22" fill="${C.belly}"/>
    <circle cx="90" cy="107" r="3.1" fill="${C.eye}" opacity=".6"/>
    <circle cx="110" cy="107" r="3.1" fill="${C.eye}" opacity=".6"/>
    ${mouth}`;
}

/** せなかと あたまの とげ */
function spikes() {
  return `<g fill="${C.spike}" stroke="${C.spikeDark}" stroke-width="2" stroke-linejoin="round">
      <path d="M69 62l9-22 9 22z"/>
      <path d="M89 56l11-28 11 28z"/>
      <path d="M113 62l9-22 9 22z"/>
    </g>`;
}

/** しっぽ（とげつき） */
function tail() {
  return `<g>
      <path d="M146 150c18 16 44 10 48-14 2-12-8-18-13-9-7 12-21 14-33 8z" fill="${C.bodyDark}"/>
      <g fill="${C.spike}" stroke="${C.spikeDark}" stroke-width="1.6" stroke-linejoin="round">
        <path d="M170 152l3-13 9 10z"/>
        <path d="M186 141l-1-13 10 7z"/>
      </g>
    </g>`;
}

/** て */
function arms(pose) {
  if (pose === 'cheer') {
    return `<g fill="${C.bodyDark}">
        <ellipse cx="36" cy="86" rx="14" ry="21" transform="rotate(-38 36 86)"/>
        <ellipse cx="164" cy="86" rx="14" ry="21" transform="rotate(38 164 86)"/>
      </g>`;
  }
  return `<g fill="${C.bodyDark}">
      <ellipse cx="42" cy="126" rx="13" ry="19" transform="rotate(16 42 126)"/>
      <ellipse cx="158" cy="126" rx="13" ry="19" transform="rotate(-16 158 126)"/>
    </g>`;
}

/** あし */
function feet() {
  return `<g fill="${C.bodyDark}">
      <ellipse cx="76" cy="176" rx="24" ry="13"/>
      <ellipse cx="124" cy="176" rx="24" ry="13"/>
    </g>
    <g fill="${C.belly}">
      <circle cx="62" cy="180" r="4"/><circle cx="74" cy="182" r="4"/><circle cx="86" cy="180" r="4"/>
      <circle cx="110" cy="180" r="4"/><circle cx="122" cy="182" r="4"/><circle cx="134" cy="180" r="4"/>
    </g>`;
}

function extras(pose) {
  if (pose === 'cheer') {
    return `<g fill="${C.spike}">
        <path d="M22 44l4 11 11 4-11 4-4 11-4-11-11-4 11-4z"/>
        <path d="M180 58l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/>
      </g>`;
  }
  if (pose === 'think') {
    return `<text x="168" y="50" ${FONT} font-size="46" font-weight="700" fill="${C.spikeDark}" text-anchor="middle">?</text>`;
  }
  return '';
}

export function mascotSvg(pose = 'normal') {
  const tilt = pose === 'think' ? 'rotate(-6 100 114)' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="ガオくん">
  <g transform="${tilt}">
    <ellipse cx="100" cy="188" rx="52" ry="8" fill="#000" opacity=".08"/>
    ${tail()}
    ${feet()}
    ${arms(pose)}
    ${spikes()}
    <ellipse cx="100" cy="114" rx="62" ry="60" fill="${C.body}"/>
    <ellipse cx="100" cy="132" rx="40" ry="38" fill="${C.belly}" opacity=".55"/>
    <circle cx="58" cy="112" r="11" fill="${C.cheek}" opacity=".7"/>
    <circle cx="142" cy="112" r="11" fill="${C.cheek}" opacity=".7"/>
    ${muzzle(pose)}
    ${eyes(pose)}
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
  'game-weekday': tile('#74c0fc', `
    <rect x="14" y="26" width="100" height="80" rx="16" fill="#fff"/>
    <rect x="14" y="26" width="100" height="22" rx="11" fill="#4dabf7"/>
    <g fill="#fff"><rect x="34" y="18" width="9" height="18" rx="4.5"/><rect x="85" y="18" width="9" height="18" rx="4.5"/></g>
    <g fill="#d0e7fb">
      <rect x="24" y="58" width="15" height="15" rx="5"/><rect x="44" y="58" width="15" height="15" rx="5"/>
      <rect x="64" y="58" width="15" height="15" rx="5"/><rect x="84" y="58" width="15" height="15" rx="5"/>
      <rect x="24" y="80" width="15" height="15" rx="5"/><rect x="64" y="80" width="15" height="15" rx="5"/>
      <rect x="84" y="80" width="15" height="15" rx="5"/>
    </g>
    <rect x="44" y="80" width="15" height="15" rx="5" fill="#ff922b"/>`),
  'game-left-right': tile('#ffa94d', `
    <g fill="#fff" opacity=".55">
      <rect x="20" y="57" width="30" height="14" rx="7"/>
      <polygon points="26,44 12,64 26,84"/>
    </g>
    <g fill="#fff">
      <rect x="78" y="57" width="30" height="14" rx="7"/>
      <polygon points="102,44 116,64 102,84"/>
    </g>
    <circle cx="64" cy="64" r="8" fill="#fff"/>`),
  'game-shiritori': tile('#f783ac', `
    <rect x="10" y="38" width="44" height="52" rx="13" fill="#fff"/>
    <text x="32" y="74" ${FONT} font-size="30" font-weight="800" fill="#e64980" text-anchor="middle">り</text>
    <g fill="#fff"><rect x="56" y="60" width="16" height="7" rx="3.5"/><polygon points="70,56 80,63.5 70,71"/></g>
    <rect x="80" y="38" width="44" height="52" rx="13" fill="#fff"/>
    <text x="102" y="74" ${FONT} font-size="30" font-weight="800" fill="#e64980" text-anchor="middle">ご</text>`),
  'game-odd-one-out': tile('#9775fa', `
    <g fill="#fff" opacity=".62">
      <circle cx="40" cy="42" r="17"/><circle cx="88" cy="42" r="17"/><circle cx="40" cy="90" r="17"/>
    </g>
    <rect x="70" y="72" width="36" height="36" rx="9" fill="#fff" transform="rotate(12 88 90)"/>`),
  'game-seasons': tile('#69db7c', `
    <g fill="#fff">
      <g transform="translate(38 40)">
        <circle cx="0" cy="-13" r="7"/><circle cx="12" cy="-4" r="7"/><circle cx="8" cy="11" r="7"/>
        <circle cx="-8" cy="11" r="7"/><circle cx="-12" cy="-4" r="7"/>
      </g>
      <g transform="translate(90 40)">
        <circle cx="0" cy="0" r="12"/>
        <g stroke="#fff" stroke-width="4.5" stroke-linecap="round">
          <line x1="0" y1="-21" x2="0" y2="-17"/><line x1="0" y1="17" x2="0" y2="21"/>
          <line x1="-21" y1="0" x2="-17" y2="0"/><line x1="17" y1="0" x2="21" y2="0"/>
          <line x1="-15" y1="-15" x2="-12" y2="-12"/><line x1="12" y1="12" x2="15" y2="15"/>
          <line x1="15" y1="-15" x2="12" y2="-12"/><line x1="-12" y1="12" x2="-15" y2="15"/>
        </g>
      </g>
      <path d="M38 74c16 0 24 10 24 22-16 2-26-6-24-22z"/>
      <path d="M38 96c6-8 14-14 22-17" fill="none" stroke="#69db7c" stroke-width="3" stroke-linecap="round"/>
      <g transform="translate(90 90)" stroke="#fff" stroke-width="5" stroke-linecap="round">
        <line x1="0" y1="-18" x2="0" y2="18"/>
        <line x1="-15.6" y1="-9" x2="15.6" y2="9"/>
        <line x1="-15.6" y1="9" x2="15.6" y2="-9"/>
      </g>
    </g>`),
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
    written.push(await write(`assets/characters/mascot-${pose}.svg`, mascotSvg(pose)));
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
