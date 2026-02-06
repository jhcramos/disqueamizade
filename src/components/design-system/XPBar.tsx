import { clsx } from 'clsx'

interface XPBarProps {
  current: number
  max: number
  level?: number
  levelTitle?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
}

export const XPBar = ({
  current,
  max,
  level,
  levelTitle,
  showLabel = true,
  size = 'md',
  className,
}: XPBarProps) => {
  const percentage = Math.min((current / max) * 100, 100)

  return (
    <div className={clsx('w-full', className)}>
      {/* Header with level and XP count */}
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {level !== undefined && (
              <span className="font-display font-bold text-conquista-400">
                Lv.{level}
              </span>
            )}
            {levelTitle && (
              <span className="text-sm text-noite-400">{levelTitle}</span>
            )}
          </div>
          <span className="text-xs text-noite-400">
            {current.toLocaleString()} / {max.toLocaleString()} XP
          </span>
        </div>
      )}

      {/* Bar */}
      <div className={clsx('xp-bar-glow', sizeClasses[size])}>
        <div
          className="xp-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Mini XP indicator (for avatars/cards)
interface MiniXPProps {
  level: number
  emoji?: string
}

export const MiniXP = ({ level, emoji = '⭐' }: MiniXPProps) => {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-noite-800 border border-conquista-500/30">
      <span className="text-xs">{emoji}</span>
      <span className="text-xs font-bold text-conquista-400">{level}</span>
    </div>
  )
}

// XP Gain Animation (show when user earns XP)
interface XPGainProps {
  amount: number
  isVisible: boolean
}

export const XPGain = ({ amount, isVisible }: XPGainProps) => {
  if (!isVisible) return null

  return (
    <div className="animate-slide-up">
      <span className="font-display font-bold text-conquista-400 text-lg">
        +{amount} XP
      </span>
    </div>
  )
}
