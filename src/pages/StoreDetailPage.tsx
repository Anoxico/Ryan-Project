import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, ImageIcon, Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { listSurveys } from '@/lib/surveys'
import type { Survey } from '@/lib/types'

export function StoreDetailPage() {
  const { storeName = '' } = useParams<{ storeName: string }>()
  const navigate = useNavigate()
  const [surveys, setSurveys] = React.useState<Survey[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listSurveys({ store: storeName })
      setSurveys(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [storeName])

  React.useEffect(() => {
    void load()
  }, [load])

  const latest = surveys[0]

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md px-4 pb-32">
      <header className="flex items-center gap-3 pt-4 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="glass flex h-10 w-10 items-center justify-center rounded-full text-white"
          aria-label="返回"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight">{storeName}</h1>
          <p className="truncate text-xs text-[var(--color-fg-dim)]">
            {latest ? `${latest.channel} · ${latest.customer}` : '门店'}
          </p>
        </div>
      </header>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!loading && error && (
        <Card className="border-[var(--color-accent)]/30">
          <p className="text-sm text-[var(--color-accent)]">{error}</p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => void load()}>
            重试
          </Button>
        </Card>
      )}

      {!loading && !error && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              巡店记录
              <span className="ml-2 text-sm font-medium text-[var(--color-fg-dim)]">
                {surveys.length} 次
              </span>
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate('/survey/new', {
                  state: {
                    prefill: latest
                      ? { store: latest.store, channel: latest.channel, customer: latest.customer }
                      : { store: storeName, channel: '', customer: '' },
                  },
                })
              }
            >
              <Plus className="h-4 w-4" /> 新建巡店
            </Button>
          </div>

          {surveys.length === 0 && (
            <Card className="flex flex-col items-center py-12 text-center">
              <Package className="h-7 w-7 text-[var(--color-muted)]" />
              <p className="mt-3 text-sm text-[var(--color-fg-dim)]">该门店暂无可显示的巡店记录</p>
            </Card>
          )}

          <div className="space-y-3">
            {surveys.map((s) => (
              <Link key={s.id} to={`/survey/${s.id}`} className="block">
                <div className="glass squircle flex items-center gap-4 rounded-[var(--radius-xl)] p-4 transition-colors active:bg-white/[0.06]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-fg-dim)]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span className="tabular-nums">{s.visit_date}</span>
                      {s.status === 'draft' && (
                        <span className="rounded-full bg-[var(--color-warning)]/15 px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--color-warning)]">
                          草稿
                        </span>
                      )}
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-fg-dim)]">
                      <Package className="h-3 w-3" />
                      {s.product_count ?? 0} 个产品
                    </div>
                  </div>

                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[1.1rem] bg-[var(--color-surface-2)]">
                    {s.thumbnail ? (
                      <img src={s.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-[var(--color-muted)]" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
