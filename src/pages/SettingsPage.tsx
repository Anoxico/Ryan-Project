import { Link2, KeyRound, LogOut, ChevronRight, Info, Trash } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AiSettingsCard } from '@/components/settings/AiSettingsCard'
import { useAppConfig } from '@/lib/app-config'

export function SettingsPage() {
  const { config, resetConfig } = useAppConfig()
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader title="设置" subtitle="后端与基础配置" />

      <Card className="space-y-4">
        <Row icon={<Link2 className="h-4 w-4" />} label="Web App 地址">
          <p className="truncate text-sm text-[var(--color-fg-dim)]">
            {config?.endpoint ?? '未配置'}
          </p>
        </Row>
        <Row icon={<KeyRound className="h-4 w-4" />} label="口令">
          <p className="text-sm text-[var(--color-fg-dim)]">
            {config ? '•'.repeat(Math.min(config.token.length, 12)) : '未配置'}
          </p>
        </Row>
        <Button variant="outline" className="w-full" onClick={() => navigate('/setup')}>
          修改配置
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => {
            if (confirm('确定要清除本机配置吗？下次打开需要重新填写。')) {
              resetConfig()
              navigate('/')
            }
          }}
        >
          <LogOut className="h-4 w-4" /> 清除本机配置
        </Button>
      </Card>

      <AiSettingsCard />

      <Card className="mt-4">
        <button
          onClick={() => navigate('/recycle')}
          className="flex w-full items-center justify-between"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Trash className="h-4 w-4" />
            回收站
          </span>
          <span className="flex items-center gap-1 text-sm text-[var(--color-fg-dim)]">
            7 天内可恢复
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
      </Card>

      <Card className="mt-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 text-[var(--color-fg-dim)]" />
          <div className="text-sm leading-relaxed text-[var(--color-fg-dim)]">
            <p className="font-semibold text-white">巡店记录</p>
            <p className="mt-1">
              数据保存在你自己的 Google 表格与网盘中，配置仅存于本机浏览器。
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-sm font-semibold text-white">
        {icon}
        {label}
      </span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  )
}
