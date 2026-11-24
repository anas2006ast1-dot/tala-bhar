import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isDemo, demoCategories, demoItems, demoSettings } from '../lib/demoData'
import { loadSnapshot, onConnectivityChange, pruneMenuImageCache, saveSnapshot } from '../lib/sync'
import { fetchMenuSnapshot } from '../lib/menuRepository'
import { createMenuRefreshBatcher } from '../lib/menuRealtime'
import { getBundledMenuSnapshot } from '../lib/localMenu'

const MENU_CACHE_TTL = 10_000
let lastSnapshot = null
let lastSuccessAt = 0
let realtimeChannel = null
let realtimeBatcher = null
const refreshListeners = new Set()

function startRealtimeChannel() {
  if (realtimeChannel || isDemo()) return

  realtimeBatcher = createMenuRefreshBatcher({
    invalidate: (pending) => refreshListeners.forEach(({ invalidate }) => invalidate?.(pending)),
    refresh: (options) => refreshListeners.forEach(({ refresh }) => refresh(options)),
  })

  realtimeChannel = supabase
    .channel('menu-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, realtimeBatcher)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, realtimeBatcher)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, realtimeBatcher)
    .subscribe()
}

function subscribeToMenuRefresh(listener) {
  refreshListeners.add(listener)
  startRealtimeChannel()

  return () => {
    refreshListeners.delete(listener)
    if (!refreshListeners.size && realtimeChannel) {
      realtimeBatcher?.cancel()
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
      realtimeBatcher = null
    }
  }
}

/**
 * Loads one shared menu snapshot for the customer menu and admin dashboard.
 * Customer views use a short in-memory/IndexedDB TTL and fall back to IndexedDB
 * offline. The admin always fetches from Supabase and never edits cached data.
 */
export default function useMenuData({ onlyVisible = false } = {}) {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFresh, setIsFresh] = useState(false)
  const bundledMenu = onlyVisible ? getBundledMenuSnapshot() : null

  const applySnapshot = useCallback((snapshot) => {
    setCategories(snapshot.categories || [])
    setItems(snapshot.items || [])
    setSettings(snapshot.settings || null)
  }, [])

  const refresh = useCallback(async ({ force = !onlyVisible } = {}) => {
    setError(null)
    if (!onlyVisible) setIsFresh(false)

    // Once a real fallback export is bundled, public visitors use that static
    // snapshot directly. This avoids Supabase requests while the project is
    // quota-restricted; the admin continues to fetch and save through Supabase.
    const localMenu = bundledMenu
    if (localMenu) {
      applySnapshot(localMenu)
      setIsFresh(true)
      setLoading(false)
      return
    }

    if (isDemo()) {
      if (onlyVisible) {
        setError('المنيو المحلي غير جاهز بعد.')
        setLoading(false)
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 350))
      applySnapshot({ categories: demoCategories, items: demoItems, settings: demoSettings })
      setIsFresh(true)
      setLoading(false)
      return
    }

    let cachedSnapshot = null
    if (onlyVisible) {
      if (!force && lastSnapshot && Date.now() - lastSuccessAt < MENU_CACHE_TTL) {
        applySnapshot(lastSnapshot)
        setIsFresh(true)
        setLoading(false)
        return
      }

      cachedSnapshot = await loadSnapshot()
      if (cachedSnapshot?.data) {
        applySnapshot(cachedSnapshot.data)
        setLoading(false)
        if (!force && Date.now() - cachedSnapshot.savedAt < MENU_CACHE_TTL) {
          lastSnapshot = cachedSnapshot.data
          lastSuccessAt = cachedSnapshot.savedAt
          setIsFresh(true)
          return
        }
      }
    }

    setLoading(true)
    try {
      const snapshot = await fetchMenuSnapshot(supabase, { force })
      lastSnapshot = snapshot
      lastSuccessAt = Date.now()
      applySnapshot(snapshot)
      setIsFresh(true)
      await Promise.all([
        saveSnapshot(snapshot).catch(() => {}),
        pruneMenuImageCache(snapshot.items.map((item) => item.image_url)).catch(() => {}),
      ])
    } catch (requestError) {
      setIsFresh(false)
      if (onlyVisible) {
        const fallback = cachedSnapshot || await loadSnapshot()
        if (fallback?.data) {
          applySnapshot(fallback.data)
          setError(null)
        } else {
          setError(requestError.message || String(requestError))
        }
      } else {
        setError(requestError.message || String(requestError))
      }
    } finally {
      setLoading(false)
    }
  }, [applySnapshot, bundledMenu, onlyVisible])

  useEffect(() => {
    refresh({ force: !onlyVisible })
  }, [onlyVisible, refresh])

  useEffect(() => {
    if (isDemo() || (onlyVisible && getBundledMenuSnapshot())) return

    const listener = {
      refresh,
      invalidate: (pending = false) => {
        if (!onlyVisible) {
          setIsFresh(false)
          if (pending) setLoading(true)
        }
      },
    }
    const unsubscribeRealtime = subscribeToMenuRefresh(listener)
    const unsubscribeConnectivity = onConnectivityChange({
      onOnline: () => refresh({ force: true }),
      onOffline: listener.invalidate,
    })

    return () => {
      unsubscribeRealtime()
      unsubscribeConnectivity()
    }
  }, [onlyVisible, refresh])

  const visibleCategories = onlyVisible ? categories.filter((category) => category.is_visible) : categories
  const visibleItems = items

  return {
    categories: visibleCategories,
    items: visibleItems,
    settings,
    loading,
    error,
    isFresh,
    localFallback: Boolean(bundledMenu),
    showImages: bundledMenu ? bundledMenu.displayImages === true : true,
    refresh,
    demo: isDemo() && !bundledMenu,
  }
}
