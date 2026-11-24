/* ============================================================
   طلة بحر — Service Worker
   Strategy:
   - App shell + static assets   -> Stale-While-Revalidate
   - Public menu photos          -> Cache-First (unique immutable paths)
   - Supabase data/auth          -> Network only; IndexedDB is the offline fallback
   - Navigation requests         -> Network-First, fallback to cached index (offline SPA)
   - Background sync 'menu-sync' -> clients get notified to refresh
   ============================================================ */

const CACHE_PREFIX = 'talat-bahr-';
const CACHE_NAME = 'talat-bahr-v3-shell';
const MENU_IMAGE_CACHE = 'talat-bahr-menu-images-v1';
const CONFIG_CACHE = 'talat-bahr-config-v1';
const CONFIG_REQUEST = '/__talat-bahr-config/menu-image-origins';
let configuredMenuImageOrigins = new Set();
const APP_SHELL = [
  '/',
  '/index.html',
  '/menu',
  '/manifest.json',
  '/logo.jpg',
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

// ---------- ACTIVATE: migrate menu images and clean only our old caches ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const imageCache = await caches.open(MENU_IMAGE_CACHE);
      await loadConfiguredMenuImageOrigins();

      for (const key of keys) {
        if (!key.startsWith(CACHE_PREFIX) || key === CACHE_NAME || key === MENU_IMAGE_CACHE || key === CONFIG_CACHE) continue;

        // The previous worker cached Supabase images in its general cache. Move
        // those entries before removing that cache so an upgrade doesn't force
        // visitors to download the same menu photos again.
        try {
          const oldCache = await caches.open(key);
          for (const request of await oldCache.keys()) {
            if (!isPublicMenuImage(new URL(request.url))) continue;
            if (!(await imageCache.match(request))) {
              const response = await oldCache.match(request);
              if (response) await imageCache.put(request, response);
            }
          }
          await caches.delete(key);
        } catch {
          // Keep an old cache if migration failed; retry on the next activation.
        }
      }
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

function isPublicMenuImage(url) {
  return (
    isSupabaseRequest(url) &&
    /^\/storage\/v1\/object\/public\/menu-images\/.+/i.test(url.pathname)
  );
}

function isConfiguredR2MenuImage(url) {
  return configuredMenuImageOrigins.has(url.origin) && /^\/items\/.+\.(?:avif|jpe?g|png|webp)$/i.test(url.pathname);
}

async function loadConfiguredMenuImageOrigins() {
  try {
    const cache = await caches.open(CONFIG_CACHE);
    const response = await cache.match(CONFIG_REQUEST);
    configuredMenuImageOrigins = new Set(response ? await response.json() : []);
  } catch {
    configuredMenuImageOrigins = new Set();
  }
}

async function cacheFirstPublicMenuImage(request) {
  const cache = await caches.open(MENU_IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  // A normal cross-origin <img> request is no-cors and returns an opaque
  // response. Its HTTP status and headers are hidden, so caching it could
  // persist a 404 or an authenticated/private response. For our explicitly
  // configured public R2 image origin, retry as credential-free CORS instead;
  // the Worker (or R2 CORS policy) must allow the menu origin. This gives us a
  // readable status while preserving the original <img> request and fallback.
  const useReadableR2Request = request.mode === 'no-cors' && isConfiguredR2MenuImage(new URL(request.url));
  const cacheRequest = useReadableR2Request
    ? new Request(request, { mode: 'cors', credentials: 'omit' })
    : request;

  let response;
  try {
    response = await fetch(cacheRequest);
  } catch (error) {
    // A custom R2 domain may not have CORS configured yet. Keep the image
    // usable through the browser's original no-cors path, but don't cache it.
    if (!useReadableR2Request) throw error;
    return fetch(request);
  }

  // Opaque responses are deliberately never cached: response.status is 0 and
  // gives no way to distinguish a valid public image from a 404 or private data.
  if (response.ok && response.type !== 'opaque') {
    await cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))
  );
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

  // Only public menu photos are cached. Database and auth requests stay
  // network-only; the app's IndexedDB snapshot is the offline data fallback.
  if (isSupabaseRequest(url)) {
    if (isPublicMenuImage(url)) {
      event.respondWith(cacheFirstPublicMenuImage(req));
    }
    return;
  }

  if (isConfiguredR2MenuImage(url)) {
    event.respondWith(cacheFirstPublicMenuImage(req));
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

  // Leave other origins to the browser's normal network handling. The only
  // cross-origin Cache-First exception is the public menu-images bucket above.
});

// ---------- MESSAGE: allow page to force cache refresh ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CONFIGURE_MENU_IMAGE_ORIGINS') {
    event.waitUntil(storeConfiguredMenuImageOrigins(event.data.origins));
  }
});

async function storeConfiguredMenuImageOrigins(origins) {
  const validOrigins = [...new Set((Array.isArray(origins) ? origins : []).filter((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && value === url.origin;
    } catch {
      return false;
    }
  }))];
  configuredMenuImageOrigins = new Set(validOrigins);
  const cache = await caches.open(CONFIG_CACHE);
  await cache.put(CONFIG_REQUEST, new Response(JSON.stringify(validOrigins), {
    headers: { 'Content-Type': 'application/json' },
  }));
}

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
