import test from 'node:test'
import assert from 'node:assert/strict'
import bundledMenu from '../src/data/menu-fallback.json' with { type: 'json' }
import { getBundledMenuSnapshot, isUsableLocalMenu } from '../src/lib/localMenu.js'
import { createMenuFallbackSnapshot } from '../src/lib/menuSnapshot.js'

test('complete real fallback is enabled with photos hidden and original photo URLs retained', () => {
  const localMenu = getBundledMenuSnapshot()
  assert.ok(localMenu)
  assert.equal(localMenu.items.length, 50)
  assert.equal(localMenu.categories.length, 10)
  assert.equal(localMenu.displayImages, false)
  assert.equal(localMenu.items.filter((item) => item.image_url).length, 47)
  assert.equal(isUsableLocalMenu({ ...bundledMenu, displayImages: true }), false)
  assert.equal(isUsableLocalMenu({ categories: [], items: [], settings: null }), false)
})

test('admin snapshot export preserves current prices and original image URLs while hiding images', () => {
  const exported = createMenuFallbackSnapshot(bundledMenu)
  assert.equal(exported.displayImages, false)
  assert.equal(exported.items.length, 50)
  assert.equal(exported.items.filter((item) => item.image_url).length, 47)
  assert.deepEqual(exported.items, bundledMenu.items)
})
