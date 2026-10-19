import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Trash2, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  listDeletedSurveys,
  restoreSurvey,
  purgeSurvey,
  emptyRecycleBin,
  type DeletedSurvey,
} from '@/lib/surveys'

export function RecycleBinPage() {
  const navigate = useNavigate()
  const [items, setItems] = React.useState<DeletedSurvey[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [purgeTarget, setPurgeTarget] = React.useState<string | null>(null)
  const [confirmEmpty, setConfirmEmpty] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listDeletedSurveys()
      setItems(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  async function handleRestore(id: string) {
    if (busy) return
    setBusy(true)
    try {
      await restoreSurvey(id)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handlePurge() {
    if (!purgeTarget) return
    setBusy(true)
    try {
      await purgeSurvey(purgeTarget)
      setPurgeTarget(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleEmpty() {
    setBusy(true)
    try {
      await emptyRecycleBin()
      setConfirmEmpty(false)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md px-4 pb-10">
      <header className="flex items-center gap-3 pt-4 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="glass flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-fg)]"
          aria-label="返回"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold tracking-tight">回收站</h1>
          <p className="text-xs text-[var(--color-fg-dim)]">删除后 7 天内可恢复</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="shrink-0 text-sm font-semibold text-[var(--color-danger)]"
          >
            清空
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

      {!loading && !error && items.length === 0 && (
        <Card className="flex flex-col items-center py-16 text-center">
          <Trash className="h-8 w-8 text-[var(--color-muted)]" />
          <p className="mt-4 text-sm text-[var(--color-fg-dim)]">回收站是空的</p>
        </Card>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-bold leading-tight">{s.store}</h3>
                  <p className="mt-0.5 truncate text-sm text-[var(--color-fg-dim)]">
                    {s.channel}
                    <span className="mx-1 text-[var(--color-muted)]">·</span>
                    {s.customer}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-[var(--color-muted)]">
                    巡店 {s.visit_date}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--color-warning-soft)] px-2.5 py-1 text-[0.65rem] font-semibold text-[var(--color-warning)]">
                  {s.days_left} 天后清除
                </span>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2 border-t border-[var(--color-line)] pt-3">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void handleRestore(s.id)}>
                  <RotateCcw className="h-3.5 w-3.5" /> 恢复
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => setPurgeTarget(s.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> 彻底删除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!purgeTarget}
        onOpenChange={(open) => !open && setPurgeTarget(null)}
        title="彻底删除这条记录？"
        description="记录、产品与照片将被永久删除，无法恢复。"
        confirmText="彻底删除"
        loading={busy}
        onConfirm={handlePurge}
      />

      <ConfirmDialog
        open={confirmEmpty}
        onOpenChange={setConfirmEmpty}
        title="清空回收站？"
        description="回收站内所有记录、产品与照片将被永久删除，无法恢复。"
        confirmText="清空"
        loading={busy}
        onConfirm={handleEmpty}
      />
    </div>
  )
}
