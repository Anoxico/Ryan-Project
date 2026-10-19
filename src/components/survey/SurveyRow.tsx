import { CalendarDays, ImageIcon, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Survey } from '@/lib/types'

interface SurveyRowProps {
  survey: Survey
  showStore?: boolean
  selected?: boolean
  selecting?: boolean
  onClick?: () => void
  className?: string
}

export function SurveyRow({
  survey,
  showStore = true,
  selected,
  selecting,
  onClick,
  className,
}: SurveyRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass squircle flex items-center gap-4 rounded-[var(--radius-xl)] p-4 transition-colors',
        onClick && 'cursor-pointer active:bg-[var(--color-surface-2)]',
        selected && 'ring-1 ring-[var(--color-brand)]',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-[var(--color-fg-dim)]">
          <CalendarDays className="h-3.5 w-3.5" />
          <span className="tabular-nums">{survey.visit_date}</span>
          {survey.status === 'draft' && (
            <span className="rounded-full bg-[var(--color-warning)]/15 px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--color-warning)]">
              草稿
            </span>
          )}
        </div>
        {showStore && (
          <h3 className="mt-1.5 truncate text-[1.02rem] font-bold leading-tight">{survey.store}</h3>
        )}
        <p className="mt-0.5 truncate text-sm text-[var(--color-fg-dim)]">
          {survey.channel}
          <span className="mx-1 text-[var(--color-muted)]">·</span>
          {survey.customer}
        </p>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-fg-dim)]">
          <Package className="h-3 w-3" />
          {survey.product_count ?? 0} 个产品
        </div>
      </div>

      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[1.1rem] bg-[var(--color-surface-2)]">
        {survey.thumbnail ? (
          <img src={survey.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-5 w-5 text-[var(--color-muted)]" />
          </div>
        )}
      </div>
    </div>
  )
}
