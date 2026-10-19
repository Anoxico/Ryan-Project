import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, CalendarDays, Store, User, Radio, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { getSurvey, deleteSurvey } from '@/lib/surveys'
import { CATEGORY_LABELS, type Survey } from '@/lib/types'

export function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [survey, setSurvey] = React.useState<Survey | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    if (!id) return
    let alive = true
    ;(async () => {
      try {
        const data = await getSurvey(id)
        if (alive) setSurvey(data)
      } catch (e) {
        if (alive) setError((e as Error).message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    try {
      await deleteSurvey(id)
      navigate('/', { replace: true })
    } catch (e) {
      setDeleting(false)
      setConfirmOpen(false)
      setError((e as Error).message)
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md px-4 pb-32">
      <header className="flex items-center justify-between pt-4 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="glass flex h-10 w-10 items-center justify-center rounded-full text-white"
          aria-label="返回"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {survey && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/survey/${survey.id}/edit`)}
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-white"
              aria-label="编辑"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-accent)]"
              aria-label="删除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!loading && error && !survey && (
        <Card>
          <p className="text-sm text-[var(--color-accent)]">{error}</p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/')}>
            返回列表
          </Button>
        </Card>
      )}

      {survey && (
        <>
          <div className="mb-5">
            <div className="flex items-center gap-2 text-xs text-[var(--color-fg-dim)]">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="tabular-nums">{survey.visit_date}</span>
              {survey.status === 'draft' && (
                <span className="rounded-full bg-[var(--color-warning)]/15 px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--color-warning)]">
                  草稿
                </span>
              )}
            </div>
            <h1 className="mt-2 text-[1.7rem] font-extrabold leading-tight tracking-tight">
              {survey.store}
            </h1>
          </div>

          <Card className="space-y-4">
            <InfoRow icon={<Radio className="h-4 w-4" />} label="渠道" value={survey.channel} />
            <InfoRow icon={<User className="h-4 w-4" />} label="客户" value={survey.customer} />
            <InfoRow icon={<Store className="h-4 w-4" />} label="门店" value={survey.store} />
            {survey.remark && (
              <div className="border-t border-[var(--color-line)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  备注
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-fg-dim)]">
                  {survey.remark}
                </p>
              </div>
            )}
          </Card>

          <div className="mt-6 mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">产品记录</h2>
            <span className="text-sm text-[var(--color-fg-dim)]">
              {survey.products?.length ?? 0} 个
            </span>
          </div>

          {(!survey.products || survey.products.length === 0) && (
            <Card className="flex flex-col items-center py-10 text-center">
              <Package className="h-7 w-7 text-[var(--color-muted)]" />
              <p className="mt-3 text-sm text-[var(--color-fg-dim)]">
                还没有产品记录，阶段 3 开放添加
              </p>
            </Card>
          )}

          <div className="space-y-3">
            {survey.products?.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-block rounded-full bg-white/[0.06] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-fg-dim)]">
                      {CATEGORY_LABELS[p.category]}
                    </span>
                    <h3 className="mt-1.5 truncate font-bold">{p.product_name}</h3>
                    <p className="mt-0.5 text-xs text-[var(--color-fg-dim)]">
                      {[p.form, p.energy_rating].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <p className="shrink-0 text-right font-bold tabular-nums">
                    ¥{Number(p.sample_price || 0).toFixed(2)}
                  </p>
                </div>

                {p.photos && p.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {p.photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt=""
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-[0.8rem] object-cover"
                      />
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="删除这条巡店单？"
        description="巡店单下的所有产品记录和照片都会一并删除，且无法恢复。"
        confirmText="删除"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-sm text-[var(--color-fg-dim)]">
        {icon}
        {label}
      </span>
      <span className="truncate text-sm font-semibold text-white">{value}</span>
    </div>
  )
}
