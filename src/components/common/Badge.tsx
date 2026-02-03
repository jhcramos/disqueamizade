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
  const baseClasses = 'inline-flex items-center gap-1 font-rajdhani font-semibold uppercase tracking-wider rounded-full'

  const variantClasses = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30',
  }

  const tierClasses = {
    free: 'bg-gray-700 text-gray-300',
    basic: 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 shadow-neon-cyan',
    premium: 'bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30 shadow-neon-magenta',
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
