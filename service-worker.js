
const CACHE_NAME = 'abo-suhail-dynamic-v200';

// Files strictly required for the "App Shell" to load immediately.
// We keep this list small to ensure installation succeeds quickly.
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './offline.html'
];

self.addEventListener('install', (event) => {
  // Skip waiting ensures the new SW takes over immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // console.log('[SW] Pre-caching shell...');
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Claim clients immediately so the first page load is controlled
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              // console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Handle Root Navigation (The PWA "Start URL" fix)
  // If the user asks for '/', serve 'index.html' from cache.
  if (event.request.mode === 'navigate' || url.pathname === '/') {
    event.respondWith(
      caches.match('./index.html').then((response) => {
        return response || fetch(event.request).catch(() => {
            return caches.match('./offline.html');
        });
      })
    );
    return;
  }

  // 2. Stale-While-Revalidate Strategy for everything else (JS, CSS, Fonts)
  // Return cached version immediately (fast), but fetch update in background for next time.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Clone and Cache the new response for future
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch((err) => {
           // Network failed, nothing to do here as we handled cache below
           // console.log('[SW] Network fetch failed', err);
        });

      // Return cached response if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
