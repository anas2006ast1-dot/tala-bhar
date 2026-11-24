import { readFile, writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const rollbackIndex = args.indexOf('--rollback')
const apply = args.includes('--apply')
const allowedColumns = { menu_items: new Set(['image_url']), settings: new Set(['logo_url']) }
const allowedArgs = apply ? ['--apply'] : []
if (rollbackIndex >= 0 && args.length === rollbackIndex + 2) {
  await rollback(args[rollbackIndex + 1])
} else if (rollbackIndex >= 0 || args.some((arg) => !allowedArgs.includes(arg))) {
  usage()
} else {
  await migrate()
}

async function migrate() {
  const supabase = apply ? createServiceClient() : createPublicClient()
  const [items, settings] = await Promise.all([
    supabase.from('menu_items').select('id,image_url'),
    supabase.from('settings').select('id,logo_url'),
  ])
  if (items.error) throw new Error(`Could not read menu items: ${items.error.message}`)
  if (settings.error) throw new Error(`Could not read menu settings: ${settings.error.message}`)

  const candidates = [
    ...(items.data || []).map((row) => ({ table: 'menu_items', id: row.id, column: 'image_url', oldUrl: row.image_url })),
    ...(settings.data || []).map((row) => ({ table: 'settings', id: row.id, column: 'logo_url', oldUrl: row.logo_url })),
  ].filter((row) => isMenuStorageUrl(row.oldUrl))

  if (!apply) {
    console.log(`Dry run: found ${candidates.length} Supabase menu image/logo URLs to migrate.`)
    console.log('No image was copied and no database row was changed. Review, then rerun with --apply after approval.')
    return
  }

  const mediaApiUrl = requireEnv('MEDIA_API_URL').replace(/\/$/, '')
  const publicBase = new URL(requireEnv('R2_PUBLIC_BASE_URL'))
  if (publicBase.protocol !== 'https:') throw new Error('R2_PUBLIC_BASE_URL must use HTTPS.')
  const token = await getWorkerToken(mediaApiUrl)
  const manifestPath = `menu-image-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const manifest = { createdAt: new Date().toISOString(), entries: [] }
  await saveManifest(manifestPath, manifest)
  const urlMap = new Map()

  for (const record of candidates) {
    let newUrl = urlMap.get(record.oldUrl)
    if (!newUrl) {
      newUrl = await copyImageToR2(record.oldUrl, mediaApiUrl, token, publicBase)
      urlMap.set(record.oldUrl, newUrl)
    }
    const entry = { ...record, newUrl, status: 'uploaded' }
    manifest.entries.push(entry)
    await saveManifest(manifestPath, manifest)

    const { error } = await supabase.from(record.table)
      .update({ [record.column]: newUrl })
      .eq('id', record.id)
    if (error) {
      entry.status = 'uploaded-not-updated'
      entry.error = error.message
      await saveManifest(manifestPath, manifest)
      throw new Error(`Image was copied but ${record.table} row ${record.id} was not updated. Rollback manifest: ${manifestPath}`)
    }
    entry.status = 'updated'
    await saveManifest(manifestPath, manifest)
    console.log(`Migrated ${record.table} row ${record.id}.`)
  }

  console.log(`Migration completed. Original Supabase objects were not deleted. Rollback manifest: ${manifestPath}`)
}

async function copyImageToR2(sourceUrl, mediaApiUrl, token, publicBase) {
  const source = new URL(sourceUrl)
  const allowedHost = new URL(requireEnv('SUPABASE_URL')).hostname
  if (source.hostname !== allowedHost || !source.pathname.includes('/storage/v1/object/public/menu-images/')) {
    throw new Error(`Refusing to fetch a non-menu Supabase URL: ${source.hostname}`)
  }
  const sourceResponse = await fetch(sourceUrl)
  if (!sourceResponse.ok) throw new Error(`Could not fetch a Supabase image (${sourceResponse.status}).`)
  const contentType = sourceResponse.headers.get('Content-Type')?.split(';')[0].toLowerCase() || ''
  if (!['image/webp', 'image/jpeg', 'image/png'].includes(contentType)) {
    throw new Error(`Unsupported image content type ${contentType || '(missing)'} for ${source.pathname}.`)
  }
  const bytes = await sourceResponse.arrayBuffer()
  const upload = await fetch(`${mediaApiUrl}/admin/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': contentType },
    body: bytes,
  })
  const result = await upload.json().catch(() => ({}))
  if (!upload.ok || !result.publicUrl) throw new Error(`Could not upload a Supabase image to R2: ${result.error || upload.status}`)

  const migrated = new URL(result.publicUrl)
  if (migrated.origin !== publicBase.origin || migrated.protocol !== 'https:') {
    throw new Error('Worker returned a URL outside the configured R2 public domain.')
  }
  const verify = await fetch(result.publicUrl, { method: 'HEAD' })
  if (!verify.ok) throw new Error(`R2 image verification failed (${verify.status}); database URL was not changed.`)
  return result.publicUrl
}

async function rollback(path) {
  const manifest = JSON.parse(await readFile(path, 'utf8'))
  if (!Array.isArray(manifest.entries)) throw new Error('Invalid migration manifest.')
  const supabase = createServiceClient()
  for (const entry of [...manifest.entries].reverse()) {
    if (!entry.oldUrl || !entry.id || !allowedColumns[entry.table]?.has(entry.column)) continue
    const { error } = await supabase.from(entry.table)
      .update({ [entry.column]: entry.oldUrl })
      .eq('id', entry.id)
    if (error) throw new Error(`Rollback failed for ${entry.table} row ${entry.id}: ${error.message}`)
    entry.status = 'rolled-back'
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)
  }
  console.log('Database URLs were restored from the manifest. Supabase originals and R2 copies were left untouched.')
}

async function getWorkerToken(mediaApiUrl) {
  const response = await fetch(`${mediaApiUrl}/admin/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: requireEnv('ADMIN_PASSWORD') }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.token) throw new Error('Could not authenticate with the media Worker.')
  return result.token
}

function createServiceClient() {
  const url = requireEnv('SUPABASE_URL')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function createPublicClient() {
  const url = requireEnv('SUPABASE_URL')
  const key = requireEnv('SUPABASE_ANON_KEY')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function isMenuStorageUrl(value) {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.hostname === new URL(requireEnv('SUPABASE_URL')).hostname &&
      url.pathname.includes('/storage/v1/object/public/menu-images/')
  } catch {
    return false
  }
}

function requireEnv(name) {
  if (!process.env[name]) throw new Error(`Missing ${name} in this shell environment.`)
  return process.env[name]
}

async function saveManifest(path, manifest) {
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, { flag: path ? 'w' : 'wx' })
}

function usage() {
  console.error('Usage: node scripts/migrate-menu-images.mjs [--apply]')
  console.error('       node scripts/migrate-menu-images.mjs --rollback <manifest.json>')
  process.exit(2)
}
