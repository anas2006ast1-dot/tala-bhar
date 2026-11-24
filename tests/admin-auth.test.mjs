import assert from 'node:assert/strict'
import test from 'node:test'
import { createAdminAuth, isAdminUser } from '../src/lib/adminAuthCore.js'

const admin = { id: 'admin-id', app_metadata: { role: 'admin' }, user_metadata: {} }

test('admin access depends only on server-managed app_metadata', () => {
  assert.equal(isAdminUser(admin), true)
  assert.equal(isAdminUser({ id: 'ordinary', app_metadata: {}, user_metadata: { role: 'admin' } }), false)
  assert.equal(isAdminUser({ id: 'ordinary', user_metadata: { role: 'admin' } }), false)
})

test('login accepts an admin and signs out an authenticated non-admin', async () => {
  const calls = []
  let user = admin
  const client = { auth: {
    signInWithPassword: async (credentials) => { calls.push(['login', credentials]); return { data: { user }, error: null } },
    signOut: async (options) => { calls.push(['logout', options]); return { error: null } },
  } }
  const auth = createAdminAuth(client)

  const allowed = await auth.login('admin@example.com', 'password')
  assert.equal(allowed.user, admin)
  assert.equal(allowed.error, null)
  assert.deepEqual(calls[0], ['login', { email: 'admin@example.com', password: 'password' }])

  user = { id: 'ordinary', app_metadata: {}, user_metadata: { role: 'admin' } }
  const denied = await auth.login('user@example.com', 'password')
  assert.equal(denied.user, null)
  assert.match(denied.error.message, /Admin access/)
  assert.deepEqual(calls[1], ['login', { email: 'user@example.com', password: 'password' }])
  assert.deepEqual(calls[2], ['logout', { scope: 'local' }])
})

test('login propagates Auth errors and getAdminUser checks the verified user', async () => {
  const authError = new Error('invalid credentials')
  let currentUser = admin
  const client = { auth: {
    signInWithPassword: async () => ({ data: {}, error: authError }),
    getUser: async () => ({ data: { user: currentUser }, error: null }),
    signOut: async () => ({ error: null }),
  } }
  const auth = createAdminAuth(client)
  assert.equal((await auth.login('x', 'y')).error, authError)
  assert.equal((await auth.getAdminUser()).user, admin)
  currentUser = { id: 'ordinary', app_metadata: {}, user_metadata: { role: 'admin' } }
  assert.equal((await auth.getAdminUser()).user, null)
})

test('logout is local to the active tab and auth subscription can be removed', () => {
  let listener
  let unsubscribed = false
  const client = { auth: {
    signOut: async (options) => { assert.deepEqual(options, { scope: 'local' }); return { error: null } },
    onAuthStateChange: (callback) => {
      listener = callback
      return { data: { subscription: { unsubscribe: () => { unsubscribed = true } } } }
    },
  } }
  const auth = createAdminAuth(client)
  const received = []
  const unsubscribe = auth.subscribe((user) => received.push(user))
  listener('SIGNED_IN', { user: admin })
  listener('SIGNED_OUT', null)
  assert.deepEqual(received, [admin, null])
  unsubscribe()
  assert.equal(unsubscribed, true)
  return auth.logout()
})
