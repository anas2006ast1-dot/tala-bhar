import assert from 'node:assert/strict'
import test from 'node:test'
import { pruneMenuImageCache } from '../src/lib/sync.js'

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
