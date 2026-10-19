import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, ImageIcon, Package, Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { listSurveys, deleteSurveys } from '@/lib/surveys'
import { cn } from '@/lib/utils'
import type { Survey } from '@/lib/types'

export function StoreDetailPage() {
  const { storeName = '' } = useParams<{ storeName: string }>()
  const navigate = useNavigate()
  const [surveys, setSurveys] = React.useState<Survey[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [selecting, setSelecting] = React.useState(false)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

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

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelecting() {
    setSelecting(false)
    setSelected(new Set())
  }

  async function handleBulkDelete() {
    setBusy(true)
    try {
      await deleteSurveys(Array.from(selected))
      setConfirmOpen(false)
      exitSelecting()
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md px-4 pb-40">
      <header className="flex items-center gap-3 pt-4 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="glass flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-fg)]"
          aria-label="返回"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight">{storeName}</h1>
          <p className="truncate text-xs text-[var(--color-fg-dim)]">
            {latest ? `${latest.channel} · ${latest.customer}` : '门店'}
          </p>
        </div>
        {surveys.length > 0 && (
          <button
            onClick={() => (selecting ? exitSelecting() : setSelecting(true))}
            className="shrink-0 text-sm font-semibold text-[var(--color-fg-dim)]"
          >
            {selecting ? '取消' : '选择'}
          </button>
        )}
      </header>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!loading && error && (
        <Card className="border-[var(--color-danger)]/30">
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
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
            {!selecting && (
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
            )}
          </div>

          {surveys.length === 0 && (
            <Card className="flex flex-col items-center py-12 text-center">
              <Package className="h-7 w-7 text-[var(--color-muted)]" />
              <p className="mt-3 text-sm text-[var(--color-fg-dim)]">该门店暂无可显示的巡店记录</p>
            </Card>
          )}

          <div className="space-y-3">
            {surveys.map((s) => {
              const isSelected = selected.has(s.id)
              const inner = (
                <div
                  className={cn(
                    'glass squircle flex items-center gap-3 rounded-[var(--radius-xl)] p-4 transition-colors',
                    !selecting && 'active:bg-[var(--color-surface-2)]',
                    isSelected && 'ring-1 ring-[var(--color-brand)]',
                  )}
                >
                  {selecting && (
                    <span className="shrink-0 text-[var(--color-danger)]">
                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5 text-[var(--color-muted)]" />
                      )}
                    </span>
                  )}
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
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-fg-dim)]">
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
              )

              return selecting ? (
                <button key={s.id} type="button" onClick={() => toggleSelect(s.id)} className="block w-full text-left">
                  {inner}
                </button>
              ) : (
                <Link key={s.id} to={`/survey/${s.id}`} className="block">
                  {inner}
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* 批量操作条 */}
      {selecting && (
        <div className="fixed inset-x-0 bottom-0 z-30 safe-bottom">
          <div className="mx-auto max-w-md px-4 pb-4">
            <div className="glass-strong flex items-center gap-3 rounded-[1.4rem] p-3">
              <span className="pl-1 text-sm text-[var(--color-fg-dim)]">
                已选 <span className="font-bold text-[var(--color-fg)]">{selected.size}</span> 条
              </span>
              <Button
                variant="destructive"
                className="ml-auto"
                disabled={selected.size === 0}
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> 移入回收站
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`移入回收站 ${selected.size} 条记录？`}
        description="可在「设置 → 回收站」中 7 天内恢复。"
        confirmText="移入回收站"
        loading={busy}
        onConfirm={handleBulkDelete}
      />
    </div>
  )
}
