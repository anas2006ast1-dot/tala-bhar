const MENU_CACHE_TTL = 10_000
let menuRequest = null
let lastSnapshot = null
let lastSuccessAt = 0

/** Fetches a single shared snapshot; concurrent views reuse the in-flight work. */
export function fetchMenuSnapshot(supabase, { force = false } = {}) {
  if (menuRequest) return menuRequest

  if (!force && lastSnapshot && Date.now() - lastSuccessAt < MENU_CACHE_TTL) {
    return Promise.resolve(lastSnapshot)
  }

  const currentRequest = (async () => {
    const [categoriesResult, itemsResult, settingsResult] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('menu_items').select('*').order('sort_order', { ascending: true }),
      supabase.from('settings').select('*').limit(1).maybeSingle(),
    ])

    if (categoriesResult.error) throw categoriesResult.error
    if (itemsResult.error) throw itemsResult.error
    if (settingsResult.error) throw settingsResult.error

    const snapshot = {
      categories: categoriesResult.data || [],
      items: itemsResult.data || [],
      settings: settingsResult.data || null,
    }
    lastSnapshot = snapshot
    lastSuccessAt = Date.now()
    return snapshot
  })()

  menuRequest = currentRequest
  currentRequest.then(
    () => { if (menuRequest === currentRequest) menuRequest = null },
    () => { if (menuRequest === currentRequest) menuRequest = null }
  )
  return currentRequest
}
