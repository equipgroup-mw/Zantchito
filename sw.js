self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // All resources fetched from network only - no offline capability
  e.respondWith(fetch(e.request));
});
