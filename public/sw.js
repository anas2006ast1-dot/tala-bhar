/* ============================================================
   طلة بحر — Service Worker
   Strategy:
   - App shell + static assets  -> Cache-First (stale-while-revalidate)
   - Supabase API (REST/Realtime) -> Network-First, fallback to cache
   - Navigation requests         -> Network-First, fallback to cached index (offline SPA)
   - Background sync 'menu-sync' -> clients get notified to refresh
   ============================================================ */

const CACHE_NAME = 'talat-bahr-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/menu',
  '/manifest.json',
  '/logo.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// assets that should be cached but may have hashed names (built by Vite)
const PRECACHE_HINTS = ['/assets/'];

// ---------- INSTALL: precache app shell ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // cache shell entries (ignore individual failures — some only exist post-build)
      await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
      self.skipWaiting();
    })()
  );
});

// ---------- ACTIVATE: cleanup old caches ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ---------- HELPERS ----------
function isSupabaseRequest(url) {
  return (
    url.hostname.endsWith('.supabase.co') ||
    url.hostname.endsWith('.supabase.in')
  );
}

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))
  );
}

// Network-First for API: try network, cache response, fallback to cache.
async function networkFirst(event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(event.request);
    // only cache successful GETs (Realtime/POST/etc. must not be cached)
    if (event.request.method === 'GET' && fresh && fresh.ok) {
      cache.put(event.request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    throw err;
  }
}

// Stale-While-Revalidate for static assets.
async function staleWhileRevalidate(event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(event.request);
  const network = fetch(event.request)
    .then((res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        cache.put(event.request, res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

// Navigation: Network-First with cached index fallback (SPA offline).
async function handleNavigation(event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(event.request);
    return fresh;
  } catch (err) {
    const cachedIndex =
      (await cache.match(event.request)) ||
      (await cache.match('/index.html')) ||
      (await cache.match('/'));
    if (cachedIndex) return cachedIndex;
    throw err;
  }
}

// ---------- FETCH ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') {
    // let non-GET through (Supabase writes, Realtime websockets)
    return;
  }
  const url = new URL(req.url);

  // Supabase API -> network-first
  if (isSupabaseRequest(url)) {
    event.respondWith(networkFirst(event));
    return;
  }

  // Google Fonts -> SWR (cache them offline)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  // Same-origin static assets -> SWR
  if (url.origin === self.location.origin) {
    if (isNavigationRequest(req)) {
      event.respondWith(handleNavigation(event));
      return;
    }
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  // everything else: try network, fallback to cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req).then((r) => r || Response.error()))
  );
});

// ---------- MESSAGE: allow page to force cache refresh ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// ---------- BACKGROUND SYNC ----------
self.addEventListener('sync', (event) => {
  if (event.tag === 'menu-sync') {
    event.waitUntil(notifyClientsToRefresh());
  }
});

async function notifyClientsToRefresh() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach((c) => c.postMessage({ type: 'MENU_UPDATED' }));
}
