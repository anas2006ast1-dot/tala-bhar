import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const files = [
  new URL('../supabase/schema.sql', import.meta.url),
  new URL('../supabase/proposals/admin-auth-rls.sql', import.meta.url),
]

test('schema and migration draft use server-managed role claims for writes', async () => {
  for (const file of files) {
    const sql = await readFile(file, 'utf8')
    assert.match(sql, /app_metadata/)
    assert.doesNotMatch(sql, /user_metadata/)
    assert.match(sql, /for select to anon, authenticated using \(true\)/i)
    assert.match(sql, /for insert to authenticated/i)
    assert.match(sql, /for update to authenticated/i)
    assert.match(sql, /for delete to authenticated/i)
    assert.match(sql, /bucket_id = 'menu-images'/)
    assert.match(sql, /as restrictive for insert/i)
    assert.doesNotMatch(sql, /for all to authenticated\s+using\s*\(true\)/i)
  }
})

test('current client and migration notes contain no legacy password gate', async () => {
  const sourceFiles = [
    new URL('../src/lib/adminAuth.js', import.meta.url),
    new URL('../src/lib/adminAuthCore.js', import.meta.url),
    new URL('../src/pages/AdminLogin.jsx', import.meta.url),
    new URL('../docs/supabase-auth-migration-plan.md', import.meta.url),
  ]
  for (const file of sourceFiles) {
    const source = await readFile(file, 'utf8')
    assert.doesNotMatch(source, /ADMIN_PASSWORD|isAuthed\s*=/)
  }
})
