/**
 * ============================================================================
 * WEIGHT TRACKER - SERVICE WORKER (sw.js)
 * ============================================================================
 * Enables offline capability and native installability for Android & mobile.
 * 
 * Concepts:
 * 1. Cache API - stores static files locally on the user's device
 * 2. Service Worker Lifecycle (install -> activate -> fetch)
 * 3. Offline First Strategy (Cache with Network fallback)
 * ============================================================================
 */

const CACHE_NAME = 'weight-tracker-v9';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './weights.json',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

/**
 * 1. Install Event:
 * Caches all essential application files so the app works offline.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

/**
 * 2. Activate Event:
 * Cleans up outdated caches when a new version of the app is deployed.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * 3. Fetch Event:
 * Intercepts network requests and serves from cache if offline or available.
 * Strategy: Cache First, falling back to Network.
 */
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version immediately for speed
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Check if response is valid
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Clone response because it can only be consumed once
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // If both cache and network fail (offline and not cached)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
