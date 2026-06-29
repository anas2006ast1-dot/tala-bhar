/**
 * sync.js — Offline/online sync layer for طلة بحر.
 *
 * - Persists a full menu snapshot to IndexedDB on every successful fetch.
 * - Restores from IndexedDB when offline / on a failed fetch.
 * - Listens to online/offline events and Supabase Realtime to trigger refreshes.
 * - Exposes a tiny event-based API: subscribe(listener) -> { data, offline }.
 *
 * This is intentionally framework-agnostic; the React hook (useMenuData) consumes it.
 */

const DB_NAME = 'talat-bahr';
const STORE = 'kv';
const SNAPSHOT_KEY = 'menu_snapshot';

// ---------- tiny IndexedDB key-value wrapper ----------
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key, value) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* storage unavailable — degrade gracefully */
  }
}

export async function saveSnapshot(data) {
  const payload = { data, savedAt: Date.now() };
  await idbSet(SNAPSHOT_KEY, payload);
  return payload;
}

export async function loadSnapshot() {
  return idbGet(SNAPSHOT_KEY);
}

// ---------- online/offline helpers ----------
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Register a background sync with the service worker (no-op if unsupported).
 */
export async function registerBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.sync?.register) {
      await reg.sync.register('menu-sync');
    }
  } catch {
    /* background sync not supported — realtime + online event still work */
  }
}

/**
 * Subscribe to online/offline events.
 * Returns an unsubscribe function.
 */
export function onConnectivityChange({ onOnline, onOffline } = {}) {
  const handleOnline = () => onOnline?.();
  const handleOffline = () => onOffline?.();
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Subscribe to "menu updated" messages from the service worker
 * (background-sync completion). Returns an unsubscribe function.
 */
export function onMenuUpdated(callback) {
  const handler = (event) => {
    if (event.data?.type === 'MENU_UPDATED') callback?.();
  };
  navigator.serviceWorker?.addEventListener?.('message', handler);
  return () => navigator.serviceWorker?.removeEventListener?.('message', handler);
}
