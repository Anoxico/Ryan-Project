import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

function token(name) {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match) throw new Error(`缺少 --color-${name}`)
  return match[1]
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const checks = [
  ['brand-strong', 'surface', 4.5, '主按钮白字'],
  ['brand-text', 'surface', 4.5, '蓝字/白'],
  ['brand-text', 'bg', 4.5, '蓝字/页面底'],
  ['fg', 'surface', 4.5, '正文/白'],
  ['fg', 'bg', 4.5, '正文/页面底'],
  ['fg-dim', 'surface', 4.5, '次要/白'],
  ['fg-dim', 'bg', 4.5, '次要/页面底'],
  ['muted', 'surface', 4.5, '提示/白'],
  ['muted', 'bg', 4.5, '提示/页面底'],
  ['danger', 'surface', 4.5, '危险/白'],
  ['danger', 'danger-soft', 4.5, '危险/浅红底'],
  ['success', 'surface', 4.5, '成功/白'],
  ['success', 'success-soft', 4.5, '成功/浅绿底'],
  ['warning', 'surface', 4.5, '警告/白'],
  ['warning', 'warning-soft', 4.5, '警告/浅黄底'],
  ['brand', 'surface', 3, '品牌图形/白'],
  ['brand', 'bg', 3, '品牌图形/页面底'],
  ['control', 'surface', 3, '控件描边/白'],
  ['control', 'bg', 3, '控件描边/页面底'],
]

let failed = false
for (const [fg, bg, min, label] of checks) {
  const value = ratio(token(fg), token(bg))
  const ok = value >= min
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${label}: ${token(fg)} on ${token(bg)} = ${value.toFixed(2)} (>= ${min})`,
  )
  if (!ok) failed = true
}

if (failed) process.exit(1)
