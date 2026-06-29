import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Instagram, MessageCircle } from 'lucide-react'
import useMenuData from '../hooks/useMenuData'
import useScrollReveal from '../hooks/useScrollReveal'
import Splash from '../components/Splash'
import CategoryTabs from '../components/CategoryTabs'
import MenuItemCard from '../components/MenuItemCard'
import Lightbox from '../components/Lightbox'
import WaveDivider from '../components/WaveDivider'
import CategoryIcon from '../components/CategoryIcon'
import { RESTAURANT_NAME, CURRENCY } from '../lib/supabaseClient'

export default function MenuPage() {
  const { categories, items, settings, loading, error, demo } = useMenuData({ onlyVisible: true })
  const [activeId, setActiveId] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [showSplash, setShowSplash] = useState(true)

  const restaurantName = settings?.name_ar || RESTAURANT_NAME
  const tagline = settings?.tagline_ar || 'مأكولات بحرية طازجة'
  const logo = settings?.logo_url || '/logo.svg'

  // items grouped by category (only categories that have items)
  const grouped = useMemo(() => {
    return categories
      .map((c) => ({
        ...c,
        items: items.filter((i) => i.category_id === c.id),
      }))
      .filter((c) => c.items.length > 0)
  }, [categories, items])

  // default active = first category
  useEffect(() => {
    if (!activeId && grouped.length) setActiveId(grouped[0].id)
  }, [grouped, activeId])

  // theme
  useEffect(() => {
    document.body.classList.add('theme-customer')
    document.body.classList.remove('theme-admin')
    document.title = `${restaurantName} | القائمة`
  }, [restaurantName])

  // scroll-spy: highlight active category while scrolling
  useEffect(() => {
    if (!grouped.length) return
    const sections = grouped
      .map((c) => document.getElementById(`cat-${c.id}`))
      .filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) {
          const id = visible[0].target.id.replace('cat-', '')
          setActiveId(id)
        }
      },
      { rootMargin: '-140px 0px -60% 0px', threshold: [0, 0.2, 0.5, 1] }
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [grouped])

  // reveal-on-scroll
  useScrollReveal(items)

  // open lightbox from any element carrying data-lightbox
  const onClick = (e) => {
    const t = e.target.closest('[data-lightbox]')
    if (t && t.dataset.lightbox) {
      setLightbox({ src: t.dataset.lightbox, title: t.getAttribute('aria-label') })
    }
  }

  const handleSelect = (c) => {
    setActiveId(c.id)
    const el = document.getElementById(`cat-${c.id}`)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 130
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div onClick={onClick} className="min-h-screen">
      {/* ===== SPLASH / LANDING ===== */}
      {showSplash && (
        <Splash
          logo={logo}
          name="مطعم طلة بحر"
          tagline="طعم البحر على طبقك"
          onEnter={() => setShowSplash(false)}
        />
      )}

      {/* ===== HEADER (sticky, responsive) ===== */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-2/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-4 sm:py-3 md:px-6 md:py-4">
          <img
            src={logo}
            alt=""
            className="h-10 w-10 rounded-full ring-1 ring-accent/40 sm:h-11 sm:w-11 md:h-12 md:w-12"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold leading-tight text-accent sm:text-xl md:text-2xl" style={{ fontFamily: "'Cairo', sans-serif" }}>
              {restaurantName}
            </h1>
            <p className="truncate text-[11px] text-text/60 sm:text-xs">{tagline}</p>
          </div>
          <span className="hidden rounded-full bg-white/5 px-3 py-1 text-[11px] text-text/50 md:block">
            قائمة الطعام
          </span>
        </div>
      </header>

      {/* ===== CATEGORY TABS ===== */}
      {!loading && grouped.length > 0 && (
        <CategoryTabs categories={grouped} activeId={activeId} onSelect={handleSelect} />
      )}

      {/* ===== HERO BANNER ===== */}
      <section className="relative overflow-hidden px-4 pb-2 pt-6 sm:px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-accent/15 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-5 text-center sm:p-8 md:rounded-3xl md:p-10"
        >
          <WaveDivider className="absolute inset-x-0 top-0" opacity={0.18} />
          <img
            src={logo}
            alt=""
            className="mx-auto mb-3 h-14 w-14 rounded-full ring-2 ring-accent/40 sm:h-16 sm:w-16"
          />
          <h2 className="text-2xl font-bold text-accent sm:text-3xl md:text-5xl" style={{ fontFamily: "'Cairo', sans-serif" }}>
            {restaurantName}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text/65 sm:text-base">{tagline}</p>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-xs font-semibold text-accent/80">مأكولات بحرية طازجة</span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </div>
          <WaveDivider className="absolute inset-x-0 bottom-0 rotate-180" opacity={0.18} />
        </motion.div>
      </section>

      {/* ===== CONTENT ===== */}
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-4 md:px-6 md:pb-20">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
            تعذّر تحميل القائمة: {error}
          </div>
        )}

        {loading && <LoadingSkeleton />}

        {!loading && !error && grouped.length === 0 && (
          <div className="py-20 text-center text-text/50">لا توجد أصناف متاحة حالياً.</div>
        )}

        {!loading &&
          grouped.map((cat) => (
            <section key={cat.id} id={`cat-${cat.id}`} className="mb-8 scroll-mt-28 sm:mb-10 sm:scroll-mt-32">
              <div className="mb-4 flex items-center gap-3">
                {cat.icon && <CategoryIcon name={cat.icon} className="text-accent" size={24} />}
                <h2 className="text-xl font-bold text-text sm:text-2xl" style={{ fontFamily: "'Cairo', sans-serif" }}>{cat.name_ar}</h2>
                <span className="leader-dots" />
                <span className="text-xs text-text/40">{cat.items.length} صنف</span>
              </div>
              {/* Responsive grid: 1 col mobile → 2 tablet → 3-4 desktop */}
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
                }}
              >
                {cat.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 bg-surface-2/60">
        <WaveDivider className="opacity-60" opacity={0.15} />
        <div className="mx-auto max-w-5xl px-4 py-8 text-center sm:px-6 md:px-6 md:py-10">
          <img src={logo} alt="" className="mx-auto mb-3 h-10 w-10 rounded-full sm:h-12 sm:w-12" />
          <h3 className="text-lg font-bold text-accent sm:text-xl" style={{ fontFamily: "'Cairo', sans-serif" }}>{restaurantName}</h3>
          <p className="mt-1 text-xs text-text/50">
            شكراً لزيارتكم — نتمنى لكم تجربة بحرية مميزة
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {settings?.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/5 text-accent transition hover:bg-accent hover:text-surface-2"
              >
                <Phone size={18} />
              </a>
            )}
            {settings?.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/5 text-accent transition hover:bg-accent hover:text-surface-2"
              >
                <Instagram size={18} />
              </a>
            )}
            {settings?.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/5 text-accent transition hover:bg-accent hover:text-surface-2"
              >
                <MessageCircle size={18} />
              </a>
            )}
          </div>
          <p className="mt-6 text-[11px] text-text/30">
            Powered by {restaurantName} · الأسعار بالـ {CURRENCY}
          </p>
        </div>
      </footer>

      {demo && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-accent/40 bg-surface-2/95 px-4 py-2 text-center text-[11px] text-accent shadow-xl backdrop-blur">
          وضع المعاينة — لربط قاعدة البيانات الحقيقية، أضف مفاتيح Supabase في ملف <code className="font-mono">.env</code>
        </div>
      )}

      <Lightbox
        src={lightbox?.src}
        title={lightbox?.title}
        onClose={() => setLightbox(null)}
      />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[0, 1, 2].map((g) => (
        <div key={g}>
          <div className="skeleton mb-4 h-7 w-40 rounded-lg" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
                <div className="skeleton h-20 w-20 rounded-xl" />
                <div className="flex-1 space-y-2 pt-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-5 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
