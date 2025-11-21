
const CACHE_NAME = 'abo-suhail-calc-v53-offline-fixed';

// List of ALL files to pre-cache.
// This ensures that when the app loads, it downloads the entire source code
// AND the external libraries so it can run locally without hitting the server.
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
  './services/localErrorFixer.ts',

  // External Resources (CRITICAL for offline)
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Cairo:wght@400;700&family=Almarai:wght@400;700&display=swap',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/react-dom@18.3.1/client',
  'https://esm.sh/react@18.3.1/',
  'https://esm.sh/react-dom@18.3.1/'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately upon installation
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Installing & Pre-caching all app source files + CDN libs...');
      // We map requests to cache them. 
      // For external URLs (CDN), mode 'cors' or 'no-cors' might depend on the server, 
      // but simple fetch usually works for caching opaque responses.
      const urlsToCache = PRECACHE_URLS.map(url => {
         return new Request(url, { mode: url.startsWith('http') ? 'cors' : 'same-origin' });
      });
      
      return cache.addAll(urlsToCache).catch(err => {
          console.error('Precache failed for some files:', err);
          // We don't throw here to allow partial installation, 
          // but for a robust offline app, all need to pass.
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
      
      if (cachedResponse) {
        // If online, update cache in background (stale-while-revalidate)
        if (navigator.onLine) {
             fetch(request).then(networkResponse => {
                 if(networkResponse && networkResponse.status === 200) {
                     cache.put(request, networkResponse.clone());
                 }
             }).catch(() => { /* ignore */ }); 
        }
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(request).then((networkResponse) => {
        // Cache successful GET requests
        if (networkResponse && networkResponse.status === 200) {
             cache.put(request, networkResponse.clone());
        }
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
