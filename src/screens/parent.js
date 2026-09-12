import { h, clear, starsHtml, formatDuration, showModal } from '../core/ui.js';
import { sfx, configureAudio } from '../core/audio.js';
import { GAMES } from '../games/index.js';
import {
  accuracy, domainStats, totalPlays,
  exportPayload, backupFileName, parseBackup,
} from '../core/state.js';
import { STICKERS } from '../data/stickers.js';

const LEVELS = [
  { value: 1, label: 'やさしい', note: '4〜5さい / はじめて' },
  { value: 2, label: 'ふつう', note: '5さい / なれてきたら' },
  { value: 3, label: 'むずかしい', note: '5〜6さい / しゅうがくまえ' },
];

export function renderParent({ root, store, onHome, onReset }) {
  const state = store.get();
  const stats = domainStats(state, GAMES);
  const maxRate = 1;

  const domainRows = stats.length
    ? stats.map((s) =>
        h(
          'div',
          { class: 'bar-row' },
          h('span', { class: 'bar-label' }, s.domain),
          h(
            'span',
            { class: 'bar-track' },
            h('span', {
              class: 'bar-fill',
              style: { width: `${Math.round((s.rate / maxRate) * 100)}%` },
            }),
          ),
          h('span', { class: 'bar-value' }, `${Math.round(s.rate * 100)}%`),
        ),
      )
    : [h('p', { class: 'empty-note' }, 'まだ記録がありません。お子さまが遊ぶとここに表示されます。')];

  const gameRows = GAMES.map((game) => {
    const rec = state.games[game.id];
    const acc = accuracy(state, game.id);
    return h(
      'tr',
      {},
      h('td', {}, game.title),
      h('td', {}, game.domain),
      h('td', { class: 'num' }, rec ? `${rec.plays}回` : '—'),
      h('td', { class: 'num' }, acc == null ? '—' : `${Math.round(acc * 100)}%`),
      h('td', { html: starsHtml(rec ? rec.bestStars : 0) }),
      h('td', {}, rec?.lastPlayed || '—'),
    );
  });

  const levelButtons = LEVELS.map((lv) =>
    h(
      'button',
      {
        class: `seg-btn ${state.profile.level === lv.value ? 'is-active' : ''}`,
        type: 'button',
        onclick: () => {
          store.update((s) => ({ ...s, profile: { ...s.profile, level: lv.value } }));
          renderParent({ root, store, onHome, onReset });
        },
      },
      h('strong', {}, lv.label),
      h('span', { class: 'seg-note' }, lv.note),
    ),
  );

  const toggle = (key, label, note) =>
    h(
      'label',
      { class: 'switch-row' },
      h('span', {}, h('strong', {}, label), h('span', { class: 'seg-note' }, note)),
      h('input', {
        type: 'checkbox',
        checked: state.settings[key],
        onchange: (ev) => {
          const next = store.update((s) => ({ ...s, settings: { ...s.settings, [key]: ev.target.checked } }));
          configureAudio(next.settings);
        },
      }),
    );

  const screen = h(
    'div',
    { class: 'screen screen-parent' },
    h(
      'header',
      { class: 'sub-header' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'もどる', onclick: () => { sfx.tap(); onHome(); } }, '🏠'),
      h('h1', { class: 'sub-title' }, 'おうちのかたへ'),
      h('span', { class: 'chip' }, 'ほごしゃ ページ'),
    ),
    h(
      'div',
      { class: 'parent-body' },
      h(
        'section',
        { class: 'card' },
        h('h2', {}, 'きろく'),
        h(
          'div',
          { class: 'kpi-row' },
          kpi('あそんだ回数', `${totalPlays(state)}回`),
          kpi('あそんだ時間', formatDuration(state.totalPlayMs)),
          kpi('れんぞく日数', `${Math.max(state.streak, 0)}日`),
          kpi('あつめたシール', `${state.stickers.length} / ${STICKERS.length}`),
        ),
      ),
      h('section', { class: 'card' }, h('h2', {}, '分野べつ 正答率'), h('div', { class: 'bars' }, domainRows)),
      h(
        'section',
        { class: 'card' },
        h('h2', {}, 'あそびべつ 記録'),
        h(
          'div',
          { class: 'table-wrap' },
          h(
            'table',
            { class: 'stat-table' },
            h('thead', {}, h('tr', {}, ...['あそび', '分野', '回数', '正答率', 'さいこう', 'さいご'].map((t) => h('th', {}, t)))),
            h('tbody', {}, gameRows),
          ),
        ),
        h('p', { class: 'note' }, '※正答率は「1回目の選択で正解できた割合」です。まちがえても何度でも挑戦できます。'),
      ),
      h(
        'section',
        { class: 'card' },
        h('h2', {}, 'せってい'),
        h('div', { class: 'field' }, h('p', { class: 'field-label' }, 'むずかしさ'), h('div', { class: 'seg' }, levelButtons)),
        toggle('sound', 'こうかおん', 'せいかい音・タップ音を鳴らします'),
        toggle('speech', 'よみあげ', '問題文を音声で読み上げます（端末の音声合成を使用）'),
        h(
          'div',
          { class: 'field' },
          h('p', { class: 'field-label' }, 'おなまえ'),
          h('input', {
            class: 'text-input',
            type: 'text',
            value: state.profile.name || '',
            placeholder: 'たろう',
            maxlength: '10',
            oninput: (ev) => store.update((s) => ({ ...s, profile: { ...s.profile, name: ev.target.value } })),
          }),
        ),
      ),
      backupCard({ store, onReloaded: () => renderParent({ root, store, onHome, onReset }) }),
      h(
        'section',
        { class: 'card card-danger' },
        h('h2', {}, 'データを けす'),
        h('p', { class: 'note' }, 'きろく・シール・せっていをすべて消して最初からやり直します。元に戻せません。先に「きろくを ほぞん」しておくと、あとから戻せます。'),
        h(
          'button',
          {
            class: 'danger-btn',
            type: 'button',
            onclick: () => showModal({
              title: 'きろくを ぜんぶ けしますか？',
              lines: [
                'あそんだ きろく・あつめた シール・せってい が すべて 消えます。',
                'もとに もどす ことは できません。',
              ],
              okLabel: 'けす',
              danger: true,
              onOk: onReset,
            }),
          },
          'きろくを ぜんぶ けす',
        ),
      ),
      h('p', { class: 'footnote' }, 'きっずトライは端末内だけにデータを保存します。通信や外部送信は行いません。'),
    ),
  );

  clear(root).append(screen);
}

function kpi(label, value) {
  return h('div', { class: 'kpi' }, h('span', { class: 'kpi-value' }, value), h('span', { class: 'kpi-label' }, label));
}

/** きろくの かきだし・よみこみ */
function backupCard({ store, onReloaded }) {
  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    class: 'visually-hidden',
    onchange: (ev) => {
      const file = ev.target.files && ev.target.files[0];
      ev.target.value = '';
      if (file) readBackup(file, store, onReloaded);
    },
  });

  return h(
    'section',
    { class: 'card' },
    h('h2', {}, 'きろくの ほぞん'),
    h('p', { class: 'note' },
      'きろくはこの端末のブラウザだけに保存されています。機種変更・ブラウザのデータ消去・別の端末で使いたいときは、'
      + 'ファイルに書き出して持ち運べます。通信は行いません。'),
    h(
      'div',
      { class: 'backup-actions' },
      h('button', {
        class: 'pill-btn pill-action',
        type: 'button',
        onclick: () => saveBackup(store.get()),
      }, '💾 きろくを ほぞん'),
      h('button', {
        class: 'pill-btn pill-action',
        type: 'button',
        onclick: () => fileInput.click(),
      }, '📂 きろくを よみこむ'),
      fileInput,
    ),
  );
}

function saveBackup(state) {
  const json = JSON.stringify(exportPayload(state), null, 2);
  const name = backupFileName();
  try {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = h('a', { href: url, download: name, class: 'visually-hidden' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch {
    // ダウンロードが つかえない かんきょう では もじを みせて コピー して もらう
    showModal({
      title: 'きろくの なかみ',
      lines: [`このテキストをコピーして、${name} という名前で保存してください。`],
      content: h('textarea', { class: 'backup-text', readonly: true, rows: '8', text: json }),
      okLabel: 'とじる',
      cancelLabel: null,
    });
  }
}

function readBackup(file, store, onReloaded) {
  const reader = new FileReader();
  reader.onerror = () => showModal({
    title: 'よみこめませんでした',
    lines: ['ファイルを ひらけませんでした。'],
    okLabel: 'とじる',
    cancelLabel: null,
  });
  reader.onload = () => {
    const result = parseBackup(String(reader.result));
    if (!result.ok) {
      showModal({
        title: 'よみこめませんでした',
        lines: [result.error],
        okLabel: 'とじる',
        cancelLabel: null,
      });
      return;
    }
    const { summary, exportedAt } = result;
    const saved = exportedAt ? new Date(exportedAt) : null;
    showModal({
      title: 'この きろくを よみこみますか？',
      lines: [
        saved && !Number.isNaN(saved.getTime())
          ? `ほぞんした日：${saved.getFullYear()}年${saved.getMonth() + 1}月${saved.getDate()}日`
          : null,
        `あそんだ回数：${summary.plays}回 ／ シール：${summary.stickers}まい`,
        'いまの端末の きろくは、この内容に おきかわります。',
      ],
      okLabel: 'よみこむ',
      onOk: () => {
        store.set(result.state);
        onReloaded();
        showModal({
          title: 'よみこみました',
          lines: [`あそんだ回数 ${summary.plays}回 ／ シール ${summary.stickers}まい を ふくむ きろくに なりました。`],
          okLabel: 'とじる',
          cancelLabel: null,
        });
      },
    });
  };
  reader.readAsText(file);
}
