import { useEffect, useState } from 'react'
import { WifiOff, CheckCircle2 } from 'lucide-react'

/**
 * Shows two things:
 *  - a persistent banner when we're offline (data served from cache)
 *  - a temporary toast when connectivity is restored / data refreshed
 *
 * Props:
 *   - stale: true when menu is rendered from a cached snapshot
 */
export default function OfflineBanner({ stale }) {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    const goOnline = () => {
      setOnline(true)
      setToast(true)
      const t = setTimeout(() => setToast(false), 2600)
      return () => clearTimeout(t)
    }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const showBanner = !online || stale

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-accent/40 bg-surface-2/95 px-4 py-2 text-center text-[11px] text-accent shadow-xl backdrop-blur">
          <WifiOff size={14} />
          {!online ? 'أنت غير متصل — تعرض النسخة المحفوظة' : 'تعرض نسخة محفوظة مؤقتاً'}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-center text-xs text-emerald-200 shadow-xl backdrop-blur animate-[fadeSlide_0.4s_ease-out]">
          <CheckCircle2 size={15} />
          اتصال مستعاد — تم تحديث المنيو
        </div>
      )}
    </>
  )
}
