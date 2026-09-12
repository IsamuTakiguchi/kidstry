import { h, clear, starsHtml, mascotImg, wait } from '../core/ui.js';
import { sfx, speak } from '../core/audio.js';

const PRAISE = {
  3: 'かんぺき！ すごい！',
  2: 'よく できたね！',
  1: 'さいごまで がんばったね！',
};

export function renderResult({ root, game, stars, firstTryCorrect, questions, sticker, onRetry, onHome, onStickers }) {
  const starBox = h('div', { class: 'result-stars', html: starsHtml(0) });
  const stickerBox = h('div', { class: 'result-sticker' });

  const screen = h(
    'div',
    { class: 'screen screen-result', style: { '--game-color': game.color } },
    h('div', { class: 'confetti', 'aria-hidden': 'true' }),
    h(
      'div',
      { class: 'result-card' },
      mascotImg('happy', 'mascot mascot-result'),
      h('h1', { class: 'result-title' }, PRAISE[stars] || 'よく できたね！'),
      starBox,
      h('p', { class: 'result-score' }, `${game.title}：10もんちゅう ${firstTryCorrect}もん せいかい`),
      stickerBox,
      h(
        'div',
        { class: 'result-actions' },
        h('button', { class: 'big-btn', type: 'button', onclick: () => { sfx.tap(); onRetry(); } }, '🔁 もういちど'),
        h('button', { class: 'big-btn big-btn-ghost', type: 'button', onclick: () => { sfx.tap(); onHome(); } }, '🏠 ほかの あそび'),
        h('button', { class: 'big-btn big-btn-ghost', type: 'button', onclick: () => { sfx.tap(); onStickers(); } }, '⭐ シールちょう'),
      ),
    ),
  );

  clear(root).append(screen);
  void animate();

  async function animate() {
    sfx.fanfare();
    speak(`${PRAISE[stars] || 'よく できたね'}。${firstTryCorrect}もん せいかい`, 'ja-JP');
    for (let i = 1; i <= stars; i++) {
      await wait(380);
      starBox.innerHTML = starsHtml(i);
      starBox.classList.add('pop');
      setTimeout(() => starBox.classList.remove('pop'), 260);
    }
    if (sticker) {
      await wait(500);
      sfx.sticker();
      stickerBox.innerHTML = `<div class="sticker-reveal" style="--sticker-color:${sticker.color}">
          <span class="sticker-emoji">${sticker.emoji}</span>
        </div>
        <p class="sticker-caption">「${sticker.name}」の シールを もらったよ！</p>`;
      speak(`${sticker.name}の シールを もらったよ`, 'ja-JP');
    }
  }
}
