self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('mercadito-v2-cache').then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/style.css',
        '/script.js',
        '/productos.json',
        '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png.png'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
