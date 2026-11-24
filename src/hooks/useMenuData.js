import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isDemo, demoCategories, demoItems, demoSettings } from '../lib/demoData'
import { isOnline, loadSnapshot, onConnectivityChange, pruneMenuImageCache, saveSnapshot } from '../lib/sync'
import { fetchMenuSnapshot } from '../lib/menuRepository'
import { createMenuRefreshBatcher } from '../lib/menuRealtime'
import { fetchMenuSnapshotFromMedia } from '../lib/menuMirror'
import { getMediaApiUrl, publishMenuSnapshot } from '../lib/adminAuth'

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

  const applySnapshot = useCallback((snapshot) => {
    setCategories(snapshot.categories || [])
    setItems(snapshot.items || [])
    setSettings(snapshot.settings || null)
  }, [])

  const refresh = useCallback(async ({ force = !onlyVisible, publish = false } = {}) => {
    setError(null)
    if (!onlyVisible) setIsFresh(false)

    if (isDemo()) {
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
      const mediaApiUrl = getMediaApiUrl()
      const snapshot = onlyVisible && mediaApiUrl
        ? await fetchMenuSnapshotFromMedia(mediaApiUrl)
        : await fetchMenuSnapshot(supabase, { force })
      lastSnapshot = snapshot
      lastSuccessAt = Date.now()
      applySnapshot(snapshot)
      setIsFresh(true)
      if (!onlyVisible && publish && mediaApiUrl && !(await publishMenuSnapshot(snapshot))) {
        throw new Error('لم يتمكن خادم الصور من تحديث نسخة المنيو للزبائن. أعد المحاولة قبل اعتماد التغيير.')
      }
      await Promise.all([
        saveSnapshot(snapshot).catch(() => {}),
        pruneMenuImageCache([
          ...snapshot.items.map((item) => item.image_url),
          snapshot.settings?.logo_url,
        ]).catch(() => {}),
      ])
    } catch (requestError) {
      setIsFresh(false)
      if (onlyVisible) {
        const fallback = cachedSnapshot || await loadSnapshot()
        if (fallback?.data) {
          applySnapshot(fallback.data)
          setError(null)
        } else if (isOnline()) {
          try {
            const directSnapshot = await fetchMenuSnapshot(supabase, { force: true })
            lastSnapshot = directSnapshot
            lastSuccessAt = Date.now()
            applySnapshot(directSnapshot)
            setIsFresh(true)
            await saveSnapshot(directSnapshot).catch(() => {})
          } catch (fallbackError) {
            setError(fallbackError.message || String(fallbackError))
          }
        } else {
          setError(requestError.message || String(requestError))
        }
      } else {
        setError(requestError.message || String(requestError))
      }
    } finally {
      setLoading(false)
    }
  }, [applySnapshot, onlyVisible])

  useEffect(() => {
    refresh({ force: !onlyVisible })
  }, [onlyVisible, refresh])

  useEffect(() => {
    if (isDemo()) return

    const listener = {
      refresh: (options) => refresh({ ...options, publish: !onlyVisible }),
      invalidate: (pending = false) => {
        if (!onlyVisible) {
          setIsFresh(false)
          if (pending) setLoading(true)
        }
      },
    }
    const unsubscribeRealtime = subscribeToMenuRefresh(listener)
    const unsubscribeConnectivity = onConnectivityChange({
      onOnline: () => refresh({ force: true, publish: !onlyVisible }),
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
    refresh,
    demo: isDemo(),
  }
}
