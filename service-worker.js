
const CACHE_NAME = 'abo-suhail-calc-v63-best-effort';

// List of files to pre-cache.
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
  // We will try to cache these, but won't fail installation if they fail
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
      console.log('[SW] Installing & Pre-caching files...');
      
      // Best Effort Strategy:
      // We attempt to cache everything, but we don't let one failure break the whole app.
      const cachePromises = PRECACHE_URLS.map(async (url) => {
        try {
          // Use 'cors' mode for external scripts to ensure they are usable.
          // If it fails (e.g. opaque response for fonts), we might retry with no-cors or just log it.
          // For this specific app, esm.sh supports CORS, so 'cors' is correct for scripts.
          const request = new Request(url, { 
             mode: 'cors', 
             credentials: 'omit',
             cache: 'reload' // Force network fetch
          });
          
          const response = await fetch(request);
          
          if (!response.ok) {
            throw new Error(`Network response was not ok for ${url} (${response.status})`);
          }
          
          return await cache.put(request, response);
        } catch (err) {
          console.warn(`[SW] Failed to cache optional resource: ${url}`, err);
          // We do NOT throw here, allowing the installation to succeed 
          // even if a specific font or asset fails.
        }
      });

      await Promise.all(cachePromises);
      console.log('[SW] Install completed (Best Effort).');
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Only handle GET requests
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Try to find in Cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. If not in cache, try Network
      try {
        const networkResponse = await fetch(request);
        
        // Check if it's a valid response we want to cache for next time
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (e) {
         // 3. If Network fails (Offline)
         console.log('[SW] Offline fetch failed:', request.url);
         
         // If navigating to a page, show offline.html
         if (request.mode === 'navigate') {
             const offlinePage = await cache.match('./offline.html');
             if (offlinePage) return offlinePage;
         }
         
         // Fallback: if we are trying to load a script/module offline and it's missing,
         // we can't do much, but preventing the crash is handled by the app logic mostly.
         throw e;
      }
    })
  );
});
