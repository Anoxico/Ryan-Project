import { Link2, KeyRound, LogOut, ChevronRight, Info, Trash, BookText } from 'lucide-react'
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

      <Card className="mt-4 p-0">
        <TileRow
          icon={<Trash className="h-5 w-5" />}
          title="回收站"
          subtitle="7 天内可恢复"
          onClick={() => navigate('/recycle')}
        />
        <div className="mx-4 h-px bg-[var(--color-line)]" />
        <TileRow
          icon={<BookText className="h-5 w-5" />}
          title="字典管理"
          subtitle="渠道 / 客户 / 门店 / 形态 / 能效"
          onClick={() => navigate('/dict')}
        />
      </Card>

      <Card className="mt-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 text-[var(--color-fg-dim)]" />
          <div className="text-sm leading-relaxed text-[var(--color-fg-dim)]">
            <p className="font-semibold text-[var(--color-fg)]">巡店记录</p>
            <p className="mt-1">
              数据保存在你自己的 Google 表格与网盘中，配置仅存于本机浏览器。
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function TileRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-[var(--color-surface-2)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-[var(--color-brand-50)] text-[var(--color-brand-strong)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--color-fg)]">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--color-fg-dim)]">{subtitle}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
    </button>
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
      <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
        <span className="text-[var(--color-brand-strong)]">{icon}</span>
        {label}
      </span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  )
}
