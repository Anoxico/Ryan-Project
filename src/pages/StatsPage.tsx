import { BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'

export function StatsPage() {
  return (
    <div>
      <PageHeader title="统计" subtitle="渠道 / 类别 / 能效" />
      <Card className="flex flex-col items-center py-16 text-center">
        <BarChart3 className="h-8 w-8 text-[var(--color-fg-dim)]" />
        <p className="mt-4 text-sm text-[var(--color-fg-dim)]">统计与导出将在阶段 5 开放</p>
      </Card>
    </div>
  )
}
