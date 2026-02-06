import { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

type BadgeVariant = 'balada' | 'energia' | 'festa' | 'conquista' | 'neutral' | 'elite' | 'vip' | 'level'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  icon?: ReactNode
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  balada: 'badge-balada',
  energia: 'badge-energia',
  festa: 'badge-festa',
  conquista: 'badge-conquista',
  neutral: 'badge-neutral',
  elite: 'badge-elite',
  vip: 'badge-vip',
  level: 'badge-level',
}

export const Badge = ({ variant = 'neutral', icon, children, className, ...props }: BadgeProps) => {
  return (
    <span className={clsx(variantClasses[variant], className)} {...props}>
      {icon}
      {children}
    </span>
  )
}

// Level Badge with number
interface LevelBadgeProps {
  level: number
  title?: string
  emoji?: string
}

export const LevelBadge = ({ level, title, emoji }: LevelBadgeProps) => {
  return (
    <div className="badge-level flex items-center gap-2">
      <span className="text-conquista-400 font-bold">Lv.{level}</span>
      {emoji && <span>{emoji}</span>}
      {title && <span className="text-white">{title}</span>}
    </div>
  )
}

// VIP Badge
export const VIPBadge = () => {
  return (
    <Badge variant="vip" icon={<span>⭐</span>}>
      VIP
    </Badge>
  )
}

// Elite Badge with shimmer
export const EliteBadge = () => {
  return (
    <Badge variant="elite" icon={<span>👑</span>}>
      ELITE
    </Badge>
  )
}

// Online Status Badge
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy'
  showLabel?: boolean
}

export const StatusBadge = ({ status, showLabel = false }: StatusBadgeProps) => {
  const statusConfig = {
    online: { class: 'status-online', label: 'Online' },
    offline: { class: 'status-offline', label: 'Offline' },
    busy: { class: 'status-busy', label: 'Ocupado' },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2">
      <span className={config.class} />
      {showLabel && <span className="text-xs text-noite-400">{config.label}</span>}
    </div>
  )
}
