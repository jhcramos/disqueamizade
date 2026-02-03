import { useMemo } from 'react'
import clsx from 'clsx'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy'
  username?: string
  className?: string
}

export const Avatar = ({
  src,
  alt,
  size = 'md',
  status,
  username,
  className,
}: AvatarProps) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  }

  const statusClasses = {
    online: 'bg-emerald-400',
    offline: 'bg-gray-600',
    busy: 'bg-red-500',
  }

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }

  // Generate gradient based on username
  const gradient = useMemo(() => {
    if (!username) return 'from-primary to-primary-dark'

    const colors = [
      'from-primary to-primary-dark',
      'from-primary-light to-purple-400',
      'from-violet-500 to-indigo-500',
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
    ]

    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }, [username])

  const initials = username
    ? username.substring(0, 2).toUpperCase()
    : alt?.substring(0, 2).toUpperCase() || '?'

  return (
    <div className={clsx('relative inline-block', className)}>
      <div
        className={clsx(
          'rounded-full flex items-center justify-center font-bold overflow-hidden',
          sizeClasses[size],
          !src && `bg-gradient-to-br ${gradient}`
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt || username || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white">{initials}</span>
        )}
      </div>

      {status && (
        <div
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-dark-bg',
            statusClasses[status],
            statusSizes[size],
            status === 'online' && 'animate-pulse'
          )}
        />
      )}
    </div>
  )
}
