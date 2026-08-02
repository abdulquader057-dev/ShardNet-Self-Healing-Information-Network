const CACHE_NAME = 'sharednet-map-cache-v1';
const MAP_TILE_URL = 'basemaps.cartocdn.com';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Cache Map Tiles aggressively (Stale-While-Revalidate or Cache-First)
  if (url.hostname.includes(MAP_TILE_URL)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache, but optionally update in background
          fetch(event.request).then(networkResponse => {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse);
            });
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(err => {
          console.warn('Map tile fetch failed and not in cache', err);
          // Return a transparent 1x1 pixel or fallback tile if needed
          return new Response(
            new Blob(['R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'], { type: 'image/gif' })
          );
        });
      })
    );
  } else {
    // For other requests, just do network normally
    event.respondWith(fetch(event.request).catch(() => {}));
  }
});
