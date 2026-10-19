import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-brand-100)] border-t-[var(--color-brand-strong)]',
        className,
      )}
      aria-label="加载中"
    />
  )
}
