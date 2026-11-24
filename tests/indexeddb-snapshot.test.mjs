import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSnapshot, saveSnapshot } from '../src/lib/sync.js'

test('menu snapshots round-trip through the IndexedDB wrapper for offline reuse', async () => {
  const values = new Map()
  const database = {
    objectStoreNames: { contains: () => true },
    close() {},
    transaction() {
      const transaction = { oncomplete: null, onerror: null, onabort: null }
      transaction.objectStore = () => ({
        get(key) {
          const request = { result: null, onsuccess: null, onerror: null }
          queueMicrotask(() => {
            request.result = values.get(key) ?? null
            request.onsuccess?.()
            transaction.oncomplete?.()
          })
          return request
        },
        put(value, key) {
          values.set(key, value)
          queueMicrotask(() => transaction.oncomplete?.())
        },
      })
      return transaction
    },
  }
  const priorIndexedDB = globalThis.indexedDB
  globalThis.indexedDB = {
    open() {
      const request = { result: database, onsuccess: null, onerror: null, onupgradeneeded: null }
      queueMicrotask(() => request.onsuccess?.())
      return request
    },
  }

  try {
    const data = { categories: [{ id: 'category-1' }], items: [{ id: 'item-1' }], settings: { id: 1 } }
    const saved = await saveSnapshot(data)
    const restored = await loadSnapshot()
    assert.deepEqual(restored, saved)
    assert.deepEqual(restored.data, data)
  } finally {
    if (priorIndexedDB === undefined) delete globalThis.indexedDB
    else globalThis.indexedDB = priorIndexedDB
  }
})
