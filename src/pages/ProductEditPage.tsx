import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ProductForm } from '@/components/product/ProductForm'
import { Spinner } from '@/components/ui/spinner'
import { getSurvey } from '@/lib/surveys'
import { saveProduct, type ProductInput } from '@/lib/products'
import type { ProductRecord } from '@/lib/types'

export function ProductEditPage() {
  const { surveyId, productId } = useParams<{ surveyId: string; productId: string }>()
  const navigate = useNavigate()
  const isEdit = !!productId

  const [initial, setInitial] = React.useState<Partial<ProductRecord> | undefined>(undefined)
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
        if (alive) setInitial(found)
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
    setSubmitting(true)
    setError(null)
    try {
      await saveProduct(values)
      navigate(`/survey/${surveyId}`, { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setSubmitting(false)
    }
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
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
