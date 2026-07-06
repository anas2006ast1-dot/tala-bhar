import { memo } from 'react'
import { Flame, ImageIcon } from 'lucide-react'
import { CURRENCY } from '../lib/supabaseClient'

function MenuItemCard({ item }) {
  const unavailable = !item.is_available
  return (
    <article
      className={`reveal group relative overflow-hidden rounded-2xl border p-3 transition-all duration-300 sm:p-3 md:rounded-2xl md:p-4 ${
        unavailable
          ? 'border-accent/5 bg-white/30 opacity-60'
          : 'border-accent/10 bg-white/60 hover:border-accent/40 hover:bg-white/80 hover:shadow-xl hover:shadow-accent/10'
      }`}
    >
      {/* featured badge */}
      {item.is_featured && (
        <span className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-surface shadow sm:right-3 sm:top-3 sm:text-[11px]">
          <Flame size={12} /> موصى به
        </span>
      )}

      {/* ── Mobile: horizontal layout (flex-row) ── */}
      {/* ── Tablet+ (md): vertical layout (flex-col) ── */}
      <div className="flex gap-3 sm:gap-3 md:flex-col md:gap-0">
        {/* image */}
        <button
          type="button"
          disabled={!item.image_url}
          data-lightbox={item.image_url || ''}
          className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-accent/5 md:mb-3 md:h-44 md:w-full ${
            item.image_url ? 'cursor-zoom-in' : 'cursor-default'
          } h-[88px] w-[88px] sm:h-24 sm:w-24`}
          aria-label={item.name_ar}
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name_ar}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <ImageIcon className="text-accent/25" />
          )}
          {unavailable && (
            <span className="absolute inset-0 grid place-items-center bg-black/60 text-xs font-bold text-white">
              غير متوفر
            </span>
          )}
        </button>

        {/* content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between pt-0.5 sm:pt-1.5 md:pt-0">
          <div>
            <h3 className="truncate text-[0.95rem] font-bold leading-tight text-text sm:text-base md:text-[1.05rem]">
              {item.name_ar}
            </h3>
            {item.description_ar && (
              <p className="mt-1 line-clamp-2 text-[0.78rem] leading-relaxed text-text/55 sm:text-xs md:text-[0.82rem]">
                {item.description_ar}
              </p>
            )}
          </div>
          <div className="mt-1.5 flex items-end gap-2 sm:mt-2 sm:pt-1 md:mt-2 md:pt-0">
            {Number(item.price) > 0 ? (
              <span className="inline-flex items-baseline gap-1 rounded-lg border border-gold/60 bg-white/50 px-2.5 py-0.5">
                <span className="text-[1rem] font-extrabold text-accent sm:text-lg md:text-[1.15rem]">
                  {Number(item.price).toLocaleString('en-US')}
                </span>
                <span className="text-xs font-semibold text-accent/80">{CURRENCY}</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-text/50">اسأل عن السعر</span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default memo(MenuItemCard)
