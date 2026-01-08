/**
 * Service Worker for SkiWithCare PWA
 * Caches essential data for offline access at ski resorts
 */

const CACHE_NAME = 'skiwithcare-v1';
const STATIC_CACHE = 'skiwithcare-static-v1';
const DATA_CACHE = 'skiwithcare-data-v1';

// Essential static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo-192.png',
  '/logo-512.png',
];

// Data files to cache for offline access
const DATA_ASSETS = [
  '/resorts.json',
  '/urgent_care.json',
  '/clinics.json',
  '/hospitals.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DATA_CACHE).then((cache) => {
        console.log('[SW] Caching data assets');
        return cache.addAll(DATA_ASSETS);
      }),
    ]).then(() => {
      console.log('[SW] All assets cached');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== STATIC_CACHE && name !== DATA_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle data files - cache first, then network
  if (DATA_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Network failed, return cached if available
            return cachedResponse;
          });

          // Return cached immediately if available, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Handle static assets - cache first
  if (request.destination === 'document' || 
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          // Only cache successful responses
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Default - network first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background sync for report submissions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    console.log('[SW] Syncing reports');
    // TODO: Implement report sync when backend is ready
  }
});
