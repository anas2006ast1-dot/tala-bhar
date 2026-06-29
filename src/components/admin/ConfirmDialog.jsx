import Modal from './Modal'
import { Loader2 } from 'lucide-react'

/**
 * Confirmation dialog. Props: open, title, message, confirmText, onConfirm, onClose, loading
 */
export default function ConfirmDialog({
  open,
  title = 'تأكيد',
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  onConfirm,
  onClose,
  loading = false,
  danger = true,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm leading-relaxed text-gray-600">{message}</p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-accent hover:bg-accent-dark'
          }`}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}
