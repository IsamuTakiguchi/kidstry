// オフラインでも あそべる ように アプリを キャッシュする
const CACHE = 'kidstry-v1';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'styles/base.css',
  'styles/components.css',
  'styles/games.css',
  'src/main.js',
  'src/core/audio.js',
  'src/core/quiz.js',
  'src/core/random.js',
  'src/core/state.js',
  'src/core/ui.js',
  'src/core/ui-shapes.js',
  'src/data/english.js',
  'src/data/hiragana.js',
  'src/data/stickers.js',
  'src/data/words.js',
  'src/games/index.js',
  'src/games/_helpers.js',
  'src/games/addition.js',
  'src/games/clock.js',
  'src/games/counting.js',
  'src/games/english.js',
  'src/games/hiragana-find.js',
  'src/games/pattern.js',
  'src/games/seikatsu.js',
  'src/games/shapes.js',
  'src/games/word-start.js',
  'src/screens/home.js',
  'src/screens/parent.js',
  'src/screens/result.js',
  'src/screens/stickers.js',
  'assets/icons/app-icon.svg',
  'assets/icons/app-icon-maskable.svg',
  'assets/icons/game-addition.svg',
  'assets/icons/game-clock.svg',
  'assets/icons/game-counting.svg',
  'assets/icons/game-english.svg',
  'assets/icons/game-hiragana-find.svg',
  'assets/icons/game-pattern.svg',
  'assets/icons/game-seikatsu.svg',
  'assets/icons/game-shapes.svg',
  'assets/icons/game-word-start.svg',
  'assets/characters/torii-normal.svg',
  'assets/characters/torii-happy.svg',
  'assets/characters/torii-cheer.svg',
  'assets/characters/torii-think.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('index.html'));
    }),
  );
});
