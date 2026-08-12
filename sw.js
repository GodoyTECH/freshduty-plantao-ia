/**
 * Godoy FreshOps AI — Service Worker PWA para Suporte Offline & Push Notifications
 * Estratégia: Network-First + Auto-Clean (Força atualização imediata e limpa todo o cache antigo)
 * Desenvolvido por Godoy Solutions in TECH para Caique Eduardo
 */

const CACHE_NAME = 'freshops-pwa-v5-godoytech-brand-colors';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json'
];

// Instalação do Service Worker com ativação imediata
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Limpa TODOS os caches antigos ao ativar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('🧹 Removendo cache antigo do PWA:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia Network-First: Sempre busca a versão mais recente na rede. Só usa cache se estiver offline!
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Push Notification Background Handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'Novo chamado atribuído ao seu nome no Teams!';
  const options = {
    body: data,
    icon: 'https://godoyagent.netlify.app/logonew.png',
    badge: 'https://godoyagent.netlify.app/logonew.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('🚨 Godoy FreshOps AI — Novo Chamado', options)
  );
});
