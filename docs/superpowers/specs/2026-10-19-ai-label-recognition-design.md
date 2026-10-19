# 铭牌拍照识别预填 · 设计文档

日期：2026-10-19
状态：已确认，待实现

## 1. 目标

在「新增 / 编辑产品」页面给产品铭牌（参数标签）拍一张照，由视觉大模型识别后**自动预填硬参数字段**，人工核对修改后保存；铭牌图可选一并存为产品照片。

非目标（YAGNI）：

- 不自动识别并填充字典类字段（产品名 / 能效 / 形态）与价格 —— 仍由人工填写或从字典选择。
- 不做多条图片批量录入。
- 不做「Gemini 与兼容端点同时并存」的双通道，同一时刻只使用一份配置。

## 2. 决策表

| 项 | 决定 |
|---|---|
| 图片来源 | 产品铭牌 / 参数标签特写 |
| AI 运行位置 | Apps Script 后端调用视觉模型（API Key 不进入浏览器） |
| 触发入口 | 产品表单内「拍照识别」按钮 + 预填 |
| 填充范围 | 只填硬参数：型号/规格（→产品参数）、噪音 dB、套数、升数、风量 |
| 图片处理 | 识别后提供勾选项，用户可选是否存为产品照片 |
| 提供方支持 | Gemini 原生 + 「OpenAI 兼容」两类（可切换厂商，无需改代码） |
| Key 配置 | 设置页输入 → 经后端写入 Script Properties，永不回传明文 |

## 3. 数据流

```
ProductForm「拍照识别」按钮
  → 选 / 拍铭牌图（独立 file input）
  → 复用 src/lib/photos.ts 的 compressImage + toBase64（压缩 ≤1600px / 0.6MB）
  → api('recognizeLabel', { dataBase64, mimeType, category })
  → Apps Script route → recognizeLabel(p)
      → 读取 Script Properties: AI_PROVIDER / AI_API_KEY / AI_MODEL / AI_BASE_URL
      → aiExtract_() 按 provider 调对应接口，要求结构化 JSON 输出
      → 归一化 + 数值清洗
  → 返回识别结果
  → 前端把非空字段写入表单 state，显示「已识别，请核对（置信度 / 备注）」
  → 若勾选「同时保存铭牌图」，把该图加入 photos（走既有上传流程）
```

## 4. 识别结果契约

后端 `recognizeLabel` 统一返回以下结构（与提供方无关）：

```json
{
  "model": "WQP12-W5303",
  "params": ["型号：WQP12-W5303", "额定电压：220V", "容量：12套"],
  "noise_db": 44,
  "sets_count": 12,
  "liter": null,
  "air_volume": null,
  "confidence": "high",
  "notes": "容量文字略模糊"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `model` | string \| null | 识别到的型号（用于展示与产品参数首行） |
| `params` | string[] | 可供写入「产品参数」的规格行，每行一项 |
| `noise_db` | number \| null | 噪音 dB，仅洗碗机适用 |
| `sets_count` | number \| null | 套数，仅洗碗机适用 |
| `liter` | number \| null | 升数，仅热水器适用 |
| `air_volume` | number \| null | 风量，仅抽油烟机适用 |
| `confidence` | `"high" \| "medium" \| "low"` | 整体置信度 |
| `notes` | string \| null | 不确定项提示，供人工核对 |

前端映射规则：

- `product_params ← params.join('\n')`（若 `model` 非空且 `params` 未含型号，则前置一行「型号：{model}」）
- `noise_db / sets_count / liter / air_volume`：仅取非 null 值，且仅当当前 `category` 的对应字段可见时写入
- 不写入 `product_name / energy_rating / form / sample_price`

## 5. 后端改动（`apps-script/Code.gs`）

### 5.1 配置读取

从 `PropertiesService.getScriptProperties()` 读取：

| 键 | 说明 |
|---|---|
| `AI_PROVIDER` | `gemini` 或 `openai` |
| `AI_API_KEY` | 用户输入的 Key |
| `AI_MODEL` | 如 `gemini-2.5-flash` / `qwen-vl-max` / `gpt-4o-mini`（需支持视觉） |
| `AI_BASE_URL` | 仅 openai 兼容需要，如 `https://dashscope.aliyuncs.com/compatible-mode/v1` |

默认值：`AI_PROVIDER = 'gemini'`，`AI_MODEL = 'gemini-2.5-flash'`。

### 5.2 新增 action（均受现有 `SHARED_TOKEN` 校验）

- `recognizeLabel(p)`：校验 `p.dataBase64` 非空 → 未配置 Key 时抛「尚未配置识别服务」→ 调 `aiExtract_(p)` → 归一化 → 返回契约结构。
- `setAiConfig(p)`：将 `provider / apiKey / model / baseUrl` 写入 Script Properties。`apiKey` 为空字符串时不覆盖已存 Key（支持「只改模型不动 Key」）。
- `aiConfigStatus()`：返回 `{ configured, provider, model }`，**不返回 Key**。`configured` 表示 Key 是否存在。

### 5.3 适配器 `aiExtract_(p)`

共用一段 Prompt（按 `category` 限定字段、只依据铭牌、看不清留空、严格输出 JSON schema），按 provider 分支调用：

**gemini 原生**

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}
{
  "contents": [{ "parts": [
    { "inline_data": { "mime_type": "{mime}", "data": "{base64}" } },
    { "text": "{prompt}" }
  ]}],
  "generationConfig": {
    "responseMimeType": "application/json",
    "responseSchema": { ... }
  }
}
→ resp.candidates[0].content.parts[0].text（JSON 字符串）
```

**openai 兼容**

```
POST {baseUrl}/chat/completions
Authorization: Bearer {key}
{
  "model": "{model}",
  "messages": [{ "role": "user", "content": [
    { "type": "text", "text": "{prompt}" },
    { "type": "image_url", "image_url": { "url": "data:{mime};base64,{base64}" } }
  ]}],
  "response_format": { "type": "json_object" },
  "temperature": 0
}
→ resp.choices[0].message.content（JSON 字符串）
```

容错：

- 部分兼容端点不支持 `response_format`：请求失败时去掉该字段重试一次。
- 响应文本可能含 ``` 代码围栏：解析前先剥离围栏再 `JSON.parse`。
- 数值字段统一做 `toNumber` 清洗；非法或负数置为 `null`。

## 6. 前端改动

### 6.1 新增 `src/lib/ai.ts`

- `recognizeLabel({ file, category })`：调用 `compressImage` + `toBase64`（复用 `photos.ts`，需将 `toBase64` 导出）→ `api('recognizeLabel', {...})`。
- `getAiStatus()`：调 `aiConfigStatus`。
- `setAiConfig({ provider, apiKey, model, baseUrl })`：调 `setAiConfig`。
- 类型 `RecognitionResult`、`AiProvider`、`AiStatus` 定义在 `src/lib/types.ts`，此处导入。

### 6.2 `src/lib/types.ts`

新增 `RecognitionResult`（见第 4 节契约）、`AiProvider = 'gemini' | 'openai'`、`AiStatus = { configured: boolean; provider: AiProvider; model: string }`。

### 6.3 `src/components/product/ProductForm.tsx`

- 在表单下方（照片区之前）新增「拍照识别铭牌」按钮，绑定独立 `file input`（`accept="image/*"`，`capture` 允许直接拍照）。
- 点击 → 置识别中状态 → 调 `recognizeLabel`。
- 成功后：把结果映射写入 `productParams / noise / sets / liter / air` 对应 state；显示提示条（置信度 + `notes`）。
- 提示条内提供「同时保存铭牌图」勾选框（默认不勾选）；勾选则 `onPhotosChange([...photos, createPhotoItem(file)])`。
- 失败：显示错误文案，不清空已有字段。
- 复用现有 `Field`、`Button`、`Spinner` 样式。

### 6.4 `src/pages/SettingsPage.tsx`

新增「AI 识别」区块：

- 提供方下拉：`Gemini` / `OpenAI 兼容`
- API Key（密码框，提示「留空表示不修改」）
- 模型名
- Base URL（仅当选 OpenAI 兼容时显示）
- 保存按钮 → `setAiConfig`，成功后刷新状态
- 状态显示：`已配置 / 未配置 · 提供方 · 模型`（不回显 Key）
- 若缺 select 组件，复用现有样式手写一个简单下拉。

## 7. 边界与错误处理

| 场景 | 处理 |
|---|---|
| 未配置 Key | 后端抛「尚未配置识别服务」，前端提示去设置页配置 |
| 网络失败 / 超时 | 前端显示错误，不预填 |
| 模型不支持视觉 | 端点返回错误，前端展示后端错误信息；设置页注明「需选支持视觉的模型」 |
| 响应无法解析为 JSON | 后端返回空字段 + `notes` 提示，前端仅显示提示 |
| 识别不全 / 低置信度 | 填入能识别的字段，`notes` 提醒人工核对 |
| 数值非法 | 后端清洗为 `null`；保存时仍走现有数值校验 |

## 8. 验证方式

- 类型与构建：`npm run build`（`tsc --noEmit && vite build`）通过。
- 后端：用真实铭牌图，分别以 Gemini 与一个 OpenAI 兼容端点各联调一次（项目当前无自动化测试框架）。
- 手动核对：识别后字段预填正确、可修改、可保存；勾选保存时照片正常上传。

## 9. 文档更新

- `README.md`：后端 API 表新增 `recognizeLabel / setAiConfig / aiConfigStatus`；路线表新增本功能。
- 新增获取 AI Key 的说明（并入 setup 文档或独立小节）。

## 10. 落地顺序

1. 后端 adapter 与三个 action（`Code.gs`）
2. `src/lib/ai.ts` 与类型
3. `ProductForm` 识别按钮与预填
4. `SettingsPage` AI 配置区块
5. README 与文档更新
6. `npm run build` 验证 + 真实图片联调

## 11. 风险与说明

- **首次调用触发 Apps Script 重新授权**（UrlFetch 发起外部请求会新增授权范围）。
- Script Properties 为脚本级全局单份配置，切换提供方需重填对应模型 / Base URL。
- 识别准确率取决于铭牌清晰度与模型能力，故保留人工核对步骤。
