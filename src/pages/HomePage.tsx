import * as React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Store, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { SurveyCard } from '@/components/survey/SurveyCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { listSurveys } from '@/lib/surveys'
import type { Survey } from '@/lib/types'

export function HomePage() {
  const [surveys, setSurveys] = React.useState<Survey[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listSurveys()
      setSurveys(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  return (
    <div>
      <PageHeader
        title="巡店记录"
        subtitle={loading ? '加载中…' : `共 ${surveys.length} 次巡店`}
        action={
          !loading && (
            <button
              onClick={() => void load()}
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-fg-dim)]"
              aria-label="刷新"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )
        }
      />

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!loading && error && (
        <Card className="border-[var(--color-accent)]/30">
          <p className="text-sm text-[var(--color-accent)]">{error}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            请到「设置」检查后端地址与口令。
          </p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => void load()}>
            重试
          </Button>
        </Card>
      )}

      {!loading && !error && surveys.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glow mt-8 flex flex-col items-center justify-center rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-line)] px-6 py-16 text-center"
        >
          <div className="glass flex h-16 w-16 items-center justify-center rounded-full">
            <Store className="h-7 w-7 text-[var(--color-fg-dim)]" />
          </div>
          <h2 className="mt-5 text-lg font-bold">还没有巡店记录</h2>
          <p className="mt-1 max-w-[16rem] text-sm text-[var(--color-fg-dim)]">
            新建一条巡店单，开始记录门店出样情况。
          </p>
          <Button asChild className="mt-6">
            <Link to="/survey/new">
              <Plus className="h-4 w-4" /> 新建巡店单
            </Link>
          </Button>
        </motion.div>
      )}

      {!loading && !error && surveys.length > 0 && (
        <div className="space-y-3">
          {surveys.map((s) => (
            <SurveyCard key={s.id} survey={s} />
          ))}
        </div>
      )}

      {/* 悬浮新建按钮 */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20">
        <div className="mx-auto flex max-w-md justify-end px-4">
          <Link
            to="/survey/new"
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-[0_10px_40px_-8px_var(--color-accent)] transition-transform active:scale-95"
            aria-label="新建巡店单"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  )
}
