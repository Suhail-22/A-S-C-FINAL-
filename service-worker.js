
const CACHE_NAME = 'abo-suhail-calc-v58-offline-final';

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

  // External Resources (These will be fetched with no-cors)
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
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Installing & Pre-caching files...');
      
      // We must handle requests differently based on origin
      const cachePromises = PRECACHE_URLS.map(async (url) => {
        try {
          // For external URLs (http/https), use no-cors to allow opaque responses
          // For local files, use default (cors/same-origin)
          const request = new Request(url, { 
             mode: url.startsWith('http') ? 'no-cors' : 'same-origin',
             cache: 'reload'
          });
          
          const response = await fetch(request);
          // Store in cache even if opaque (status 0)
          return cache.put(request, response);
        } catch (err) {
          console.error('Failed to cache:', url, err);
        }
      });

      return Promise.all(cachePromises);
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
        return cachedResponse;
      }

      try {
        // Network fallback with aggressive caching for offline support later
        const networkResponse = await fetch(request, { 
            mode: request.url.startsWith('http') ? 'no-cors' : 'cors' 
        });
        
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
