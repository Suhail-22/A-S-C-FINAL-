
const CACHE_NAME = 'abo-suhail-calc-v55-offline-final';

// List of ALL files to pre-cache.
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

  // External Resources
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Cairo:wght@400;700&family=Almarai:wght@400;700&display=swap',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/react-dom@18.3.1/client',
  'https://esm.sh/react@18.3.1/',
  'https://esm.sh/react-dom@18.3.1/'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Installing & Pre-caching files...');
      const urlsToCache = PRECACHE_URLS.map(url => {
         // Using no-cors for external resources allows caching opaque responses
         // This is critical for CDNs that might not send CORS headers for all requests
         const mode = url.startsWith('http') ? 'no-cors' : 'same-origin';
         return new Request(url, { mode: mode });
      });
      
      return cache.addAll(urlsToCache).catch(err => {
          console.error('Precache failed for some files:', err);
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
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        if (navigator.onLine) {
             // Revalidate in background
             fetch(request, { mode: request.url.startsWith('http') ? 'no-cors' : 'same-origin' })
             .then(networkResponse => {
                 // Check if valid response (type opaque is ok for no-cors)
                 if(networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                     cache.put(request, networkResponse.clone());
                 }
             }).catch(() => { /* ignore */ }); 
        }
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request, { mode: request.url.startsWith('http') ? 'no-cors' : 'cors' });
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
             cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (e) {
         if (request.mode === 'navigate') {
             return cache.match('./offline.html');
         }
         throw e;
      }
    })
  );
});
