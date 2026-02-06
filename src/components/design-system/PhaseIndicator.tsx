import { clsx } from 'clsx'

type Phase = 'pipoca' | 'cafe' | 'cachaca'

interface PhaseIndicatorProps {
  currentPhase: Phase
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const phaseConfig: Record<Phase, { emoji: string; name: string; class: string }> = {
  pipoca: { emoji: '🍿', name: 'Pipoca', class: 'phase-pipoca' },
  cafe: { emoji: '☕', name: 'Café', class: 'phase-cafe' },
  cachaca: { emoji: '🥃', name: 'Cachaça', class: 'phase-cachaca' },
}

const sizeClasses = {
  sm: 'text-xs px-2.5 py-1',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
}

export const PhaseIndicator = ({
  currentPhase,
  showLabel = true,
  size = 'md',
  className,
}: PhaseIndicatorProps) => {
  const phase = phaseConfig[currentPhase]

  return (
    <div
      className={clsx(
        phase.class,
        sizeClasses[size],
        className
      )}
    >
      <span className="text-lg">{phase.emoji}</span>
      {showLabel && <span>{phase.name}</span>}
    </div>
  )
}

// Phase Progress (shows all 3 phases with current highlighted)
interface PhaseProgressProps {
  currentPhase: Phase
  className?: string
}

export const PhaseProgress = ({ currentPhase, className }: PhaseProgressProps) => {
  const phases: Phase[] = ['pipoca', 'cafe', 'cachaca']
  const currentIndex = phases.indexOf(currentPhase)

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {phases.map((phase, index) => {
        const config = phaseConfig[phase]
        const isActive = index <= currentIndex
        const isCurrent = phase === currentPhase

        return (
          <div key={phase} className="flex items-center">
            {/* Phase dot/icon */}
            <div
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
                isCurrent && 'scale-125',
                isActive
                  ? `bg-gradient-to-br ${
                      phase === 'pipoca'
                        ? 'from-festa-400/30 to-festa-400/10 border border-festa-400/50'
                        : phase === 'cafe'
                        ? 'from-balada-500/30 to-balada-500/10 border border-balada-500/50'
                        : 'from-purple-500/30 to-purple-500/10 border border-purple-500/50'
                    }`
                  : 'bg-noite-800 border border-white/10'
              )}
            >
              <span className={clsx('text-lg', !isActive && 'opacity-40')}>
                {config.emoji}
              </span>
            </div>

            {/* Connector line */}
            {index < phases.length - 1 && (
              <div
                className={clsx(
                  'w-8 h-0.5 mx-1 rounded-full transition-all duration-300',
                  index < currentIndex ? 'bg-conquista-500' : 'bg-noite-700'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Phase Timer (shows time spent in current phase)
interface PhaseTimerProps {
  phase: Phase
  elapsedSeconds: number
  minSeconds: number // Minimum seconds before can advance
  className?: string
}

export const PhaseTimer = ({
  phase,
  elapsedSeconds,
  minSeconds,
  className,
}: PhaseTimerProps) => {
  const canAdvance = elapsedSeconds >= minSeconds
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <PhaseIndicator currentPhase={phase} size="sm" />
      <div className="flex items-center gap-2">
        <span className="font-mono text-lg text-white">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        {canAdvance && (
          <span className="text-xs text-conquista-400 animate-pulse">
            ✓ Pode avançar
          </span>
        )}
      </div>
    </div>
  )
}
