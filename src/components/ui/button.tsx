import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25',
  {
    variants: {
      variant: {
        default:
          'bg-white text-black hover:bg-white/90 shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset]',
        accent:
          'bg-[var(--color-accent)] text-white hover:brightness-110 shadow-[0_8px_30px_-12px_var(--color-accent)]',
        glass:
          'glass text-white hover:bg-white/[0.06]',
        outline:
          'border border-[var(--color-line-strong)] text-white hover:bg-white/[0.05]',
        ghost: 'text-[var(--color-fg-dim)] hover:text-white hover:bg-white/[0.05]',
        destructive:
          'bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25',
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
