import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import test from 'node:test'

const serviceWorkerSource = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8')

class MemoryCache {
  entries = new Map()

  async match(request) {
    const response = this.entries.get(typeof request === 'string' ? request : request.url)
    return response?.clone() || null
  }

  async put(request, response) {
    this.entries.set(typeof request === 'string' ? request : request.url, response.clone())
  }

  async keys() {
    return [...this.entries.keys()].map((url) => new Request(url))
  }
}

class MemoryCacheStorage {
  caches = new Map()

  async open(name) {
    if (!this.caches.has(name)) this.caches.set(name, new MemoryCache())
    return this.caches.get(name)
  }

  async keys() {
    return [...this.caches.keys()]
  }

  async delete(name) {
    return this.caches.delete(name)
  }
}

function createWorker(fetchMock = async () => new Response('image', { status: 200 })) {
  const listeners = new Map()
  const cacheStorage = new MemoryCacheStorage()
  const self = {
    location: { origin: 'https://menu.example' },
    clients: { claim: async () => {}, matchAll: async () => [] },
    addEventListener: (type, listener) => listeners.set(type, listener),
    skipWaiting: async () => {},
  }

  runInNewContext(serviceWorkerSource, {
    self,
    caches: cacheStorage,
    fetch: fetchMock,
    URL,
    Promise,
    Response,
    setTimeout,
    clearTimeout,
  })

  return { listeners, cacheStorage }
}

async function dispatchFetch(listener, request) {
  let responsePromise
  listener({ request, respondWith: (promise) => { responsePromise = promise } })
  return responsePromise
}

test('public menu image is downloaded once and then served from Cache-First storage', async () => {
  let fetchCount = 0
  let online = true
  const { listeners } = createWorker(async () => {
    fetchCount += 1
    if (!online) throw new Error('offline')
    return new Response(`image-${fetchCount}`, { status: 200 })
  })
  const request = new Request('https://project.supabase.co/storage/v1/object/public/menu-images/items/dish.webp')

  const first = await dispatchFetch(listeners.get('fetch'), request)
  assert.equal(await first.text(), 'image-1')
  online = false
  const second = await dispatchFetch(listeners.get('fetch'), request)
  assert.equal(await second.text(), 'image-1')
  assert.equal(fetchCount, 1)

  online = true
  const updated = await dispatchFetch(
    listeners.get('fetch'),
    new Request('https://project.supabase.co/storage/v1/object/public/menu-images/items/updated.webp')
  )
  assert.equal(await updated.text(), 'image-2')
  assert.equal(fetchCount, 2)
})

test('Supabase database and non-menu storage requests bypass the service-worker cache', async () => {
  let fetchCount = 0
  const { listeners } = createWorker(async () => {
    fetchCount += 1
    return new Response('network')
  })
  const listener = listeners.get('fetch')

  const databaseResponse = await dispatchFetch(
    listener,
    new Request('https://project.supabase.co/rest/v1/menu_items?select=*')
  )
  const otherBucketResponse = await dispatchFetch(
    listener,
    new Request('https://project.supabase.co/storage/v1/object/public/avatars/user.png')
  )
  const authResponse = await dispatchFetch(
    listener,
    new Request('https://project.supabase.co/auth/v1/token?grant_type=password', { method: 'POST' })
  )

  assert.equal(databaseResponse, undefined)
  assert.equal(otherBucketResponse, undefined)
  assert.equal(authResponse, undefined)
  assert.equal(fetchCount, 0)
})

test('activation migrates old menu photos and preserves unrelated origin caches', async () => {
  const { listeners, cacheStorage } = createWorker()
  const oldCache = await cacheStorage.open('talat-bahr-v2-seaview')
  await oldCache.put(
    new Request('https://project.supabase.co/storage/v1/object/public/menu-images/items/dish.webp'),
    new Response('cached-photo')
  )
  const unrelated = await cacheStorage.open('another-app-cache')
  await unrelated.put(new Request('https://menu.example/other'), new Response('keep'))

  const waits = []
  listeners.get('activate')({ waitUntil: (promise) => waits.push(promise) })
  await Promise.all(waits)

  const imageCache = await cacheStorage.open('talat-bahr-menu-images-v1')
  const migrated = await imageCache.match('https://project.supabase.co/storage/v1/object/public/menu-images/items/dish.webp')
  assert.equal(await migrated.text(), 'cached-photo')
  assert.equal((await cacheStorage.keys()).includes('talat-bahr-v2-seaview'), false)
  assert.equal((await cacheStorage.keys()).includes('another-app-cache'), true)
})
