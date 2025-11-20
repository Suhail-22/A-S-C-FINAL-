
const CACHE_NAME = 'ai-calculator-offline-v18';

// Core assets that MUST be cached immediately for the app shell to work.
// Since we are not using a bundler, we must explicitly list all source files here
// to ensure they are available offline.
const STATIC_ASSETS = [
  './',
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
  // External Libraries (CDNs)
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

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // 1. Try to get from cache first (Instant loading)
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
          return cachedResponse;
      }

      // 2. If not in cache, fetch from network
      try {
          const networkResponse = await fetch(event.request);
          
          // Cache new files for next time (dynamic caching)
          // Ensure valid response and handled scheme
          if (networkResponse && networkResponse.status === 200 && (event.request.url.startsWith('http') || event.request.url.startsWith('https'))) {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
      } catch (error) {
          // 3. Network failed (Offline)
          // If it's a navigation request (HTML), show offline page
          if (event.request.mode === 'navigate') {
              const offlinePage = await cache.match('offline.html');
              if (offlinePage) return offlinePage;
          }
          // For other assets, we can't do much if they aren't cached
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
