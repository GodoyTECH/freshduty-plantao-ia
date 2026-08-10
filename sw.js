/**
 * Godoy FreshOps AI — Service Worker PWA para Suporte Offline & Push Notifications
 */

const CACHE_NAME = 'freshops-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push Notification Background Handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'Novo chamado atribuído ao seu nome no Teams!';
  const options = {
    body: data,
    icon: 'https://godoysoluintech.netlify.app/logonew.png',
    badge: 'https://godoysoluintech.netlify.app/logonew.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('🚨 Godoy FreshOps AI — Novo Chamado', options)
  );
});
