import type { ReactNode } from 'react'
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
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-[var(--color-fg-dim)]">{item.label}</span>
            <span className="shrink-0 font-bold text-[var(--color-fg)] tabular-nums">
              {item.value}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand-100)] to-[var(--color-brand)]"
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

const PALETTE = ['#007BA8', '#0E7490', '#0B7A54', '#92400E', '#7C3AED', '#B42318']

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
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        {segments.map((seg, i) => (
          <div
            key={seg.label}
            style={{ width: `${seg.ratio * 100}%`, background: PALETTE[i % PALETTE.length] }}
            className="relative flex h-full items-center justify-center"
            title={`${seg.label} ${(seg.ratio * 100).toFixed(0)}%`}
          >
            {seg.ratio >= 0.08 && (
              <span className="text-[0.6rem] font-semibold leading-none text-white tabular-nums">
                {(seg.ratio * 100).toFixed(0)}%
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-1.5 pt-1">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-[var(--color-fg-dim)]">{seg.label}</span>
            <span className="font-semibold text-[var(--color-fg)] tabular-nums">{seg.value}</span>
            <span className="w-10 text-right text-[var(--color-muted)] tabular-nums">
              {(seg.ratio * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface DonutSegment {
  label: string
  value: number
  ratio: number
  icon?: ReactNode
}

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[]
  centerValue: string | number
  centerLabel: string
}) {
  const size = 176
  const stroke = 22
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  let cursor = 0
  const arcs = segments.map((seg, i) => {
    const length = Math.max(seg.ratio, 0) * circumference
    const arc = {
      key: seg.label,
      color: PALETTE[i % PALETTE.length],
      length,
      offset: cursor,
    }
    cursor += length
    return arc
  })

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={centerLabel}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-surface-2)"
            strokeWidth={stroke}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[1.65rem] font-extrabold tabular-nums tracking-tight text-[var(--color-fg)]">
            {centerValue}
          </span>
          <span className="mt-0.5 text-xs text-[var(--color-fg-dim)]">{centerLabel}</span>
        </div>
      </div>

      <div className="w-full space-y-2.5">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-3 text-sm">
            {seg.icon ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.55rem] bg-[var(--color-brand-50)] text-[var(--color-brand-strong)]">
                {seg.icon}
              </span>
            ) : (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
            )}
            <span className="min-w-0 flex-1 truncate text-[var(--color-fg-dim)]">{seg.label}</span>
            <span className="font-semibold text-[var(--color-fg)] tabular-nums">{seg.value}</span>
            <span className={cn('w-10 text-right text-xs text-[var(--color-muted)] tabular-nums')}>
              {(seg.ratio * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
