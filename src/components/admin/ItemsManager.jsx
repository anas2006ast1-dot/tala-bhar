import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, ImageIcon } from 'lucide-react'
import AdminItemForm from '../AdminItemForm'
import ConfirmDialog from './ConfirmDialog'
import Toggle from './Toggle'
import { supabase, CURRENCY } from '../../lib/supabaseClient'
import { isDemo } from '../../lib/demoData'

/**
 * Items manager: filter by category, search, CRUD, toggle availability.
 * Responsive: stacked layout on mobile, row layout on tablet+.
 */
export default function ItemsManager({ categories, items, onRefresh }) {
  const [filterCat, setFilterCat] = useState('__all__')
  const [search, setSearch] = useState('')
  const [formState, setFormState] = useState({ open: false, item: null })
  const [delState, setDelState] = useState({ open: false, item: null })

  const demo = isDemo()

  const filtered = useMemo(() => {
    let list = items
    if (filterCat !== '__all__') list = list.filter((i) => i.category_id === filterCat)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((i) => i.name_ar.toLowerCase().includes(q) || (i.name_en || '').toLowerCase().includes(q))
    }
    return list
  }, [items, filterCat, search])

  const openNew = () => setFormState({ open: true, item: null })
  const openEdit = (item) => setFormState({ open: true, item })
  const openDel = (item) => setDelState({ open: true, item })

  const handleSaved = onRefresh

  const deleteItem = async () => {
    if (!delState.item || demo) return
    await supabase.from('menu_items').delete().eq('id', delState.item.id)
    setDelState({ open: false, item: null })
    onRefresh()
  }

  const toggleAvail = async (item) => {
    if (demo) return alert('وضع المعاينة — لا يمكن التعديل بدون ربط Supabase.')
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id)
    onRefresh()
  }

  const catName = (catId) => categories.find((c) => c.id === catId)?.name_ar || '—'

  return (
    <div>
      {/* toolbar — stacks on mobile */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <h3 className="text-lg font-bold text-gray-900">الأطباق ({filtered.length})</h3>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-9 pl-3 text-sm focus:border-accent focus:bg-white focus:outline-none"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-accent focus:bg-white focus:outline-none"
          >
            <option value="__all__">كل الفئات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_ar}</option>
            ))}
          </select>
          <button
            onClick={openNew}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark sm:justify-start"
          >
            <Plus size={16} /> إضافة طبق
          </button>
        </div>
      </div>

      {/* list — responsive item rows */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:gap-3 sm:p-3"
          >
            {/* top row: thumb + info (mobile) or inline (tablet+) */}
            <div className="flex items-center gap-3">
              {/* thumb */}
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={18} className="text-gray-300" />
                )}
              </div>

              {/* info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-bold text-gray-900">{item.name_ar}</span>
                  {item.is_featured && <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">🔥</span>}
                </div>
                <span className="text-xs text-gray-400">{catName(item.category_id)}</span>
              </div>

              {/* price (desktop only, hidden on small mobile) */}
              <span className="hidden shrink-0 text-sm font-bold text-gray-800 md:block">
                {Number(item.price).toLocaleString('en-US')}{CURRENCY}
              </span>
            </div>

            {/* bottom row: actions + price (mobile only) */}
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2 sm:border-t-0 sm:pt-0">
              <span className="text-sm font-bold text-gray-800 sm:hidden">
                {Number(item.price).toLocaleString('en-US')}{CURRENCY}
              </span>
              <div className="flex items-center gap-1 sm:mr-auto sm:gap-2">
                <Toggle checked={item.is_available} onChange={() => toggleAvail(item)} label={item.is_available ? 'متوفر' : 'غير متوفر'} />
                <button onClick={() => openEdit(item)} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-accent">
                  <Pencil size={16} />
                </button>
                <button onClick={() => openDel(item)} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">لا توجد أصناف.</p>
        )}
      </div>

      {/* Add/Edit Form */}
      <AdminItemForm
        open={formState.open}
        onClose={() => setFormState({ open: false, item: null })}
        onSaved={handleSaved}
        categories={categories}
        item={formState.item}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={delState.open}
        title="حذف الطبق"
        message={`سيتم حذف "${delState.item?.name_ar}". متابعة؟`}
        confirmText="حذف"
        onConfirm={deleteItem}
        onClose={() => setDelState({ open: false, item: null })}
        danger
      />
    </div>
  )
}
