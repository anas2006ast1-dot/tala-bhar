import { useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react'
import Modal from './Modal'
import Toggle from './Toggle'
import ConfirmDialog from './ConfirmDialog'
import { supabase } from '../../lib/supabaseClient'
import { isDemo, demoCategories } from '../../lib/demoData'
import CategoryIcon from '../CategoryIcon'

/**
 * Categories manager: list, add, edit, delete, toggle visibility.
 * Responsive rows with wrapped actions on mobile.
 */
export default function CategoriesManager({ categories, onRefresh }) {
  const [modal, setModal] = useState({ open: false, item: null })
  const [confirm, setConfirm] = useState({ open: false, item: null })
  const [saving, setSaving] = useState(false)

  const demo = isDemo()

  const openNew = () => setModal({ open: true, item: null })
  const openEdit = (c) => setModal({ open: true, item: c })
  const openDel = (c) => setConfirm({ open: true, item: c })

  const saveCat = async (form) => {
    if (demo) return alert('وضع المعاينة — لا يمكن الحفظ بدون ربط Supabase.')
    setSaving(true)
    if (form.id) {
      await supabase.from('categories').update(form).eq('id', form.id)
    } else {
      await supabase.from('categories').insert(form)
    }
    setSaving(false)
    setModal({ open: false, item: null })
    onRefresh()
  }

  const deleteCat = async () => {
    if (!confirm.item || demo) return
    
    // 1. Delete the category
    await supabase.from('categories').delete().eq('id', confirm.item.id)
    
    // 2. Adjust sorting of remaining categories
    const { data: remainingCats } = await supabase
      .from('categories')
      .select('id, sort_order')
      .order('sort_order', { ascending: true })
      
    if (remainingCats && remainingCats.length > 0) {
      for (let i = 0; i < remainingCats.length; i++) {
        const newOrder = i + 1
        if (remainingCats[i].sort_order !== newOrder) {
          await supabase
            .from('categories')
            .update({ sort_order: newOrder })
            .eq('id', remainingCats[i].id)
        }
      }
    }
    
    setConfirm({ open: false, item: null })
    onRefresh()
  }

  const toggleVisible = async (c) => {
    if (demo) return alert('وضع المعاينة — لا يمكن التعديل بدون ربط Supabase.')
    await supabase.from('categories').update({ is_visible: !c.is_visible }).eq('id', c.id)
    onRefresh()
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text-gray-900">الفئات ({categories.length})</h3>
        <button
          onClick={openNew}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark sm:justify-start"
        >
          <Plus size={16} /> إضافة فئة
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:gap-3 sm:p-3"
          >
            <div className="flex items-center gap-3">
              <GripVertical className="shrink-0 text-gray-300" size={18} />
              {c.icon && <CategoryIcon name={c.icon} className="shrink-0 text-accent" size={20} />}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-gray-900">{c.name_ar}</span>
                {c.name_en && <span className="mr-2 text-xs text-gray-400">{c.name_en}</span>}
              </div>
              <span className="hidden text-xs text-gray-400 sm:block">ترتيب: {c.sort_order}</span>
            </div>
            <div className="flex items-center gap-1 border-t border-gray-100 pt-2 sm:border-t-0 sm:pt-0 sm:gap-2">
              <span className="text-xs text-gray-400 sm:hidden">ترتيب: {c.sort_order}</span>
              <button onClick={() => toggleVisible(c)} title={c.is_visible ? 'إخفاء' : 'إظهار'} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                {c.is_visible ? <Eye size={18} className="text-green-600" /> : <EyeOff size={18} className="text-gray-400" />}
              </button>
              <button onClick={() => openEdit(c)} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-accent">
                <Pencil size={16} />
              </button>
              <button onClick={() => openDel(c)} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">لا توجد فئات بعد.</p>
        )}
      </div>

      {/* Add/Edit Modal */}
      <CategoryFormModal
        open={modal.open}
        onClose={() => setModal({ open: false, item: null })}
        onSave={saveCat}
        item={modal.item}
        saving={saving}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={confirm.open}
        title="حذف الفئة"
        message={`سيتم حذف "${confirm.item?.name_ar}" وجميع أصنافها. متابعة؟`}
        confirmText="حذف"
        onConfirm={deleteCat}
        onClose={() => setConfirm({ open: false, item: null })}
        danger
      />
    </div>
  )
}

function CategoryFormModal({ open, onClose, onSave, item, saving }) {
  const [name_ar, setNameAr] = useState('')
  const [name_en, setNameEn] = useState('')
  const [icon, setIcon] = useState('')

  const handleOpen = () => {
    setNameAr(item?.name_ar || '')
    setNameEn(item?.name_en || '')
    setIcon(item?.icon || '')
  }

  const submit = (e) => {
    e.preventDefault()
    if (!name_ar.trim()) return
    onSave({
      id: item?.id || null,
      name_ar: name_ar.trim(),
      name_en: name_en.trim() || null,
      icon: icon.trim() || null,
      sort_order: item?.sort_order ?? 0,
      is_visible: item?.is_visible ?? true,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? 'تعديل الفئة' : 'إضافة فئة'} onAfterEnter={handleOpen}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">الاسم (عربي) *</span>
          <input
            value={name_ar}
            onChange={(e) => setNameAr(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">الاسم (إنجليزي)</span>
          <input
            value={name_en}
            onChange={(e) => setNameEn(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">أيقونة (إيموجي)</span>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🦐"
            className="w-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-center text-2xl focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            إلغاء
          </button>
          <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-60">
            {item ? 'حفظ' : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
