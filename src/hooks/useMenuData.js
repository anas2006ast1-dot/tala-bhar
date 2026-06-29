import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isDemo, demoCategories, demoItems, demoSettings } from '../lib/demoData'
import { saveSnapshot, loadSnapshot } from '../lib/sync'

/**
 * Fetches categories + menu_items + settings and subscribes to Realtime.
 * In demo mode (no Supabase env), returns bundled demo data.
 * In Supabase mode, persists each successful fetch to IndexedDB for offline
 * access; on network failure, restores the last cached snapshot.
 *
 * Returns { categories, items, settings, loading, error, refresh, demo }
 */
export default function useMenuData({ onlyVisible = false } = {}) {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    // ---- Demo mode (no Supabase configured) ----
    if (isDemo()) {
      await new Promise((r) => setTimeout(r, 350)) // small fake latency
      setCategories(demoCategories)
      setItems(demoItems)
      setSettings(demoSettings)
      setLoading(false)
      return
    }

    // ---- Supabase mode ----
    try {
      const [
        { data: cats, error: e1 },
        { data: itms, error: e2 },
        { data: sett, error: e3 },
      ] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('menu_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('settings').select('*').limit(1).maybeSingle(),
      ])
      if (e1) throw e1
      if (e2) throw e2
      if (e3) throw e3

      const catsFinal = cats || []
      const itemsFinal = itms || []
      const settFinal = sett || null

      setCategories(catsFinal)
      setItems(itemsFinal)
      setSettings(settFinal)

      // persist to IndexedDB for offline access
      saveSnapshot({
        categories: catsFinal,
        items: itemsFinal,
        settings: settFinal,
      }).catch(() => {})
    } catch (err) {
      // network failure — try IndexedDB cache
      const cached = await loadSnapshot()
      if (cached?.data) {
        setCategories(cached.data.categories || [])
        setItems(cached.data.items || [])
        setSettings(cached.data.settings || null)
        setError(null) // recovered silently
      } else {
        setError(err.message || String(err))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Realtime (Supabase only)
  useEffect(() => {
    if (isDemo()) return
    const channel = supabase
      .channel('menu-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => refresh())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  const visibleCategories = onlyVisible ? categories.filter((c) => c.is_visible) : categories
  const visibleItems = onlyVisible ? items.filter((i) => true) : items

  return {
    categories: visibleCategories,
    items: visibleItems,
    settings,
    loading,
    error,
    refresh,
    demo: isDemo(),
  }
}
