// 生成 PWA 图标（纯 Node，无第三方依赖）
// 用法: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'icons')

const BG = [0, 127, 176]
const FG = [255, 255, 255]

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

function render(size, padRatio = 0, radiusRatio = 0.24, glyphRatio = 1) {
  const ss = 3
  const S = size * ss
  const buf = new Uint8Array(S * S * 4)
  const pad = S * padRatio
  const c = S * 0.5
  const g = glyphRatio

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4
      let color = null
      if (inRoundRect(x, y, pad, pad, S - pad, S - pad, (S - 2 * pad) * radiusRatio)) {
        color = BG
        // 白色标签（围绕中心按 glyphRatio 缩放）
        const tagX0 = c + (-0.24 * g) * S
        const tagX1 = c + (0.24 * g) * S
        const tagY0 = c + (-0.17 * g) * S
        const tagY1 = c + (0.17 * g) * S
        if (inRoundRect(x, y, tagX0, tagY0, tagX1, tagY1, S * 0.05 * g)) color = FG
        // 标签上的圆孔
        if (inCircle(x, y, c + (-0.11 * g) * S, c, S * 0.055 * g)) color = BG
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
// [文件名, 尺寸, 内边距, 圆角比例, 图形缩放]
// maskable 与 apple-touch 满版铺底，避免透明边被系统填黑
const targets = [
  ['icon-192-v2.png', 192, 0, 0.24, 1],
  ['icon-512-v2.png', 512, 0, 0.24, 1],
  ['maskable-512-v2.png', 512, 0, 0, 0.8],
  ['apple-touch-icon-v2.png', 180, 0, 0, 1],
]
for (const [name, size, pad, radius, glyph] of targets) {
  const png = encodePng(size, size, render(size, pad, radius, glyph))
  writeFileSync(join(OUT_DIR, name), png)
  console.log('wrote', name, `${size}x${size}`)
}
