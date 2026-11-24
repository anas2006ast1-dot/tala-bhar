import assert from 'node:assert/strict'
import test from 'node:test'
import { pruneMenuImageCache, setMenuImageOrigins } from '../src/lib/sync.js'

test('menu image cleanup keeps referenced photos and removes only stale menu-photo cache entries', async () => {
  const current = 'https://project.supabase.co/storage/v1/object/public/menu-images/items/current.webp'
  const stale = 'https://project.supabase.co/storage/v1/object/public/menu-images/items/old.webp'
  const unrelated = 'https://project.supabase.co/storage/v1/object/public/avatars/user.png'
  const entries = new Set([current, stale, unrelated])
  const cache = {
    keys: async () => [...entries].map((url) => new Request(url)),
    delete: async (request) => entries.delete(request.url),
  }
  const priorCaches = globalThis.caches
  globalThis.caches = { open: async () => cache }

  try {
    await pruneMenuImageCache([current])
  } finally {
    if (priorCaches === undefined) delete globalThis.caches
    else globalThis.caches = priorCaches
  }

  assert.deepEqual([...entries], [current, unrelated])
})

test('menu cache pruning recognizes configured R2 photo URLs', async () => {
  const current = 'https://images.example.com/items/current.webp'
  const stale = 'https://images.example.com/items/old.webp'
  const entries = new Set([current, stale])
  const cache = {
    keys: async () => [...entries].map((url) => new Request(url)),
    delete: async (request) => entries.delete(request.url),
  }
  const priorCaches = globalThis.caches
  globalThis.caches = { open: async () => cache }
  setMenuImageOrigins(['https://images.example.com'])
  try {
    await pruneMenuImageCache([current])
  } finally {
    setMenuImageOrigins([])
    if (priorCaches === undefined) delete globalThis.caches
    else globalThis.caches = priorCaches
  }
  assert.deepEqual([...entries], [current])
})
