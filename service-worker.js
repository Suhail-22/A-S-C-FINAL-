
const CACHE_NAME = 'abo-suhail-calc-v46-production-fix';

// CRITICAL FIX: We ONLY cache static assets that definitely exist in the build.
// We DO NOT cache .tsx files because Vercel converts them to .js bundles.
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './offline.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Installing & Pre-caching static core files...');
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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Ignore non-GET requests
  if (request.method !== 'GET') return;

  // STRATEGY: Cache First for Assets, Network First for Data
  // This ensures the app loads instantly even without internet.

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Return cached response immediately (Fastest)
        // But update it in background if it's not the main HTML
        if (!request.url.includes('index.html')) {
             fetch(request).then(networkResponse => {
                 if(networkResponse && networkResponse.status === 200) {
                     cache.put(request, networkResponse.clone());
                 }
             }).catch(() => {}); 
        }
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(request).then((networkResponse) => {
        // Check if we received a valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // IMPORTANT: Cache the new file (like the main.js bundle) for next time
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }).catch(() => {
         // Network failed & No Cache -> Show Offline Page
         if (request.mode === 'navigate') {
             return cache.match('./offline.html');
         }
      });
    })
  );
});
