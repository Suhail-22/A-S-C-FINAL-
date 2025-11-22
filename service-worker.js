const CACHE_NAME = 'abo-suhail-offline-v9.0.0';

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
  // 1. Navigation (HTML): Robust Cache-First Strategy
  // If request is for '/', we must check if we have '/' OR 'index.html' cached.
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // A. Try finding the exact request in cache (e.g. '/')
        let cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // B. If not found (e.g. requesting '/'), try finding 'index.html'
        cachedResponse = await caches.match('./index.html');
        if (cachedResponse) return cachedResponse;

        // C. If neither found, go to network
        const networkResponse = await fetch(event.request);
        // Save network response for next time
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkResponse.clone());
        return networkResponse;

      } catch (error) {
        // D. If network fails (Offline), show offline.html
        const offlineResponse = await caches.match('./offline.html');
        if (offlineResponse) return offlineResponse;
        
        // Last resort
        return new Response('You are offline', { status: 200, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  // 2. Resources (JS, CSS, Fonts): Cache First -> Network Update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Allow opaque responses for CDNs
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