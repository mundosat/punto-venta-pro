const CACHE_NAME = 'pv-pro-total-v1';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/js/api.js',
  './assets/js/firebase.js',
  './assets/js/firebase-config.js',
  './assets/js/state.js',
  './assets/js/ticket.js',
  './assets/js/ui.js',
  './assets/js/utils.js',
  './assets/js/views.js',
  './assets/img/logo-placeholder.svg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)).catch(() => {}));
});
self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request)));
});
