/**
 * Service Worker for Nexus Impact AI PWA
 * Caches complete app shell assets, fonts, icons, and dynamic bundles
 * enabling robust offline field operations.
 */
const CACHE_NAME = 'nexus-impact-shell-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(STATIC_ASSETS);
      } catch (err) {
        console.warn('[SW] Pre-caching asset list issue:', err);
      }
    })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass API and MCP routes - handled by client router & IndexedDB queue
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/mcp')) {
    return;
  }

  // 2. Bypass Vite dev server modules, preview hosts, and auth URLs so preview never breaks
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('vite') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.searchParams.has('auth_token') ||
    url.searchParams.has('authToken') ||
    url.searchParams.has('token') ||
    url.searchParams.has('authuser') ||
    url.searchParams.has('t') ||
    url.hostname.includes('googleusercontent') ||
    url.hostname.includes('aistudio') ||
    url.hostname.includes('localhost') ||
    url.hostname === '127.0.0.1'
  ) {
    return;
  }

  // 3. Only intercept GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // 4. For page navigation (HTML documents), use Network-First to guarantee fresh code
  // and fall back to cached index.html offline (ignoring query strings/tokens)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html', { ignoreSearch: true });
          if (cached) return cached;
          return caches.match('/', { ignoreSearch: true });
        })
    );
    return;
  }

  // 5. For static assets (CSS, JS, images, icons, fonts), Stale-While-Revalidate with ignoreSearch
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.origin === self.location.origin || url.hostname.includes('gstatic.com') || url.hostname.includes('googleapis.com'))
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
