import { HTMLAttributes, forwardRef, ReactNode } from 'react'
import { clsx } from 'clsx'

type CardVariant = 'default' | 'balada' | 'energia' | 'elite' | 'interactive'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  default: 'card',
  balada: 'card-balada',
  energia: 'card-energia',
  elite: 'card-elite',
  interactive: 'card-interactive',
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(variantClasses[variant], paddingClasses[padding], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: ReactNode
}

export const CardHeader = ({ title, subtitle, action, className, ...props }: CardHeaderProps) => {
  return (
    <div className={clsx('flex items-start justify-between mb-4', className)} {...props}>
      <div>
        <h3 className="font-display font-bold text-lg text-white">{title}</h3>
        {subtitle && <p className="text-sm text-noite-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// Card Footer
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const CardFooter = ({ children, className, ...props }: CardFooterProps) => {
  return (
    <div
      className={clsx('flex items-center gap-3 mt-4 pt-4 border-t border-white/5', className)}
      {...props}
    >
      {children}
    </div>
  )
}
