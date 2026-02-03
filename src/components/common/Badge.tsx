import clsx from 'clsx'
import type { SubscriptionTier } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  tier?: SubscriptionTier
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Badge = ({
  children,
  variant = 'default',
  tier,
  size = 'md',
  className,
}: BadgeProps) => {
  const baseClasses = 'inline-flex items-center gap-1 font-semibold rounded-full'

  const variantClasses = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-primary/20 text-primary-light border border-primary/30',
  }

  const tierClasses = {
    free: 'bg-gray-700 text-gray-300',
    basic: 'bg-primary/20 text-primary-light border border-primary/30',
    premium: 'bg-accent/20 text-accent border border-accent/30',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  const tierIcons = {
    free: '⚪',
    basic: '💎',
    premium: '👑',
  }

  return (
    <span
      className={clsx(
        baseClasses,
        tier ? tierClasses[tier] : variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {tier && <span>{tierIcons[tier]}</span>}
      {children}
    </span>
  )
}
