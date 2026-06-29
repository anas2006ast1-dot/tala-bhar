import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut, Tags, UtensilsCrossed, QrCode, Settings,
  Menu as MenuIcon, ChevronLeft, ChevronRight,
  ExternalLink, Eye,
} from 'lucide-react'
import useMenuData from '../hooks/useMenuData'
import CategoriesManager from '../components/admin/CategoriesManager'
import ItemsManager from '../components/admin/ItemsManager'
import QRCodeDisplay from '../components/QRCodeDisplay'
import { MENU_URL, RESTAURANT_NAME } from '../lib/supabaseClient'
import { logout as adminLogout } from '../lib/adminAuth'

const TABS = [
  { key: 'categories', label: 'الفئات', icon: Tags },
  { key: 'items', label: 'الأطباق', icon: UtensilsCrossed },
  { key: 'qr', label: 'QR Code', icon: QrCode },
  { key: 'settings', label: 'الإعدادات', icon: Settings },
]

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState('categories')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settingForm, setSettingForm] = useState({})
  const navigate = useNavigate()

  const { categories, items, settings, refresh, demo } = useMenuData({ onlyVisible: false })

  useEffect(() => {
    document.body.classList.add('theme-admin')
    document.body.classList.remove('theme-customer')
  }, [])

  useEffect(() => {
    if (settings) {
      setSettingForm({
        name_ar: settings.name_ar || '',
        name_en: settings.name_en || '',
        tagline_ar: settings.tagline_ar || '',
        currency: settings.currency || '₪',
        phone: settings.phone || '',
        instagram: settings.instagram || '',
        whatsapp: settings.whatsapp || '',
      })
    }
  }, [settings])

  const logout = () => {
    adminLogout()
    onLogout?.()
    navigate('/admin/login', { replace: true })
  }

  const saveSettings = async (e) => {
    e.preventDefault()
    if (demo) return alert('وضع المعاينة — لا يمكن الحفظ بدون ربط Supabase.')
    setSaving(true)
    await supabase.from('settings').update(settingForm).eq('id', 1)
    setSaving(false)
    refresh()
  }

  const menuUrl = MENU_URL

  return (
    <div className="flex min-h-screen">
      {/* sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* sidebar — hidden on mobile unless toggled */}
      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-64 flex-col border-l border-gray-200 bg-white shadow-xl transition-transform md:static md:translate-x-0 lg:w-64 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="h-9 w-9 rounded-full" />
            <span className="font-bold text-gray-900">{RESTAURANT_NAME}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 md:hidden">
            <ChevronRight size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSidebarOpen(false) }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                tab === t.key
                  ? 'bg-accent/10 text-accent'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <a
            href="/menu"
            target="_blank"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
          >
            <Eye size={18} /> معاينة القائمة <ExternalLink size={14} className="mr-auto text-gray-400" />
          </a>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* main content */}
      <div className="flex min-h-screen flex-1 flex-col bg-gray-50">
        {/* top bar — mobile + tablet, hidden on desktop (sidebar always visible) */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600">
            <MenuIcon size={22} />
          </button>
          <span className="font-bold text-gray-900">لوحة التحكم</span>
          {demo && (
            <span className="mr-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">معاينة</span>
          )}
        </header>

        {/* ── Mobile tab bar (horizontal scroll, below header) ── */}
        <div className="no-scrollbar snap-tabs sticky top-[57px] z-20 flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-3 py-2 lg:hidden">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition sm:px-3.5 sm:text-sm ${
                tab === t.key
                  ? 'border-accent bg-accent text-white shadow'
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {demo && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 sm:mb-6 sm:p-4 sm:text-sm">
                <strong>وضع المعاينة:</strong> لا يمكن إجراء عمليات الكتابة بدون ربط Supabase.
              </div>
            )}

            {tab === 'categories' && <CategoriesManager categories={categories} onRefresh={refresh} />}
            {tab === 'items' && <ItemsManager categories={categories} items={items} onRefresh={refresh} />}
            {tab === 'qr' && (
              <div>
                <h3 className="mb-4 text-lg font-bold text-gray-900">رابط QR Code</h3>
                <QRCodeDisplay url={menuUrl} />
              </div>
            )}
            {tab === 'settings' && (
              <SettingsSection form={settingForm} setForm={setSettingForm} saving={saving} onSave={saveSettings} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function SettingsSection({ form, setForm, saving, onSave }) {
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <form onSubmit={onSave} className="space-y-5">
      <h3 className="text-lg font-bold text-gray-900">إعدادات المطعم</h3>
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="اسم المطعم (عربي)" value={form.name_ar} onChange={(v) => set('name_ar', v)} />
          <Field label="اسم المطعم (إنجليزي)" value={form.name_en} onChange={(v) => set('name_en', v)} />
          <Field label="الشعار" value={form.tagline_ar} onChange={(v) => set('tagline_ar', v)} />
          <Field label="العملة" value={form.currency} onChange={(v) => set('currency', v)} />
          <Field label="رقم الهاتف" value={form.phone} onChange={(v) => set('phone', v)} />
          <Field label="رابط إنستغرام" value={form.instagram} onChange={(v) => set('instagram', v)} />
          <Field label="رقم واتساب" value={form.whatsapp} onChange={(v) => set('whatsapp', v)} />
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark disabled:opacity-60"
          >
            {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </label>
  )
}
