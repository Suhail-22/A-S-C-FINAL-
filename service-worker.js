
const CACHE_NAME = 'ai-calculator-offline-v21';

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
      // We use Promise.allSettled to ensure one failed CDN doesn't break the whole install
      // But for key assets, we really want them.
      return cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn("[Service Worker] Some assets failed to cache, but continuing:", err);
      });
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

  const url = new URL(event.request.url);

  // 1. NAVIGATION REQUESTS (HTML): Always try to serve the App Shell (index.html) from cache first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        // Fallback: Try index.html without ./ or /
        return caches.match('index.html').then(res => {
             if (res) return res;
             return fetch(event.request).catch(() => caches.match('offline.html'));
        });
      })
    );
    return;
  }

  // 2. EXTERNAL ASSETS (CDNs): Cache First, Revalidate in background (Stale-While-Revalidate-ish)
  // or simple Cache First if immutable.
  if (url.origin !== self.location.origin) {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then(res => {
                // Cache valid responses
                if (res && res.status === 200) {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
                }
                return res;
            }).catch(() => {
                // If offline and not in cache, nothing we can do for external scripts
                return new Response('', { status: 408, statusText: 'Request Timeout' }); 
            });
        })
      );
      return;
  }

  // 3. LOCAL ASSETS: Cache First, then Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
             const resClone = networkResponse.clone();
             caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          }
          return networkResponse;
      }).catch((err) => {
          console.error("[Service Worker] Fetch failed:", err);
          // Optional: return a placeholder image if it was an image request
          throw err;
      });
    })
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
