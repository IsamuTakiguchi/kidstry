// おと：ファイル なしで WebAudio から つくる ＋ よみあげ（speechSynthesis）
let ctx = null;
let settings = { sound: true, speech: true };
let jaVoice = null;
let enVoice = null;
let voicesReady = false;

export function configureAudio(next) {
  settings = { ...settings, ...next };
  if (!settings.speech) cancelSpeech();
}

/** タブレットでは さいしょの タップで おとを ゆるす ひつようが ある */
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  loadVoices();
}

function loadVoices() {
  if (voicesReady || typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return;
  jaVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('ja')) || null;
  enVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en')) || null;
  voicesReady = true;
}

if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.addEventListener?.('voiceschanged', () => {
    voicesReady = false;
    loadVoices();
  });
}

function tone({ freq, start = 0, duration = 0.18, type = 'sine', gain = 0.16 }) {
  if (!ctx || !settings.sound) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function chord(freqs, opts = {}) {
  freqs.forEach((freq, i) => tone({ freq, start: i * (opts.step ?? 0.09), ...opts }));
}

export const sfx = {
  tap() { tone({ freq: 660, duration: 0.08, type: 'triangle', gain: 0.1 }); },
  correct() { chord([784, 988, 1319], { duration: 0.22, type: 'triangle', gain: 0.15 }); },
  wrong() {
    tone({ freq: 300, duration: 0.16, type: 'sine', gain: 0.12 });
    tone({ freq: 240, start: 0.14, duration: 0.22, type: 'sine', gain: 0.12 });
  },
  start() { chord([523, 659, 784], { duration: 0.16, type: 'triangle', gain: 0.12, step: 0.07 }); },
  sticker() { chord([659, 880, 1047, 1319], { duration: 0.3, type: 'triangle', gain: 0.13, step: 0.1 }); },
  fanfare() {
    chord([523, 659, 784, 1047], { duration: 0.26, type: 'triangle', gain: 0.15, step: 0.12 });
    tone({ freq: 1319, start: 0.5, duration: 0.5, type: 'triangle', gain: 0.16 });
  },
};

export function cancelSpeech() {
  if (typeof speechSynthesis !== 'undefined') {
    try { speechSynthesis.cancel(); } catch { /* むし */ }
  }
}

/** よみあげ。つかえない ばあいは なにも しない（がめんの もじで つたわる） */
export function speak(text, lang = 'ja-JP') {
  if (!settings.speech || !text) return;
  if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') return;
  loadVoices();
  cancelSpeech();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = lang.startsWith('ja') ? 0.95 : 0.85;
  u.pitch = 1.15;
  const voice = lang.startsWith('ja') ? jaVoice : enVoice;
  if (voice) u.voice = voice;
  try { speechSynthesis.speak(u); } catch { /* むし */ }
}

export function hasSpeech() {
  return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}
