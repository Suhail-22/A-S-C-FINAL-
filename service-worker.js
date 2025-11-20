
const CACHE_NAME = 'ai-calculator-offline-v19';

// Core assets that MUST be cached immediately for the app shell to work.
const STATIC_ASSETS = [
  './',
  './index.html',
  'index.html',
  'offline.html',
  'manifest.json',
  'assets/icon.svg',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'constants.ts',
  // Components
  'components/AboutPanel.tsx',
  'components/Button.tsx',
  'components/ButtonGrid.tsx',
  'components/Calculator.tsx',
  'components/ConfirmationDialog.tsx',
  'components/Display.tsx',
  'components/Header.tsx',
  'components/HistoryPanel.tsx',
  'components/Icon.tsx',
  'components/Notification.tsx',
  'components/Overlay.tsx',
  'components/SettingsPanel.tsx',
  'components/SupportPanel.tsx',
  // Hooks
  'hooks/useCalculator.tsx',
  'hooks/useLocalStorage.tsx',
  // Services
  'services/calculationEngine.ts',
  'services/localErrorFixer.ts',
  'services/geminiService.ts',
  // External Libraries (CDNs) - NOTE: CDNs might fail offline if not visited previously, 
  // but the app shell (index.html) should still load.
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
      console.log('[Service Worker] Pre-caching all source files for offline use');
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

  // STRATEGY: App Shell (Network-First, falling back to Cache for data / Cache-First for assets)
  
  // 1. NAVIGATION REQUESTS (HTML): Always try to serve the App Shell (index.html) from cache first
  // This ensures that if the user is offline, the app opens immediately.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cachedResponse) => {
        // Return cached index.html if available (Offline capability)
        if (cachedResponse) {
            return cachedResponse;
        }
        // Fallback: Try index.html without ./
        return caches.match('index.html').then(res => {
             if (res) return res;
             // If not in cache, try network
             return fetch(event.request).catch(() => {
                 // If network fails, show offline page
                 return caches.match('offline.html');
             });
        });
      })
    );
    return;
  }

  // 2. ALL OTHER ASSETS (JS, CSS, Images): Cache First, then Network
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
          return cachedResponse;
      }

      try {
          const networkResponse = await fetch(event.request);
          // Cache new files for next time (dynamic caching)
          if (networkResponse && networkResponse.status === 200 && (event.request.url.startsWith('http') || event.request.url.startsWith('https'))) {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
      } catch (error) {
          // Network failed and resource not in cache
          // For images, we could return a placeholder, but for code we just fail.
          throw error;
      }
    })()
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
