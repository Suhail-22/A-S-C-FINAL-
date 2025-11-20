
const CACHE_NAME = 'abo-suhail-calc-v35-full';

// القائمة الكاملة للملفات التي يجب تحميلها فوراً ليعمل التطبيق دون إنترنت
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './assets/icon.svg',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.ts',
  './hooks/useCalculator.tsx',
  './hooks/useLocalStorage.tsx',
  './services/calculationEngine.ts',
  './services/localErrorFixer.ts',
  './components/Calculator.tsx',
  './components/Header.tsx',
  './components/Display.tsx',
  './components/ButtonGrid.tsx',
  './components/Button.tsx',
  './components/Icon.tsx',
  './components/HistoryPanel.tsx',
  './components/SettingsPanel.tsx',
  './components/SupportPanel.tsx',
  './components/AboutPanel.tsx',
  './components/Overlay.tsx',
  './components/Notification.tsx',
  './components/ConfirmationDialog.tsx'
];

// عند التثبيت: احفظ كل الملفات الأساسية
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // نستخدم addAll لتحميل كل الملفات دفعة واحدة
      return cache.addAll(CORE_ASSETS).catch(err => {
         console.error('Failed to cache core assets:', err);
      });
    })
  );
});

// عند التفعيل: تنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية التعامل مع الشبكة
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1. تصفح الصفحات (Navigation) -> دائماً ارجع index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => {
        return cached || fetch(req).catch(() => caches.match('./offline.html'));
      })
    );
    return;
  }

  // 2. باقي الملفات -> Cache First
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 && networkResponse.type !== 'opaque') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
            try {
                cache.put(req, responseToCache);
            } catch (e) {}
        });
        return networkResponse;
      }).catch(() => {
        // إذا فشل النت ولم يكن الملف في الكاش (حالة نادرة جداً مع الـ Pre-caching)
        // يمكن ارجاع صورة بديلة أو ملف فارغ حسب الحاجة
      });
    })
  );
});
