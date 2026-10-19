import * as React from 'react'
import { Pencil, Copy, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CATEGORY_LABELS, type ProductRecord } from '@/lib/types'

interface ProductCardProps {
  product: ProductRecord
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  busy?: boolean
}

export function ProductCard({ product: p, onEdit, onDuplicate, onDelete, busy }: ProductCardProps) {
  const metrics: { label: string; value: string }[] = []
  if (p.form) metrics.push({ label: '形态', value: p.form })
  if (p.energy_rating) metrics.push({ label: '能效', value: p.energy_rating })
  if (p.category === 'dishwasher') {
    if (p.noise_db !== '' && p.noise_db !== undefined) metrics.push({ label: '噪音', value: `${p.noise_db} dB` })
    if (p.sets_count !== '' && p.sets_count !== undefined) metrics.push({ label: '套数', value: `${p.sets_count} 套` })
  }
  if (p.category === 'water_heater' && p.liter !== '' && p.liter !== undefined) {
    metrics.push({ label: '升数', value: `${p.liter} L` })
  }
  if (p.category === 'range_hood' && p.air_volume !== '' && p.air_volume !== undefined) {
    metrics.push({ label: '风量', value: `${p.air_volume} m³/min` })
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-block rounded-full bg-white/[0.06] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-fg-dim)]">
            {CATEGORY_LABELS[p.category]}
          </span>
          <h3 className="mt-1.5 truncate font-bold leading-tight">{p.product_name}</h3>
        </div>
        <p className="shrink-0 text-right font-bold tabular-nums">
          ¥{Number(p.sample_price || 0).toFixed(2)}
        </p>
      </div>

      {metrics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {metrics.map((m) => (
            <span
              key={m.label}
              className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[0.72rem] text-[var(--color-fg-dim)]"
            >
              {m.label} <span className="font-semibold text-white">{m.value}</span>
            </span>
          ))}
        </div>
      )}

      {p.extra_points && (
        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-[var(--color-fg-dim)]">
          卖点：{p.extra_points}
        </p>
      )}

      {p.product_params && (
        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-muted)]">
          {p.product_params}
        </p>
      )}

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

      <div className="mt-3 flex items-center justify-end gap-1 border-t border-[var(--color-line)] pt-2">
        <ActionButton label="编辑" onClick={onEdit} disabled={busy}>
          <Pencil className="h-3.5 w-3.5" />
        </ActionButton>
        <ActionButton label="复制" onClick={onDuplicate} disabled={busy}>
          <Copy className="h-3.5 w-3.5" />
        </ActionButton>
        <ActionButton label="删除" onClick={onDelete} disabled={busy} destructive>
          <Trash2 className="h-3.5 w-3.5" />
        </ActionButton>
      </div>
    </Card>
  )
}

function ActionButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ' +
        (destructive
          ? 'text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10'
          : 'text-[var(--color-fg-dim)] hover:bg-white/5 hover:text-white')
      }
    >
      {children}
      {label}
    </button>
  )
}
