import { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import { Avatar } from './Avatar'
import { Badge, EliteBadge, VIPBadge } from './Badge'

type VideoTileVariant = 'default' | 'active' | 'flash' | 'elite'

interface VideoTileProps extends HTMLAttributes<HTMLDivElement> {
  /** Video element or placeholder */
  children?: ReactNode
  /** User name */
  name?: string
  /** User avatar URL */
  avatarUrl?: string
  /** Is this user speaking/active */
  isActive?: boolean
  /** Is this user receiving a flash */
  hasFlash?: boolean
  /** User tier */
  tier?: 'free' | 'vip' | 'elite'
  /** User level */
  level?: number
  /** Is user muted */
  isMuted?: boolean
  /** Is video off */
  isVideoOff?: boolean
  /** Click handler for the tile */
  onFlashClick?: () => void
}

export const VideoTile = ({
  children,
  name,
  avatarUrl,
  isActive = false,
  hasFlash = false,
  tier = 'free',
  level,
  isMuted = false,
  isVideoOff = false,
  onFlashClick,
  className,
  ...props
}: VideoTileProps) => {
  // Determine variant based on state
  let variant: VideoTileVariant = 'default'
  if (tier === 'elite') variant = 'elite'
  else if (hasFlash) variant = 'flash'
  else if (isActive) variant = 'active'

  const variantClasses: Record<VideoTileVariant, string> = {
    default: 'video-tile',
    active: 'video-tile-active',
    flash: 'video-tile-flash',
    elite: 'video-tile-elite',
  }

  return (
    <div
      className={clsx(variantClasses[variant], className)}
      {...props}
    >
      {/* Video content or avatar placeholder */}
      {isVideoOff ? (
        <div className="absolute inset-0 flex items-center justify-center bg-noite-800">
          <Avatar
            src={avatarUrl}
            name={name}
            size="xl"
            variant={tier === 'elite' ? 'elite' : tier === 'vip' ? 'vip' : 'default'}
          />
        </div>
      ) : (
        children
      )}

      {/* Overlay gradient for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Top left: Badges */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        {tier === 'elite' && <EliteBadge />}
        {tier === 'vip' && <VIPBadge />}
        {level && (
          <Badge variant="conquista">
            Lv.{level}
          </Badge>
        )}
      </div>

      {/* Top right: Status indicators */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        {isMuted && (
          <div className="p-1.5 rounded-full bg-black/50">
            <svg className="w-4 h-4 text-energia-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              <path d="M3.27 3L2 4.27l7.53 7.53c.07.24.11.49.11.75 0 1.1-.9 2-2 2-.36 0-.7-.1-1-.28L5.6 15.3c.86.58 1.89.92 3 .92 2.76 0 5-2.24 5-5 0-.34-.04-.68-.11-1L20.73 3l-1.27-1.27L3.27 3z" fill="none"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
        )}
        {isVideoOff && (
          <div className="p-1.5 rounded-full bg-black/50">
            <svg className="w-4 h-4 text-noite-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Bottom: Name and flash button */}
      <div className="absolute inset-x-0 bottom-0 p-2 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <Avatar src={avatarUrl} name={name} size="sm" />
          <span
            className={clsx(
              'font-display font-semibold text-sm truncate max-w-[120px]',
              tier === 'elite' && 'ostentacao-name'
            )}
          >
            {name || 'Anônimo'}
          </span>
        </div>

        {/* Flash button */}
        {onFlashClick && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFlashClick()
            }}
            className={clsx(
              'flash-button',
              hasFlash && 'flash-sent'
            )}
            title="Mandar Flash ⚡"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 2v11h3v9l7-12h-4l4-8z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// Video Grid layout component
interface VideoGridProps {
  children: ReactNode
  columns?: 3 | 4 | 5 | 6
  className?: string
}

export const VideoGrid = ({ children, columns = 5, className }: VideoGridProps) => {
  const columnClasses = {
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  }

  return (
    <div
      className={clsx(
        'grid gap-3',
        columnClasses[columns],
        className
      )}
    >
      {children}
    </div>
  )
}
