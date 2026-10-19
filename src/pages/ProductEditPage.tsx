import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ProductForm } from '@/components/product/ProductForm'
import { Spinner } from '@/components/ui/spinner'
import { getSurvey } from '@/lib/surveys'
import { saveProduct, type ProductInput } from '@/lib/products'
import { uploadPhoto, deletePhoto, toPhotoItems, type PhotoItem } from '@/lib/photos'
import type { ProductRecord } from '@/lib/types'

export function ProductEditPage() {
  const { surveyId, productId } = useParams<{ surveyId: string; productId: string }>()
  const navigate = useNavigate()
  const isEdit = !!productId

  const [initial, setInitial] = React.useState<Partial<ProductRecord> | undefined>(undefined)
  const [photos, setPhotos] = React.useState<PhotoItem[]>([])
  const originalIds = React.useRef<string[]>([])
  const [loading, setLoading] = React.useState(isEdit)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!surveyId || !productId) return
    let alive = true
    ;(async () => {
      try {
        const survey = await getSurvey(surveyId)
        const found = survey.products?.find((p) => p.id === productId)
        if (!found) throw new Error('未找到该产品记录')
        if (alive) {
          setInitial(found)
          setPhotos(toPhotoItems(found.photos))
          originalIds.current = (found.photos ?? []).map((p) => p.id)
        }
      } catch (e) {
        if (alive) setLoadError((e as Error).message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [surveyId, productId])

  async function handleSubmit(values: ProductInput) {
    if (!surveyId) return
    setSubmitting(true)
    setError(null)
    // 清除上一次的错误状态
    setPhotos((prev) => prev.map((p) => (p.status === 'error' ? { ...p, status: 'pending' } : p)))

    try {
      const { id: savedId } = await saveProduct(values)

      // 删除已移除的旧照片
      const removed = originalIds.current.filter((id) => !photos.some((p) => p.id === id))
      await Promise.all(removed.map((id) => deletePhoto(id).catch(() => undefined)))

      // 上传新照片
      const pending = photos.filter((p) => p.file)
      const failed: string[] = []
      for (let i = 0; i < pending.length; i++) {
        const item = pending[i]
        if (!item.file) continue
        setPhotos((prev) =>
          prev.map((p) => (p.key === item.key ? { ...p, status: 'uploading' } : p)),
        )
        try {
          await uploadPhoto({ productId: savedId, surveyId, file: item.file, sortOrder: i })
          setPhotos((prev) => prev.map((p) => (p.key === item.key ? { ...p, status: undefined } : p)))
        } catch {
          failed.push(item.key)
          setPhotos((prev) => prev.map((p) => (p.key === item.key ? { ...p, status: 'error' } : p)))
        }
      }

      if (failed.length > 0) {
        setError(`有 ${failed.length} 张照片上传失败，请点「重试」或再次保存`)
        setSubmitting(false)
        return
      }

      navigate(`/survey/${surveyId}`, { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setSubmitting(false)
    }
  }

  function handleRetry(key: string) {
    setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, status: 'pending' } : p)))
    setError(null)
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md px-4 pb-10">
      <header className="flex items-center gap-3 pt-4 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="glass flex h-10 w-10 items-center justify-center rounded-full text-white"
          aria-label="返回"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">
            {isEdit ? '编辑产品' : '新增产品'}
          </h1>
          <p className="text-xs text-[var(--color-fg-dim)]">按类别填写专属字段</p>
        </div>
      </header>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!loading && loadError && (
        <div className="glass rounded-[var(--radius-xl)] p-5">
          <p className="text-sm text-[var(--color-accent)]">{loadError}</p>
          <button
            className="mt-3 text-sm text-[var(--color-fg-dim)] underline"
            onClick={() => navigate(`/survey/${surveyId}`)}
          >
            返回巡店单
          </button>
        </div>
      )}

      {!loading && !loadError && surveyId && (
        <ProductForm
          surveyId={surveyId}
          initial={initial}
          photos={photos}
          onPhotosChange={setPhotos}
          onPhotoRetry={handleRetry}
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
