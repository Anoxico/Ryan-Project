import { cn } from '@/lib/utils'

export interface UnderlineTabItem<T extends string> {
  value: T
  label: string
}

export function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: UnderlineTabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn('flex border-b border-[var(--color-line)]', className)}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative flex-1 py-3 text-sm font-semibold transition-colors',
              active
                ? 'text-[var(--color-brand-text)]'
                : 'text-[var(--color-fg-dim)] hover:text-[var(--color-fg)]',
            )}
          >
            {item.label}
            <span
              className={cn(
                'absolute inset-x-6 -bottom-px h-0.5 rounded-full transition-opacity',
                active ? 'bg-[var(--color-brand)] opacity-100' : 'opacity-0',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
