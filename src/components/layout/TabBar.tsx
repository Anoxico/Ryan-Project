import { NavLink } from 'react-router-dom'
import { ClipboardList, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/', label: '记录', icon: ClipboardList, end: true },
  { to: '/stats', label: '统计', icon: BarChart3, end: false },
  { to: '/settings', label: '设置', icon: Settings, end: false },
]

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 safe-bottom">
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="glass-strong flex items-center justify-around rounded-[1.6rem] px-2 py-2">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-[1.1rem] py-2 text-[0.68rem] font-semibold transition-colors',
                  isActive ? 'text-white' : 'text-[var(--color-muted)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-[1.35rem] w-[1.35rem]', isActive && 'drop-shadow')} strokeWidth={isActive ? 2.4 : 2} />
                  <span>{label}</span>
                  <span
                    className={cn(
                      'h-1 w-1 rounded-full transition-opacity',
                      isActive ? 'bg-[var(--color-accent)] opacity-100' : 'opacity-0',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
