#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const [userId, action, ...extra] = process.argv.slice(2)
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

if (!uuidPattern.test(userId || '') || !['grant', 'revoke'].includes(action) || extra.length) {
  console.error('Usage: node scripts/set-admin-role.mjs <auth-user-uuid> <grant|revoke>')
  process.exitCode = 2
} else {
  const url = process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !secretKey) {
    console.error('Set SUPABASE_URL and server-only SUPABASE_SECRET_KEY in this shell environment.')
    process.exitCode = 2
  } else {
    try {
      const supabase = createClient(url, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { data: lookup, error: lookupError } = await supabase.auth.admin.getUserById(userId)
      if (lookupError) throw lookupError
      if (!lookup?.user) throw new Error('No Auth user found for the supplied UUID.')

      const appMetadata = { ...(lookup.user.app_metadata || {}) }
      if (action === 'grant') appMetadata.role = 'admin'
      else delete appMetadata.role

      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: appMetadata,
      })
      if (updateError) throw updateError

      console.log(`Admin role ${action === 'grant' ? 'granted' : 'revoked'} for Auth user ${userId}.`)
      console.log('Sign out and back in to refresh the role claim in the JWT.')
    } catch (error) {
      console.error(`Could not update admin role: ${error?.message || 'unknown error'}`)
      process.exitCode = 1
    }
  }
}
