import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when Supabase env vars are properly configured. */
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_url' &&
  supabaseAnonKey !== 'your_anon_key'

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
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
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
