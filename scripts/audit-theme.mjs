import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const files = execSync('git ls-files "src/**/*.tsx" "src/**/*.ts"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)

const DARK_ALLOWED = new Set([
  'src/components/photo/Lightbox.tsx',
  'src/components/photo/PhotoUploader.tsx',
  'src/components/store/StoreCard.tsx',
  'src/components/ui/dialog.tsx',
])

const WHITE_ALLOWED_PATTERNS = [
  /brand-strong/,
  /brand-pressed/,
  /color-danger/,
  /bg-black\//,
  /bg-\[rgba\(/,
  /glass-dark/,
  /text-\[var\(--color-on-dark/,
]

const violations = []

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    const at = `${file}:${i + 1}`
    if (/color-scheme:\s*dark/.test(line)) violations.push(`${at} color-scheme:dark`)
    if (/--color-accent/.test(line)) violations.push(`${at} --color-accent 残留`)
    if (/text-black/.test(line)) violations.push(`${at} text-black 残留`)
    if (/bg-white\b(?!\/)/.test(line) && /text-black/.test(line)) {
      violations.push(`${at} bg-white text-black`)
    }
    if (/bg-black\b(?!\/)/.test(line) && !DARK_ALLOWED.has(file)) {
      violations.push(`${at} bg-black 仅允许深色遮罩文件`)
    }
    if (/text-white/.test(line)) {
      const ok = WHITE_ALLOWED_PATTERNS.some((re) => re.test(line))
      if (!ok) violations.push(`${at} text-white 未在白名单场景`)
    }
  })
}

if (violations.length > 0) {
  console.error('主题审计失败：')
  for (const v of violations) console.error('  ' + v)
  process.exit(1)
}

console.log('主题审计通过')
