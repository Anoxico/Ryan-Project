# 美的蓝 · 白底 UI 改版实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有“纯黑 + 红色强调 + 暗色毛玻璃”界面整体迁移为“白底 + 美的蓝”，并重新生成蓝色 PWA 图标。

**Architecture:** 以 CSS 自定义属性作为唯一颜色来源；`--color-accent` 语义收敛为危险色，新增 `--color-brand` 承载品牌；`.glass` 拆为内容卡片、固定层、深色控件三档；通过构建前脚本强制校验对比度与残留暗色类。

**Tech Stack:** React 18、Vite 6、Tailwind CSS 4、Radix Dialog、lucide-react、Vitest。

## Global Constraints

- 主按钮底色 `#007BA8`，白字，对比度 4.77。
- 品牌图形 `#0098D1`，仅用于图标、图表、选中线，不承载正文。
- 正文对比度 ≥ 4.5:1，图形/控件描边 ≥ 3:1。
- 照片查看器与图片遮罩保持深色。
- 不改业务逻辑、API、数据结构。
- 每个任务结束必须 `npm run build` 通过并提交。
- `text-white` 仅允许出现在品牌/危险按钮、深色遮罩、Lightbox、门店封面徽章。

---

## 设计令牌

| 令牌 | 值 | 用途 |
|---|---|---|
| `--color-brand` | `#0098D1` | 图标、图表、选中线 |
| `--color-brand-strong` | `#007BA8` | 主按钮、选中分段 |
| `--color-brand-pressed` | `#006C99` | 按下/悬浮 |
| `--color-brand-text` | `#0077A8` | 链接、小号蓝字 |
| `--color-brand-50` | `#EAF8FD` | 选中胶囊 |
| `--color-brand-100` | `#D6F1FB` | 虚线框、进度轨道 |
| `--color-bg` | `#F2F7FB` | 页面背景 |
| `--color-surface` | `#FFFFFF` | 卡片、输入框、弹层 |
| `--color-surface-2` | `#EDF3F8` | 次级填充、胶囊 |
| `--color-surface-3` | `#DCE7F1` | 强次级填充 |
| `--color-line` | `#DCE7F1` | 分隔线、装饰描边 |
| `--color-control` | `#7B90A5` | 可交互控件描边（≥3:1） |
| `--color-fg` | `#10212F` | 主文字 |
| `--color-fg-dim` | `#52677B` | 次要文字 |
| `--color-muted` | `#5B6E82` | 占位符、提示 |
| `--color-danger` | `#B42318` | 错误、删除 |
| `--color-danger-soft` | `#FEE2E2` | 危险浅底 |
| `--color-success` | `#0B7A54` | 成功 |
| `--color-success-soft` | `#DCFCE7` | 成功浅底 |
| `--color-warning` | `#92400E` | 草稿、警告 |
| `--color-warning-soft` | `#FEF3C7` | 警告浅底 |
| `--color-on-dark-dim` | `#A1A1A6` | 深色底次要文字 |

---

## Task 1: 主题令牌、全局背景、审计脚本

**Files:**
- Modify: `src/styles.css`
- Modify: `index.html`
- Modify: `vite.config.ts`
- Modify: `package.json`
- Create: `scripts/check-contrast.mjs`
- Create: `scripts/audit-theme.mjs`

**Interfaces:**
- Produces: CSS 令牌 `--color-brand`、`--color-brand-strong`、`--color-brand-pressed`、`--color-brand-text`、`--color-brand-50`、`--color-brand-100`、`--color-bg`、`--color-surface`、`--color-surface-2`、`--color-surface-3`、`--color-line`、`--color-control`、`--color-fg`、`--color-fg-dim`、`--color-muted`、`--color-danger`、`--color-danger-soft`、`--color-success`、`--color-success-soft`、`--color-warning`、`--color-warning-soft`、`--color-on-dark-dim`。
- Produces: 类 `.glass`（白卡）、`.glass-strong`（固定层）、`.glass-dark`（深色控件）、`.glow`（蓝色顶光）。
- Produces: npm 脚本 `check:contrast`、`audit:theme`、`prebuild`。

- [ ] **Step 1: 写对比度脚本**

`scripts/check-contrast.mjs`：

```js
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
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${token(fg)} on ${token(bg)} = ${value.toFixed(2)} (>= ${min})`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
```

- [ ] **Step 2: 写主题审计脚本**

`scripts/audit-theme.mjs`：

```js
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
```

- [ ] **Step 3: 运行审计，确认当前失败**

Run: `node scripts/audit-theme.mjs`
Expected: 非零退出并列出 `--color-accent`、`text-black`、`color-scheme:dark` 等违规。

- [ ] **Step 4: 重写 `src/styles.css`**

```css
@import 'tailwindcss';

@theme {
  /* 品牌：美的蓝 */
  --color-brand: #0098d1;
  --color-brand-strong: #007ba8;
  --color-brand-pressed: #006c99;
  --color-brand-text: #0077a8;
  --color-brand-50: #eaf8fd;
  --color-brand-100: #d6f1fb;

  /* 中性 */
  --color-bg: #f2f7fb;
  --color-surface: #ffffff;
  --color-surface-2: #edf3f8;
  --color-surface-3: #dce7f1;
  --color-line: #dce7f1;
  --color-control: #7b90a5;
  --color-fg: #10212f;
  --color-fg-dim: #52677b;
  --color-muted: #5b6e82;

  /* 语义 */
  --color-danger: #b42318;
  --color-danger-soft: #fee2e2;
  --color-success: #0b7a54;
  --color-success-soft: #dcfce7;
  --color-warning: #92400e;
  --color-warning-soft: #fef3c7;
  --color-on-dark-dim: #a1a1a6;

  --font-sans:
    'Inter', system-ui, -apple-system, 'SF Pro Text', 'PingFang SC', 'Noto Sans SC',
    'Microsoft YaHei', sans-serif;

  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
  --radius-2xl: 1.5rem;
  --radius-pill: 999px;

  --shadow-card: 0 1px 2px rgba(16, 42, 67, 0.04), 0 12px 32px -16px rgba(16, 42, 67, 0.18);
  --shadow-float: 0 12px 40px -12px rgba(0, 123, 168, 0.4);
}

@layer base {
  :root {
    color-scheme: light;
  }

  html {
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    margin: 0;
    min-height: 100dvh;
    background-color: var(--color-bg);
    background-image: radial-gradient(120% 60% at 50% 0%, #e8f7fe 0%, rgba(232, 247, 254, 0) 70%);
    background-repeat: no-repeat;
    background-size: 100% 420px;
    color: var(--color-fg);
    font-family: var(--font-sans);
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    overscroll-behavior-y: none;
  }

  h1,
  h2,
  h3 {
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
    color: inherit;
  }

  input,
  textarea {
    -webkit-appearance: none;
    appearance: none;
  }

  ::placeholder {
    color: var(--color-muted);
  }

  .safe-top {
    padding-top: env(safe-area-inset-top);
  }
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

@layer components {
  /* 内容卡片：白底 + 细描边 + 柔和阴影 */
  .glass {
    background: var(--color-surface);
    border: 1px solid var(--color-line);
    box-shadow: var(--shadow-card);
  }

  /* 固定层：TabBar / 底部弹层 */
  .glass-strong {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(16px) saturate(160%);
    -webkit-backdrop-filter: blur(16px) saturate(160%);
    border: 1px solid var(--color-line);
    box-shadow: var(--shadow-card);
  }

  /* 深色背景上的控件（照片查看器） */
  .glass-dark {
    background: rgba(10, 20, 30, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .squircle {
    border-radius: var(--radius-xl);
    corner-shape: squircle;
  }

  .hairline {
    border: 1px solid var(--color-line);
  }

  .glow {
    position: relative;
    isolation: isolate;
  }
  .glow::before {
    content: '';
    position: absolute;
    inset: -40% -20% auto -20%;
    height: 220px;
    background: radial-gradient(
      60% 60% at 50% 0%,
      rgba(0, 152, 209, 0.12) 0%,
      rgba(0, 152, 209, 0) 70%
    );
    z-index: -1;
    pointer-events: none;
  }

  @keyframes sheet-up {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .animate-sheet-up {
    animation: sheet-up 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    .animate-sheet-up,
    .animate-fade-in {
      animation: none;
    }
  }
}

@layer utilities {
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

- [ ] **Step 5: 更新 `index.html` 与 `vite.config.ts`**

`index.html`：
- `<meta name="theme-color" content="#007FB0" />`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default" />`
- 增加 `<meta name="color-scheme" content="light" />`

`vite.config.ts` manifest：
- `theme_color: '#007FB0'`
- `background_color: '#F2F7FB'`

- [ ] **Step 6: 增加 npm 脚本**

```json
"prebuild": "npm run check:contrast && npm run audit:theme",
"check:contrast": "node scripts/check-contrast.mjs",
"audit:theme": "node scripts/audit-theme.mjs"
```

- [ ] **Step 7: 验证令牌**

Run: `npm run check:contrast`
Expected: 19 项全部 PASS。

- [ ] **Step 8: 提交**

```bash
git add src/styles.css index.html vite.config.ts package.json scripts/check-contrast.mjs scripts/audit-theme.mjs
git commit -m "feat: switch theme tokens to Midea blue and white"
```

---

## Task 2: 基础组件

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/label.tsx`
- Modify: `src/components/ui/spinner.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/form/AutocompleteInput.tsx`

**Interfaces:**
- Consumes: Task 1 的令牌与 `.glass` 三档。
- Produces: `Button` 变体 `default | accent | glass | outline | ghost | destructive`；`Input`/`Textarea` 白底蓝焦环；`DialogOverlay` 浅色遮罩。

- [ ] **Step 1: 重写 `button.tsx`**

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-brand-strong)] text-white hover:bg-[var(--color-brand-pressed)] shadow-float',
        accent:
          'bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-strong)] text-white hover:brightness-105 shadow-float',
        glass: 'glass text-[var(--color-fg)] hover:bg-[var(--color-brand-50)]',
        outline:
          'border border-[var(--color-control)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-brand-strong)] hover:text-[var(--color-brand-text)]',
        ghost:
          'text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]',
        destructive:
          'bg-[var(--color-danger)] text-white hover:brightness-110 shadow-[0_8px_24px_-12px_rgba(180,35,24,0.5)]',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm rounded-[0.9rem]',
        default: 'h-11 px-5 text-[0.95rem] rounded-[1.05rem]',
        lg: 'h-13 px-6 text-base rounded-[1.2rem]',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)
```

- [ ] **Step 2: 更新 `card.tsx`**

```tsx
className={cn('glass squircle rounded-[var(--radius-xl)] p-5', className)}
```

- [ ] **Step 3: 更新 `input.tsx`**

Input：

```tsx
'flex h-12 w-full rounded-[1.05rem] bg-[var(--color-surface)] px-4 text-[1rem] text-[var(--color-fg)]',
'border border-[var(--color-control)] transition-colors',
'placeholder:text-[var(--color-muted)]',
'focus:outline-none focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand)]/10',
'disabled:cursor-not-allowed disabled:opacity-50',
```

Textarea 同样替换，`text-[1rem]`，`bg-[var(--color-surface)]`。

- [ ] **Step 4: 更新 `label.tsx`**

```tsx
'text-[0.78rem] font-semibold tracking-normal text-[var(--color-fg-dim)]',
```

- [ ] **Step 5: 更新 `spinner.tsx`**

```tsx
'inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-brand-100)] border-t-[var(--color-brand-strong)]',
```

- [ ] **Step 6: 更新 `dialog.tsx`**

- Overlay：`bg-[rgba(9,30,50,0.35)] backdrop-blur-sm`
- 拖拽条：`bg-[var(--color-line-strong)]`
- 关闭按钮：`text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]`

- [ ] **Step 7: 更新 `AutocompleteInput.tsx`**

- 选中项：`bg-[var(--color-brand-50)] text-[var(--color-brand-text)]`
- 普通项：`text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]`
- 创建项：`text-[var(--color-brand-text)] hover:bg-[var(--color-brand-50)]`

- [ ] **Step 8: 构建**

Run: `npm run build`
Expected: 通过（audit 仍会因页面未改而失败，此时先只运行 `npx tsc --noEmit`）。

- [ ] **Step 9: 提交**

```bash
git add src/components/ui src/components/form/AutocompleteInput.tsx
git commit -m "feat: restyle base UI primitives for light theme"
```

---

## Task 3: 外壳、Tab 栏、首页

**Files:**
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/layout/TabBar.tsx`
- Modify: `src/pages/HomePage.tsx`

**Interfaces:**
- Consumes: Task 1 令牌、Task 2 按钮。
- Produces: 无导出变化，仅样式。

- [ ] **Step 1: `AppShell.tsx`**

```tsx
<div className="min-h-[100dvh]">
```

- [ ] **Step 2: `TabBar.tsx`**

- 激活：`bg-[var(--color-brand-50)] text-[var(--color-brand-text)]`
- 未激活：`text-[var(--color-muted)]`
- 指示点：`bg-[var(--color-brand)]`
- 图标：激活 `strokeWidth={2.4}`，`drop-shadow-sm`

- [ ] **Step 3: `HomePage.tsx`**

- 搜索/刷新按钮：`glass` + `text-[var(--color-fg-dim)] hover:text-[var(--color-brand-text)]`
- 错误卡：`border-[var(--color-danger)]/30`，文字 `text-[var(--color-danger)]`
- 空状态图标容器：`bg-[var(--color-brand-50)]`，图标 `text-[var(--color-brand)]`
- FAB：`bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-strong)] shadow-float`

- [ ] **Step 4: 构建**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 5: 提交**

```bash
git add src/components/layout src/pages/HomePage.tsx
git commit -m "feat: restyle app shell, tab bar and home page"
```

---

## Task 4: 卡片与列表

**Files:**
- Modify: `src/components/survey/SurveyCard.tsx`
- Modify: `src/components/survey/SurveyRow.tsx`
- Modify: `src/components/store/StoreCard.tsx`
- Modify: `src/components/product/ProductCard.tsx`
- Modify: `src/pages/StoreDetailPage.tsx`
- Modify: `src/pages/SurveyDetailPage.tsx`

**Interfaces:**
- Consumes: Task 1 令牌、Task 2 卡片。
- Produces: 无导出变化。

- [ ] **Step 1: 统一替换**

| 旧 | 新 |
|---|---|
| `active:bg-white/[0.06]` | `active:bg-[var(--color-surface-2)]` |
| `bg-white/[0.06]` | `bg-[var(--color-surface-2)]` |
| `bg-white/[0.04]` | `bg-[var(--color-surface-2)]` |
| 数值 `text-white` | `text-[var(--color-fg)]` |
| `bg-[var(--color-accent)]/15 text-[var(--color-accent)]` | `bg-[var(--color-warning-soft)] text-[var(--color-warning)]` |
| `ring-[var(--color-accent)]` | `ring-[var(--color-brand)]` |
| 错误/删除 `text-[var(--color-accent)]` | `text-[var(--color-danger)]` |
| `hover:bg-white/5 hover:text-white` | `hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]` |

- [ ] **Step 2: `StoreCard.tsx`**

- 封面占位：`from-[var(--color-brand-50)] to-[var(--color-surface-2)]`
- 次数徽章保留 `bg-black/55 text-white`

- [ ] **Step 3: 详情页头部按钮**

- 返回/编辑：`glass` + `text-[var(--color-fg)]`
- 删除：`glass` + `text-[var(--color-danger)]`
- 批量操作条：`glass-strong`；已选数字 `text-[var(--color-fg)]`

- [ ] **Step 4: 构建**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 5: 提交**

```bash
git add src/components/survey src/components/store src/components/product/ProductCard.tsx src/pages/StoreDetailPage.tsx src/pages/SurveyDetailPage.tsx
git commit -m "feat: restyle cards and list views"
```

---

## Task 5: 表单与筛选

**Files:**
- Modify: `src/components/form/Field.tsx`
- Modify: `src/components/survey/SurveyForm.tsx`
- Modify: `src/components/product/ProductForm.tsx`
- Modify: `src/pages/FilterPage.tsx`
- Modify: `src/components/product/LabelRecognizer.tsx`
- Modify: `src/components/settings/AiSettingsCard.tsx`

**Interfaces:**
- Consumes: Task 1 令牌、Task 2 输入与按钮。
- Produces: 无导出变化。

- [ ] **Step 1: 错误色统一**

`Field.tsx`、`ProductForm.tsx`、`FilterPage.tsx`、`LabelRecognizer.tsx`、`AiSettingsCard.tsx`：
`--color-accent` → `--color-danger`。

- [ ] **Step 2: 草稿提示**

`SurveyForm.tsx`、`ProductForm.tsx`：
`bg-white/[0.05] text-[var(--color-fg-dim)]` → `bg-[var(--color-brand-50)] text-[var(--color-brand-text)]`。

- [ ] **Step 3: 日期与下拉**

- `SurveyForm.tsx`：`[color-scheme:dark]` → `[color-scheme:light]`
- `FilterPage.tsx`：两处 `[color-scheme:dark]` → `[color-scheme:light]`
- `FilterPage.tsx` 两个 select：`bg-[var(--color-surface)] text-[var(--color-fg)] border-[var(--color-control)]`，focus `border-[var(--color-brand)] ring-4 ring-[var(--color-brand)]/10`

- [ ] **Step 4: 选中态**

`SurveyForm.tsx`、`ProductForm.tsx`、`FilterPage.tsx` 中 `bg-white text-black` → `bg-[var(--color-brand-strong)] text-white`。

- [ ] **Step 5: 识别结果卡**

`LabelRecognizer.tsx`：
- 按钮 `variant="glass"` → `variant="outline"`
- 结果卡：`border border-[var(--color-brand-100)] bg-[var(--color-brand-50)]`
- 标题：`text-[var(--color-brand-text)]`
- 复选框文字：`text-[var(--color-fg-dim)]`

- [ ] **Step 6: 构建**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 7: 提交**

```bash
git add src/components/form/Field.tsx src/components/survey/SurveyForm.tsx src/components/product/ProductForm.tsx src/components/product/LabelRecognizer.tsx src/components/settings/AiSettingsCard.tsx src/pages/FilterPage.tsx
git commit -m "feat: restyle forms and filters for light theme"
```

---

## Task 6: 照片组件

**Files:**
- Modify: `src/components/photo/PhotoUploader.tsx`
- Modify: `src/components/photo/Lightbox.tsx`

**Interfaces:**
- Consumes: Task 1 的 `.glass-dark`、`--color-on-dark-dim`、`--color-danger`。
- Produces: 无导出变化。

- [ ] **Step 1: `PhotoUploader.tsx`**

- 上传中遮罩 `bg-black/50` 保留。
- 删除按钮 `bg-black/60 text-white` 保留。
- 失败遮罩：`bg-[var(--color-danger)]/85 text-white`
- 添加方块：`border border-dashed border-[var(--color-brand-100)] bg-[var(--color-brand-50)]/50 text-[var(--color-brand-text)]`，`hover:border-[var(--color-brand)]`，`active:bg-[var(--color-brand-100)]`

- [ ] **Step 2: `Lightbox.tsx`**

- 三个控件 `glass` → `glass-dark`
- 计数文字：`text-[var(--color-on-dark-dim)]`
- 背景 `bg-black/95` 保留

- [ ] **Step 3: 构建**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 4: 提交**

```bash
git add src/components/photo
git commit -m "feat: restyle photo uploader and keep dark lightbox controls"
```

---

## Task 7: 其余页面

**Files:**
- Modify: `src/pages/SetupPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/pages/DictPage.tsx`
- Modify: `src/pages/RecycleBinPage.tsx`
- Modify: `src/pages/SurveyEditPage.tsx`
- Modify: `src/pages/ProductEditPage.tsx`

**Interfaces:**
- Consumes: Task 1–2。
- Produces: 无导出变化。

- [ ] **Step 1: `SetupPage.tsx`**

`<div className="glow min-h-[100dvh] bg-black">` → `<div className="glow min-h-[100dvh]">`；错误 `text-[var(--color-danger)]`。

- [ ] **Step 2: `SettingsPage.tsx`**

- 4 处 `text-white` → `text-[var(--color-fg)]`
- Row 图标加 `text-[var(--color-brand)]`
- 危险按钮保持 `destructive`

- [ ] **Step 3: `DictPage.tsx`**

- 类型选中：`bg-[var(--color-brand-strong)] text-white`
- 类别选中：`border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] text-[var(--color-brand-text)]`
- 类别未选中：`bg-[var(--color-surface-2)] text-[var(--color-fg-dim)]`
- 错误/删除：`text-[var(--color-danger)]`
- 编辑项容器 `glass` 保持不变

- [ ] **Step 4: `RecycleBinPage.tsx`**

- 清空/错误：`text-[var(--color-danger)]`
- 剩余天数徽章：`bg-[var(--color-warning-soft)] text-[var(--color-warning)]`
- 返回按钮 `text-[var(--color-fg)]`

- [ ] **Step 5: 编辑页**

`SurveyEditPage.tsx`、`ProductEditPage.tsx`：
- 返回按钮 `text-[var(--color-fg)]`
- 加载错误 `text-[var(--color-danger)]`

- [ ] **Step 6: 构建**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 7: 提交**

```bash
git add src/pages/SetupPage.tsx src/pages/SettingsPage.tsx src/pages/DictPage.tsx src/pages/RecycleBinPage.tsx src/pages/SurveyEditPage.tsx src/pages/ProductEditPage.tsx
git commit -m "feat: restyle remaining pages for light theme"
```

---

## Task 8: 图表与统计

**Files:**
- Modify: `src/components/stats/Charts.tsx`
- Modify: `src/pages/StatsPage.tsx`

**Interfaces:**
- Consumes: Task 1 令牌。
- Produces: `PALETTE` 改为 `['#007BA8', '#0E7490', '#0B7A54', '#92400E', '#7C3AED', '#B42318']`。

- [ ] **Step 1: `Charts.tsx`**

- 轨道：`bg-[var(--color-surface-2)]`
- 柱条：`from-[var(--color-brand-100)] to-[var(--color-brand)]`
- 数值：`text-[var(--color-fg)]`
- 图例百分比：`text-[var(--color-fg)]`
- 比例条每段宽度 ≥4% 时在条内显示百分比：在 `segments.map` 内渲染 `<span>`，条件 `seg.ratio >= 0.04`，样式 `text-[0.6rem] font-semibold text-white`，绝对定位居中。

- [ ] **Step 2: `StatsPage.tsx`**

- 错误与导出错误：`text-[var(--color-danger)]`
- 错误卡边框：`border-[var(--color-danger)]/30`
- `StatBox` 数字 `text-[var(--color-fg)]`

- [ ] **Step 3: 构建**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 4: 提交**

```bash
git add src/components/stats src/pages/StatsPage.tsx
git commit -m "feat: restyle charts with Midea blue palette"
```

---

## Task 9: 蓝色 PWA 图标、文档

**Files:**
- Modify: `scripts/gen-icons.mjs`
- Modify: `vite.config.ts`
- Modify: `index.html`
- Modify: `README.md`
- Create: `public/icons/icon-192-v2.png`
- Create: `public/icons/icon-512-v2.png`
- Create: `public/icons/maskable-512-v2.png`
- Create: `public/icons/apple-touch-icon-v2.png`

**Interfaces:**
- Consumes: 无。
- Produces: manifest 与 HTML 引用 `-v2` 图标。

- [ ] **Step 1: 修改 `gen-icons.mjs`**

- `const BG = [0, 127, 176]`、`const FG = [255, 255, 255]`
- 输出文件名加 `-v2`
- maskable 使用 `pad=0`、`radius=0`，图形缩到 80% 安全区：标签坐标改为 `0.3–0.7`（x/y）
- apple-touch-icon 使用 `radius=0`、`pad=0`
- 删除旧图标生成逻辑中的透明圆角（`radiusRatio=0`）

- [ ] **Step 2: 生成图标**

Run: `node scripts/gen-icons.mjs`
Expected: 输出 4 个 `-v2` 文件。

- [ ] **Step 3: 校验尺寸**

Run: `file public/icons/*-v2.png`
Expected: 180/192/512/512。

- [ ] **Step 4: 更新引用**

- `index.html`：`apple-touch-icon` → `%BASE_URL%icons/apple-touch-icon-v2.png`
- `vite.config.ts`：`includeAssets` 与 `manifest.icons` 全部改 `-v2`
- `theme_color: '#007FB0'`、`background_color: '#F2F7FB'`

- [ ] **Step 5: 更新 README**

第 48 行：

```md
设计语言：白底 + 美的蓝（#0098D1 / 主按钮 #007BA8）+ 白色卡片与柔和阴影；字体 Inter / SF Pro / 苹方 / 思源黑体。
```

- [ ] **Step 6: 提交**

```bash
git add scripts/gen-icons.mjs public/icons vite.config.ts index.html README.md
git commit -m "feat: blue PWA icons and docs for new light theme"
```

---

## Task 10: 最终验收

**Files:**
- 无新增；仅验证。

**Interfaces:**
- Consumes: Task 1–9 全部产出。

- [ ] **Step 1: 对比度**

Run: `npm run check:contrast`
Expected: 19 项 PASS。

- [ ] **Step 2: 主题审计**

Run: `npm run audit:theme`
Expected: `主题审计通过`。

- [ ] **Step 3: 单元测试**

Run: `npm test`
Expected: 全部通过。

- [ ] **Step 4: 构建**

Run: `npm run build`
Expected: prebuild 两项通过，`tsc` 与 `vite build` 成功。

- [ ] **Step 5: 残留检查**

Run: `grep -rn "bg-black\|text-black\|--color-accent\|color-scheme:dark" src`
Expected: 仅深色遮罩文件中的 `bg-black/xx`。

- [ ] **Step 6: 手动检查清单**

- 首页空状态与有数据
- 门店详情 / 巡店详情
- 新建巡店 / 新建产品 / 识别结果卡
- 筛选页日期与下拉
- 统计页柱条与比例条
- 设置 / 字典 / 回收站
- 底部弹层、Lightbox
- PWA 删除重装后图标为蓝底白标

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "chore: final verification for blue-white theme"
```

---

## 验收标准

- 全站无纯黑背景、无红色品牌强调、无暗色输入框。
- 主按钮 `#007BA8` 白字；选中态蓝底白字或浅蓝底蓝字。
- 卡片白底、细描边、柔和阴影；仅 TabBar 与底部弹层使用半透明毛玻璃。
- Lightbox 保持深色且控件清晰。
- `check:contrast`、`audit:theme`、`npm test`、`npm run build` 全绿。
- PWA 图标蓝底白标，重装后正确显示。

## 风险点

- `.glass` 全局变更会影响 Lightbox，必须同步改 `.glass-dark`。
- `--color-accent` 已删除，任何残留都会由审计脚本拦截。
- 品牌按钮上的 `text-white` 为有意保留，审计脚本按同行白名单放行。
- PWA 缓存需删除重装验证。
