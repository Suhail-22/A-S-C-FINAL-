
const CACHE_NAME = 'abo-suhail-offline-v12.0.2';

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
          
          // Strategy: Try to find the EXACT request in cache
          let cachedResponse = await cache.match(event.request);
          if (cachedResponse) return cachedResponse;

          // Fallback 1: Try to find root '/' (Most likely for SPAs)
          cachedResponse = await cache.match('/');
          if (cachedResponse) return cachedResponse;

          // Fallback 2: Try to find 'index.html'
          cachedResponse = await cache.match('/index.html');
          if (cachedResponse) return cachedResponse;

          // If not in cache, try network
          const networkResponse = await fetch(event.request);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;

        } catch (error) {
          // If everything fails (Offline & No Cache), show offline page
          const cache = await caches.open(CACHE_NAME);
          const offlineResponse = await cache.match('/offline.html');
          return offlineResponse || new Response('Offline', { status: 503, statusText: 'Offline' });
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
