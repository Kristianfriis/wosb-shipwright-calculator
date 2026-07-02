const CACHE = 'wosb-shipwright-v1'
const URLS = ['/', '/index.html', '/app.js', '/data/formulas.json', '/data/ships.json']

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS))))
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))))
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))))