import { supabase } from './supabaseClient'
import { createAdminAuth, isAdminUser } from './adminAuthCore'

const auth = createAdminAuth(supabase)
export { isAdminUser }
export function getMediaApiUrl() {
  return import.meta.env.VITE_MEDIA_API_URL?.replace(/\/$/, '') || ''
}
export const login = auth.login
export const getAdminUser = auth.getAdminUser
export const logout = auth.logout
export const subscribeAuthState = auth.subscribe

async function getAdminAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (error || !token || !isAdminUser(data?.session?.user)) {
    throw new Error('انتهت جلسة المسؤول أو لا تملك هذه الحساب صلاحية الإدارة. سجّل الدخول مجددًا.')
  }
  return token
}

async function workerRequest(path, options = {}) {
  const mediaApiUrl = getMediaApiUrl()
  if (!mediaApiUrl) throw new Error('إعداد خدمة الصور غير مكتمل.')
  const token = await getAdminAccessToken()
  const response = await fetch(`${mediaApiUrl}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'تعذر تنفيذ طلب خدمة الصور.')
  return result
}

export async function uploadMenuImage(file) {
  const result = await workerRequest('/admin/images', {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!result.publicUrl) throw new Error('لم يعُد خادم الصور رابطًا للصورة.')
  return result.publicUrl
}

export async function publishMenuSnapshot(snapshot) {
  try {
    await workerRequest('/admin/menu-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    })
    return true
  } catch {
    return false
  }
}
