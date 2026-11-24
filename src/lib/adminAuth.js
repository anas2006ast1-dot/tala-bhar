const SESSION_KEY = 'talat-bahr-media-session'
const MEDIA_API_URL = import.meta.env.VITE_MEDIA_API_URL?.replace(/\/$/, '') || ''

function getToken() {
  try { return sessionStorage.getItem(SESSION_KEY) || '' } catch { return '' }
}

function clearToken() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* unavailable */ }
}

export function isAuthed() {
  return Boolean(getToken())
}

export async function validateSession() {
  const token = getToken()
  if (!token || !MEDIA_API_URL) {
    clearToken()
    return false
  }
  try {
    const response = await fetch(`${MEDIA_API_URL}/admin/session`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (response.ok) return true
  } catch { /* handled as signed out */ }
  clearToken()
  return false
}

export async function login(password) {
  if (!MEDIA_API_URL) throw new Error('إعداد خدمة رفع الصور غير مكتمل.')
  const response = await fetch(`${MEDIA_API_URL}/admin/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.token) throw new Error(result.error || 'بيانات الدخول غير صحيحة.')
  try { sessionStorage.setItem(SESSION_KEY, result.token) } catch { /* session is required */ }
  if (!getToken()) throw new Error('تعذّر حفظ جلسة المسؤول في هذا المتصفح.')
  return true
}

export async function logout() {
  clearToken()
}

export async function uploadMenuImage(file) {
  const token = getToken()
  if (!MEDIA_API_URL || !token) throw new Error('انتهت جلسة المسؤول. سجّل الدخول مجددًا.')
  const response = await fetch(`${MEDIA_API_URL}/admin/images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type,
    },
    body: file,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.publicUrl) throw new Error(result.error || 'تعذّر رفع الصورة.')
  return result.publicUrl
}

export async function publishMenuSnapshot(snapshot) {
  const token = getToken()
  if (!MEDIA_API_URL || !token) return false
  const response = await fetch(`${MEDIA_API_URL}/admin/menu-cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(snapshot),
  })
  return response.ok
}

export function getMediaApiUrl() {
  return MEDIA_API_URL
}
