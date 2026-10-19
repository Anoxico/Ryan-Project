import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Field } from '@/components/form/Field'
import { AutocompleteInput } from '@/components/form/AutocompleteInput'
import { PhotoUploader } from '@/components/photo/PhotoUploader'
import { useDict } from '@/lib/dict'
import { cn } from '@/lib/utils'
import { createPhotoItem, type PhotoItem } from '@/lib/photos'
import { CATEGORY_LABELS, type ProductCategory, type ProductRecord } from '@/lib/types'
import type { ProductInput } from '@/lib/products'

const CATEGORIES: ProductCategory[] = ['dishwasher', 'water_heater', 'range_hood']

interface CategoryFieldFlags {
  form: boolean
  energy: boolean
  noise: boolean
  sets: boolean
  extra: boolean
  liter: boolean
  air: boolean
}

const FIELD_FLAGS: Record<ProductCategory, CategoryFieldFlags> = {
  dishwasher: { form: true, energy: true, noise: true, sets: true, extra: true, liter: false, air: false },
  water_heater: { form: true, energy: true, noise: false, sets: false, extra: false, liter: true, air: false },
  range_hood: { form: true, energy: true, noise: false, sets: false, extra: true, liter: false, air: true },
}

interface ProductFormProps {
  surveyId: string
  initial?: Partial<ProductRecord>
  photos: PhotoItem[]
  onPhotosChange: (photos: PhotoItem[]) => void
  onPhotoRetry?: (key: string) => void
  submitting?: boolean
  error?: string | null
  onSubmit: (values: ProductInput) => void
}

type Errors = Partial<Record<'product_name' | 'sample_price' | 'noise_db' | 'sets_count' | 'liter' | 'air_volume', string>>

function str(v: unknown): string {
  return v === undefined || v === null || v === '' ? '' : String(v)
}

export function ProductForm({
  surveyId,
  initial,
  photos,
  onPhotosChange,
  onPhotoRetry,
  submitting,
  error,
  onSubmit,
}: ProductFormProps) {
  const [category, setCategory] = React.useState<ProductCategory>(initial?.category ?? 'dishwasher')
  const [productName, setProductName] = React.useState(initial?.product_name ?? '')
  const [productParams, setProductParams] = React.useState(initial?.product_params ?? '')
  const [price, setPrice] = React.useState(str(initial?.sample_price))
  const [form, setForm] = React.useState(initial?.form ?? '')
  const [energy, setEnergy] = React.useState(initial?.energy_rating ?? '')
  const [noise, setNoise] = React.useState(str(initial?.noise_db))
  const [sets, setSets] = React.useState(str(initial?.sets_count))
  const [extra, setExtra] = React.useState(initial?.extra_points ?? '')
  const [liter, setLiter] = React.useState(str(initial?.liter))
  const [air, setAir] = React.useState(str(initial?.air_volume))
  const [remark, setRemark] = React.useState(initial?.remark ?? '')
  const [errors, setErrors] = React.useState<Errors>({})

  const productNames = useDict('product_name', category)
  const forms = useDict('form', category)
  const energies = useDict('energy_rating')

  const flags = FIELD_FLAGS[category]

  function handleCategoryChange(next: ProductCategory) {
    if (next === category) return
    setCategory(next)
    // 清空上一类别的专属字段，避免脏数据
    setForm('')
    setNoise('')
    setSets('')
    setExtra('')
    setLiter('')
    setAir('')
    setErrors({})
  }

  function numField(value: string, label: string, key: keyof Errors): number | '' {
    if (value.trim() === '') return ''
    const n = Number(value)
    if (Number.isNaN(n)) {
      setErrors((p) => ({ ...p, [key]: `${label} 需为数字` }))
      return ''
    }
    if (n < 0) {
      setErrors((p) => ({ ...p, [key]: `${label} 不能为负数` }))
      return ''
    }
    return n
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!productName.trim()) next.product_name = '请填写产品名'
    if (price.trim() === '') {
      next.sample_price = '请填写终端出样价格'
    } else if (Number.isNaN(Number(price)) || Number(price) < 0) {
      next.sample_price = '价格需为非负数字'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({
      id: initial?.id,
      survey_id: surveyId,
      category,
      product_name: productName.trim(),
      product_params: productParams.trim(),
      sample_price: Number(Number(price).toFixed(2)),
      form: flags.form ? form.trim() : '',
      energy_rating: flags.energy ? energy.trim() : '',
      noise_db: flags.noise ? numField(noise, '噪音', 'noise_db') : '',
      sets_count: flags.sets ? numField(sets, '套数', 'sets_count') : '',
      extra_points: flags.extra ? extra.trim() : '',
      liter: flags.liter ? numField(liter, '升数', 'liter') : '',
      air_volume: flags.air ? numField(air, '风量', 'air_volume') : '',
      remark: remark.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 产品类别 */}
      <Field label="产品类别" required>
        <div className="glass flex rounded-[1.05rem] p-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                'flex-1 rounded-[0.8rem] py-2.5 text-sm font-semibold transition-colors',
                category === cat ? 'bg-white text-black' : 'text-[var(--color-fg-dim)]',
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="产品名" required error={errors.product_name}>
        <AutocompleteInput
          value={productName}
          onChange={(v) => {
            setProductName(v)
            if (errors.product_name) setErrors((p) => ({ ...p, product_name: undefined }))
          }}
          options={productNames.options}
          placeholder="如：美的洗碗机 WQP12"
          invalid={!!errors.product_name}
        />
      </Field>

      <Field label="终端出样价格" required error={errors.sample_price} hint="单位：元，保留两位小数">
        <div className="relative">
          <Input
            inputMode="decimal"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value)
              if (errors.sample_price) setErrors((p) => ({ ...p, sample_price: undefined }))
            }}
            placeholder="0.00"
            className={cn('tabular-nums pr-10', errors.sample_price && 'border-[var(--color-accent)]/50')}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]">
            元
          </span>
        </div>
      </Field>

      {/* 形态 */}
      {flags.form && (
        <Field label="形态">
          <AutocompleteInput
            value={form}
            onChange={setForm}
            options={forms.options}
            placeholder="选择或输入形态"
          />
        </Field>
      )}

      {/* 能效 */}
      {flags.energy && (
        <Field label="能效">
          <div className="flex flex-wrap gap-2">
            {energies.options.length === 0 && (
              <span className="text-sm text-[var(--color-muted)]">暂无能效字典</span>
            )}
            {energies.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEnergy(energy === opt.name ? '' : opt.name)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  energy === opt.name
                    ? 'bg-white text-black'
                    : 'glass text-[var(--color-fg-dim)]',
                )}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </Field>
      )}

      {/* 洗碗机专属 */}
      {flags.noise && (
        <NumericField label="噪音" unit="dB" value={noise} onChange={setNoise} error={errors.noise_db} />
      )}
      {flags.sets && (
        <NumericField label="套数" unit="套" value={sets} onChange={setSets} error={errors.sets_count} />
      )}

      {/* 热水器专属 */}
      {flags.liter && (
        <NumericField label="升数" unit="L" value={liter} onChange={setLiter} error={errors.liter} />
      )}

      {/* 抽油烟机专属 */}
      {flags.air && (
        <NumericField label="风量" unit="m³/min" value={air} onChange={setAir} error={errors.air_volume} />
      )}

      {/* 额外卖点（洗碗机 / 抽油烟机） */}
      {flags.extra && (
        <Field label="额外卖点">
          <Textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="选填，如：高温除菌 / 热风烘干"
          />
        </Field>
      )}

      <Field label="产品参数" hint="选填，每行一项，如：型号 WQP12 / 尺寸 600x600">
        <Textarea
          value={productParams}
          onChange={(e) => setProductParams(e.target.value)}
          placeholder="型号：&#10;尺寸：&#10;容量："
        />
      </Field>

      <Field label="备注">
        <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="选填" />
      </Field>

      {/* 照片 */}
      <Field label="巡店照片" hint="选填，可拍照或从相册选择多张">
        <PhotoUploader
          photos={photos}
          disabled={submitting}
          onAddFiles={(files) => onPhotosChange([...photos, ...files.map(createPhotoItem)])}
          onRemove={(key) => {
            const target = photos.find((p) => p.key === key)
            if (target?.file) URL.revokeObjectURL(target.url)
            onPhotosChange(photos.filter((p) => p.key !== key))
          }}
          onRetry={onPhotoRetry}
        />
      </Field>

      {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting && <Spinner />}
        保存产品记录
      </Button>
    </form>
  )
}

function NumericField({
  label,
  unit,
  value,
  onChange,
  error,
}: {
  label: string
  unit: string
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <Field label={label} error={error}>
      <div className="relative">
        <Input
          inputMode="decimal"
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={cn('tabular-nums pr-16', error && 'border-[var(--color-accent)]/50')}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]">
          {unit}
        </span>
      </div>
    </Field>
  )
}
