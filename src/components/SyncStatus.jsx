import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import {
  isOnline,
  onConnectivityChange,
  onMenuUpdated,
  registerBackgroundSync,
} from '../lib/sync'

/**
 * Global connectivity + sync status UI:
 *  - shows an offline banner while navigator.onLine === false
 *  - shows a brief toast when connectivity is restored or the menu updates
 * Mount once, near the app root.
 */
export default function SyncStatus() {
  const [offline, setOffline] = useState(!isOnline())
  const [toast, setToast] = useState(null)

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    const unsub = onConnectivityChange({
      onOnline: () => {
        setOffline(false)
        setToast('اتصال مستعاد — جاري التحديث')
        registerBackgroundSync()
      },
      onOffline: () => {
        setOffline(true)
      },
    })
    const unsubMsg = onMenuUpdated(() => setToast('تم تحديث المنيو ✓'))
    return () => {
      unsub()
      unsubMsg()
    }
  }, [])

  return (
    <>
      {offline && (
        <div className="fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-[#1d3a5e] px-4 py-2 text-center text-xs font-semibold text-[#f7f2e8] shadow-lg ring-1 ring-[#5b9bd5]/30">
          <WifiOff size={14} />
          أنت غير متصل — تعرض النسخة المحفوظة
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 animate-fade-slide rounded-full border border-[#5b9bd5]/40 bg-[#1d3a5e]/95 px-5 py-2.5 text-center text-sm font-bold text-[#f7f2e8] shadow-xl backdrop-blur">
          {toast}
        </div>
      )}
    </>
  )
}
