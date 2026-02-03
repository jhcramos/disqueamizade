import clsx from 'clsx'
import { Crown, Diamond, Circle } from 'lucide-react'
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
  const baseClasses = 'inline-flex items-center gap-1.5 font-medium rounded-full'

  const variantClasses = {
    default: 'bg-zinc-800 text-zinc-300',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
    info: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  }

  const tierClasses = {
    free: 'bg-zinc-800 text-zinc-400',
    basic: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    premium: 'bg-gradient-to-r from-violet-500/15 to-rose-500/15 text-rose-300 border border-rose-500/20',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  const tierIcons = {
    free: <Circle className="w-3 h-3" />,
    basic: <Diamond className="w-3 h-3" />,
    premium: <Crown className="w-3 h-3" />,
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
      {tier && tierIcons[tier]}
      {children}
    </span>
  )
}
