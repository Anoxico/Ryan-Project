import { Link } from 'react-router-dom'
import { Store as StoreIcon, CalendarDays } from 'lucide-react'
import type { StoreGroup } from '@/lib/surveys'

export function StoreCard({ group }: { group: StoreGroup }) {
  return (
    <Link to={`/store/${encodeURIComponent(group.store)}`} className="block">
      <div className="glass squircle overflow-hidden rounded-[var(--radius-xl)] transition-colors active:bg-white/[0.06]">
        <div className="relative h-28 w-full bg-gradient-to-br from-white/[0.08] to-transparent">
          {group.cover ? (
            <img src={group.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <StoreIcon className="h-7 w-7 text-[var(--color-muted)]" />
            </div>
          )}
          <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[0.68rem] font-bold text-white backdrop-blur-sm">
            {group.visitCount} 次巡店
          </span>
        </div>

        <div className="p-4">
          <h3 className="truncate text-[1.05rem] font-bold leading-tight">{group.store}</h3>
          <p className="mt-1 truncate text-sm text-[var(--color-fg-dim)]">
            {group.channel}
            <span className="mx-1 text-[var(--color-muted)]">·</span>
            {group.customer}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
            <CalendarDays className="h-3.5 w-3.5" />
            最近巡店 <span className="tabular-nums">{group.latestDate}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
