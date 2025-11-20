
const CACHE_NAME = 'ai-calculator-offline-v16';

// Core assets that MUST be cached immediately for the app shell to work
const STATIC_ASSETS = [
  './',
  'index.html',
  'offline.html',
  'manifest.json',
  'assets/icon.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Cairo:wght@400;700&family=Almarai:wght@400;700&display=swap',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/react-dom@18.3.1/client'
];

// Install event: Cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

// Fetch event: The core logic for offline support
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Strategy: Stale-While-Revalidate for most things, Network First for HTML
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // 1. Try to get from cache first (Instant loading)
      const cachedResponse = await cache.match(event.request);
      
      // 2. Fetch from network in the background to update cache
      const networkFetchPromise = fetch(event.request).then((networkResponse) => {
        // Update cache if valid response
        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
            cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => {
          // Network failed
          // If we have no cache and it's a navigation request (HTML), show offline page
          if (!cachedResponse && event.request.mode === 'navigate') {
              return cache.match('offline.html');
          }
      });

      // Return cached response immediately if available, otherwise wait for network
      return cachedResponse || networkFetchPromise;
    })()
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
