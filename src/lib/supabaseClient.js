import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
const tabSessionStorage = (() => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
})()

/** True when Supabase env vars are properly configured. */
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseKey &&
  supabaseUrl !== 'your_supabase_url' &&
  supabaseKey !== 'your_publishable_key' &&
  supabaseKey !== 'your_anon_key'

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] وضع المعاينة — مفاتيح Supabase غير مضبوطة. ' +
    'أضفها في ملف .env لتفعيل قاعدة البيانات الحقيقية.'
  )
}

/**
 * In demo mode we still create a client pointing at a harmless placeholder,
 * so imports never crash. The app reads `isSupabaseConfigured` and skips
 * real network calls when false.
 */
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseKey : 'placeholder-anon-key',
  {
    auth: {
      // Admin sessions persist only for the current tab and are never handled
      // by the Service Worker or Cache API.
      persistSession: Boolean(tabSessionStorage),
      ...(tabSessionStorage ? { storage: tabSessionStorage } : {}),
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: { eventsPerSecond: 2 },
    },
  }
)

export const RESTAURANT_NAME = import.meta.env.VITE_RESTAURANT_NAME || 'طلة بحر'
export const CURRENCY = import.meta.env.VITE_CURRENCY || '₪'
export const MENU_URL =
  import.meta.env.VITE_MENU_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/menu`
    : 'https://your-app.vercel.app/menu')
