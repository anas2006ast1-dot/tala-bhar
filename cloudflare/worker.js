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
    if (url.pathname === '/admin/session') {
      if (request.method === 'POST') return createSession(request, env, cors)
      if (request.method === 'GET') {
        const valid = await verifyRequest(request, env)
        return json({ valid }, valid ? 200 : 401, cors)
      }
    }
    if (request.method === 'POST' && url.pathname === '/admin/images') {
      if (!(await verifyRequest(request, env))) return json({ error: 'Unauthorized.' }, 401, cors)
      return uploadImage(request, env, cors)
    }
    if (request.method === 'POST' && url.pathname === '/admin/menu-cache') {
      if (!(await verifyRequest(request, env))) return json({ error: 'Unauthorized.' }, 401, cors)
      return storeMenuSnapshot(request, env, ctx, cors)
    }
    return json({ error: 'Not found.' }, 404, cors)
  },
}

async function createSession(request, env, cors) {
  if (!env.LOGIN_LIMITER) return json({ error: 'Login protection is not configured.' }, 503, cors)
  const rate = await env.LOGIN_LIMITER.limit({
    key: request.headers.get('CF-Connecting-IP') || 'unknown',
  })
  if (rate && !rate.success) return json({ error: 'Too many login attempts. Try again shortly.' }, 429, cors)
  const bodyBytes = await readBodyUpTo(request, 1024)
  if (!bodyBytes) return json({ error: 'Invalid request.' }, 400, cors)
  let body
  try { body = JSON.parse(decoder.decode(bodyBytes)) } catch { return json({ error: 'Invalid request.' }, 400, cors) }
  if (!body || typeof body.password !== 'string' || body.password.length > 256 || !env.ADMIN_PASSWORD ||
      !env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length < 32) {
    return json({ error: 'Admin media service is not configured.' }, 503, cors)
  }
  if (!(await constantTimeEqual(body.password, env.ADMIN_PASSWORD))) {
    return json({ error: 'Incorrect password.' }, 401, cors)
  }
  const token = await createToken(env.ADMIN_SESSION_SECRET)
  return json({ token }, 200, { ...cors, 'Cache-Control': 'no-store' })
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

async function createToken(secret) {
  const payload = base64Url(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60, sub: 'admin' }))
  const signature = await sign(payload, secret)
  return `${payload}.${base64Url(signature)}`
}

async function verifyRequest(request, env) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (!token || !env.ADMIN_SESSION_SECRET) return false
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra) return false
  let claims
  try { claims = JSON.parse(decodeBase64Url(payload)) } catch { return false }
  if (claims.sub !== 'admin' || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) return false
  const expected = base64Url(await sign(payload, env.ADMIN_SESSION_SECRET))
  return constantTimeStringEqual(signature, expected)
}

async function tokenFingerprint(request) {
  const token = request.headers.get('Authorization') || ''
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', key, encoder.encode(value))
}

async function constantTimeEqual(left, right) {
  const [a, b] = await Promise.all([sha256(left), sha256(right)])
  return constantTimeBytesEqual(a, b)
}

async function sha256(value) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
}

function constantTimeStringEqual(left, right) {
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  if (a.length !== b.length) return false
  let result = 0
  for (let index = 0; index < a.length; index += 1) result |= a[index] ^ b[index]
  return result === 0
}

function constantTimeBytesEqual(a, b) {
  if (a.length !== b.length) return false
  let result = 0
  for (let index = 0; index < a.length; index += 1) result |= a[index] ^ b[index]
  return result === 0
}

function base64Url(value) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : new Uint8Array(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
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
