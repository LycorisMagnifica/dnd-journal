// Service worker: держит приложение рабочим офлайн и вовремя обновляет его.
// Стратегия:
//   - сама страница (навигация) -> "сначала сеть": при интернете всегда свежая
//     версия, без интернета -> из кэша.
//   - шрифты/иконки/картинки -> "сначала кэш" (они меняются редко).
// При обновлении содержимого меняй номер версии (v5 -> v6), чтобы устройства
// гарантированно перекачали файлы.
const CACHE = 'dnd-journal-v5';

const ASSETS = [
  'index.html',
  'manifest.json',
  'splash-flower.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'fonts/inter-latin-400-normal.woff2',
  'fonts/inter-latin-500-normal.woff2',
  'fonts/inter-latin-600-normal.woff2',
  'fonts/inter-latin-700-normal.woff2',
  'fonts/inter-cyrillic-400-normal.woff2',
  'fonts/inter-cyrillic-500-normal.woff2',
  'fonts/inter-cyrillic-600-normal.woff2',
  'fonts/inter-cyrillic-700-normal.woff2',
  'fonts/cinzel-latin-500-normal.woff2',
  'fonts/cinzel-latin-600-normal.woff2',
  'fonts/cinzel-latin-700-normal.woff2'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put('index.html', copy); });
        return resp;
      }).catch(function () {
        return caches.match('index.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return resp;
      });
    })
  );
});
