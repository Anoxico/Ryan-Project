import * as React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SurveyForm } from '@/components/survey/SurveyForm'
import { Spinner } from '@/components/ui/spinner'
import { getSurvey, saveSurvey, type SurveyInput } from '@/lib/surveys'
import type { Survey } from '@/lib/types'

interface Prefill {
  channel?: string
  customer?: string
  store?: string
}

export function SurveyEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isEdit = !!id
  const prefill = (location.state as { prefill?: Prefill } | null)?.prefill

  const [initial, setInitial] = React.useState<Partial<Survey> | undefined>(
    isEdit ? undefined : prefill,
  )
  const [loading, setLoading] = React.useState(isEdit)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!id) return
    let alive = true
    ;(async () => {
      try {
        const data = await getSurvey(id)
        if (alive) setInitial(data)
      } catch (e) {
        if (alive) setLoadError((e as Error).message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  async function handleSubmit(values: SurveyInput) {
    setSubmitting(true)
    setError(null)
    try {
      const { id: savedId } = await saveSurvey(values)
      navigate(`/survey/${savedId}`, { replace: true })
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
            {isEdit ? '编辑巡店单' : '新建巡店单'}
          </h1>
          <p className="text-xs text-[var(--color-fg-dim)]">填写基础信息</p>
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
            onClick={() => navigate('/')}
          >
            返回列表
          </button>
        </div>
      )}

      {!loading && !loadError && (
        <SurveyForm
          initial={initial}
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
