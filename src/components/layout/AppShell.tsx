import type { ReactNode } from 'react'
import { TabBar } from './TabBar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-black">
      <main className="mx-auto max-w-md px-4 pb-32 pt-4">{children}</main>
      <TabBar />
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3 pt-2">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--color-fg-dim)]">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
