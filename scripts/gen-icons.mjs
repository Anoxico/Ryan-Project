// 生成 PWA 图标（纯 Node，无第三方依赖）
// 用法: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'icons')

const BG = [10, 10, 12]
const FG = [245, 245, 247]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return (~c) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function inRoundRect(px, py, x0, y0, x1, y1, r) {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false
  const cx = Math.min(Math.max(px, x0 + r), x1 - r)
  const cy = Math.min(Math.max(py, y0 + r), y1 - r)
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= r * r
}

function inCircle(px, py, cx, cy, r) {
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= r * r
}

function render(size, padRatio = 0, radiusRatio = 0.24) {
  const ss = 3
  const S = size * ss
  const buf = new Uint8Array(S * S * 4)
  const pad = S * padRatio

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4
      let color = null
      if (inRoundRect(x, y, pad, pad, S - pad, S - pad, (S - 2 * pad) * radiusRatio)) {
        color = BG
        // 白色标签
        const tagX0 = S * 0.26
        const tagX1 = S * 0.74
        const tagY0 = S * 0.33
        const tagY1 = S * 0.67
        if (inRoundRect(x, y, tagX0, tagY0, tagX1, tagY1, S * 0.05)) color = FG
        // 标签上的圆孔
        if (inCircle(x, y, S * 0.39, S * 0.5, S * 0.055)) color = BG
      }
      if (color) {
        buf[i] = color[0]
        buf[i + 1] = color[1]
        buf[i + 2] = color[2]
        buf[i + 3] = 255
      }
    }
  }

  // 下采样（超采样抗锯齿）
  const out = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let dy = 0; dy < ss; dy++) {
        for (let dx = 0; dx < ss; dx++) {
          const si = ((y * ss + dy) * S + (x * ss + dx)) * 4
          r += buf[si]
          g += buf[si + 1]
          b += buf[si + 2]
          a += buf[si + 3]
        }
      }
      const n = ss * ss
      const oi = (y * size + x) * 4
      out[oi] = Math.round(r / n)
      out[oi + 1] = Math.round(g / n)
      out[oi + 2] = Math.round(b / n)
      out[oi + 3] = Math.round(a / n)
    }
  }
  return out
}

mkdirSync(OUT_DIR, { recursive: true })
const targets = [
  ['icon-192.png', 192, 0, 0.24],
  ['icon-512.png', 512, 0, 0.24],
  ['maskable-512.png', 512, 0.14, 0.32],
  ['apple-touch-icon.png', 180, 0, 0.24],
]
for (const [name, size, pad, radius] of targets) {
  const png = encodePng(size, size, render(size, pad, radius))
  writeFileSync(join(OUT_DIR, name), png)
  console.log('wrote', name, `${size}x${size}`)
}
