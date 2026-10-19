import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Link2, KeyRound, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { apiWith } from '@/lib/api'
import { normalizeEndpoint } from '@/lib/config'
import { useAppConfig } from '@/lib/app-config'

type Status = 'idle' | 'testing' | 'success' | 'error'

export function SetupPage({ mode = 'setup' }: { mode?: 'setup' | 'edit' }) {
  const { config, setConfig } = useAppConfig()
  const navigate = useNavigate()
  const [endpoint, setEndpoint] = React.useState(config?.endpoint ?? '')
  const [token, setToken] = React.useState(config?.token ?? '')
  const [status, setStatus] = React.useState<Status>('idle')
  const [message, setMessage] = React.useState('')

  async function handleConnect() {
    const cleanEndpoint = normalizeEndpoint(endpoint)
    if (!cleanEndpoint || !token.trim()) {
      setStatus('error')
      setMessage('请填写 Web App 地址和口令')
      return
    }
    setStatus('testing')
    setMessage('正在连接…')
    try {
      const next = { endpoint: cleanEndpoint, token: token.trim() }
      await apiWith(next, 'ping')
      await apiWith(next, 'listSurveys')
      setConfig(next)
      setStatus('success')
      setMessage('连接成功')
      setTimeout(() => navigate('/'), 450)
    } catch (e) {
      setStatus('error')
      setMessage((e as Error).message)
    }
  }

  return (
    <div className="glow min-h-[100dvh] bg-black">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pt-16 pb-10">
        {mode === 'edit' && (
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-1 self-start text-sm text-[var(--color-fg-dim)]"
          >
            <ArrowLeft className="h-4 w-4" /> 返回
          </button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-[2.1rem] leading-[1.1] font-extrabold tracking-tight">
            巡店记录
          </h1>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--color-fg-dim)]">
            数据存放于你自己的 Google 账号。首次使用请填写后端地址与口令。
          </p>
        </motion.div>

        <div className="mt-8 space-y-5">
          <Field
            icon={<Link2 className="h-4 w-4" />}
            label="Web App 地址"
            hint="以 /exec 结尾的部署网址"
          >
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </Field>

          <Field icon={<KeyRound className="h-4 w-4" />} label="口令" hint="Code.gs 中设置的 SHARED_TOKEN">
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="请输入口令"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </Field>
        </div>

        <div className="mt-auto pt-8">
          <Button
            className="w-full"
            size="lg"
            onClick={handleConnect}
            disabled={status === 'testing'}
          >
            {status === 'testing' && <Spinner />}
            {status === 'success' && <CheckCircle2 className="h-5 w-5" />}
            {status === 'success' ? '连接成功' : '测试并保存'}
          </Button>

          {message && (
            <p
              className={
                'mt-3 text-center text-sm ' +
                (status === 'error'
                  ? 'text-[var(--color-accent)]'
                  : status === 'success'
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-fg-dim)]')
              }
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  icon,
  label,
  hint,
  children,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      {children}
      {hint && <p className="pl-1 text-xs text-[var(--color-muted)]">{hint}</p>}
    </div>
  )
}
