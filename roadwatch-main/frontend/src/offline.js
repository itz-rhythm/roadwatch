import { openDB } from 'idb';

const DB_NAME = 'roadwatch-offline-db';
const STORE_NAME = 'complaint-outbox';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function queueComplaintForSync(complaintData) {
  const db = await initDB();
  await db.add(STORE_NAME, {
    ...complaintData,
    timestamp: Date.now()
  });

  // Register background sync if supported
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const swRegistration = await navigator.serviceWorker.ready;
    swRegistration.sync.register('sync-complaints');
  }
}

export async function getQueuedComplaintsCount() {
  const db = await initDB();
  return db.count(STORE_NAME);
}

// Service Worker Registration
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('SW registered: ', registration);
      }).catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
    });
  }
}
