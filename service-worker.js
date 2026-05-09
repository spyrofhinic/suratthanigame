const CACHE_NAME = 'suratgames-v1';

// ไฟล์ที่ cache ไว้ใช้งาน offline
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './favicon.ico',
  './images/SuratEsportClub.jpg',
  './images/logo/SuratthaniEsport_Logo_New.png'
];

// ===== Install: cache ไฟล์หลักทั้งหมด =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      // cache ทีละไฟล์ ไม่ให้พัง ถ้าไฟล์ไหนหาไม่เจอ
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Skip:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ===== Activate: ลบ cache เก่า =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ===== Fetch: Network First สำหรับ HTML, Cache First สำหรับ assets =====
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ข้าม request ที่ไม่ใช่ http/https
  if (!url.protocol.startsWith('http')) return;

  // HTML → Network First (ให้ได้ข้อมูลล่าสุดเสมอ ถ้า offline ใช้ cache)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Assets (CSS, JS, รูปภาพ) → Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // cache เฉพาะ response ที่ ok
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // รูปภาพ offline → คืน placeholder SVG
        if (event.request.destination === 'image') {
          return new Response(
            `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
              <rect width="200" height="150" fill="#f0f0f0"/>
              <text x="100" y="80" text-anchor="middle" fill="#999" font-size="14">ไม่มีการเชื่อมต่อ</text>
            </svg>`,
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      });
    })
  );
});

// ===== Message: force update จาก UI =====
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
