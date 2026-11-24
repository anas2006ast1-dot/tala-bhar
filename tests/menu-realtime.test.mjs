import assert from 'node:assert/strict'
import test from 'node:test'
import { createMenuRefreshBatcher } from '../src/lib/menuRealtime.js'

test('bursty Realtime events invalidate immediately and trigger one full refresh', async () => {
  let invalidations = 0
  let refreshes = 0
  const schedule = createMenuRefreshBatcher({
    invalidate: (pending) => { if (pending) invalidations += 1 },
    refresh: ({ force }) => { if (force) refreshes += 1 },
  }, 25)

  schedule()
  schedule()
  schedule()
  assert.equal(invalidations, 3)
  await new Promise((resolve) => setTimeout(resolve, 40))
  assert.equal(refreshes, 1)

  schedule()
  schedule.cancel()
  await new Promise((resolve) => setTimeout(resolve, 40))
  assert.equal(refreshes, 1)
})
