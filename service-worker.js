
const CACHE_NAME = 'abo-suhail-pro-offline-v2.1.0';

// Critical external resources that must be cached for offline usage
const EXTERNAL_RESOURCES = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Cairo:wght@400;700&family=Almarai:wght@400;700&display=swap',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/react-dom@18.3.1/client',
  'https://esm.sh/react@18.3.1/',
  'https://esm.sh/react-dom@18.3.1/'
];

const LOCAL_RESOURCES = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Cache Local Resources (Critical)
      await cache.addAll(LOCAL_RESOURCES);

      // 2. Cache External Resources (Best Effort Strategy)
      // We map over requests and catch individual errors so one failure doesn't stop the whole install.
      const externalPromises = EXTERNAL_RESOURCES.map(async (url) => {
        try {
          // Try fetching with CORS first to get a 'clean' response
          const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
          if (response.ok) {
             return cache.put(url, response);
          }
          throw new Error('Network response was not ok');
        } catch (e) {
          // Fallback to no-cors (opaque) for CDNs that might not send headers
          // This is "Best Effort" - if it fails here, we just log it and continue.
          try {
             const opaqueResponse = await fetch(url, { mode: 'no-cors' });
             return cache.put(url, opaqueResponse);
          } catch (err) {
             console.warn(`[SW] Failed to cache external resource: ${url}`);
          }
        }
      });
      
      // Wait for all attempts to finish (success or fail)
      await Promise.all(externalPromises);
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
  const request = event.request;

  // Strategy: CACHE FIRST for HTML (Navigation)
  // This guarantees the app loads offline immediately.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cachedResponse) => {
        // 1. Return cached index.html immediately if found (OFFLINE READY)
        if (cachedResponse) {
            return cachedResponse;
        }
        // 2. Fallback: If not in cache (first load), fetch from network
        return fetch(request).then(networkResponse => {
             const clone = networkResponse.clone();
             caches.open(CACHE_NAME).then(cache => cache.put('./index.html', clone));
             return networkResponse;
        }).catch(() => {
             // 3. Absolute fallback for any navigation error -> try matching root
             return caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Strategy: Stale-While-Revalidate for everything else (Scripts, Styles, Images)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // Update cache with new version if valid
          if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
             const clone = networkResponse.clone();
             caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
            // Network failed, do nothing, rely on cache
        });

      // Return cached response immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
