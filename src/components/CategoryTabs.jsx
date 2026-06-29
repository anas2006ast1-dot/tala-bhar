import { useEffect, useRef } from 'react'

/**
 * Sticky horizontal-scrollable category tabs with snap scrolling.
 * Clicking a tab smooth-scrolls to that category section.
 */
export default function CategoryTabs({ categories, activeId, onSelect }) {
  const scroller = useRef(null)
  const activeBtn = useRef(null)

  // keep the active tab scrolled into view INSIDE the tab bar (horizontal only)
  // We avoid scrollIntoView because it can also scroll the page vertically,
  // which yanks the user back to the top while they're scrolling the menu.
  useEffect(() => {
    const btn = activeBtn.current
    const bar = scroller.current
    if (!btn || !bar) return
    const barRect = bar.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    // only scroll horizontally if the active button is outside the visible area
    if (btnRect.right > barRect.right) {
      bar.scrollBy({ left: btnRect.right - barRect.right + 16, behavior: 'smooth' })
    } else if (btnRect.left < barRect.left) {
      bar.scrollBy({ left: btnRect.left - barRect.left - 16, behavior: 'smooth' })
    }
    // NOTE: never touch window.scrollY / vertical page scroll
  }, [activeId])

  return (
    <div className="sticky top-[56px] z-30 border-y border-white/5 bg-surface-2/90 backdrop-blur-md sm:top-[60px] md:top-[68px]">
      <div
        ref={scroller}
        className="no-scrollbar snap-tabs flex gap-2 overflow-x-auto px-3 py-2.5 sm:gap-2 sm:py-3 md:gap-3"
      >
        {categories.map((c) => {
          const active = c.id === activeId
          return (
            <button
              key={c.id}
              ref={active ? activeBtn : null}
              onClick={() => onSelect(c)}
              className={`group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200 sm:px-4 sm:py-2 md:px-4 md:py-2.5 ${
                active
                  ? 'border-accent bg-accent text-surface-2 shadow-lg shadow-accent/20'
                  : 'border-white/10 bg-white/5 text-text/80 hover:border-accent/50 hover:text-accent'
              }`}
            >
              {c.icon && <span className="text-base leading-none sm:text-lg">{c.icon}</span>}
              <span>{c.name_ar}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
