import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Printer } from 'lucide-react'
import { RESTAURANT_NAME } from '../lib/supabaseClient'

/**
 * Customizable QR code generator + PNG download + print.
 * Responsive QR sizes: 200px mobile, 250px tablet, 300px desktop.
 */
export default function QRCodeDisplay({ url, restaurantName = RESTAURANT_NAME }) {
  const qrRef = useRef(null)
  const [fg, setFg] = useState('#0f1d33')
  const [bg, setBg] = useState('#ffffff')
  const [size, setSize] = useState(220)
  const [includeLabel, setIncludeLabel] = useState(true)

  const downloadPNG = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const out = document.createElement('canvas')
    const pad = 40
    const labelH = includeLabel ? 70 : 0
    out.width = size + pad * 2
    out.height = size + pad * 2 + labelH
    const ctx = out.getContext('2d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(canvas, pad, pad)
    if (includeLabel) {
      ctx.fillStyle = fg
      ctx.font = 'bold 32px Cairo, sans-serif'
      ctx.textAlign = 'center'
      ctx.direction = 'rtl'
      ctx.fillText(restaurantName, out.width / 2, out.height - 25)
    }
    const link = document.createElement('a')
    link.download = 'qr-menu.png'
    link.href = out.toDataURL('image/png')
    link.click()
  }

  const print = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const data = canvas.toDataURL('image/png')
    const w = window.open('', '_blank')
    w.document.write(`
      <html dir="rtl"><head><title>${restaurantName} - QR</title>
      <style>body{margin:0;display:grid;place-items:center;height:100vh;font-family:Cairo,sans-serif}
      img{width:340px}h1{color:#0f1d33}</style></head>
      <body><div style="text-align:center">
      ${includeLabel ? `<h1>${restaurantName}</h1>` : ''}
      <img src="${data}"/><p style="color:#888;margin-top:16px">امسح الكود لعرض القائمة</p>
      </div></body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  return (
    <div className="space-y-6">
      {/* QR + info — stacks on mobile, side-by-side on tablet+ */}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 p-5 sm:flex-row sm:items-start sm:p-6">
        <div ref={qrRef} className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
          <QRCodeCanvas value={url} size={size} fgColor={fg} bgColor={bg} level="H" includeMargin={false} />
        </div>
        <div className="flex-1 text-center sm:text-right">
          <h4 className="text-lg font-bold text-gray-900">{restaurantName}</h4>
          <p className="mt-1 break-all text-sm text-gray-500">{url}</p>
          <p className="mt-2 text-xs text-gray-400">وجّه هذا الكود لرابط القائمة العامة</p>
          {includeLabel && (
            <p className="mt-3 text-xl font-bold text-primary" style={{ fontFamily: "'Cairo', sans-serif" }}>{restaurantName}</p>
          )}
        </div>
      </div>

      {/* customizer — 2 cols mobile, 3 cols tablet+ */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <ColorField label="لون الكود" value={fg} onChange={setFg} />
        <ColorField label="لون الخلفية" value={bg} onChange={setBg} />
        <div className="col-span-2 sm:col-span-1">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">الحجم</span>
          <input
            type="range" min="160" max="320" step="20" value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-[#1d3a5e]"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={includeLabel} onChange={(e) => setIncludeLabel(e.target.checked)} className="accent-[#1d3a5e]" />
        إظهار اسم المطعم أسفل الكود
      </label>

      {/* buttons — full width on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={downloadPNG}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark"
        >
          <Download size={18} /> تحميل PNG
        </button>
        <button
          onClick={print}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Printer size={18} /> طباعة
        </button>
      </div>
    </div>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
      <input
        type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white"
      />
    </label>
  )
}
