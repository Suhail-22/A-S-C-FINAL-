const CACHE_NAME = 'abo-suhail-offline-v11.0.0';

// The core file that runs the app
const APP_SHELL = './index.html';

const URLS_TO_CACHE = [
  './',
  APP_SHELL,
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
  // 1. Navigation Strategy (App Shell - Cache First)
  // CRITICAL FIX: Always serve index.html from cache for navigation.
  // This prevents "Site cannot be reached" by avoiding network failure on startup.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(APP_SHELL).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Only if cache is empty, try network
        return fetch(APP_SHELL).catch(() => {
           return caches.match('./offline.html');
        });
      })
    );
    return;
  }

  // 2. Asset Strategy (Stale-While-Revalidate)
  // For JS, CSS, Images, Fonts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache opaque responses (CDNs) and valid responses
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
           const clone = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
          // Network failed, suppress error if we have cache
      });
      
      // Return cache if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});