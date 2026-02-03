import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  variant?: 'default' | 'cyan' | 'magenta' | 'yellow'
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
  const baseClasses = 'glass-card p-6 rounded-xl transition-all duration-300'

  const variantClasses = {
    default: 'border-neon-cyan/30',
    cyan: 'border-neon-cyan/50',
    magenta: 'border-neon-magenta/50',
    yellow: 'border-neon-yellow/50',
  }

  const hoverClasses = {
    default: 'hover:border-neon-cyan hover:shadow-neon-cyan',
    cyan: 'hover:border-neon-cyan hover:shadow-neon-cyan',
    magenta: 'hover:border-neon-magenta hover:shadow-neon-magenta',
    yellow: 'hover:border-neon-yellow hover:shadow-neon-yellow',
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
  <h3 className={clsx('text-2xl font-bold text-neon-cyan', className)}>
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
  <div className={clsx('mt-6 pt-4 border-t border-gray-700', className)}>
    {children}
  </div>
)
