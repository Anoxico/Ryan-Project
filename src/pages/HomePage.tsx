import * as React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Store, RefreshCw, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { StoreCard } from '@/components/store/StoreCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { listSurveys, groupByStore } from '@/lib/surveys'
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

  const stores = React.useMemo(() => groupByStore(surveys), [surveys])

  return (
    <div>
      <PageHeader
        title="门店"
        subtitle={loading ? '加载中…' : `${stores.length} 家门店 · ${surveys.length} 次巡店`}
        action={
          !loading && (
            <div className="flex items-center gap-2">
              <Link
                to="/filter"
                className="glass flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-fg-dim)] transition-colors hover:text-[var(--color-brand-text)]"
                aria-label="筛选与搜索"
              >
                <Search className="h-4 w-4" />
              </Link>
              <button
                onClick={() => void load()}
                className="glass flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-fg-dim)] transition-colors hover:text-[var(--color-brand-text)]"
                aria-label="刷新"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          )
        }
      />

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!loading && error && (
        <Card className="border-[var(--color-danger)]/30">
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            请到「设置」检查后端地址与口令。
          </p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => void load()}>
            重试
          </Button>
        </Card>
      )}

      {!loading && !error && stores.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glow mt-8 flex flex-col items-center justify-center rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-line)] px-6 py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-50)]">
            <Store className="h-7 w-7 text-[var(--color-brand)]" />
          </div>
          <h2 className="mt-5 text-lg font-bold">还没有门店记录</h2>
          <p className="mt-1 max-w-[16rem] text-sm text-[var(--color-fg-dim)]">
            新建一条巡店记录，门店会自动出现在这里。
          </p>
          <Button asChild className="mt-6">
            <Link to="/survey/new">
              <Plus className="h-4 w-4" /> 新建巡店记录
            </Link>
          </Button>
        </motion.div>
      )}

      {!loading && !error && stores.length > 0 && (
        <div className="space-y-3">
          {stores.map((group) => (
            <StoreCard key={group.store} group={group} />
          ))}
        </div>
      )}

      {/* 悬浮新建按钮 */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20">
        <div className="mx-auto flex max-w-md justify-end px-4">
          <Link
            to="/survey/new"
            className="bg-brand-vivid pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-float transition-transform active:scale-95"
            aria-label="新建巡店记录"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  )
}
