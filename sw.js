// Service worker: кэширует все файлы приложения для работы офлайн.
// При обновлении содержимого меняй CACHE (например v1 -> v2), чтобы
// пользователи получили свежую версию.
const CACHE = 'dnd-journal-v3';

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

// Cache-first: сначала кэш, при промахе — сеть (и докладываем в кэш).
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return resp;
      }).catch(function () {
        // офлайн и нет в кэше — для навигации отдаём главную страницу
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
