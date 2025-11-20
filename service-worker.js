
const CACHE_NAME = 'abo-suhail-calc-v37-production';

// الملفات الثابتة فقط التي نضمن وجودها دائماً
// ملاحظة: لا نضع ملفات .tsx أو .ts هنا لأنها تختفي بعد عملية البناء (Build)
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './assets/icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // تفعيل التحديث فوراً
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // محاولة حفظ الملفات الأساسية
      return cache.addAll(CORE_ASSETS);
    })
  );
});

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

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. طلبات التنقل (فتح الصفحة الرئيسية)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .catch(() => {
          // إذا فشل النت، ابحث في الكاش عن الصفحة الرئيسية
          return caches.match('./index.html');
        })
        .then((response) => {
          // إذا لم توجد الصفحة في الكاش أيضاً (نادر جداً)، اعرض صفحة الأوفلاين
          return response || caches.match('./offline.html');
        })
    );
    return;
  }

  // 2. طلبات الملفات (JS, CSS, Images, Fonts)
  // استراتيجية: Stale-While-Revalidate معدلة
  // (حاول تجيب من الكاش، وفي نفس الوقت حدث من النت للمرة الجاية، لو مفيش نت استخدم الكاش)
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      // إذا الملف موجود في الكاش، رجعه فوراً (سرعة قصوى)
      if (cachedResponse) {
        // لكن في الخلفية، حاول تحدثه من النت
        fetch(req).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(req, responseToCache);
                });
            }
        }).catch(() => {}); // لو مفيش نت، مش مشكلة، عندنا النسخة القديمة
        
        return cachedResponse;
      }

      // إذا الملف مش في الكاش، هاته من النت واحفظه
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
         // فشل تام (لا كاش ولا نت) للصورة أو الملف
         // يمكن إرجاع صورة بديلة هنا إذا أردت
      });
    })
  );
});
