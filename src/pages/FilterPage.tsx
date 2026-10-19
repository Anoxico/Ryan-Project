import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Field } from '@/components/form/Field'
import { AutocompleteInput } from '@/components/form/AutocompleteInput'
import { SurveyRow } from '@/components/survey/SurveyRow'
import { listSurveys } from '@/lib/surveys'
import { useDict } from '@/lib/dict'
import { cn } from '@/lib/utils'
import { CATEGORY_LABELS, type ProductCategory, type Survey, type SurveyFilters } from '@/lib/types'

const CATEGORY_OPTIONS: { value: '' | ProductCategory; label: string }[] = [
  { value: '', label: '全部类别' },
  { value: 'dishwasher', label: CATEGORY_LABELS.dishwasher },
  { value: 'water_heater', label: CATEGORY_LABELS.water_heater },
  { value: 'range_hood', label: CATEGORY_LABELS.range_hood },
]

export function FilterPage() {
  const navigate = useNavigate()

  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')
  const [channel, setChannel] = React.useState('')
  const [customer, setCustomer] = React.useState('')
  const [store, setStore] = React.useState('')
  const [category, setCategory] = React.useState<'' | ProductCategory>('')
  const [productName, setProductName] = React.useState('')
  const [energy, setEnergy] = React.useState('')
  const [form, setForm] = React.useState('')

  const [results, setResults] = React.useState<Survey[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const channels = useDict('channel')
  const customers = useDict('customer')
  const stores = useDict('store')
  const energies = useDict('energy_rating')
  const forms = useDict('form', category || undefined)

  function buildFilters(): SurveyFilters {
    const f: SurveyFilters = {}
    if (dateFrom) f.dateFrom = dateFrom
    if (dateTo) f.dateTo = dateTo
    if (channel) f.channel = channel
    if (customer) f.customer = customer
    if (store) f.store = store
    if (category) f.category = category
    if (productName.trim()) f.productName = productName.trim()
    if (energy) f.energy = energy
    if (form) f.form = form
    return f
  }

  async function runSearch() {
    setLoading(true)
    setError(null)
    try {
      const data = await listSurveys(buildFilters())
      setResults(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setDateFrom('')
    setDateTo('')
    setChannel('')
    setCustomer('')
    setStore('')
    setCategory('')
    setProductName('')
    setEnergy('')
    setForm('')
    setResults(null)
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
          <h1 className="text-xl font-extrabold tracking-tight">筛选与搜索</h1>
          <p className="text-xs text-[var(--color-fg-dim)]">按条件查找巡店记录</p>
        </div>
      </header>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="开始日期">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="[color-scheme:dark] tabular-nums"
            />
          </Field>
          <Field label="结束日期">
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="[color-scheme:dark] tabular-nums"
            />
          </Field>
        </div>

        <Field label="渠道">
          <AutocompleteInput value={channel} onChange={setChannel} options={channels.options} placeholder="全部渠道" />
        </Field>
        <Field label="客户">
          <AutocompleteInput value={customer} onChange={setCustomer} options={customers.options} placeholder="全部客户" />
        </Field>
        <Field label="门店">
          <AutocompleteInput value={store} onChange={setStore} options={stores.options} placeholder="全部门店" />
        </Field>

        <Field label="产品类别">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as '' | ProductCategory)
              setForm('')
            }}
            className="h-12 w-full rounded-[1.05rem] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 text-[0.95rem] text-white focus:border-[var(--color-line-strong)] focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[var(--color-surface)]">
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="产品名">
          <Input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="按产品名模糊匹配"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="能效">
            <select
              value={energy}
              onChange={(e) => setEnergy(e.target.value)}
              className="h-12 w-full rounded-[1.05rem] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 text-[0.95rem] text-white focus:border-[var(--color-line-strong)] focus:outline-none"
            >
              <option value="" className="bg-[var(--color-surface)]">全部</option>
              {energies.options.map((o) => (
                <option key={o.id} value={o.name} className="bg-[var(--color-surface)]">
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="形态">
            <AutocompleteInput value={form} onChange={setForm} options={forms.options} placeholder="全部形态" />
          </Field>
        </div>

        <div className="flex gap-3 pt-1">
          <Button className="flex-1" size="lg" onClick={() => void runSearch()} disabled={loading}>
            {loading ? <Spinner /> : <Search className="h-4 w-4" />}
            搜索
          </Button>
          <Button variant="outline" size="lg" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}

        {results !== null && !loading && !error && (
          <div className="pt-2">
            <p className="mb-3 text-sm text-[var(--color-fg-dim)]">
              找到 <span className="font-bold text-white">{results.length}</span> 条巡店记录
            </p>
            {results.length === 0 ? (
              <Card className="flex flex-col items-center py-12 text-center">
                <Search className="h-7 w-7 text-[var(--color-muted)]" />
                <p className="mt-3 text-sm text-[var(--color-fg-dim)]">没有符合条件的记录</p>
              </Card>
            ) : (
              <div className={cn('space-y-3')}>
                {results.map((s) => (
                  <SurveyRow key={s.id} survey={s} onClick={() => navigate(`/survey/${s.id}`)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
