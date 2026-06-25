const CACHE_NAME = 'meowmoon-bowling-v1-5-15-starship-sofa-animations-cache';
const CORE_ASSETS = [
  './',
  './index.html',
  './app-v1.5.15.js',
  './special-animation-galleries.html',
  './special-animation-gallery-page.html',
  './special-animation-preview.html',
  './special-animation-gallery.css',
  './special-animation-gallery-data.js',
  './special-animation-gallery.js',
  './special-animation-gallery-app-v1.0.js',
  './manifest.webmanifest',
  './assets/images/icon-192.png',
  './assets/images/icon-512.png',
  './audio/jesu-joy-piano-loop.mp3'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    const url = new URL(event.request.url);
    if (url.origin === self.location.origin) {
      const querylessAsset = './' + (url.pathname.split('/').pop() || '');
      return caches.match(querylessAsset).then(queryless => queryless || fetch(event.request).catch(() => caches.match('./index.html')));
    }
    return fetch(event.request).catch(() => caches.match('./index.html'));
  }));
});
