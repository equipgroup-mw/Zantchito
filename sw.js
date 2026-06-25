const CACHE_NAME = 'zantchito-dash-v5'; // bump this every deploy
const ASSETS = [
  './manifest.json',
  './Z.png',
  './E.png',
  './browser.png',
  './appLogo.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js'
];
// index.html and './' deliberately removed from ASSETS — handled network-first below

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // HTML shell + data.csv: network-first, always try fresh, fall back to cache offline
  if (url.includes('data.csv') || e.request.mode === 'navigate' || url.endsWith('index.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Fonts: cache-first
  if (url.includes('fonts.gstatic.com') || url.includes('fonts.googleapis.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
    return;
  }

  // Static assets (images, manifest, CDN libs): cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() =>
      new Response('Offline', { status: 503 })
    ))
  );
});
