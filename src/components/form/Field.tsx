import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  htmlFor?: string
  className?: string
  children: React.ReactNode
}

export function Field({ label, required, error, hint, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor} className="flex items-center gap-1">
        {label}
        {required && <span className="text-[var(--color-accent)]">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="pl-1 text-xs text-[var(--color-accent)]">{error}</p>
      ) : hint ? (
        <p className="pl-1 text-xs text-[var(--color-muted)]">{hint}</p>
      ) : null}
    </div>
  )
}
