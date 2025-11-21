
const CACHE_NAME = 'abo-suhail-pro-offline-v8';

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
      // 1. Cache Local Resources
      await cache.addAll(LOCAL_RESOURCES);

      // 2. Cache External Resources (with fallback for opaque responses)
      const externalPromises = EXTERNAL_RESOURCES.map(async (url) => {
        try {
          // Try fetching with CORS first to get a 'clean' response
          const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
          if (!response.ok) throw new Error('Network response was not ok');
          return cache.put(url, response);
        } catch (e) {
          // Fallback to no-cors (opaque) for CDNs that might not send headers
          const opaqueResponse = await fetch(url, { mode: 'no-cors' });
          return cache.put(url, opaqueResponse);
        }
      });
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
  // Strategy: Cache First for HTML (Navigation)
  // This forces the browser to load the app from cache IMMEDIATELY, ensuring offline works.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cachedResponse) => {
        // 1. Return cached index.html immediately if found
        if (cachedResponse) {
            return cachedResponse;
        }
        // 2. Fallback: Try to match the request specifically (for root /)
        return caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => {
                 // 3. Absolute fallback if network fails and not in cache (shouldn't happen if installed)
                 return caches.match('./index.html');
            });
        });
      })
    );
    return;
  }

  // Strategy: Stale-While-Revalidate for everything else (Scripts, Styles, Images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Update cache with new version if valid
          if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
             const clone = networkResponse.clone();
             caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
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
