# 巡店记录 · UI 设计规范（美的蓝白）

版本：1.0 · 2026-10-19

本规范是前端 UI 的唯一标准。所有新增或修改的界面**必须**遵守本文；与本规范冲突的实现视为不合入。

---

## 1. 总原则

1. **唯一色源**：组件不得直接写颜色值，只能引用 `src/styles.css` 的令牌或 Tailwind 令牌类。
2. **品牌克制**：蓝色只用于交互、选中、强调与图形，面积占比约 10%。
3. **白为主**：页面底 `--color-bg`、内容面 `--color-surface`，中性色承担 ≥ 90% 面积。
4. **语义色只表状态**：红 / 绿 / 琥珀仅表达错误、成功、警告，禁止当装饰色。
5. **新增颜色必须先立令牌**，并加入 `npm run check:contrast`，否则不允许合入。

---

## 2. 颜色令牌

| 分组 | 令牌 | 值 | 用途 |
|---|---|---|---|
| 品牌 | `brand` | `#0098D1` | 图标、图表、选中线（不承载小字） |
| | `brand-strong` | `#007BA8` | 主按钮、选中分段、图标瓷砖图标 |
| | `brand-pressed` | `#006C99` | 按下 / 悬浮 |
| | `brand-text` | `#0077A8` | 链接、小号蓝字 |
| | `brand-50` | `#EAF8FD` | 选中胶囊、图标瓷砖底 |
| | `brand-100` | `#D6F1FB` | 虚线框、进度轨道、浅渐变端 |
| 中性 | `bg` | `#F2F7FB` | 页面背景 |
| | `surface` | `#FFFFFF` | 卡片、输入、弹层 |
| | `surface-2` | `#EDF3F8` | 次级填充、胶囊、图表轨道 |
| | `surface-3` | `#DCE7F1` | 强次级、拖拽条 |
| | `line` | `#DCE7F1` | 分隔线、装饰描边 |
| | `control` | `#7B90A5` | 可交互控件描边（≥3:1） |
| | `fg` | `#10212F` | 正文 |
| | `fg-dim` | `#52677B` | 次要文字 |
| | `muted` | `#5B6E82` | 占位符、提示 |
| 语义 | `danger` / `danger-soft` | `#B42318` / `#FEE2E2` | 错误、删除 |
| | `success` / `success-soft` | `#0B7A54` / `#DCFCE7` | 成功、增长 |
| | `warning` / `warning-soft` | `#92400E` / `#FEF3C7` | 草稿、警告 |
| 深色上下文 | `on-dark-dim` | `#A1A1A6` | Lightbox 次要文字 |
| | `on-brand` | `#FFFFFF` | 品牌底上的文字/图标 |
| 遮罩 | `overlay` | `rgba(9,30,50,0.35)` | 弹层遮罩 |

对比度基准（`check:contrast` 强制）：正文/次要/提示 ≥ 4.5:1；主按钮白字 ≥ 4.5:1；蓝字 ≥ 4.5:1；品牌图形与控件描边 ≥ 3:1。

---

## 3. 渐变与毛玻璃

渐变与毛玻璃**允许使用**，但必须由品牌色与白色派生，且所有端点满足对比度要求。

### 3.1 令牌与类（只在 `styles.css` 定义，`.tsx` 只写类名）

```css
--color-on-brand: #FFFFFF;

.bg-brand-gradient { background-image: linear-gradient(135deg, var(--color-brand-strong), var(--color-brand-pressed)); }
.bg-brand-vivid    { background-image: linear-gradient(135deg, var(--color-brand), var(--color-brand-strong)); }
.bg-brand-soft     { background-image: linear-gradient(135deg, var(--color-brand-50), var(--color-surface)); }

.glass-hero { background: rgba(255,255,255,0.78); backdrop-filter: blur(16px) saturate(160%); border: 1px solid var(--color-line); box-shadow: var(--shadow-card); }
```

### 3.2 规则

**Must**
- 渐变方向统一 `135deg`，只用品牌色与白色。
- 含小字（< 24px）的渐变按钮用 `bg-brand-gradient`（对比度 4.77–5.83）。
- 图标与大号数字可用 `bg-brand-vivid`（亮端 3.28，仅满足图形与大字号 3:1）。
- 毛玻璃仅用于固定层与**关键汇总卡**（KPI 头部、统计摘要）；文字用 `fg`。

**Forbidden**
- 禁止在 `bg-brand-vivid` 上放 < 24px 的文字。
- 禁止非品牌色渐变、彩虹渐变、多色渐变。
- 禁止毛玻璃用于输入框、表单控件、列表行、数据表格。
- 禁止把 `brand`（`#0098D1`）用作浅色底上的小号文字，必须用 `brand-text`。
- 禁止把语义色用于非状态场景。

---

## 4. 组件规范

| 组件 | 规格 |
|---|---|
| 卡片 | `glass`：`surface` 底 + `line` 描边 + `--shadow-card`，圆角 `--radius-xl` |
| 关键汇总卡 | `glass-hero`（毛玻璃） |
| 固定层 | `glass-strong`：白 88% + blur 16px，仅 TabBar 与底部弹层 |
| 深色控件 | `glass-dark`，仅 Lightbox |
| 主按钮 | `default`：`brand-strong` 底白字；渐变按钮用 `bg-brand-gradient` |
| 次按钮 | `outline`：`control` 描边 + `surface` 底 |
| 危险按钮 | `destructive`：`danger` 底白字，`shadow-danger` |
| 输入框 | `surface` 底、`control` 描边、聚焦 `brand` 边 + 品牌色 10% 光环 |
| 分段/Tab | 选中 `brand-strong` 底白字，或 `brand-50` 底 + `brand-text`；下划线 Tab 用 2px `brand` |
| 图标瓷砖 | 40px 方块，`brand-50` 底 + `brand-strong` 图标；行高 ≥ 56px |
| 徽章 | 草稿 `warning-soft/warning`；成功 `success-soft/success`；危险 `danger-soft/danger` |
| 图表轨道 | `surface-2` |

**触控与焦点**：可点击区域 ≥ 44×44px；焦点态 2px `brand` 实色环，`ring-offset` 使用 `surface`。

---

## 5. 图表规范

- 固定 6 色色板：`#007BA8`、`#0E7490`、`#0B7A54`、`#92400E`、`#7C3AED`、`#B42318`，全部对白底 ≥ 4.5:1。
- 环形图中心放总值（可用 `bg-brand-vivid` 大数字）；段数 ≤ 5，超出改条形排行。
- 条形：圆角、轨道 `surface-2`、右侧数值。
- 图例行：色点 + 名称 + 右对齐数量与百分比。
- **禁止只靠颜色区分数据**，必须配文字或数值。

---

## 6. 字体与排版

- 字体栈：`Inter` / `system-ui` / `SF Pro Text` / `PingFang SC` / `Noto Sans SC` / `Microsoft YaHei`。
- 标题字重 700，正文 400/500，数字统一 `tabular-nums`。
- 正文字号 `1rem`，次要信息不低于 `0.875rem`。

## 7. 圆角、阴影、间距

- 圆角：`--radius-lg: 1rem`、`--radius-xl: 1.25rem`、`--radius-2xl: 1.5rem`、`--radius-pill`。
- 阴影：`--shadow-card`（卡片）、`--shadow-float`（悬浮主操作）、`--shadow-danger`（危险操作）。
- 间距：4px 网格；页面左右 16px；区块间距 16 / 24px。

---

## 8. 无障碍门槛

- 正文对比度 ≥ 4.5:1，图形与控件描边 ≥ 3:1。
- 焦点可见；支持 `prefers-reduced-motion`。
- 通过 `npm run check:contrast` 与 `npm run audit:theme` 双重门禁。

---

## 9. 例外清单（仅限深色上下文）

`PhotoUploader` 遮罩、`Lightbox`、`StoreCard` 封面徽章允许 `bg-black/xx` 与 `text-white`，由 `audit:theme` 白名单管理。

---

## 10. 变更流程

1. 需要新颜色/新渐变 → 先在 `styles.css` 增加令牌或类。
2. 在 `scripts/check-contrast.mjs` 增加对应校验对。
3. `npm run check:contrast` 与 `npm run audit:theme` 通过后方可提交。
4. `.tsx` 中禁止出现 `#hex` 与 `rgba(`（`src/components/stats/Charts.tsx` 的色板除外）。
