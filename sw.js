/**
 * Godoy FreshOps AI — Service Worker PWA para Suporte Offline & Push Notifications
 * Estratégia: Anti-Cache Strict + Auto-Clean (Garante carregamento da última versão a cada F5/Ctrl+F5)
 * Desenvolvido por Godoy Solutions in TECH para Caique Eduardo
 */

const CACHE_NAME = 'freshops-pwa-v-nocache-v7-latest';

// Instalação do Service Worker com ativação imediata sem esperar
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Limpa TODOS os caches antigos ao ativar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('🧹 Limpando cache do PWA para carregar a versão mais recente:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia Network-Only / Strict Fetch para arquivos principais (Garante a versão mais recente)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Busca sempre diretamente na rede sem armazenar cache estático pesado
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .catch(() => caches.match(event.request))
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
