/* ==========================================================================
   Dynamic Island Studio - Service Worker (Offline-First Engine)
   ========================================================================== */

const CACHE_NAME = 'dynamic-island-v1';

// قائمة الملفات الأساسية المطلوبة للتشغيل الكامل بدون إنترنت
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. مرحلة التثبيت: حفظ الملفات في الكاش وتخطي الانتظار
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // استخدام Promise.allSettled أو التخزين الفردي لضمان عدم توقف التثبيت في حال غياب الأيقونات مؤقتاً
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Some assets failed to precache (like missing icons):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. مرحلة التفعيل: السيطرة الفورية على الصفحات ومسح الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. مرحلة جلب البيانات (استراتيجية Cache-First مع الرجوع للشبكة)
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير المدعومة مثل chrome-extension أو طلبات غير GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إذا كان الملف مخزناً مسبقاً، نقوم بإرجاعه فوراً لتسريع التطبيق
      if (cachedResponse) {
        return cachedResponse;
      }

      // إذا لم يكن مخزناً، يتم جلبه من الشبكة وحفظه للاستخدام المستقبلي
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // في حال انقطاع النت وعدم وجود الملف، يتم إرجاع الصفحة الرئيسية إذا كان الطلب تنقلاً
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
