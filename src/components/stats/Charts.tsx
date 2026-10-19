import { cn } from '@/lib/utils'

export interface BarItem {
  label: string
  value: number
}

export function BarList({ items, emptyText = '暂无数据' }: { items: BarItem[]; emptyText?: string }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-[var(--color-muted)]">{emptyText}</p>
  }
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate pr-2 text-[var(--color-fg-dim)]">{item.label}</span>
            <span className="shrink-0 font-bold tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-white/70 to-white"
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export interface RatioSegment {
  label: string
  value: number
  ratio: number
}

const PALETTE = ['#30d158', '#ff9f0a', '#ff3b30', '#5e5ce6', '#64d2ff', '#bf5af2']

export function RatioBar({
  title,
  segments,
}: {
  title: string
  segments: RatioSegment[]
}) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{title}</span>
        <span className="text-xs text-[var(--color-muted)]">{total} 个</span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
        {segments.map((seg, i) => (
          <div
            key={seg.label}
            style={{ width: `${seg.ratio * 100}%`, background: PALETTE[i % PALETTE.length] }}
            className="h-full"
            title={`${seg.label} ${(seg.ratio * 100).toFixed(0)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
        {segments.map((seg, i) => (
          <span key={seg.label} className="flex items-center gap-1.5 text-xs text-[var(--color-fg-dim)]">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            {seg.label}
            <span className={cn('font-semibold text-white tabular-nums')}>
              {(seg.ratio * 100).toFixed(0)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
