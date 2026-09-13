// ぜんぶの ゲームで きょうつうの もんだい すすめかた
import { h, clear, wait, clockSvg, emojiGroupHtml, shapeSvg, mascotImg, mascotSrc } from './ui.js';
import { sfx, speak, cancelSpeech } from './audio.js';
import { QUESTIONS_PER_SESSION } from './state.js';

const FEEDBACK_MS = 850;

export function renderStage(stage) {
  switch (stage.kind) {
    case 'emoji-word':
      return `<div class="stage-emoji">${stage.emoji}</div><div class="stage-word">${[...stage.word]
        .map((c) => `<span class="${c === '◯' ? 'blank' : ''}">${c}</span>`)
        .join('')}</div>`;
    case 'chain': {
      const chars = [...stage.word];
      const at = chars.lastIndexOf(stage.tail);
      const word = chars
        .map((c, i) => (i === at ? `<span class="tail">${c}</span>` : `<span>${c}</span>`))
        .join('');
      return `<div class="stage-chain">
          <div class="stage-emoji">${stage.emoji}</div>
          <div class="stage-word">${word}</div>
          <p class="chain-hint"><span class="tail">${stage.tail}</span> から はじまる ことば</p>
        </div>`;
    }
    case 'group':
      return emojiGroupHtml(stage.emoji, stage.count);
    case 'addition':
      return `<div class="stage-add">
          ${emojiGroupHtml(stage.emoji, stage.a)}
          <div class="stage-op">＋</div>
          ${emojiGroupHtml(stage.emoji, stage.b)}
          <div class="stage-op">＝</div>
          <div class="stage-op stage-q">？</div>
        </div>`;
    case 'clock':
      return `<div class="stage-clock">${clockSvg(stage.hour, stage.minute)}</div>`;
    case 'sequence':
      return `<div class="stage-seq">${stage.items
        .map((it) => `<span class="seq-item">${it}</span>`)
        .join('')}<span class="seq-item seq-q">？</span></div>`;
    default:
      return '';
  }
}

export function renderChoiceInner(choice) {
  switch (choice.kind) {
    case 'shape':
      return `${shapeSvg(choice.value, choice.color, 110)}<span class="choice-label">${choice.label || ''}</span>`;
    case 'emoji':
      return `<span class="choice-emoji">${choice.value}</span>${
        choice.label ? `<span class="choice-label">${choice.label}</span>` : ''
      }`;
    case 'number':
      return `<span class="choice-number">${choice.value}</span>`;
    default:
      return `<span class="choice-text">${choice.value}</span>`;
  }
}

/**
 * クイズを はじめる。かえり値は かたづけ かんすう。
 */
export function startQuiz({ root, game, level, onExit, onFinish, count = QUESTIONS_PER_SESSION }) {
  const questions = game.generate(level, Math.random, count);
  const startedAt = Date.now();
  let index = 0;
  let firstTryCorrect = 0;
  let missedThisQuestion = false;
  let locked = false;
  let disposed = false;

  const progress = h('div', { class: 'progress' });
  const askText = h('h2', { class: 'ask-text' });
  const askSub = h('p', { class: 'ask-sub' });
  const stage = h('div', { class: 'stage' });
  const choicesEl = h('div', { class: 'choices' });
  const toast = h('div', { class: 'toast', 'aria-live': 'polite' });
  const mascot = mascotImg('normal', 'mascot mascot-quiz');

  const speakerBtn = h(
    'button',
    { class: 'icon-btn speaker', type: 'button', 'aria-label': 'もういちど きく', onclick: () => sayQuestion() },
    '🔊',
  );

  const quizMain = h('main', { class: 'quiz-main' }, askText, askSub, stage, choicesEl);

  const screen = h(
    'div',
    { class: 'screen screen-quiz', style: { '--game-color': game.color } },
    h(
      'header',
      { class: 'quiz-header' },
      h('button', {
        class: 'icon-btn',
        type: 'button',
        'aria-label': 'ホームに もどる',
        onclick: () => { cancelSpeech(); onExit(); },
      }, '🏠'),
      mascot,
      h('div', { class: 'quiz-title' }, h('span', { class: 'quiz-title-text' }, game.title), progress),
      speakerBtn,
    ),
    quizMain,
    toast,
  );

  clear(root).append(screen);

  function sayQuestion() {
    const q = questions[index];
    if (!q) return;
    speak(q.ask.speak || q.ask.text, q.ask.lang || 'ja-JP');
  }

  function renderProgress() {
    clear(progress);
    for (let i = 0; i < questions.length; i++) {
      progress.append(h('span', { class: `dot ${i < index ? 'is-done' : i === index ? 'is-now' : ''}` }));
    }
  }

  function renderQuestion() {
    const q = questions[index];
    missedThisQuestion = false;
    locked = false;
    askText.textContent = q.ask.text;
    askSub.textContent = q.ask.sub || '';
    askSub.hidden = !q.ask.sub;
    const hasStage = q.stage.kind !== 'none';
    stage.innerHTML = renderStage(q.stage);
    stage.hidden = !hasStage;
    quizMain.className = `quiz-main ${hasStage ? '' : 'no-stage'}`;
    mascot.src = mascotSrc('normal');
    clear(choicesEl);
    choicesEl.className = `choices ${q.layout || 'grid4'}`;
    for (const choice of q.choices) {
      const btn = h('button', {
        class: `choice choice-${choice.kind}`,
        type: 'button',
        dataset: { key: choice.key },
        html: renderChoiceInner(choice),
        onclick: () => onPick(btn, choice),
      });
      choicesEl.append(btn);
    }
    renderProgress();
    sayQuestion();
  }

  async function onPick(btn, choice) {
    if (locked || disposed) return;
    const q = questions[index];
    if (choice.key === q.answer) {
      locked = true;
      if (!missedThisQuestion) firstTryCorrect += 1;
      btn.classList.add('is-correct');
      mascot.src = mascotSrc('happy');
      sfx.correct();
      showToast(missedThisQuestion ? 'できた！' : 'せいかい！', 'good');
      if (q.reveal) {
        askSub.hidden = false;
        askSub.textContent = q.reveal;
      }
      speak(missedThisQuestion ? 'できたね' : 'せいかい', 'ja-JP');
      await wait(FEEDBACK_MS);
      if (disposed) return;
      index += 1;
      if (index >= questions.length) {
        finish();
      } else {
        renderQuestion();
      }
    } else {
      missedThisQuestion = true;
      btn.classList.add('is-wrong');
      btn.disabled = true;
      mascot.src = mascotSrc('think');
      sfx.wrong();
      showToast('もういちど！', 'retry');
      speak('もういちど', 'ja-JP');
    }
  }

  let toastTimer = null;
  function showToast(text, kind) {
    toast.textContent = text;
    toast.className = `toast is-show toast-${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = 'toast'; }, 1100);
  }

  function finish() {
    onFinish({
      gameId: game.id,
      firstTryCorrect,
      questions: questions.length,
      durationMs: Date.now() - startedAt,
    });
  }

  sfx.start();
  renderQuestion();

  return () => {
    disposed = true;
    clearTimeout(toastTimer);
    cancelSpeech();
  };
}
