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
