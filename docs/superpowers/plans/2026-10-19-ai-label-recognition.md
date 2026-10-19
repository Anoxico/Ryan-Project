# 铭牌拍照识别预填 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在产品表单内拍照识别铭牌，调用后端视觉模型（Gemini 或 OpenAI 兼容）自动预填硬参数，人工核对后保存，铭牌图可选存为产品照片。

**Architecture:** 前端复用既有 `compressImage`/`toBase64` 压缩图片，通过既有 `api()` 通道调用新增的 Apps Script action `recognizeLabel`；后端按 `AI_PROVIDER` 适配 Gemini 原生 / OpenAI 兼容接口，归一化为统一 JSON 契约返回。纯逻辑（结果归一、字段映射）放前端并用 vitest 单测；后端联调靠部署后手动验证。

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind v4；Google Apps Script（V8）+ UrlFetchApp + PropertiesService；vitest（新增，仅测试纯函数）。

## Global Constraints

- 所有面向用户的 UI 文案使用中文。
- 后端是单文件 `apps-script/Code.gs`，保持现有「section banner 注释 + `function` 声明」风格；V8 runtime。
- 前端 TypeScript 严格模式，路径别名 `@` → `src`；跟随现有组件与设计语言（`glass`、大圆角、黑底、`--color-*` 变量）。
- 不新增**运行时**依赖：AI 调用一律走后端 `UrlFetchApp`，前端仅使用已有依赖。仅新增 `vitest` 作为 devDependency。
- API 通道固定：`POST`、`Content-Type: text/plain;charset=utf-8`、body 为 `{ action, token, payload }`。
- 每个任务结束时 `npm run build`（`tsc --noEmit && vite build`）必须通过。
- 后端配置键固定为：`AI_PROVIDER`、`AI_API_KEY`、`AI_MODEL`、`AI_BASE_URL`。

---

### Task 1: 测试基建 + 类型 + 识别纯逻辑 helper

**Files:**
- Modify: `package.json`（新增 devDependency `vitest` 与 `test` 脚本）
- Create: `vitest.config.ts`
- Modify: `src/lib/types.ts`（在文件末尾追加类型）
- Create: `src/lib/recognition.ts`
- Test: `src/lib/recognition.test.ts`

**Interfaces:**
- Consumes: 无（首个任务）。
- Produces:
  - `types.ts` 导出 `AiProvider = 'gemini' | 'openai'`、`RecognitionResult`、`AiStatus`。
  - `recognition.ts` 导出 `parseRecognitionResult(raw: unknown): RecognitionResult`、`recognitionToFormPatch(result: RecognitionResult, category: ProductCategory): RecognitionFormPatch`、接口 `RecognitionFormPatch { productParams?: string; noise?: string; sets?: string; liter?: string; air?: string }`。

- [ ] **Step 1: 安装 vitest 并加脚本**

Run:
```bash
npm install -D vitest
```
然后编辑 `package.json` 的 `scripts`，在 `"preview"` 后加入（保持 JSON 合法，注意逗号）：
```json
    "test": "vitest run",
```

- [ ] **Step 2: 创建 vitest 配置**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: 追加类型到 `src/lib/types.ts`**

在 `src/lib/types.ts` 末尾追加：
```ts
export type AiProvider = 'gemini' | 'openai'

export interface RecognitionResult {
  model: string | null
  params: string[]
  noise_db: number | null
  sets_count: number | null
  liter: number | null
  air_volume: number | null
  confidence: 'high' | 'medium' | 'low'
  notes: string | null
}

export interface AiStatus {
  configured: boolean
  provider: AiProvider
  model: string
}
```

- [ ] **Step 4: 写失败测试**

Create `src/lib/recognition.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseRecognitionResult, recognitionToFormPatch } from './recognition'

describe('parseRecognitionResult', () => {
  it('非对象输入返回空结果', () => {
    expect(parseRecognitionResult(null)).toEqual({
      model: null,
      params: [],
      noise_db: null,
      sets_count: null,
      liter: null,
      air_volume: null,
      confidence: 'low',
      notes: null,
    })
  })

  it('将字符串数字强制转换，丢弃负数与非法值', () => {
    const r = parseRecognitionResult({ noise_db: '44', sets_count: -1, liter: 'abc', air_volume: 12.5 })
    expect(r.noise_db).toBe(44)
    expect(r.sets_count).toBeNull()
    expect(r.liter).toBeNull()
    expect(r.air_volume).toBe(12.5)
  })

  it('过滤空 params 并归一化 confidence', () => {
    const r = parseRecognitionResult({ params: ['a', '', ' b '], confidence: 'weird' })
    expect(r.params).toEqual(['a', 'b'])
    expect(r.confidence).toBe('low')
  })
})

describe('recognitionToFormPatch', () => {
  const full = parseRecognitionResult({
    model: 'WQP12',
    params: ['额定电压：220V'],
    noise_db: 44,
    sets_count: 12,
    liter: 60,
    air_volume: 18,
    confidence: 'high',
    notes: null,
  })

  it('params 未含型号时前置型号行', () => {
    expect(recognitionToFormPatch(full, 'dishwasher').productParams).toBe('型号：WQP12\n额定电压：220V')
  })

  it('params 已含型号时不重复', () => {
    const r = parseRecognitionResult({ model: 'WQP12', params: ['型号：WQP12'] })
    expect(recognitionToFormPatch(r, 'dishwasher').productParams).toBe('型号：WQP12')
  })

  it('仅填入当前类别的数值字段', () => {
    const dish = recognitionToFormPatch(full, 'dishwasher')
    expect(dish.noise).toBe('44')
    expect(dish.sets).toBe('12')
    expect(dish.liter).toBeUndefined()
    expect(dish.air).toBeUndefined()

    const wh = recognitionToFormPatch(full, 'water_heater')
    expect(wh.liter).toBe('60')
    expect(wh.noise).toBeUndefined()

    const rh = recognitionToFormPatch(full, 'range_hood')
    expect(rh.air).toBe('18')
    expect(rh.sets).toBeUndefined()
  })

  it('无识别内容时返回空补丁', () => {
    expect(recognitionToFormPatch(parseRecognitionResult(null), 'dishwasher')).toEqual({})
  })
})
```

- [ ] **Step 5: 运行测试确认失败**

Run: `npx vitest run src/lib/recognition.test.ts`
Expected: FAIL —— 找不到模块 `./recognition`。

- [ ] **Step 6: 实现 `src/lib/recognition.ts`**

Create `src/lib/recognition.ts`:
```ts
import type { ProductCategory, RecognitionResult } from './types'

export interface RecognitionFormPatch {
  productParams?: string
  noise?: string
  sets?: string
  liter?: string
  air?: string
}

function toStrOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function toPositiveOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x).trim()).filter((x) => x !== '')
}

function normalizeConfidence(v: unknown): RecognitionResult['confidence'] {
  return v === 'high' || v === 'medium' || v === 'low' ? v : 'low'
}

export function parseRecognitionResult(raw: unknown): RecognitionResult {
  if (!raw || typeof raw !== 'object') {
    return {
      model: null,
      params: [],
      noise_db: null,
      sets_count: null,
      liter: null,
      air_volume: null,
      confidence: 'low',
      notes: null,
    }
  }
  const o = raw as Record<string, unknown>
  return {
    model: toStrOrNull(o.model),
    params: toStringArray(o.params),
    noise_db: toPositiveOrNull(o.noise_db),
    sets_count: toPositiveOrNull(o.sets_count),
    liter: toPositiveOrNull(o.liter),
    air_volume: toPositiveOrNull(o.air_volume),
    confidence: normalizeConfidence(o.confidence),
    notes: toStrOrNull(o.notes),
  }
}

const CATEGORY_NUMERIC_FIELDS: Record<
  ProductCategory,
  Array<'noise_db' | 'sets_count' | 'liter' | 'air_volume'>
> = {
  dishwasher: ['noise_db', 'sets_count'],
  water_heater: ['liter'],
  range_hood: ['air_volume'],
}

export function recognitionToFormPatch(
  result: RecognitionResult,
  category: ProductCategory,
): RecognitionFormPatch {
  const patch: RecognitionFormPatch = {}

  const lines = result.params.slice()
  if (result.model && !lines.some((l) => l.indexOf(result.model as string) >= 0)) {
    lines.unshift(`型号：${result.model}`)
  }
  if (lines.length > 0) patch.productParams = lines.join('\n')

  const allowed = CATEGORY_NUMERIC_FIELDS[category]
  if (allowed.indexOf('noise_db') >= 0 && result.noise_db !== null) patch.noise = String(result.noise_db)
  if (allowed.indexOf('sets_count') >= 0 && result.sets_count !== null) patch.sets = String(result.sets_count)
  if (allowed.indexOf('liter') >= 0 && result.liter !== null) patch.liter = String(result.liter)
  if (allowed.indexOf('air_volume') >= 0 && result.air_volume !== null) patch.air = String(result.air_volume)

  return patch
}
```

- [ ] **Step 7: 运行测试确认通过**

Run: `npx vitest run src/lib/recognition.test.ts`
Expected: PASS（8 个断言用例通过）。

- [ ] **Step 8: 构建校验**

Run: `npm run build`
Expected: 成功，输出 `dist/`，无 TS 报错。

- [ ] **Step 9: 提交**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/types.ts src/lib/recognition.ts src/lib/recognition.test.ts
git commit -m "test: add vitest and recognition helpers"
```

---

### Task 2: 后端 AI action（适配器 + 配置）

**Files:**
- Modify: `apps-script/Code.gs`（新增常量、route 项、AI section）

**Interfaces:**
- Consumes: 无（独立后端能力）。
- Produces（供 Task 3 前端调用）：
  - action `recognizeLabel`，payload `{ dataBase64: string, mimeType: string, category: string }` → 返回第 4 节契约对象。
  - action `setAiConfig`，payload `{ provider?: string, apiKey?: string, model?: string, baseUrl?: string }` → 返回 `{ configured, provider, model }`。
  - action `aiConfigStatus` → 返回 `{ configured, provider, model }`。

- [ ] **Step 1: 新增常量**

在 `apps-script/Code.gs` 的 `const SPECIAL_FIELDS = [...]` 行之后新增：
```js
const AI_DEFAULT_PROVIDER = 'gemini';
const AI_DEFAULT_MODEL = 'gemini-2.5-flash';
```

- [ ] **Step 2: 注册 route**

在 `route()` 的 `handlers` 对象里，`exportData: function () { return exportData(); }` 之后新增（注意给上一行补逗号）：
```js
    exportData: function () { return exportData(); },
    recognizeLabel: function () { return recognizeLabel(p); },
    setAiConfig: function () { return setAiConfig(p); },
    aiConfigStatus: function () { return aiConfigStatus(); }
```
（即把原来最后一行的 `exportData: ...,` 保留逗号，再追加三行，最后一行不带逗号。）

- [ ] **Step 3: 在文件末尾新增 AI section**

在 `apps-script/Code.gs` 末尾（`exportData` 函数之后）追加：
```js

/* ============================================================
 *  AI 识别（铭牌参数）
 * ============================================================ */

function aiProps_() { return PropertiesService.getScriptProperties(); }

function getAiConfig_() {
  const props = aiProps_();
  return {
    provider: props.getProperty('AI_PROVIDER') || AI_DEFAULT_PROVIDER,
    apiKey: props.getProperty('AI_API_KEY') || '',
    model: props.getProperty('AI_MODEL') || AI_DEFAULT_MODEL,
    baseUrl: props.getProperty('AI_BASE_URL') || ''
  };
}

function aiConfigStatus() {
  const cfg = getAiConfig_();
  return { configured: !!cfg.apiKey, provider: cfg.provider, model: cfg.model };
}

function setAiConfig(p) {
  if (p.provider && ['gemini', 'openai'].indexOf(p.provider) < 0) throw new Error('提供方无效');
  const props = aiProps_();
  if (p.provider) props.setProperty('AI_PROVIDER', p.provider);
  if (p.model) props.setProperty('AI_MODEL', p.model);
  if (p.baseUrl !== undefined) props.setProperty('AI_BASE_URL', p.baseUrl || '');
  // 仅当提供了非空 Key 时才覆盖，留空表示不修改已保存的 Key
  if (p.apiKey) props.setProperty('AI_API_KEY', p.apiKey);
  return aiConfigStatus();
}

function recognizeLabel(p) {
  if (!p || !p.dataBase64) throw new Error('缺少图片数据');
  const cfg = getAiConfig_();
  if (!cfg.apiKey) throw new Error('尚未配置识别服务，请到设置页填写 API Key');
  const prompt = aiBuildPrompt_(p.category || '');
  const text = cfg.provider === 'openai'
    ? aiCallOpenAI_(cfg, p, prompt)
    : aiCallGemini_(cfg, p, prompt);
  return aiNormalize_(aiParseJson_(text));
}

function aiBuildPrompt_(category) {
  const names = { dishwasher: '洗碗机', water_heater: '热水器', range_hood: '抽油烟机' };
  const label = names[category] || '家电产品';
  return [
    '你是家电巡店数据录入助手。请阅读这张产品铭牌/参数标签照片，抽取' + label + '的参数。',
    '只根据图片中清晰可见的文字作答；看不清或图片中没有的字段一律置为 null，绝对不要猜测。',
    '严格输出如下 JSON 结构：',
    '{',
    '  "model": 型号字符串或 null,',
    '  "params": 其他规格键值行数组，如 ["额定电压：220V","容量：12套"]，没有则 [],',
    '  "noise_db": 噪音(分贝)数字或 null,',
    '  "sets_count": 套数数字或 null,',
    '  "liter": 容量升数数字或 null,',
    '  "air_volume": 风量数字或 null,',
    '  "confidence": "high" | "medium" | "low",',
    '  "notes": 不确定或模糊之处的中文说明，没有则 null',
    '}',
    '只输出 JSON，不要任何解释或代码块。'
  ].join('\n');
}

function aiSchema_() {
  return {
    type: 'object',
    properties: {
      model: { type: 'string', nullable: true },
      params: { type: 'array', items: { type: 'string' } },
      noise_db: { type: 'number', nullable: true },
      sets_count: { type: 'number', nullable: true },
      liter: { type: 'number', nullable: true },
      air_volume: { type: 'number', nullable: true },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      notes: { type: 'string', nullable: true }
    },
    required: ['model', 'params', 'confidence']
  };
}

function aiCallGemini_(cfg, p, prompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/'
    + encodeURIComponent(cfg.model) + ':generateContent?key=' + encodeURIComponent(cfg.apiKey);
  const body = {
    contents: [{
      parts: [
        { inline_data: { mime_type: p.mimeType || 'image/jpeg', data: p.dataBase64 } },
        { text: prompt }
      ]
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: aiSchema_(),
      temperature: 0
    }
  };
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  const status = res.getResponseCode();
  const text = res.getContentText();
  if (status < 200 || status >= 300) throw new Error('识别服务错误(' + status + ')：' + text);
  const json = JSON.parse(text);
  const cand = json.candidates && json.candidates[0];
  const parts = cand && cand.content && cand.content.parts;
  if (!parts || !parts.length || !parts[0].text) throw new Error('识别服务未返回内容');
  return parts[0].text;
}

function aiCallOpenAI_(cfg, p, prompt) {
  if (!cfg.baseUrl) throw new Error('请先在设置页填写 Base URL');
  const url = cfg.baseUrl.replace(/\/+$/, '') + '/chat/completions';
  const messages = [{
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: 'data:' + (p.mimeType || 'image/jpeg') + ';base64,' + p.dataBase64 } }
    ]
  }];
  function call(withFormat) {
    const body = { model: cfg.model, messages: messages, temperature: 0 };
    if (withFormat) body.response_format = { type: 'json_object' };
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + cfg.apiKey },
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });
    return { status: res.getResponseCode(), text: res.getContentText() };
  }
  let r = call(true);
  // 部分兼容端点不支持 response_format，失败时去掉再试一次
  if (r.status < 200 || r.status >= 300) r = call(false);
  if (r.status < 200 || r.status >= 300) throw new Error('识别服务错误(' + r.status + ')：' + r.text);
  const json = JSON.parse(r.text);
  const choice = json.choices && json.choices[0];
  const content = choice && choice.message && choice.message.content;
  if (typeof content !== 'string' || !content) throw new Error('识别服务未返回内容');
  return content;
}

function aiParseJson_(text) {
  let s = String(text || '').trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1];
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch (e) {
    throw new Error('识别结果无法解析');
  }
}

function aiNormalize_(raw) {
  function str(v) { return (v === null || v === undefined || String(v).trim() === '') ? null : String(v).trim(); }
  function num(v) { if (v === null || v === undefined || v === '') return null; const n = Number(v); return (isFinite(n) && n >= 0) ? n : null; }
  const o = (raw && typeof raw === 'object') ? raw : {};
  const params = [];
  if (Array.isArray(o.params)) {
    o.params.forEach(function (x) { const s = String(x).trim(); if (s) params.push(s); });
  }
  const conf = (o.confidence === 'high' || o.confidence === 'medium' || o.confidence === 'low') ? o.confidence : 'low';
  return {
    model: str(o.model),
    params: params,
    noise_db: num(o.noise_db),
    sets_count: num(o.sets_count),
    liter: num(o.liter),
    air_volume: num(o.air_volume),
    confidence: conf,
    notes: str(o.notes)
  };
}
```

- [ ] **Step 4: 手动校验语法（无法本地跑 Apps Script）**

在 Apps Script 编辑器中全选替换为最新 `Code.gs`，按 `Cmd+S` 保存——保存不报错即视为语法通过。
Expected: 无错误提示。

- [ ] **Step 5: 提交**

```bash
git add apps-script/Code.gs
git commit -m "feat: backend AI label recognition actions"
```

---

### Task 3: 前端 AI 客户端

**Files:**
- Modify: `src/lib/photos.ts`（导出 `toBase64`）
- Create: `src/lib/ai.ts`

**Interfaces:**
- Consumes: `types.ts` 的 `AiProvider`/`AiStatus`/`RecognitionResult`（Task 1）、`photos.ts` 的 `compressImage`/`toBase64`、`api.ts` 的 `api()`；后端 action（Task 2）。
- Produces:
  - `recognizeLabel({ file, category }): Promise<RecognitionResult>`
  - `getAiStatus(): Promise<AiStatus>`
  - `setAiConfig(input: AiConfigInput): Promise<AiStatus>`，`AiConfigInput { provider: AiProvider; apiKey: string; model: string; baseUrl: string }`

- [ ] **Step 1: 导出 `toBase64`**

在 `src/lib/photos.ts` 中把：
```ts
async function toBase64(file: File): Promise<{ data: string; mime: string }> {
```
改为：
```ts
export async function toBase64(file: File): Promise<{ data: string; mime: string }> {
```

- [ ] **Step 2: 创建 `src/lib/ai.ts`**

Create `src/lib/ai.ts`:
```ts
import { api } from './api'
import { compressImage, toBase64 } from './photos'
import type { AiProvider, AiStatus, ProductCategory, RecognitionResult } from './types'

export async function recognizeLabel({
  file,
  category,
}: {
  file: File
  category: ProductCategory
}): Promise<RecognitionResult> {
  const compressed = await compressImage(file)
  const { data, mime } = await toBase64(compressed)
  return api<RecognitionResult>('recognizeLabel', {
    dataBase64: data,
    mimeType: mime,
    category,
  })
}

export function getAiStatus() {
  return api<AiStatus>('aiConfigStatus')
}

export interface AiConfigInput {
  provider: AiProvider
  apiKey: string
  model: string
  baseUrl: string
}

export function setAiConfig(input: AiConfigInput) {
  return api<AiStatus>('setAiConfig', input)
}
```

- [ ] **Step 3: 构建校验**

Run: `npm run build`
Expected: 成功，无 TS 报错。

- [ ] **Step 4: 提交**

```bash
git add src/lib/photos.ts src/lib/ai.ts
git commit -m "feat: frontend AI recognition client"
```

---

### Task 4: 识别按钮组件 + 表单集成

**Files:**
- Create: `src/components/product/LabelRecognizer.tsx`
- Modify: `src/components/product/ProductForm.tsx`

**Interfaces:**
- Consumes: `recognition.ts` 的 `parseRecognitionResult`/`recognitionToFormPatch`/`RecognitionFormPatch`（Task 1）、`ai.ts` 的 `recognizeLabel`（Task 3）、`photos.ts` 的 `createPhotoItem`/`PhotoItem`。
- Produces: `LabelRecognizer` 组件，props `{ category: ProductCategory; disabled?: boolean; photos: PhotoItem[]; onPhotosChange: (photos: PhotoItem[]) => void; onRecognized: (patch: RecognitionFormPatch) => void }`。

- [ ] **Step 1: 创建 `src/components/product/LabelRecognizer.tsx`**

Create `src/components/product/LabelRecognizer.tsx`:
```tsx
import * as React from 'react'
import { ScanText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { createPhotoItem, type PhotoItem } from '@/lib/photos'
import { recognizeLabel } from '@/lib/ai'
import {
  parseRecognitionResult,
  recognitionToFormPatch,
  type RecognitionFormPatch,
} from '@/lib/recognition'
import type { ProductCategory, RecognitionResult } from '@/lib/types'

const CONFIDENCE_LABELS: Record<RecognitionResult['confidence'], string> = {
  high: '高',
  medium: '中',
  low: '低',
}

interface LabelRecognizerProps {
  category: ProductCategory
  disabled?: boolean
  photos: PhotoItem[]
  onPhotosChange: (photos: PhotoItem[]) => void
  onRecognized: (patch: RecognitionFormPatch) => void
}

export function LabelRecognizer({
  category,
  disabled,
  photos,
  onPhotosChange,
  onRecognized,
}: LabelRecognizerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const fileRef = React.useRef<File | null>(null)
  const itemRef = React.useRef<PhotoItem | null>(null)
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = React.useState<RecognitionResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [savePhoto, setSavePhoto] = React.useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    fileRef.current = file
    itemRef.current = null
    setSavePhoto(false)
    setResult(null)
    setError(null)
    setStatus('loading')
    try {
      const raw = await recognizeLabel({ file, category })
      const parsed = parseRecognitionResult(raw)
      setResult(parsed)
      onRecognized(recognitionToFormPatch(parsed, category))
      setStatus('done')
    } catch (err) {
      setError((err as Error).message)
      setStatus('error')
    }
  }

  function toggleSave(checked: boolean) {
    const file = fileRef.current
    if (!file) return
    if (checked) {
      const item = createPhotoItem(file)
      itemRef.current = item
      onPhotosChange([...photos, item])
    } else {
      const key = itemRef.current?.key
      if (key) {
        const target = photos.find((p) => p.key === key)
        if (target?.file) URL.revokeObjectURL(target.url)
        onPhotosChange(photos.filter((p) => p.key !== key))
      }
      itemRef.current = null
    }
    setSavePhoto(checked)
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="glass"
        className="w-full"
        disabled={disabled || status === 'loading'}
        onClick={() => inputRef.current?.click()}
      >
        {status === 'loading' ? <Spinner /> : <ScanText className="h-4 w-4" />}
        {status === 'loading' ? '识别中…' : '拍照识别铭牌'}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}

      {status === 'done' && result && (
        <div className="glass space-y-2 rounded-[1.05rem] p-4 text-sm">
          <p className="font-semibold text-white">
            已识别，请核对（置信度：{CONFIDENCE_LABELS[result.confidence]}）
          </p>
          {result.notes && <p className="text-[var(--color-fg-dim)]">{result.notes}</p>}
          <label className="flex items-center gap-2 text-[var(--color-fg-dim)]">
            <input type="checkbox" checked={savePhoto} onChange={(e) => toggleSave(e.target.checked)} />
            同时保存铭牌图到照片
          </label>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 集成到 `ProductForm.tsx`**

在 `ProductForm.tsx` 顶部 import 区新增：
```tsx
import { LabelRecognizer } from '@/components/product/LabelRecognizer'
import type { RecognitionFormPatch } from '@/lib/recognition'
```

在组件内、`const flags = FIELD_FLAGS[category]` 之后新增处理函数：
```tsx
  function applyRecognition(patch: RecognitionFormPatch) {
    if (patch.productParams !== undefined) setProductParams(patch.productParams)
    if (patch.noise !== undefined) setNoise(patch.noise)
    if (patch.sets !== undefined) setSets(patch.sets)
    if (patch.liter !== undefined) setLiter(patch.liter)
    if (patch.air !== undefined) setAir(patch.air)
  }
```

在照片区之前、即 `{/* 照片 */}` 注释行之前插入：
```tsx
      {/* 拍照识别 */}
      <LabelRecognizer
        category={category}
        disabled={submitting}
        photos={photos}
        onPhotosChange={onPhotosChange}
        onRecognized={applyRecognition}
      />
```

- [ ] **Step 3: 构建校验**

Run: `npm run build`
Expected: 成功，无 TS 报错。

- [ ] **Step 4: 提交**

```bash
git add src/components/product/LabelRecognizer.tsx src/components/product/ProductForm.tsx
git commit -m "feat: label recognition button in product form"
```

---

### Task 5: 设置页 AI 配置

**Files:**
- Create: `src/components/settings/AiSettingsCard.tsx`
- Modify: `src/pages/SettingsPage.tsx`

**Interfaces:**
- Consumes: `ai.ts` 的 `getAiStatus`/`setAiConfig`（Task 3）、`types.ts` 的 `AiProvider`。
- Produces: `AiSettingsCard` 组件（无 props）。

- [ ] **Step 1: 创建 `src/components/settings/AiSettingsCard.tsx`**

Create `src/components/settings/AiSettingsCard.tsx`:
```tsx
import * as React from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/form/Field'
import { Spinner } from '@/components/ui/spinner'
import { getAiStatus, setAiConfig } from '@/lib/ai'
import type { AiProvider, AiStatus } from '@/lib/types'

export function AiSettingsCard() {
  const [provider, setProvider] = React.useState<AiProvider>('gemini')
  const [apiKey, setApiKey] = React.useState('')
  const [model, setModel] = React.useState('gemini-2.5-flash')
  const [baseUrl, setBaseUrl] = React.useState('')
  const [status, setStatus] = React.useState<AiStatus | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let alive = true
    getAiStatus()
      .then((s) => {
        if (!alive) return
        setStatus(s)
        setProvider(s.provider)
        setModel(s.model)
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const s = await setAiConfig({ provider, apiKey, model, baseUrl })
      setStatus(s)
      setApiKey('')
      setMessage('已保存')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mt-4 space-y-4">
      <div className="space-y-1">
        <CardTitle>AI 识别</CardTitle>
        <CardDescription>
          铭牌拍照识别填表所用的模型。API Key 仅存于你的 Google 账号后端，不会回传浏览器。
        </CardDescription>
      </div>

      {status && (
        <p className="text-sm text-[var(--color-fg-dim)]">
          当前：{status.configured ? '已配置' : '未配置'} · {status.provider} · {status.model}
        </p>
      )}

      <Field label="提供方">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as AiProvider)}
          className="flex h-12 w-full rounded-[1.05rem] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 text-[0.95rem] text-white focus:outline-none focus:border-[var(--color-line-strong)]"
        >
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI 兼容</option>
        </select>
      </Field>

      <Field label="API Key" hint="留空表示不修改已保存的 Key">
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={status?.configured ? '••••••••' : '粘贴你的 API Key'}
        />
      </Field>

      <Field label="模型名" hint="需支持图片输入，如 gemini-2.5-flash / qwen-vl-max">
        <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gemini-2.5-flash" />
      </Field>

      {provider === 'openai' && (
        <Field label="Base URL" hint="如 https://dashscope.aliyuncs.com/compatible-mode/v1">
          <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://..." />
        </Field>
      )}

      {message && <p className="text-sm text-[var(--color-fg-dim)]">{message}</p>}
      {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}

      <Button variant="outline" className="w-full" onClick={handleSave} disabled={saving || loading}>
        {saving && <Spinner />} 保存 AI 配置
      </Button>
    </Card>
  )
}
```

- [ ] **Step 2: 挂载到 `SettingsPage.tsx`**

在 `SettingsPage.tsx` 顶部 import 区新增：
```tsx
import { AiSettingsCard } from '@/components/settings/AiSettingsCard'
```

在第一个 `<Card className="space-y-4">…</Card>` 结束之后、底部说明 `<Card className="mt-4">` 之前插入：
```tsx
      <AiSettingsCard />
```

- [ ] **Step 3: 构建校验**

Run: `npm run build`
Expected: 成功，无 TS 报错。

- [ ] **Step 4: 提交**

```bash
git add src/components/settings/AiSettingsCard.tsx src/pages/SettingsPage.tsx
git commit -m "feat: AI recognition settings card"
```

---

### Task 6: 文档与端到端验证

**Files:**
- Modify: `README.md`
- Modify: `docs/01-apps-script-setup.md`

**Interfaces:**
- Consumes: 全部前置任务。
- Produces: 无（收尾）。

- [ ] **Step 1: 更新 README API 表**

在 `README.md` 的 API 表格中，`exportData` 行之后新增三行：
```markdown
| `recognizeLabel` | 铭牌拍照识别（Gemini / OpenAI 兼容），返回归一化字段 |
| `setAiConfig` / `aiConfigStatus` | 保存 / 查询 AI 识别配置（Key 不回传） |
```

在「产品简介」列表末尾新增一条：
```markdown
- 铭牌拍照识别：拍参数标签自动预填硬参数，人工核对后保存
```

- [ ] **Step 2: 更新 setup 文档**

在 `docs/01-apps-script-setup.md` 的「常见问题」之前新增小节：
```markdown
---

## 可选：开启铭牌识别

1. 准备一个支持图片识别的 API Key（如 Google Gemini）。
   - Gemini：到 https://aistudio.google.com/apikey 创建 Key
2. 部署好前端后，手机打开 App → 底部「设置」→ 找到「AI 识别」
3. 提供方选 `Gemini`，粘贴 Key，模型名保持 `gemini-2.5-flash`（可按需更换）
4. 点「保存 AI 配置」，状态显示「已配置」即完成
5. 在新增产品页点「拍照识别铭牌」拍照，识别结果会自动预填，请核对后再保存

> Key 存在你 Google 账号的 Apps Script 属性里，不会显示在浏览器。
> 若用其他厂商（OpenAI 兼容），提供方选 `OpenAI 兼容`，填对应 Base URL 与模型名。
```

- [ ] **Step 3: 全量验证**

Run: `npm test`
Expected: `src/lib/recognition.test.ts` 全部通过。

Run: `npm run build`
Expected: 成功，无报错。

- [ ] **Step 4: 端到端手动验证（部署后）**

1. 将最新 `Code.gs` 粘贴进 Apps Script，重新部署新版本。
2. 打开 App → 设置 → 填写真实 Key → 保存，确认状态「已配置」。
3. 新增产品 → 点「拍照识别铭牌」→ 选一张真实铭牌图。
4. 确认：型号/规格进入「产品参数」，噪音/套数（洗碗机）等对应字段被预填；提示条显示置信度。
5. 勾选「同时保存铭牌图到照片」→ 保存 → 在详情页确认照片已上传。
6. 用「OpenAI 兼容」提供方重复 2–5 各验证一次。

- [ ] **Step 5: 提交**

```bash
git add README.md docs/01-apps-script-setup.md
git commit -m "docs: AI label recognition usage"
```

---

## 附：完成标准

- `npm test` 与 `npm run build` 均通过。
- 新增产品页可拍照识别并预填硬参数，人工可修改后保存。
- 设置页可配置 Gemini 或 OpenAI 兼容（Key 不回传）。
- 勾选时铭牌图可存为产品照片。
- 未配置 Key、网络失败、端点报错时均有中文提示且不破坏已有输入。
