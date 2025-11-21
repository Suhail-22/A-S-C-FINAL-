
const CACHE_NAME = 'abo-suhail-calc-v45-offline-final';

// CRITICAL: We must cache the Logic (index.tsx) not just the Skeleton (index.html)
const PRECACHE_URLS = [
  './',
  './index.html',
  './index.tsx', 
  './manifest.json',
  './assets/icon.svg',
  './offline.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Installing & Pre-caching critical files...');
      return cache.addAll(PRECACHE_URLS).catch(err => {
          console.error('Precache failed:', err);
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Ignore non-GET requests
  if (request.method !== 'GET') return;

  // STRATEGY: Stale-While-Revalidate (Optimized for PWA)
  // 1. Return Cached version IMMEDIATELY (Fastest, Offline works)
  // 2. Fetch from Network in background to update Cache for NEXT time
  // 3. If Cache is empty and Network fails -> Show Offline Page

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      
      // Network Fetch Promise (Updates the cache)
      const networkFetch = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
           cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => {
         // Network failed
         // If we didn't have a cached response, we need to return the offline page
         if (!cachedResponse && request.mode === 'navigate') {
             return cache.match('./offline.html');
         }
      });

      // Return cached response immediately if we have it, otherwise wait for network
      return cachedResponse || networkFetch;
    })
  );
});
