import * as React from 'react'
import { motion } from 'framer-motion'
import { Plus, Store, CalendarDays } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import type { Survey } from '@/lib/types'

export function HomePage() {
  const [surveys, setSurveys] = React.useState<Survey[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await api<Survey[]>('listSurveys')
        if (alive) setSurveys(data)
      } catch (e) {
        if (alive) setError((e as Error).message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div>
      <PageHeader
        title="巡店记录"
        subtitle={loading ? '加载中…' : `共 ${surveys.length} 次巡店`}
      />

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {error && (
        <Card className="border-[var(--color-accent)]/30">
          <p className="text-sm text-[var(--color-accent)]">{error}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            请到「设置」检查后端地址与口令。
          </p>
        </Card>
      )}

      {!loading && !error && surveys.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glow mt-10 flex flex-col items-center justify-center rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-line)] px-6 py-16 text-center"
        >
          <div className="glass flex h-16 w-16 items-center justify-center rounded-full">
            <Store className="h-7 w-7 text-[var(--color-fg-dim)]" />
          </div>
          <h2 className="mt-5 text-lg font-bold">还没有巡店记录</h2>
          <p className="mt-1 max-w-[16rem] text-sm text-[var(--color-fg-dim)]">
            新建一条巡店单，开始记录门店出样情况。
          </p>
          <Button className="mt-6" disabled>
            <Plus className="h-4 w-4" /> 新建巡店单
          </Button>
          <p className="mt-2 text-xs text-[var(--color-muted)]">（阶段 2 开放）</p>
        </motion.div>
      )}

      {!loading && surveys.length > 0 && (
        <div className="space-y-3">
          {surveys.map((s) => (
            <Card key={s.id} className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-[var(--color-fg-dim)]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {s.visit_date}
                </div>
                <h3 className="mt-1 truncate text-base font-bold">{s.store}</h3>
                <p className="truncate text-sm text-[var(--color-fg-dim)]">
                  {s.channel} · {s.customer}
                </p>
              </div>
              <div className="glass flex h-12 min-w-12 items-center justify-center rounded-[1rem] px-3 text-sm font-bold">
                {s.product_count ?? 0}
                <span className="ml-0.5 text-[0.65rem] font-medium text-[var(--color-fg-dim)]">
                  品
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
