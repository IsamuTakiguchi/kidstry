import { h, clear, starsHtml, mascotImg, wait } from '../core/ui.js';
import { sfx, speak } from '../core/audio.js';

const PRAISE = {
  3: 'かんぺき！ すごい！',
  2: 'よく できたね！',
  1: 'さいごまで がんばったね！',
};

export function renderResult({
  root, game, stars, firstTryCorrect, questions, sticker,
  newMedal = false, unlockedGames = null, reviewed = 0,
  onRetry, onHome, onStickers,
}) {
  const starBox = h('div', { class: 'result-stars', html: starsHtml(0) });
  const stickerBox = h('div', { class: 'result-sticker' });
  const bonusBox = h('div', { class: 'result-bonus' });

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
      h('p', { class: 'result-score' }, `${game.title}：${questions}もんちゅう ${firstTryCorrect}もん せいかい`),
      reviewed > 0 && h('p', { class: 'result-review' }, `⭐ ふくしゅう ${reviewed}もん やったね！`),
      stickerBox,
      bonusBox,
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

    if (newMedal) {
      await wait(520);
      sfx.sticker();
      bonusBox.append(h(
        'div',
        { class: 'bonus-card bonus-medal' },
        h('span', { class: 'bonus-emoji' }, '🏅'),
        h('div', {},
          h('strong', {}, 'きんメダル ゲット！'),
          h('span', { class: 'bonus-note' }, `「${game.title}」で ★を 3つ とったよ`)),
      ));
      speak('きんメダル ゲット', 'ja-JP');
    }

    if (unlockedGames && unlockedGames.length) {
      await wait(620);
      sfx.fanfare();
      bonusBox.append(h(
        'div',
        { class: 'bonus-card bonus-unlock' },
        h('p', { class: 'bonus-headline' }, '🎉 シールが ぜんぶ あつまった！'),
        h('p', { class: 'bonus-note' }, 'あたらしい あそびが ふえたよ'),
        h('div', { class: 'unlock-row' }, unlockedGames.map((g) => h(
          'span',
          { class: 'unlock-item' },
          h('img', { class: 'unlock-icon', src: g.icon, alt: '', draggable: 'false' }),
          h('span', {}, g.title),
        ))),
        h('p', { class: 'bonus-note' }, 'つぎは 🏅きんメダルを あつめよう！'),
      ));
      speak('シールが ぜんぶ あつまったよ。あたらしい あそびが ふえました', 'ja-JP');
    }
  }
}
