import { createClient } from '@supabase/supabase-js'

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'MEDIA_API_URL', 'ADMIN_PASSWORD']
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing ${name} in this shell environment.`)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const tables = ['categories', 'menu_items', 'settings']
const results = await Promise.all(tables.map((table) =>
  supabase.from(table).select('*').order(table === 'settings' ? 'id' : 'sort_order', { ascending: true })
))
for (let index = 0; index < results.length; index += 1) {
  if (results[index].error) throw new Error(`Could not read public ${tables[index]} data: ${results[index].error.message}`)
}

const loginResponse = await fetch(`${process.env.MEDIA_API_URL.replace(/\/$/, '')}/admin/session`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
})
const login = await loginResponse.json().catch(() => ({}))
if (!loginResponse.ok || !login.token) throw new Error('Could not authenticate with the media Worker.')

const snapshot = {
  categories: results[0].data || [],
  items: results[1].data || [],
  settings: results[2].data?.[0] || null,
}
const response = await fetch(`${process.env.MEDIA_API_URL.replace(/\/$/, '')}/admin/menu-cache`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${login.token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(snapshot),
})
const published = await response.json().catch(() => ({}))
if (!response.ok) throw new Error(`Could not publish menu snapshot: ${published.error || response.status}`)

console.log(`Published ${snapshot.categories.length} categories and ${snapshot.items.length} menu items to the R2 menu cache.`)
console.log(`Snapshot timestamp: ${published.updatedAt}`)
