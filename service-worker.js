
const CACHE_NAME = 'abo-suhail-calc-v40-dynamic';

// Files we explicitly want to cache immediately on install
const PRECACHE_URLS = [
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
      return cache.addAll(PRECACHE_URLS).catch(err => {
          console.warn('Precache failed for some items:', err);
      });
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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Navigation requests (HTML pages)
  // Strategy: Network First, falling back to Cache, falling back to Offline Page
  // This ensures users get the latest version if online, but app works if offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If network fetch succeeds, cache it and return it
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
             if (cachedResponse) return cachedResponse;
             // If not in cache, try index.html (for SPA routing)
             return caches.match('./index.html').then(indexResp => {
                 return indexResp || caches.match('./offline.html');
             });
          });
        })
    );
    return;
  }

  // 2. Asset requests (JS, CSS, Images, Fonts)
  // Strategy: Stale-While-Revalidate
  // Return cached version immediately (fast!), then update cache in background.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Update cache with new version
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
          // Network failed, nothing to do (we hopefully returned cachedResponse)
      });

      // Return cached response if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
