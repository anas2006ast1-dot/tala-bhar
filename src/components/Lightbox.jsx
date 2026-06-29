import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Fullscreen image lightbox.
 */
export default function Lightbox({ src, title, onClose }) {
  useEffect(() => {
    if (!src) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [src, onClose])

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4"
        >
          <button
            onClick={onClose}
            className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="إغلاق"
          >
            <X size={22} />
          </button>
          <motion.figure
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] overflow-hidden rounded-2xl sm:rounded-3xl"
          >
            <img
              src={src}
              alt={title || ''}
              className="max-h-[78vh] max-w-[92vw] object-contain sm:max-h-[82vh]"
            />
            {title && (
              <figcaption className="mt-3 text-center text-sm font-bold text-accent sm:text-base" style={{ fontFamily: "'Cairo', sans-serif" }}>
                {title}
              </figcaption>
            )}
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
