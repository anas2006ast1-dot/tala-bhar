import assert from 'node:assert/strict'
import test from 'node:test'
import worker from '../cloudflare/worker.js'

function makeEnv(overrides = {}) {
  const objects = new Map()
  return {
    objects,
    env: {
      APP_ORIGINS: 'https://menu.example',
      SUPABASE_URL: 'https://project.example.supabase.co',
      SUPABASE_ANON_KEY: 'public-test-key',
      AUTH_FETCH: async (url, options) => {
        assert.match(url, /\/auth\/v1\/user$/)
        assert.equal(options.headers.apikey, 'public-test-key')
        const token = options.headers.Authorization.replace('Bearer ', '')
        if (token === 'admin-access-token') return Response.json({ id: 'admin-id', app_metadata: { role: 'admin' } })
        if (token === 'regular-access-token') return Response.json({ id: 'user-id', app_metadata: {}, user_metadata: { role: 'admin' } })
        return new Response('{}', { status: 401 })
      },
      PUBLIC_IMAGE_BASE_URL: 'https://images.example.com',
      MENU_IMAGES: {
        put: async (key, value, options) => objects.set(key, { value, options }),
        get: async (key) => {
          const stored = objects.get(key)
          if (!stored) return null
          const body = typeof stored.value === 'string' ? stored.value : stored.value
          return { body: new Response(body).body, httpMetadata: stored.options.httpMetadata }
        },
      },
      UPLOAD_LIMITER: { limit: async () => ({ success: true }) },
      ...overrides,
    },
  }
}

function ctx() {
  return { waitUntil: (promise) => promise }
}

test('Worker validates Supabase Auth app_metadata and rejects regular users and bad origins', async () => {
  const { env } = makeEnv()
  const wrongOrigin = await worker.fetch(new Request('https://media.example/admin/session', {
    headers: { Origin: 'https://attacker.example', Authorization: 'Bearer admin-access-token' },
  }), env, ctx())
  assert.equal(wrongOrigin.status, 403)

  const verified = await worker.fetch(new Request('https://media.example/admin/session', {
    headers: { Origin: 'https://menu.example', Authorization: 'Bearer admin-access-token' },
  }), env, ctx())
  assert.equal(verified.status, 200)
  assert.deepEqual(await verified.json(), { valid: true })

  const regular = await worker.fetch(new Request('https://media.example/admin/session', {
    headers: { Origin: 'https://menu.example', Authorization: 'Bearer regular-access-token' },
  }), env, ctx())
  assert.equal(regular.status, 401)
  assert.deepEqual(await regular.json(), { valid: false })
})

test('only authenticated image writes are accepted and receive immutable URLs', async () => {
  const { env, objects } = makeEnv()
  const validPng = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0])
  const response = await worker.fetch(new Request('https://media.example/admin/images', {
    method: 'POST',
    headers: {
      Origin: 'https://menu.example',
      Authorization: 'Bearer admin-access-token',
      'Content-Type': 'image/png',
    },
    body: validPng,
  }), env, ctx())
  assert.equal(response.status, 201)
  const { publicUrl } = await response.json()
  assert.match(publicUrl, /^https:\/\/images\.example\.com\/items\/.+\.png$/)
  assert.equal(objects.size, 1)
  assert.equal([...objects.values()][0].options.httpMetadata.cacheControl, 'public, max-age=31536000, immutable')

  const denied = await worker.fetch(new Request('https://media.example/admin/images', {
    method: 'POST', headers: { Origin: 'https://menu.example', 'Content-Type': 'image/png' }, body: validPng,
  }), env, ctx())
  assert.equal(denied.status, 401)

  const regularUser = await worker.fetch(new Request('https://media.example/admin/images', {
    method: 'POST',
    headers: { Origin: 'https://menu.example', Authorization: 'Bearer regular-access-token', 'Content-Type': 'image/png' },
    body: validPng,
  }), env, ctx())
  assert.equal(regularUser.status, 401)
})

test('menu endpoint serves a durable R2 snapshot to a first-time device', async () => {
  const snapshot = { version: 1, categories: [{ id: 'c1' }], items: [{ id: 'i1', price: 4 }], settings: null }
  const { env } = makeEnv()
  env.MENU_IMAGES.put = async () => assert.fail('Existing snapshots should not be rewritten.')
  env.MENU_IMAGES.get = async (key) => key === 'menu/snapshot.json'
    ? { body: new Response(JSON.stringify(snapshot)).body, httpMetadata: { contentType: 'application/json' } }
    : null
  const response = await worker.fetch(new Request('https://media.example/menu', {
    headers: { Origin: 'https://menu.example' },
  }), env, ctx())
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('X-Menu-Source'), 'r2')
  assert.equal((await response.json()).items[0].price, 4)
})

test('admin can publish a fresh Supabase snapshot and customers receive updated prices', async () => {
  const { env, objects } = makeEnv()
  const updatedSnapshot = {
    categories: [{ id: 'c1' }],
    items: [{ id: 'i1', price: 7, is_available: false }],
    settings: null,
  }
  const update = await worker.fetch(new Request('https://media.example/admin/menu-cache', {
    method: 'POST',
    headers: {
      Origin: 'https://menu.example',
      Authorization: 'Bearer admin-access-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedSnapshot),
  }), env, ctx())
  assert.equal(update.status, 200)
  assert.ok(objects.has('menu/snapshot.json'))

  const customer = await worker.fetch(new Request('https://media.example/menu', {
    headers: { Origin: 'https://menu.example' },
  }), env, ctx())
  const result = await customer.json()
  assert.equal(result.items[0].price, 7)
  assert.equal(result.items[0].is_available, false)

  const denied = await worker.fetch(new Request('https://media.example/admin/menu-cache', {
    method: 'POST',
    headers: { Origin: 'https://menu.example', 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedSnapshot),
  }), env, ctx())
  assert.equal(denied.status, 401)
})
