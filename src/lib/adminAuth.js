/**
 * Lightweight password-only admin auth.
 * The admin login is just a single shared password ("admin1231"),
 * persisted to sessionStorage so it survives reloads but not new tabs.
 *
 * NOTE: This is a client-side gate — enough to keep the admin panel
 * out of casual reach. For real security, configure Supabase Auth
 * (the original flow) with proper accounts.
 */

const KEY = 'talat-bahr-admin'
const ADMIN_PASSWORD = 'admin1231'

export const ADMIN_PASSWORD_VALUE = ADMIN_PASSWORD

export function isAuthed() {
  try {
    return sessionStorage.getItem(KEY) === 'ok'
  } catch {
    return false
  }
}

export function login(password) {
  if (password === ADMIN_PASSWORD) {
    try {
      sessionStorage.setItem(KEY, 'ok')
    } catch {
      /* ignore */
    }
    return true
  }
  return false
}

export function logout() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
