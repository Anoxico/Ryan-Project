import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CalendarDays,
  Store,
  User,
  Radio,
  Package,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ProductCard } from '@/components/product/ProductCard'
import { PhotoUploader } from '@/components/photo/PhotoUploader'
import { Lightbox } from '@/components/photo/Lightbox'
import { getSurvey, deleteSurvey } from '@/lib/surveys'
import { deleteProduct, duplicateProduct } from '@/lib/products'
import { uploadPhoto, deletePhoto, createPhotoItem, toPhotoItems, type PhotoItem } from '@/lib/photos'
import type { Survey } from '@/lib/types'

export function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [survey, setSurvey] = React.useState<Survey | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [confirmSurveyOpen, setConfirmSurveyOpen] = React.useState(false)
  const [productToDelete, setProductToDelete] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [surveyPhotos, setSurveyPhotos] = React.useState<PhotoItem[]>([])
  const [preview, setPreview] = React.useState<{ photos: { url: string }[]; index: number } | null>(null)

  const load = React.useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getSurvey(id)
      setSurvey(data)
      setSurveyPhotos(toPhotoItems(data.survey_photos))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    void load()
  }, [load])

  async function handleDeleteSurvey() {
    if (!id) return
    setBusy(true)
    try {
      await deleteSurvey(id)
      navigate('/', { replace: true })
    } catch (e) {
      setBusy(false)
      setConfirmSurveyOpen(false)
      setError((e as Error).message)
    }
  }

  async function handleDeleteProduct() {
    if (!productToDelete) return
    setBusy(true)
    try {
      await deleteProduct(productToDelete)
      setProductToDelete(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDuplicateProduct(productId: string) {
    if (busy) return
    setBusy(true)
    try {
      await duplicateProduct(productId)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleAddSurveyPhotos(files: File[]) {
    if (!id) return
    const items = files.map(createPhotoItem)
    setSurveyPhotos((prev) => [...prev, ...items])
    let order = surveyPhotos.length
    for (const item of items) {
      if (!item.file) continue
      setSurveyPhotos((prev) =>
        prev.map((p) => (p.key === item.key ? { ...p, status: 'uploading' } : p)),
      )
      try {
        const photo = await uploadPhoto({ surveyId: id, file: item.file, sortOrder: order++ })
        setSurveyPhotos((prev) =>
          prev.map((p) => (p.key === item.key ? { key: photo.id, id: photo.id, url: photo.url } : p)),
        )
      } catch {
        setSurveyPhotos((prev) =>
          prev.map((p) => (p.key === item.key ? { ...p, status: 'error' } : p)),
        )
      }
    }
  }

  async function handleRemoveSurveyPhoto(key: string) {
    const target = surveyPhotos.find((p) => p.key === key)
    if (target?.file) URL.revokeObjectURL(target.url)
    setSurveyPhotos((prev) => prev.filter((p) => p.key !== key))
    if (target?.id) {
      try {
        await deletePhoto(target.id)
      } catch {
        /* 忽略删除失败 */
      }
    }
  }

  async function handleRetrySurveyPhoto(key: string) {
    const target = surveyPhotos.find((p) => p.key === key)
    if (!target?.file || !id) return
    setSurveyPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, status: 'uploading' } : p)))
    try {
      const photo = await uploadPhoto({ surveyId: id, file: target.file, sortOrder: surveyPhotos.length })
      setSurveyPhotos((prev) =>
        prev.map((p) => (p.key === key ? { key: photo.id, id: photo.id, url: photo.url } : p)),
      )
    } catch {
      setSurveyPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, status: 'error' } : p)))
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
              onClick={() => setConfirmSurveyOpen(true)}
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

          <div className="mt-4">
            <h2 className="mb-3 text-lg font-bold">巡店照片</h2>
            <PhotoUploader
              photos={surveyPhotos}
              onAddFiles={(files) => void handleAddSurveyPhotos(files)}
              onRemove={(key) => void handleRemoveSurveyPhoto(key)}
              onRetry={(key) => void handleRetrySurveyPhoto(key)}
              hint="选填，可拍照或从相册选择多张"
            />
          </div>

          <div className="mt-6 mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              产品记录
              <span className="ml-2 text-sm font-medium text-[var(--color-fg-dim)]">
                {survey.products?.length ?? 0} 个
              </span>
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/survey/${survey.id}/product/new`)}
            >
              <Plus className="h-4 w-4" /> 添加产品
            </Button>
          </div>

          {error && survey && <p className="mb-3 text-sm text-[var(--color-accent)]">{error}</p>}

          {(!survey.products || survey.products.length === 0) && (
            <Card className="flex flex-col items-center py-10 text-center">
              <Package className="h-7 w-7 text-[var(--color-muted)]" />
              <p className="mt-3 text-sm text-[var(--color-fg-dim)]">还没有产品记录</p>
              <Button
                className="mt-4"
                onClick={() => navigate(`/survey/${survey.id}/product/new`)}
              >
                <Plus className="h-4 w-4" /> 添加第一条产品
              </Button>
            </Card>
          )}

          <div className="space-y-3">
            {survey.products?.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                busy={busy}
                onEdit={() => navigate(`/survey/${survey.id}/product/${p.id}/edit`)}
                onDuplicate={() => void handleDuplicateProduct(p.id)}
                onDelete={() => setProductToDelete(p.id)}
                onPreviewPhoto={(photoIndex) =>
                  setPreview({ photos: (p.photos ?? []).map((ph) => ({ url: ph.url })), index: photoIndex })
                }
              />
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmSurveyOpen}
        onOpenChange={setConfirmSurveyOpen}
        title="删除这条巡店单？"
        description="巡店单下的所有产品记录和照片都会一并删除，且无法恢复。"
        confirmText="删除"
        loading={busy}
        onConfirm={handleDeleteSurvey}
      />

      <ConfirmDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        title="删除这条产品记录？"
        description="该产品记录及其照片将被删除，无法恢复。"
        confirmText="删除"
        loading={busy}
        onConfirm={handleDeleteProduct}
      />

      <Lightbox
        open={preview !== null}
        photos={preview?.photos ?? []}
        index={preview?.index ?? 0}
        onIndexChange={(i) => setPreview((prev) => (prev ? { ...prev, index: i } : prev))}
        onClose={() => setPreview(null)}
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
