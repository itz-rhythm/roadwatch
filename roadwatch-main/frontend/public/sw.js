const CACHE_NAME = 'roadwatch-v1';
const DYNAMIC_CACHE = 'roadwatch-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Intercept network requests
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) return response;

      // Otherwise fetch from network and cache dynamically
      return fetch(event.request).then((networkResponse) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          // Don't cache API endpoints if we only want to cache UI/Maps
          if (!event.request.url.includes('/api/')) {
            cache.put(event.request.url, networkResponse.clone());
          }
          return networkResponse;
        });
      }).catch(() => {
        // Fallback logic here if needed
      });
    })
  );
});

// Background Sync for Offline Submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-complaints') {
    event.waitUntil(syncComplaints());
  }
});

async function syncComplaints() {
  // MOCK: In reality, read from IndexedDB, iterate, and POST to /api/complaints
  console.log('Background Sync: Syncing offline complaints...');
  // const db = await openIndexedDB();
  // const queued = await db.getAll('outbox');
  // for (let complaint of queued) {
  //    await fetch('/api/complaints', { method: 'POST', body: JSON.stringify(complaint) });
  //    await db.delete('outbox', complaint.id);
  // }
}
