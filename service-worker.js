
const CACHE_NAME = 'abo-suhail-offline-v301';

// Explicitly list the external libraries used in index.html importmap
// This is CRITICAL for the app to run offline.
const EXTERNAL_LIBS = [
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/react-dom@18.3.1/client',
  'https://esm.sh/react@18.3.1/',
  'https://esm.sh/react-dom@18.3.1/',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Cairo:wght@400;700&family=Almarai:wght@400;700&display=swap'
];

const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './offline.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Cache Local Assets (Must succeed)
      await cache.addAll(LOCAL_ASSETS);
      
      // 2. Cache External Libraries (Best Effort / CORS)
      // Changed from 'no-cors' to 'cors' so scripts can execute properly
      const externalPromises = EXTERNAL_LIBS.map(async (url) => {
        try {
          const request = new Request(url, { mode: 'cors' });
          const response = await fetch(request);
          return cache.put(request, response);
        } catch (e) {
          console.warn('[SW] Failed to cache external lib:', url, e);
        }
      });
      
      await Promise.all(externalPromises);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Navigation Strategy (HTML)
  // Always try network first for fresh content, fallback to cache, then offline page.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html')
            .then((response) => response || caches.match('./offline.html'));
        })
    );
    return;
  }

  // 2. Stale-While-Revalidate for everything else (Scripts, Images, CSS)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
           const responseToCache = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, responseToCache);
           });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, swallow error if we have cache
      });

      return cachedResponse || fetchPromise;
    })
  );
});
