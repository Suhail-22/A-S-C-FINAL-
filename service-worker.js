const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/offline.html' // هذا الملف ضروري!
  // أضف هنا جميع ملفاتك الأساسية الأخرى
];

// حدث التثبيت: تخزين الملفات الأساسية مسبقاً
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// حدث الجلب: اعتراض الطلبات والرد من ذاكرة التخزين المؤقت
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // الرد من ذاكرة التخزين المؤقت إن وجد
        if (response) {
          return response;
        }
        // وإلا، حاول جلبها من الشبكة
        return fetch(event.request).catch(() => {
          // إذا فشل الجلب من الشبكة (أنت غير متصل)، ارجع صفحة عدم الاتصال
          return caches.match('/offline.html');
        });
      })
  );
});

// حدث التفعيل: تنظيف ذاكرة التخزين المؤقت القديمة
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
