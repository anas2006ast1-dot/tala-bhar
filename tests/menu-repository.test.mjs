import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchMenuSnapshot } from '../src/lib/menuRepository.js'

test('concurrent menu refreshes share three queries and fresh data is reused until forced', async () => {
  const counts = { categories: 0, menu_items: 0, settings: 0 }
  const supabase = {
    from(table) {
      counts[table] += 1
      const result = {
        data: table === 'settings' ? { id: 1 } : [{ table }],
        error: null,
      }
      const builder = {
        select() { return this },
        order() { return this },
        limit() { return this },
        maybeSingle() {
          return new Promise((resolve) => setTimeout(() => resolve(result), 15))
        },
        then(resolve, reject) {
          return new Promise((done) => setTimeout(() => done(result), 15)).then(resolve, reject)
        },
      }
      return builder
    },
  }

  const first = fetchMenuSnapshot(supabase, { force: true })
  const concurrent = fetchMenuSnapshot(supabase, { force: true })
  assert.equal(first, concurrent)

  const snapshot = await first
  assert.deepEqual(counts, { categories: 1, menu_items: 1, settings: 1 })
  assert.deepEqual(await fetchMenuSnapshot(supabase), snapshot)
  assert.deepEqual(counts, { categories: 1, menu_items: 1, settings: 1 })

  await fetchMenuSnapshot(supabase, { force: true })
  assert.deepEqual(counts, { categories: 2, menu_items: 2, settings: 2 })
})
