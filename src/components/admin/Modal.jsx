import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Centered modal with backdrop. Light theme (admin).
 * On mobile: full-screen. On tablet+: centered with max-width.
 */
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg', onAfterEnter }) {
  useEffect(() => {
    if (!open) return
    onAfterEnter?.()
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, onAfterEnter])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-0 backdrop-blur-sm md:p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative max-h-screen w-full ${maxWidth} overflow-y-auto rounded-none bg-white shadow-2xl md:max-h-[90vh] md:rounded-2xl md:p-6`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 py-3 md:static md:mb-5 md:border-0 md:p-0">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] grid place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="إغلاق"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 md:p-0">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
