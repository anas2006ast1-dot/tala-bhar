import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchMenuSnapshotFromMedia } from '../src/lib/menuMirror.js'

test('new menu clients load the public mirrored snapshot without calling Supabase', async () => {
  let requestedUrl = ''
  const snapshot = { categories: [], items: [], settings: { currency: '₪' } }
  const result = await fetchMenuSnapshotFromMedia('https://media.example/', async (url, options) => {
    requestedUrl = url
    assert.equal(options.cache, 'no-store')
    return new Response(JSON.stringify(snapshot), { status: 200 })
  })
  assert.equal(requestedUrl, 'https://media.example/menu')
  assert.deepEqual(result, snapshot)
})

test('invalid or unavailable menu mirror reports a recoverable error', async () => {
  await assert.rejects(
    fetchMenuSnapshotFromMedia('https://media.example', async () => new Response('bad', { status: 503 })),
    /503/
  )
  await assert.rejects(
    fetchMenuSnapshotFromMedia('https://media.example', async () => new Response('{"items":[]}')),
    /غير صالحة/
  )
})
