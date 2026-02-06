import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type AvatarVariant = 'default' | 'elite' | 'vip'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  name?: string
  size?: AvatarSize
  variant?: AvatarVariant
  isOnline?: boolean
  showStatus?: boolean
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-28 h-28 text-3xl',
}

const statusSizes: Record<AvatarSize, string> = {
  xs: 'w-1.5 h-1.5 border',
  sm: 'w-2 h-2 border',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3 h-3 border-2',
  xl: 'w-4 h-4 border-2',
  '2xl': 'w-5 h-5 border-2',
}

const variantClasses: Record<AvatarVariant, string> = {
  default: 'border-2 border-white/10',
  elite: 'ostentacao-border ostentacao-glow',
  vip: 'border-2 border-balada-500',
}

// Generate initials from name
const getInitials = (name: string): string => {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Generate background color from name
const getColorFromName = (name: string): string => {
  const colors = [
    'bg-balada-500',
    'bg-energia-500',
    'bg-festa-400',
    'bg-conquista-500',
    'bg-purple-500',
    'bg-blue-500',
    'bg-teal-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export const Avatar = ({
  src,
  alt,
  name = '',
  size = 'md',
  variant = 'default',
  isOnline,
  showStatus = false,
  className,
  ...props
}: AvatarProps) => {
  const initials = name ? getInitials(name) : '?'
  const bgColor = name ? getColorFromName(name) : 'bg-noite-700'

  return (
    <div className={clsx('relative inline-flex', className)} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={clsx(
            'rounded-full object-cover',
            sizeClasses[size],
            variantClasses[variant]
          )}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center font-display font-bold text-white',
            sizeClasses[size],
            variantClasses[variant],
            bgColor
          )}
        >
          {initials}
        </div>
      )}
      
      {/* Online status indicator */}
      {showStatus && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-noite-900',
            statusSizes[size],
            isOnline ? 'bg-conquista-500' : 'bg-noite-600'
          )}
          style={{ boxShadow: isOnline ? '0 0 6px rgba(6, 214, 160, 0.5)' : undefined }}
        />
      )}
    </div>
  )
}

// Avatar Group for multiple avatars
interface AvatarGroupProps {
  avatars: Array<{ src?: string; name?: string }>
  max?: number
  size?: AvatarSize
}

export const AvatarGroup = ({ avatars, max = 4, size = 'sm' }: AvatarGroupProps) => {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="ring-2 ring-noite-900"
        />
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            'rounded-full bg-noite-700 flex items-center justify-center font-display font-bold text-white ring-2 ring-noite-900',
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
