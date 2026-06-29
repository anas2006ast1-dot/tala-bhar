// One-off: render public/logo.svg -> PNG icons (192 + 512).
// Uses the Canvas API in Node via the @napi-rs/canvas fallback OR a pure
// hand-drawn PNG. To avoid extra deps, we draw the logo ourselves onto a
// canvas using the `canvas` package if present; otherwise we generate a
// simple gold-on-navy PNG via raw zlib encoding.
//
// Run: node scripts/gen-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import zlib from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

// Minimal 32-bit RGBA PNG encoder (no deps).
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  // add filter byte (0) at start of each row
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw)
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Software raster of the طلة بحر logo (navy bg + gold ring/fish/waves)
// adapted from public/logo.svg (viewBox 0 0 120 120).
function paint(size) {
  const w = size, h = size
  const rgba = Buffer.alloc(w * h * 4)
  const s = w / 120 // scale factor from 120x120 artboard

  const px = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y)
    if (ix < 0 || iy < 0 || ix >= w || iy >= h) return null
    return iy * w * 4 + ix * 4
  }
  const setP = (x, y, [r, g, b, a]) => {
    const o = px(x, y)
    if (o == null) return
    // alpha over
    const da = a / 255
    const ra = rgba[o + 3] / 255
    const outA = da + ra * (1 - da)
    if (outA === 0) return
    rgba[o]     = Math.round((r * da + rgba[o]     * ra * (1 - da)) / outA)
    rgba[o + 1] = Math.round((g * da + rgba[o + 1] * ra * (1 - da)) / outA)
    rgba[o + 2] = Math.round((b * da + rgba[o + 2] * ra * (1 - da)) / outA)
    rgba[o + 3] = Math.round(outA * 255)
  }
  const fillRect = (x0, y0, x1, y1, col) => {
    for (let y = Math.floor(y0); y < y1; y += 1)
      for (let x = Math.floor(x0); x < x1; x += 1) setP(x, y, col)
  }

  // background (rounded-ish, full bleed navy)
  fillRect(0, 0, w, h, [10, 22, 40, 255])

  const cx = 60 * s, cy = 60 * s, R = 56 * s
  const goldA = [232, 184, 109, 255]
  const goldB = [200, 155, 78, 255]

  // gold ring (annulus)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dx = x - cx, dy = y - cy
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d <= R && d >= R - 3 * s) {
        const t = (x + y) / (w + h)
        setP(x, y, [
          Math.round(goldA[0] * (1 - t) + goldB[0] * t),
          Math.round(goldA[1] * (1 - t) + goldB[1] * t),
          Math.round(goldA[2] * (1 - t) + goldB[2] * t),
          255,
        ])
      }
    }
  }

  // fish body (filled ellipse-ish) — approximate with filled circle cluster
  const fillBlob = (fx, fy, rx, ry, col) => {
    for (let y = Math.floor(fy - ry); y < fy + ry; y += 1)
      for (let x = Math.floor(fx - rx); x < fx + rx; x += 1) {
        const nx = (x - fx) / rx, ny = (y - fy) / ry
        if (nx * nx + ny * ny <= 1) setP(x, y, col)
      }
  }
  // main body
  fillBlob(54 * s, 60 * s, 24 * s, 16 * s, goldA)
  // tail (triangle)
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) {
      // triangle apex at (78,60), base (92,48)-(92,72)
      const inside =
        x >= 78 * s && x <= 92 * s &&
        y >= (48 + (x - 78) * (12 / 14)) * s &&
        y <= (72 - (x - 78) * (12 / 14)) * s
      if (inside) setP(x, y, goldA)
    }
  // eye (navy dot)
  fillBlob(40 * s, 57 * s, 2.6 * s, 2.6 * s, [15, 29, 51, 255])

  // waves — two wavy strokes near bottom
  const wave = (baseY, col) => {
    for (let x = 0; x < w; x += 1) {
      const y = baseY * s + Math.sin((x / s) * 0.4) * 3 * s
      for (let t = -1.2 * s; t <= 1.2 * s; t += 1) setP(x, y + t, col)
    }
  }
  wave(84, goldA)
  wave(94, goldB)

  return encodePNG(w, h, rgba)
}

writeFileSync(join(publicDir, 'icon-192.png'), paint(192))
writeFileSync(join(publicDir, 'icon-512.png'), paint(512))
console.log('icons written: icon-192.png, icon-512.png')
