
const CACHE_NAME = 'abo-suhail-calc-v62-offline-fixed';

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
  // IMPORTANT: These must be fetched with CORS enabled to work as Modules/Scripts
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
      
      const cachePromises = PRECACHE_URLS.map(async (url) => {
        try {
          // CRITICAL FIX: Use 'cors' mode. 
          // 'no-cors' creates opaque responses which fail for ES Modules (react/react-dom).
          const request = new Request(url, { 
             mode: 'cors', 
             credentials: 'omit',
             cache: 'reload' // Force network fetch to ensure fresh cache
          });
          
          const response = await fetch(request);
          
          if (!response.ok) {
            throw new Error(`Network response was not ok for ${url}`);
          }
          
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
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        
        // Cache valid responses for future offline use
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (e) {
         // If offline and resource not found
         console.log('Offline fetch failed:', request.url);
         if (request.mode === 'navigate') {
             return cache.match('./offline.html');
         }
         // Fallback for images/fonts could be added here
         throw e;
      }
    })
  );
});
