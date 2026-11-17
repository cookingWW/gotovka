// Сервис-воркер: приложение работает без интернета.
// Если обновили файлы на GitHub, а у пользователей старая версия, увеличьте номер ниже.
const CACHE = 'gotovka-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'img/favicon.svg', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || req.destination === 'document';
  if (isPage) {
    // Страница: сначала сеть (чтобы видеть обновления), без интернета берём из кэша.
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('index.html', copy));
        return res;
      }).catch(() => caches.match('index.html').then(r => r || caches.match('./')))
    );
  } else {
    // Остальное: сначала кэш.
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
