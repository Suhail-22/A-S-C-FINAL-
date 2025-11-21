
const CACHE_NAME = 'abo-suhail-calc-v75-robust';

// Files that MUST exist for the app to start (Local files)
const CRITICAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './offline.html',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.ts',
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
  './hooks/useCalculator.tsx',
  './hooks/useLocalStorage.tsx',
  './services/calculationEngine.ts',
  './services/localErrorFixer.ts'
];

// External libraries that make the app look good and work
// We will attempt to cache these aggressively
const EXTERNAL_ASSETS = [
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
      console.log('[SW] Installing...');

      // 1. Cache Critical Assets (Must succeed)
      await cache.addAll(CRITICAL_ASSETS);

      // 2. Cache External Assets (Best Effort)
      // We fetch them manually to handle opaque responses or CORS issues gracefully
      const externalPromises = EXTERNAL_ASSETS.map(async (url) => {
        try {
          // Try fetching with CORS first (best for scripts)
          let response = await fetch(url, { mode: 'cors' });
          if (!response.ok) throw new Error('Status: ' + response.status);
          await cache.put(url, response);
        } catch (e) {
            console.warn('[SW] CORS fetch failed, trying no-cors for:', url);
            try {
                // Fallback for fonts/images
                let ncResponse = await fetch(url, { mode: 'no-cors' });
                await cache.put(url, ncResponse);
            } catch (err2) {
                console.error('[SW] Failed to cache external asset:', url);
            }
        }
      });

      await Promise.all(externalPromises);
      console.log('[SW] Install Complete.');
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
  // Handle navigation requests to serve index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((response) => {
        return response || fetch(event.request).catch(() => caches.match('./offline.html'));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
         // Cache valid GET requests dynamically
         if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });
         }
         return networkResponse;
      });
    })
  );
});
