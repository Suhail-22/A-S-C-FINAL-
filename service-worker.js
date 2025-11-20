
const CACHE_NAME = 'abo-suhail-calc-v32-dynamic';

// الملفات الأساسية التي يجب توفرها فوراً (App Shell)
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './offline.html',
  './assets/icon.svg'
];

// عند التثبيت: احفظ الهيكل الأساسي فقط
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
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
  const url = new URL(req.url);

  // 1. تصفح الصفحات (Navigation) -> دائماً ارجع index.html
  // هذا يحل مشكلة "التطبيق لا يعمل من الأيقونة" ويضمن تحميل التطبيق PWA
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => {
        // ارجع النسخة المخبأة من الصفحة الرئيسية، أو حاول جلبها من النت، أو اعرض صفحة الأوفلاين
        return cached || fetch(req).catch(() => caches.match('./offline.html'));
      })
    );
    return;
  }

  // 2. باقي الملفات (صور، سكربتات، خطوط) -> استراتيجية Cache First with Dynamic Caching
  // ابحث في الكاش أولاً، إذا لم تجد، احمل من النت واحفظ نسخة للمستقبل
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        // تأكد من أن الاستجابة صالحة قبل تخزينها
        // (نسمح بتخزين opaque responses للمصادر الخارجية مثل الخطوط)
        if (!networkResponse || networkResponse.status !== 200 && networkResponse.type !== 'opaque') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try {
             // استخدام put لتخزين الملف ديناميكياً
             cache.put(req, responseToCache);
          } catch (err) {
            // تجاهل أخطاء التخزين (مثل quotas)
          }
        });

        return networkResponse;
      }).catch(() => {
        // في حال فشل الشبكة وعدم وجود الملف في الكاش، لا نفعل شيئاً (ستظهر أيقونة صورة مكسورة مثلاً)
        // لكن التطبيق نفسه سيبقى يعمل
      });
    })
  );
});
