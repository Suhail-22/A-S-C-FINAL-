
const CACHE_NAME = 'abo-suhail-v400-final';

// Files that MUST be cached immediately for the app shell to work
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './offline.html'
];

// Install Event: Cache the core shell
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
       return caches.keys().then(keys => Promise.all(
         keys.map(key => {
           if (key !== CACHE_NAME) {
             return caches.delete(key);
           }
         })
       ));
    })
  );
});

// Fetch Event: The Core Logic for Offline Support
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-http requests (like extensions)
  if (!url.protocol.startsWith('http')) return;

  // Strategy: Stale-While-Revalidate
  // 1. Return cached version immediately (Fastest).
  // 2. Fetch from network in background to update cache (Freshness).
  // 3. If no cache, wait for network.
  // 4. If network fails (Offline) & no cache, show Offline page.

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Try to get from cache first
      const cachedResponse = await cache.match(event.request);

      // 2. Create a network fetch promise to update the cache
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Only cache valid responses
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed - do nothing here, handled below
          return null;
        });

      // 3. Return cached response if we have it (and update in background)
      if (cachedResponse) {
        return cachedResponse;
      }

      // 4. If not in cache, we MUST wait for network
      const networkResponse = await fetchPromise;

      if (networkResponse) {
        return networkResponse;
      }

      // 5. Fallback for Offline (Network failed & Not in cache)
      // If it's a navigation request (HTML page), show offline.html or index.html
      if (event.request.mode === 'navigate') {
        return cache.match('./index.html').then(r => r || cache.match('./offline.html'));
      }

      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});
