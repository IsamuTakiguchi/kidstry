// DOM と え（SVG）の ヘルパー
import { SHAPES, SHAPE_KEYS, shapeSvg } from './ui-shapes.js';

export { SHAPES, SHAPE_KEYS, shapeSvg };

export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'style' && typeof value === 'object') {
      for (const [prop, val] of Object.entries(value)) {
        if (prop.startsWith('--')) node.style.setProperty(prop, val);
        else node.style[prop] = val;
      }
    }
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- とけい ----------------------------------------------------------------
export function clockSvg(hour, minute, size = 220) {
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const minuteAngle = minute * 6;
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const long = i % 5 === 0;
    ticks.push(
      `<line x1="50" y1="${long ? 9 : 11}" x2="50" y2="${long ? 15 : 13}" stroke="${long ? '#6b7a90' : '#c3cdd9'}" stroke-width="${long ? 2 : 1}" stroke-linecap="round" transform="rotate(${i * 6} 50 50)"/>`,
    );
  }
  const numbers = [];
  for (let i = 1; i <= 12; i++) {
    const rad = ((i * 30 - 90) * Math.PI) / 180;
    const x = 50 + Math.cos(rad) * 33;
    const y = 50 + Math.sin(rad) * 33;
    numbers.push(
      `<text x="${x.toFixed(2)}" y="${(y + 4).toFixed(2)}" text-anchor="middle" font-size="11" font-weight="700" fill="#42526b">${i}</text>`,
    );
  }
  return `<svg class="clock-svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="とけい">
    <circle cx="50" cy="50" r="47" fill="#ffffff" stroke="#ffb703" stroke-width="5"/>
    <circle cx="50" cy="50" r="41" fill="#fffdf7"/>
    ${ticks.join('')}
    ${numbers.join('')}
    <line x1="50" y1="50" x2="50" y2="27" stroke="#2f4858" stroke-width="5" stroke-linecap="round" transform="rotate(${hourAngle} 50 50)"/>
    <line x1="50" y1="50" x2="50" y2="18" stroke="#ff6b6b" stroke-width="3.4" stroke-linecap="round" transform="rotate(${minuteAngle} 50 50)"/>
    <circle cx="50" cy="50" r="3.4" fill="#2f4858"/>
  </svg>`;
}

export function clockLabel(hour, minute) {
  return minute === 30 ? `${hour}じはん` : `${hour}じ`;
}

// ---- そのほかの え ---------------------------------------------------------
export function starsHtml(count, total = 3) {
  let out = '';
  for (let i = 0; i < total; i++) {
    out += `<span class="star ${i < count ? 'is-on' : 'is-off'}">★</span>`;
  }
  return out;
}

export const MASCOT_POSES = ['normal', 'happy', 'cheer', 'think'];

export const MASCOT_NAME = 'ガオくん';

/** マスコットの えの ばしょ（パスは ここ 1かしょだけ） */
export function mascotSrc(pose = 'normal') {
  const safe = MASCOT_POSES.includes(pose) ? pose : 'normal';
  return `assets/characters/mascot-${safe}.svg`;
}

export function mascotImg(pose = 'normal', cls = 'mascot') {
  return h('img', {
    class: cls,
    src: mascotSrc(pose),
    alt: MASCOT_NAME,
    draggable: 'false',
  });
}

/** えもじ を n こ ならべた HTML（かぞえる あそび） */
export function emojiGroupHtml(emoji, count) {
  const cols = count <= 4 ? count : count <= 9 ? Math.ceil(count / 2) : Math.ceil(count / 3);
  const cells = Array.from({ length: count }, () => `<span class="count-item">${emoji}</span>`).join('');
  return `<div class="count-grid" style="grid-template-columns:repeat(${Math.max(cols, 1)},1fr)">${cells}</div>`;
}

export function formatDuration(ms) {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}ふん`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}じかん ${minutes}ふん` : `${hours}じかん`;
}

/**
 * がめんの うえに だす かくにん ダイアログ。
 * window.confirm と ちがい、もじを ひらがなに でき、テストからも あつかえる。
 */
export function showModal({
  title,
  lines = [],
  content = null,
  okLabel = 'OK',
  cancelLabel = 'やめる',
  danger = false,
  onOk = null,
  onCancel = null,
}) {
  const overlay = h('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });

  const close = (fn) => {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    if (fn) fn();
  };
  function onKey(ev) {
    if (ev.key === 'Escape') close(onCancel);
  }

  const okBtn = h('button', {
    class: `modal-btn ${danger ? 'modal-btn-danger' : 'modal-btn-ok'}`,
    type: 'button',
    onclick: () => close(onOk),
  }, okLabel);

  const card = h(
    'div',
    { class: 'modal-card' },
    h('h2', { class: 'modal-title' }, title),
    ...lines.filter(Boolean).map((line) => h('p', { class: 'modal-line' }, line)),
    content,
    h(
      'div',
      { class: 'modal-actions' },
      okBtn,
      cancelLabel && h('button', {
        class: 'modal-btn modal-btn-cancel',
        type: 'button',
        onclick: () => close(onCancel),
      }, cancelLabel),
    ),
  );

  overlay.addEventListener('click', (ev) => { if (ev.target === overlay) close(onCancel); });
  document.addEventListener('keydown', onKey);
  overlay.append(card);
  document.body.append(overlay);
  okBtn.focus();
  return () => close(null);
}
