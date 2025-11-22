
const CACHE_NAME = 'abo-suhail-offline-v13.0.0';

const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icon.svg',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We try to cache both root and index.html to cover all bases
      return cache.addAll(URLS_TO_CACHE).catch(err => console.log('Pre-cache warning:', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Navigation Strategy: Cache First (Root Fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          
          // 1. Try exact match
          let cachedResponse = await cache.match(event.request);
          if (cachedResponse) return cachedResponse;

          // 2. Try root '/'
          cachedResponse = await cache.match('/');
          if (cachedResponse) return cachedResponse;

          // 3. Try index.html
          cachedResponse = await cache.match('/index.html');
          if (cachedResponse) return cachedResponse;

          // 4. Network
          const networkResponse = await fetch(event.request);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;

        } catch (error) {
          const cache = await caches.open(CACHE_NAME);
          return await cache.match('/offline.html');
        }
      })()
    );
    return;
  }

  // 2. Assets Strategy: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
           const clone = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {});
      
      return cachedResponse || fetchPromise;
    })
  );
});