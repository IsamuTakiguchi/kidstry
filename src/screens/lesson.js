// 「おしえて」の さいせい がめん。どうがの ように じどうで すすむ。
import { h, clear, clockSvg, emojiGroupHtml, shapeSvg, mascotImg } from '../core/ui.js';
import { sfx, speak, cancelSpeech } from '../core/audio.js';
import { WEEKDAYS } from '../data/weekdays.js';

/** ステップ1つぶんの え を HTML に する */
export function renderLessonStep(step) {
  switch (step.kind) {
    case 'title':
      return `<div class="lesson-title-visual"><span class="lesson-big-emoji">${step.emoji || '✨'}</span></div>`;

    case 'week': {
      const cells = WEEKDAYS.map((day, i) => {
        const classes = ['week-cell'];
        let inner = '';
        if (i <= (step.upto ?? -1)) {
          classes.push('is-known');
          inner = day.short;
        }
        if (i === step.highlight) classes.push('is-pop');
        if (i === step.next) {
          classes.push('is-ask');
          inner = inner || '？';
        }
        const style = i <= (step.upto ?? -1) ? ` style="--day-color:${day.color}"` : '';
        return `<span class="${classes.join(' ')}"${style}>${inner}</span>`;
      }).join('');
      const arrow = step.next != null ? '<p class="lesson-note">→ つぎ</p>' : '';
      return `<div class="stage-week"><div class="week-strip">${cells}</div>${arrow}</div>`;
    }

    case 'row': {
      const items = step.items.map((emoji, i) => {
        const classes = ['lesson-row-item'];
        if (i === step.mark) classes.push('is-mark');
        const order = Array.isArray(step.count) ? step.count.indexOf(i) : -1;
        const badge = order >= 0 ? `<span class="lesson-count-badge">${order + 1}</span>` : '';
        return `<span class="${classes.join(' ')}">${badge}${emoji}</span>`;
      }).join('');
      return `<div class="lesson-row-wrap">
          <div class="dir-band">
            <span class="dir-side ${step.side === 'left' ? 'is-on' : ''}">← ひだり</span>
            <span class="dir-side ${step.side === 'right' ? 'is-on' : ''}">みぎ →</span>
          </div>
          <div class="lesson-row">${items}</div>
        </div>`;
    }

    case 'clock': {
      const legend = step.point
        ? `<p class="lesson-note">${step.point === 'hour' ? 'みじかい はり' : 'ながい はり'}</p>`
        : '';
      return `<div class="lesson-clock ${step.point ? `point-${step.point}` : ''}">${clockSvg(step.hour, step.minute)}${legend}</div>`;
    }

    case 'count':
      return `<div class="lesson-count">
          ${emojiGroupHtml(step.emoji, step.count)}
          <span class="lesson-count-number">${step.count}</span>
        </div>`;

    case 'shape':
      return `<div class="lesson-shape">${shapeSvg(step.shape, step.color, 200)}</div>`;

    default:
      return '';
  }
}

/**
 * かいせつを さいせい する。かえり値は かたづけ かんすう。
 */
export function startLesson({ root, game, lesson, onExit, onFinish }) {
  const steps = lesson.steps;
  let index = 0;
  let playing = true;
  let timer = null;
  let disposed = false;

  const visual = h('div', { class: 'lesson-visual' });
  const caption = h('p', { class: 'lesson-caption' });
  const progress = h('div', { class: 'progress' });

  const playBtn = h('button', {
    class: 'icon-btn',
    type: 'button',
    'aria-label': 'とめる／すすめる',
    onclick: () => { sfx.tap(); setPlaying(!playing); },
  }, '⏸');

  const prevBtn = h('button', {
    class: 'icon-btn',
    type: 'button',
    'aria-label': 'まえに もどる',
    onclick: () => { sfx.tap(); go(index - 1); },
  }, '◀');

  const nextBtn = h('button', {
    class: 'icon-btn',
    type: 'button',
    'aria-label': 'つぎへ',
    onclick: () => { sfx.tap(); go(index + 1); },
  }, '▶');

  const playBar = h(
    'div',
    { class: 'lesson-controls' },
    prevBtn,
    playBtn,
    nextBtn,
    h('button', {
      class: 'big-btn',
      type: 'button',
      onclick: () => { sfx.tap(); finish(); },
    }, '▶ あそぶ'),
  );

  const screen = h(
    'div',
    { class: 'screen screen-lesson', style: { '--game-color': game.color } },
    h(
      'header',
      { class: 'quiz-header' },
      h('button', {
        class: 'icon-btn',
        type: 'button',
        'aria-label': 'ホームに もどる',
        onclick: () => { sfx.tap(); onExit(); },
      }, '🏠'),
      mascotImg('cheer', 'mascot mascot-quiz'),
      h('div', { class: 'quiz-title' }, h('span', { class: 'quiz-title-text' }, lesson.title), progress),
      h('span', { class: 'chip chip-lesson' }, 'おしえて'),
    ),
    h('main', { class: 'lesson-main' }, visual, caption),
    playBar,
  );

  clear(root).append(screen);

  function renderProgress() {
    clear(progress);
    for (let i = 0; i < steps.length; i++) {
      progress.append(h('span', { class: `dot ${i < index ? 'is-done' : i === index ? 'is-now' : ''}` }));
    }
  }

  function setPlaying(next) {
    playing = next;
    playBtn.textContent = playing ? '⏸' : '▶';
    clearTimeout(timer);
    if (playing) schedule();
    else cancelSpeech();
  }

  function schedule() {
    clearTimeout(timer);
    if (!playing || disposed) return;
    const step = steps[index];
    timer = setTimeout(() => {
      if (index + 1 >= steps.length) {
        setPlaying(false);
        caption.classList.add('is-done');
        return;
      }
      go(index + 1);
    }, step.ms || 2600);
  }

  function go(next) {
    if (disposed) return;
    if (next < 0 || next >= steps.length) return;
    index = next;
    show();
  }

  function show() {
    const step = steps[index];
    visual.innerHTML = renderLessonStep(step);
    visual.className = `lesson-visual kind-${step.kind}`;
    caption.textContent = step.text;
    caption.classList.remove('is-done');
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === steps.length - 1;
    renderProgress();
    speak(step.speak || step.text, 'ja-JP');
    schedule();
  }

  function finish() {
    if (disposed) return;
    cleanup();
    onFinish();
  }

  function cleanup() {
    disposed = true;
    clearTimeout(timer);
    cancelSpeech();
  }

  sfx.start();
  show();

  return cleanup;
}
