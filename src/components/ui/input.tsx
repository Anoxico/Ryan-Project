import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-12 w-full rounded-[1.05rem] bg-[var(--color-surface-2)] px-4 text-[0.95rem] text-white',
          'border border-[var(--color-line)] transition-colors',
          'placeholder:text-[var(--color-muted)]',
          'focus:outline-none focus:border-[var(--color-line-strong)] focus:bg-[var(--color-surface-3)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[96px] w-full rounded-[1.05rem] bg-[var(--color-surface-2)] px-4 py-3 text-[0.95rem] text-white',
        'border border-[var(--color-line)] transition-colors leading-relaxed',
        'placeholder:text-[var(--color-muted)]',
        'focus:outline-none focus:border-[var(--color-line-strong)] focus:bg-[var(--color-surface-3)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'
