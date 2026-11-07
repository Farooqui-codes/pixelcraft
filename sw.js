/**
 * PixelCraft Service Worker
 * Pre-caches application shell, static assets, and offline fallback.
 * Strictly avoids caching private user authentication, billing, or sensitive data.
 */

const CACHE_NAME = 'pixelcraft-cache-v1';
const STATIC_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/css/style.css',
  '/assets/css/animations.css',
  '/assets/js/theme.js',
  '/assets/js/i18n.js',
  '/assets/js/api.js',
  '/assets/js/auth.js',
  '/assets/js/ux-patterns.js',
  '/assets/js/main.js',
  '/assets/logos/logo.svg',
  '/assets/logos/app-icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // NEVER cache API requests or sensitive auth/billing data
  if (requestUrl.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first with cache fallback for navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/offline.html');
        });
      })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Return empty or fallback
      });
    })
  );
});

