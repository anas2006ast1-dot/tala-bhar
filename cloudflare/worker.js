const MENU_KEY = 'menu/snapshot.json'
const MENU_CACHE_SECONDS = 15
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const encoder = new TextEncoder()
const decoder = new TextDecoder()

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || ''
    const cors = corsHeaders(origin, env)
    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(origin, env)) return new Response(null, { status: 403 })
      return new Response(null, { status: 204, headers: cors })
    }
    if (origin && !isAllowedOrigin(origin, env)) return json({ error: 'Origin is not allowed.' }, 403)

    if (url.pathname === '/menu' && request.method === 'GET') {
      return getMenuSnapshot(request, env, ctx, cors)
    }
    if (/^\/items\/[0-9a-f-]+\.(?:avif|jpe?g|png|webp)$/i.test(url.pathname) &&
        (request.method === 'GET' || request.method === 'HEAD')) {
      return serveR2Image(request, env)
    }
    if (url.pathname === '/admin/session') {
      if (request.method === 'GET') {
        const valid = await verifyAdminRequest(request, env)
        return json({ valid }, valid ? 200 : 401, cors)
      }
    }
    if (request.method === 'POST' && url.pathname === '/admin/images') {
      if (!(await verifyAdminRequest(request, env))) return json({ error: 'Administrator session required.' }, 401, cors)
      return uploadImage(request, env, cors)
    }
    if (request.method === 'POST' && url.pathname === '/admin/menu-cache') {
      if (!(await verifyAdminRequest(request, env))) return json({ error: 'Administrator session required.' }, 401, cors)
      return storeMenuSnapshot(request, env, ctx, cors)
    }
    return json({ error: 'Not found.' }, 404, cors)
  },
}

async function uploadImage(request, env, cors) {
  if (!env.MENU_IMAGES || !env.PUBLIC_IMAGE_BASE_URL) {
    return json({ error: 'R2 image service is not configured.' }, 503, cors)
  }
  const contentType = normalizeImageType(request.headers.get('Content-Type') || '')
  const declaredSize = Number(request.headers.get('Content-Length') || 0)
  if (!contentType || declaredSize > MAX_IMAGE_BYTES) {
    return json({ error: 'Only JPEG, PNG, or WebP images up to 20 MB are accepted.' }, 415, cors)
  }

  if (!env.UPLOAD_LIMITER) return json({ error: 'Upload protection is not configured.' }, 503, cors)
  const rate = await env.UPLOAD_LIMITER.limit({ key: await tokenFingerprint(request) })
  if (rate && !rate.success) return json({ error: 'Upload limit reached. Try again shortly.' }, 429, cors)
  const bytes = await readBodyUpTo(request, MAX_IMAGE_BYTES)
  if (!bytes?.byteLength || !matchesImageType(bytes, contentType)) {
    return json({ error: 'The image is empty, too large, or its content does not match its type.' }, 400, cors)
  }

  const extension = contentType === 'image/jpeg' ? 'jpg' : contentType.slice('image/'.length)
  const key = `items/${crypto.randomUUID()}.${extension}`
  await env.MENU_IMAGES.put(key, bytes, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  })
  const publicBase = env.PUBLIC_IMAGE_BASE_URL.replace(/\/$/, '')
  return json({ publicUrl: `${publicBase}/${key}` }, 201, cors)
}

async function serveR2Image(request, env) {
  if (!env.MENU_IMAGES) return json({ error: 'R2 image service is not configured.' }, 503)
  const key = new URL(request.url).pathname.slice(1)
  const object = request.method === 'HEAD'
    ? await env.MENU_IMAGES.head(key)
    : await env.MENU_IMAGES.get(key)
  if (!object) return new Response('Not found.', { status: 404, headers: { 'Cache-Control': 'no-store' } })

  const headers = new Headers({
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    'Cache-Control': object.httpMetadata?.cacheControl || 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  })
  if (object.httpEtag) headers.set('ETag', object.httpEtag)
  if (Number.isFinite(object.size)) headers.set('Content-Length', String(object.size))
  return new Response(request.method === 'HEAD' ? null : object.body, { headers })
}

async function storeMenuSnapshot(request, env, ctx, cors) {
  if (Number(request.headers.get('Content-Length') || 0) > 2 * 1024 * 1024) {
    return json({ error: 'Menu snapshot is too large.' }, 413, cors)
  }
  const snapshotBytes = await readBodyUpTo(request, 2 * 1024 * 1024)
  if (!snapshotBytes) return json({ error: 'Menu snapshot is invalid or too large.' }, 413, cors)
  let snapshot
  try { snapshot = JSON.parse(decoder.decode(snapshotBytes)) } catch { return json({ error: 'Invalid menu snapshot.' }, 400, cors) }
  if (!isMenuSnapshot(snapshot) || !env.MENU_IMAGES) {
    return json({ error: 'Menu snapshot is invalid or R2 is not configured.' }, 400, cors)
  }
  const stored = { ...snapshot, version: 1, updatedAt: new Date().toISOString() }
  await env.MENU_IMAGES.put(MENU_KEY, JSON.stringify(stored), {
    httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' },
  })
  await purgeMenuCache(request, env)
  return json({ updatedAt: stored.updatedAt }, 200, cors)
}

async function getMenuSnapshot(request, env, ctx, cors) {
  if (!env.MENU_IMAGES) return json({ error: 'Menu cache is not configured.' }, 503, cors)
  const cache = globalThis.caches?.default
  const cacheKey = makeMenuCacheKey(request, request.headers.get('Origin') || '')
  const cached = await cache?.match(cacheKey)
  if (cached) return withHeaders(cached, cors)

  let object = await env.MENU_IMAGES.get(MENU_KEY)
  if (!object && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      const snapshot = await fetchSupabaseSnapshot(env)
      await env.MENU_IMAGES.put(MENU_KEY, JSON.stringify({ ...snapshot, version: 1, updatedAt: new Date().toISOString() }), {
        httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' },
      })
      object = await env.MENU_IMAGES.get(MENU_KEY)
    } catch {
      return json({ error: 'Menu is not seeded yet and Supabase is unavailable.' }, 503, cors)
    }
  }
  if (!object) return json({ error: 'Menu cache has not been seeded.' }, 503, cors)

  const headers = new Headers(cors)
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/json; charset=utf-8')
  headers.set('Cache-Control', `public, max-age=0, s-maxage=${MENU_CACHE_SECONDS}`)
  headers.set('X-Menu-Source', 'r2')
  const response = new Response(object.body, { headers })
  if (cache) ctx.waitUntil(cache.put(cacheKey, response.clone()))
  return response
}

async function fetchSupabaseSnapshot(env) {
  const base = env.SUPABASE_URL.replace(/\/$/, '')
  const headers = { apikey: env.SUPABASE_ANON_KEY }
  const requests = [
    fetch(`${base}/rest/v1/categories?select=*&order=sort_order.asc`, { headers }),
    fetch(`${base}/rest/v1/menu_items?select=*&order=sort_order.asc`, { headers }),
    fetch(`${base}/rest/v1/settings?select=*&limit=1`, { headers }),
  ]
  const [categories, items, settings] = await Promise.all(requests)
  if (![categories, items, settings].every((response) => response.ok)) throw new Error('Supabase snapshot request failed.')
  return {
    categories: await categories.json(),
    items: await items.json(),
    settings: (await settings.json())[0] || null,
  }
}

async function purgeMenuCache(request, env) {
  const cache = globalThis.caches?.default
  if (!cache) return
  const requestOrigin = new URL(request.url).origin
  const origins = (env.APP_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean)
  await Promise.all(origins.map((origin) => cache.delete(makeMenuCacheKey(request, origin))))
  await cache.delete(makeMenuCacheKey(new Request(`${requestOrigin}/menu`), ''))
}

function makeMenuCacheKey(request, origin) {
  const key = new URL('/__edge-cache/menu', new URL(request.url).origin)
  if (origin) key.searchParams.set('origin', origin)
  return new Request(key.toString())
}

async function verifyAdminRequest(request, env) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return false
  try {
    const authFetch = env.AUTH_FETCH || fetch
    const response = await authFetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })
    if (!response.ok) return false
    const user = await response.json()
    return user?.app_metadata?.role === 'admin'
  } catch {
    return false
  }
}

async function tokenFingerprint(request) {
  const token = request.headers.get('Authorization') || ''
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function normalizeImageType(type) {
  return ['image/webp', 'image/jpeg', 'image/png'].includes(type.toLowerCase()) ? type.toLowerCase() : ''
}

function matchesImageType(buffer, type) {
  const bytes = new Uint8Array(buffer)
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
  if (type === 'image/webp') return ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP'
  return false
}

async function readBodyUpTo(request, maximum) {
  if (!request.body) return null
  const reader = request.body.getReader()
  const chunks = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maximum) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const output = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }
  return output.buffer
}

function ascii(bytes, start, end) {
  return String.fromCharCode(...bytes.slice(start, end))
}

function isMenuSnapshot(snapshot) {
  return snapshot && Array.isArray(snapshot.categories) && Array.isArray(snapshot.items) &&
    (snapshot.settings === null || typeof snapshot.settings === 'object') &&
    snapshot.categories.length <= 100 && snapshot.items.length <= 2000
}

function isAllowedOrigin(origin, env) {
  return (env.APP_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean).includes(origin)
}

function corsHeaders(origin, env) {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '3600',
    'Vary': 'Origin',
  })
  if (isAllowedOrigin(origin, env)) headers.set('Access-Control-Allow-Origin', origin)
  return headers
}

function withHeaders(response, headers) {
  const result = new Headers(response.headers)
  for (const [name, value] of headers.entries()) result.set(name, value)
  return new Response(response.body, { status: response.status, headers: result })
}

function json(body, status = 200, headers = new Headers()) {
  const result = new Headers(headers)
  result.set('Content-Type', 'application/json; charset=utf-8')
  result.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(body), { status, headers: result })
}
