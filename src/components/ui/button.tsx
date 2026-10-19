import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-brand-strong)] text-white hover:bg-[var(--color-brand-pressed)] shadow-float',
        gradient:
          'bg-brand-gradient text-white hover:brightness-105 shadow-float',
        glass: 'glass text-[var(--color-fg)] hover:bg-[var(--color-brand-50)]',
        outline:
          'border border-[var(--color-control)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-brand-strong)] hover:text-[var(--color-brand-text)]',
        ghost:
          'text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]',
        destructive:
          'bg-[var(--color-danger)] text-white hover:brightness-110 shadow-danger',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm rounded-[0.9rem]',
        default: 'h-11 px-5 text-[0.95rem] rounded-[1.05rem]',
        lg: 'h-13 px-6 text-base rounded-[1.2rem]',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
