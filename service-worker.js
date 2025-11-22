const CACHE_NAME = 'abo-suhail-offline-v6.0.0';

// These are the exact URLs used in index.html. 
// We MUST cache them specifically during install to guarantee offline functionality.
const CRITICAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  // Main Entry File (Since we are using ES Modules directly)
  './index.tsx',
  // External Libraries (The core engine)
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/react-dom@18.3.1/client',
  'https://esm.sh/react@18.3.1/',
  'https://esm.sh/react-dom@18.3.1/',
  // Fonts
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Cairo:wght@400;700&family=Almarai:wght@400;700&display=swap'
];

self.addEventListener('install', (event) => {
  // Force this new service worker to become active immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('SW: Starting critical asset caching...');
      try {
        // We fetch critical assets. If any fail, the install fails.
        // This ensures that if the app installs, it WORKS.
        await cache.addAll(CRITICAL_ASSETS);
        console.log('SW: All critical assets cached successfully!');
      } catch (err) {
        console.error('SW: Caching failed', err);
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Navigation (HTML): Network First -> Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          return caches.match('./index.html').then(res => res || caches.match('./'));
        })
    );
    return;
  }

  // 2. Everything else: Cache First -> Network Update (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache valid responses (including opaque ones like CDN scripts)
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
           const clone = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
         // Network failed
      });
      
      return cachedResponse || fetchPromise;
    })
  );
});