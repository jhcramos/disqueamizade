import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'gradient-border'
  hover?: boolean
  clickable?: boolean
  className?: string
  onClick?: () => void
}

export const Card = ({
  children,
  variant = 'default',
  hover = false,
  clickable = false,
  className,
  onClick,
}: CardProps) => {
  const baseClasses = 'p-6 rounded-2xl transition-all duration-300'

  const variantClasses = {
    default: 'bg-zinc-900/80 backdrop-blur-sm border border-zinc-800',
    elevated: 'bg-zinc-900 border border-zinc-800 shadow-lg',
    'gradient-border': 'gradient-border p-6',
  }

  const hoverClasses = 'hover:border-zinc-700 hover:shadow-lg hover:-translate-y-0.5'

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        hover && hoverClasses,
        clickable && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export const CardHeader = ({ children, className }: CardHeaderProps) => (
  <div className={clsx('mb-4', className)}>{children}</div>
)

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export const CardTitle = ({ children, className }: CardTitleProps) => (
  <h3 className={clsx('text-2xl font-bold text-zinc-50', className)}>
    {children}
  </h3>
)

interface CardContentProps {
  children: ReactNode
  className?: string
}

export const CardContent = ({ children, className }: CardContentProps) => (
  <div className={clsx('text-zinc-400', className)}>{children}</div>
)

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export const CardFooter = ({ children, className }: CardFooterProps) => (
  <div className={clsx('mt-6 pt-4 border-t border-zinc-800', className)}>
    {children}
  </div>
)
