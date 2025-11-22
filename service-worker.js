
const CACHE_NAME = 'abo-suhail-offline-v8.0.0';

const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './offline.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Navigation (HTML): Stale-While-Revalidate
  // This is the KEY FIX for "Site cannot be reached".
  // It serves the cached index.html IMMEDIATELY, then updates in background.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cachedResponse) => {
        // 1. Return cached index.html immediately if found
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return networkResponse;
          })
          .catch(() => {
             // If network fails, we don't care because we (hopefully) returned the cache.
          });

        // Return cache if available, otherwise fetch, otherwise fallback to offline.html
        return cachedResponse || fetchPromise || caches.match('./offline.html');
      }).catch(() => {
         return caches.match('./offline.html');
      })
    );
    return;
  }

  // 2. Resources (JS, CSS, Fonts): Cache First -> Network Update
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
