import { useEffect, useState } from 'react'

/**
 * Full-screen landing/splash for مطعم طلة بحر SeaView.
 * بهوية المنيو: ورق كريمي، كحلي بحري، أمواج زرقاء.
 * Props:
 *   - logo:    logo image url (defaults to /logo.jpg)
 *   - name:    restaurant name (Arabic)
 *   - tagline: tagline (Arabic)
 *   - onEnter: fired when user clicks the CTA (after the fade-out completes)
 */
export default function Splash({ logo = '/logo.jpg', name = 'مطعم طلة بحر', tagline = 'مطعم مأكولات بحرية فاخر', onEnter }) {
  const [leaving, setLeaving] = useState(false)

  const enter = () => {
    if (leaving) return
    setLeaving(true)
    // after the fade-out finishes, tell the parent to reveal the menu
    window.setTimeout(() => onEnter?.(), 500)
  }

  // lock body scroll while splash is visible
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // staggered entrance delays (seconds)
  const d = {
    line: '0s',
    logo: '0.2s',
    tagline: '0.6s',
    dots: '0.8s',
    button: '1.0s',
  }

  return (
    <div className={`splash${leaving ? ' splash-leaving' : ''}`} role="dialog" aria-label={name}>
      {/* ===== floating fish (very subtle) ===== */}
      <div className="splash-fish-layer" aria-hidden>
        <Fish top="22%" size={22} duration="34s" delay="-6s" opacity={0.09} />
        <Fish top="46%" size={16} duration="46s" delay="-18s" opacity={0.07} />
        <Fish top="68%" size={28} duration="38s" delay="-2s" opacity={0.09} />
        <Fish top="33%" size={14} duration="52s" delay="-30s" opacity={0.06} />
        <Fish top="58%" size={20} duration="42s" delay="-12s" opacity={0.07} />
      </div>

      {/* ===== centered content ===== */}
      <div className="relative flex flex-col items-center" style={{ zIndex: 2 }}>
        {/* top decorative line */}
        <span
          className="splash-item splash-fade-up"
          style={{ animationDelay: d.line, display: 'block', height: '1px', width: '120px', background: 'linear-gradient(90deg, transparent, #5b9bd5, transparent)' }}
        />

        {/* logo — يتضمن اسم المطعم بالخط العربي */}
        <div className="splash-item splash-fade-scale splash-logo-glow relative my-6" style={{ animationDelay: d.logo }}>
          <img
            src={logo}
            alt={name}
            style={{
              width: '260px',
              maxWidth: '72vw',
              borderRadius: '18px',
              filter: 'drop-shadow(0 6px 24px rgba(29, 58, 94, 0.18))',
            }}
            className="h-auto w-[260px] sm:w-[320px]"
          />
        </div>

        {/* tagline */}
        <p
          className="splash-item splash-fade-up"
          style={{
            animationDelay: d.tagline,
            fontFamily: "'Cairo', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: '1.05rem',
            color: '#3f5c78',
            margin: '0 0 1.1rem',
            letterSpacing: '0.5px',
          }}
        >
          {tagline}
        </p>

        {/* decorative dots */}
        <div
          className="splash-item splash-fade-up"
          style={{ animationDelay: d.dots, display: 'flex', gap: '8px', marginBottom: '1.6rem' }}
          aria-hidden
        >
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1d3a5e' }} />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={enter}
          className="splash-item splash-fade-up splash-cta"
          style={{ animationDelay: d.button }}
        >
          اكتشف قائمتنا ←
        </button>
      </div>

      {/* ===== bottom waves (كأمواج أسفل صفحات المنيو) ===== */}
      <div className="splash-waves" aria-hidden>
        <svg className="splash-wave splash-wave--back" viewBox="0 0 1200 110" preserveAspectRatio="none">
          <path d="M0,60 C150,100 300,20 450,60 C600,100 750,20 900,60 C1050,100 1200,20 1200,20 L1200,110 L0,110 Z" fill="#5b9bd5" />
        </svg>
        <svg className="splash-wave splash-wave--front" viewBox="0 0 1200 110" preserveAspectRatio="none">
          <path d="M0,70 C150,30 300,110 450,70 C600,30 750,110 900,70 C1050,30 1200,110 1200,110 L1200,110 L0,110 Z" fill="#1d3a5e" />
        </svg>
      </div>
    </div>
  )
}

/* tiny drifting fish */
function Fish({ top, size = 18, duration = '40s', delay = '0s', opacity = 0.08 }) {
  return (
    <svg
      className="splash-fish"
      width={size}
      height={size * 0.6}
      viewBox="0 0 50 30"
      style={{ top, animationDuration: duration, animationDelay: delay, opacity }}
    >
      <path
        d="M5 15 C12 5, 30 5, 38 15 C30 25, 12 25, 5 15 Z M38 15 L48 7 L48 23 Z"
        fill="#1d3a5e"
      />
      <circle cx="13" cy="13" r="1.4" fill="#f7f2e8" />
    </svg>
  )
}
