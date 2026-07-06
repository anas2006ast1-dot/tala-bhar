/**
 * Decorative SVG wave band — طلة بحر sea motif.
 */
export default function WaveDivider({ className = '', color = '#5b9bd5', opacity = 0.25 }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden>
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="w-full h-[28px] sm:h-[40px]"
      >
        <path
          d="M0,30 C100,58 200,2 300,30 C400,58 500,2 600,30 C700,58 800,2 900,30 C1000,58 1100,2 1200,30 L1200,60 L0,60 Z"
          fill={color}
          opacity={opacity}
        />
      </svg>
    </div>
  )
}
