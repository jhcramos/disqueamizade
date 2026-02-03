import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  variant?: 'default' | 'primary' | 'accent'
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
  const baseClasses = 'card p-6 rounded-2xl transition-all duration-300'

  const variantClasses = {
    default: '',
    primary: 'border-primary/20',
    accent: 'border-accent/20',
  }

  const hoverClasses = {
    default: 'hover:border-primary/20 hover:shadow-card-hover',
    primary: 'hover:border-primary/30 hover:shadow-card-hover',
    accent: 'hover:border-accent/30 hover:shadow-card-hover',
  }

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        hover && hoverClasses[variant],
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
  <h3 className={clsx('text-2xl font-bold text-white', className)}>
    {children}
  </h3>
)

interface CardContentProps {
  children: ReactNode
  className?: string
}

export const CardContent = ({ children, className }: CardContentProps) => (
  <div className={clsx('text-gray-400', className)}>{children}</div>
)

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export const CardFooter = ({ children, className }: CardFooterProps) => (
  <div className={clsx('mt-6 pt-4 border-t border-white/5', className)}>
    {children}
  </div>
)
