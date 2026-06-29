import { useEffect, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { Loader2, Upload, X, ImageIcon } from 'lucide-react'
import Modal from './admin/Modal'
import Toggle from './admin/Toggle'
import { supabase, CURRENCY } from '../lib/supabaseClient'

const EMPTY = {
  id: null,
  category_id: '',
  name_ar: '',
  name_en: '',
  description_ar: '',
  price: '',
  image_url: '',
  is_available: true,
  is_featured: false,
  sort_order: 0,
}

/**
 * Add / edit item modal.
 * Props: open, onClose, onSaved, categories, item (null = new)
 */
export default function AdminItemForm({ open, onClose, onSaved, categories, item }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setForm(item ? { ...EMPTY, ...item, price: item.price ?? '' } : { ...EMPTY, category_id: categories[0]?.id || '' })
    }
  }, [open, item, categories])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleFile = async (file) => {
    if (!file) return
    setError('')
    
    // Validate size up to 20MB
    if (file.size > 20 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً. يجب أن يكون أقل من 20 ميجابايت.')
      return
    }

    try {
      setUploading(5)
      // Compress to 150KB - 200KB range (maxSizeMB: 0.18)
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.18,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        onProgress: (p) => {
          setUploading(Math.round(p * 0.6)) // 0% to 60% progress is compression
        }
      })
      
      setUploading(75) // 75% progress is starting upload
      const ext = file.name.split('.').pop().toLowerCase()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const path = `items/${fileName}`

      const { error: upErr } = await supabase.storage
        .from('menu-images')
        .upload(path, compressed, { upsert: false, contentType: compressed.type })

      if (upErr) throw upErr

      setUploading(100)
      const { data: pub } = supabase.storage.from('menu-images').getPublicUrl(path)
      set('image_url', pub.publicUrl)
    } catch (err) {
      setError('فشل رفع الصورة: ' + (err.message || err))
    } finally {
      // Small delay so progress shows 100% briefly before resetting
      setTimeout(() => setUploading(0), 400)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name_ar.trim()) return setError('اسم الطبق مطلوب.')
    if (!form.category_id) return setError('الرجاء اختيار فئة.')
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0)
      return setError('السعر غير صحيح.')

    setSaving(true)
    const payload = {
      category_id: form.category_id,
      name_ar: form.name_ar.trim(),
      name_en: form.name_en?.trim() || null,
      description_ar: form.description_ar?.trim() || null,
      price: Number(form.price),
      image_url: form.image_url || null,
      is_available: form.is_available,
      is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0,
    }

    const { error } = form.id
      ? await supabase.from('menu_items').update(payload).eq('id', form.id)
      : await supabase.from('menu_items').insert(payload)

    setSaving(false)
    if (error) return setError('فشل الحفظ: ' + error.message)
    onSaved?.()
    onClose?.()
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? 'تعديل الطبق' : 'إضافة طبق جديد'} maxWidth="max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        {/* image uploader */}
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">صورة الطبق</span>
          <div className="flex items-center gap-3">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
              {form.image_url ? (
                <img src={form.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="text-gray-300" size={26} />
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200">
                <Upload size={16} /> اختيار صورة
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
              {uploading > 0 && uploading < 100 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full bg-accent transition-all" style={{ width: `${uploading}%` }} />
                </div>
              )}
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => set('image_url', '')}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <X size={13} /> إزالة الصورة
                </button>
              )}

            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="الاسم (عربي) *" value={form.name_ar} onChange={(v) => set('name_ar', v)} required />
          <Input label="الاسم (إنجليزي)" value={form.name_en} onChange={(v) => set('name_en', v)} />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">الوصف</span>
          <textarea
            value={form.description_ar}
            onChange={(e) => set('description_ar', e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">السعر ({CURRENCY}) *</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">الفئة *</span>
            <select
              value={form.category_id}
              onChange={(e) => set('category_id', e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">اختر...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name_ar}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">ترتيب</span>
            <input
              type="number"
              min="0"
              value={form.sort_order}
              onChange={(e) => set('sort_order', e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 rounded-xl bg-gray-50 px-4 py-3">
          <SwitchRow label="متوفر" checked={form.is_available} onChange={(v) => set('is_available', v)} />
          <SwitchRow label="🔥 موصى به" checked={form.is_featured} onChange={(v) => set('is_featured', v)} />
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {item ? 'حفظ التعديلات' : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Input({ label, value, onChange, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </label>
  )
}

function SwitchRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <Toggle checked={checked} onChange={onChange} />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  )
}
