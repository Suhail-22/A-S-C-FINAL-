
const CACHE_NAME = 'abo-suhail-calc-v52-offline-pro';

// List of ALL files to pre-cache.
// This ensures that when the app loads, it downloads the entire source code
// so it can run locally without hitting the server.
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './offline.html',
  
  // Core Entry Points
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.ts',

  // Components
  './components/AboutPanel.tsx',
  './components/Button.tsx',
  './components/ButtonGrid.tsx',
  './components/Calculator.tsx',
  './components/ConfirmationDialog.tsx',
  './components/Display.tsx',
  './components/Header.tsx',
  './components/HistoryPanel.tsx',
  './components/Icon.tsx',
  './components/Notification.tsx',
  './components/Overlay.tsx',
  './components/SettingsPanel.tsx',
  './components/SupportPanel.tsx',

  // Hooks
  './hooks/useCalculator.tsx',
  './hooks/useLocalStorage.tsx',

  // Services
  './services/calculationEngine.ts',
  './services/geminiService.ts',
  './services/localErrorFixer.ts'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately upon installation
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Installing & Pre-caching all app source files...');
      // We use { cache: 'reload' } to ensure we get fresh files from the server during install
      const urlsToCache = PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' }));
      return cache.addAll(urlsToCache).catch(err => {
          console.error('Precache failed for some files:', err);
          // Continue even if some fail, but log it.
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
  
  // Ignore non-GET requests (like POST/PUT)
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      
      // Strategy: Stale-While-Revalidate for non-critical assets, Cache-First for immutable assets
      
      if (cachedResponse) {
        // If online, try to update the cache in the background for next time
        // This ensures the user always has the latest version eventually
        if (navigator.onLine) {
             fetch(request).then(networkResponse => {
                 // Check if valid response before updating cache
                 if(networkResponse && networkResponse.status === 200) {
                     cache.put(request, networkResponse.clone());
                 }
             }).catch(() => { /* ignore background fetch errors */ }); 
        }
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(request).then((networkResponse) => {
        // Ensure we got a valid response
        // We allow type 'cors' to cache external scripts like React (esm.sh) and Tailwind
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }

        // IMPORTANT: Cache the new file (fonts, cdn scripts, etc.)
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }).catch(() => {
         // Network failed & No Cache -> Show Offline Page
         // Only for navigation requests (main page load)
         if (request.mode === 'navigate') {
             return cache.match('./offline.html');
         }
      });
    })
  );
});
