import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Field } from '@/components/form/Field'
import { AutocompleteInput } from '@/components/form/AutocompleteInput'
import { useDict } from '@/lib/dict'
import { cn } from '@/lib/utils'
import { loadDraft, saveDraft, surveyDraftKey, type SurveyDraft } from '@/lib/draft'
import type { Survey } from '@/lib/types'
import type { SurveyInput } from '@/lib/surveys'

function today() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

interface SurveyFormProps {
  initial?: Partial<Survey>
  submitting?: boolean
  error?: string | null
  onSubmit: (values: SurveyInput) => void
}

type Errors = Partial<Record<'visit_date' | 'channel' | 'customer' | 'store', string>>

export function SurveyForm({ initial, submitting, error, onSubmit }: SurveyFormProps) {
  const draftKey = surveyDraftKey(initial?.id)
  const [draft] = React.useState<SurveyDraft | null>(() =>
    initial?.id ? null : loadDraft<SurveyDraft>(draftKey),
  )
  const restoredFromDraft = !!draft

  const [visitDate, setVisitDate] = React.useState(initial?.visit_date || draft?.visitDate || today())
  const [channel, setChannel] = React.useState(initial?.channel || draft?.channel || '')
  const [customer, setCustomer] = React.useState(initial?.customer || draft?.customer || '')
  const [store, setStore] = React.useState(initial?.store || draft?.store || '')
  const [remark, setRemark] = React.useState(initial?.remark || draft?.remark || '')
  const [status, setStatus] = React.useState<'draft' | 'submitted'>(
    (initial?.status as 'draft' | 'submitted') || draft?.status || 'submitted',
  )
  const [errors, setErrors] = React.useState<Errors>({})

  React.useEffect(() => {
    if (initial?.id) return
    saveDraft(draftKey, { visitDate, channel, customer, store, remark, status } satisfies SurveyDraft)
  }, [draftKey, initial?.id, visitDate, channel, customer, store, remark, status])

  const channels = useDict('channel')
  const customers = useDict('customer')
  const stores = useDict('store')

  function validate(): boolean {
    const next: Errors = {}
    if (!visitDate) next.visit_date = '请选择巡店日期'
    if (!channel.trim()) next.channel = '请填写渠道名'
    if (!customer.trim()) next.customer = '请填写客户名'
    if (!store.trim()) next.store = '请填写店名'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      id: initial?.id,
      visit_date: visitDate,
      channel: channel.trim(),
      customer: customer.trim(),
      store: store.trim(),
      remark: remark.trim(),
      status,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {restoredFromDraft && (
        <p className="rounded-[1rem] bg-white/[0.05] px-4 py-2.5 text-xs text-[var(--color-fg-dim)]">
          已恢复上次未保存的草稿
        </p>
      )}
      <Field label="巡店日期" required error={errors.visit_date} htmlFor="visit_date">
        <Input
          id="visit_date"
          type="date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          className={cn('tabular-nums', '[color-scheme:dark]')}
        />
      </Field>

      <Field label="渠道名" required error={errors.channel}>
        <AutocompleteInput
          value={channel}
          onChange={(v) => {
            setChannel(v)
            if (errors.channel) setErrors((p) => ({ ...p, channel: undefined }))
          }}
          options={channels.options}
          placeholder="如：国美 / 苏宁 / 京东专卖店"
          invalid={!!errors.channel}
        />
      </Field>

      <Field label="客户名" required error={errors.customer}>
        <AutocompleteInput
          value={customer}
          onChange={(v) => {
            setCustomer(v)
            if (errors.customer) setErrors((p) => ({ ...p, customer: undefined }))
          }}
          options={customers.options}
          placeholder="如：张三家电"
          invalid={!!errors.customer}
        />
      </Field>

      <Field label="店名" required error={errors.store}>
        <AutocompleteInput
          value={store}
          onChange={(v) => {
            setStore(v)
            if (errors.store) setErrors((p) => ({ ...p, store: undefined }))
          }}
          options={stores.options}
          placeholder="如：国美中山路旗舰店"
          invalid={!!errors.store}
        />
      </Field>

      <Field label="备注">
        <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="选填" />
      </Field>

      <Field label="状态">
        <div className="glass flex rounded-[1.05rem] p-1">
          {(
            [
              { value: 'submitted', label: '正式记录' },
              { value: 'draft', label: '草稿' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={cn(
                'flex-1 rounded-[0.8rem] py-2 text-sm font-semibold transition-colors',
                status === opt.value ? 'bg-white text-black' : 'text-[var(--color-fg-dim)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting && <Spinner />}
        保存巡店单
      </Button>
    </form>
  )
}
