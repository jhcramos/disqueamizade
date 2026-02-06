import { useState } from 'react'
import { Zap } from 'lucide-react'

interface FlashButtonProps {
  targetUsername: string
  onFlash: () => void
  disabled?: boolean
  alreadyFlashed?: boolean
  theyFlashed?: boolean // eles mandaram Flash pra você
}

export const FlashButton = ({
  targetUsername,
  onFlash,
  disabled = false,
  alreadyFlashed = false,
  theyFlashed = false,
}: FlashButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    if (disabled || alreadyFlashed) return
    
    setIsAnimating(true)
    onFlash()
    
    setTimeout(() => setIsAnimating(false), 600)
  }

  // Mutual flash = match!
  const isMutual = alreadyFlashed && theyFlashed

  return (
    <button
      onClick={handleClick}
      disabled={disabled || alreadyFlashed}
      className={`
        relative px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all
        ${isMutual
          ? 'bg-gradient-to-r from-conquista-500 to-conquista-600 text-white shadow-lg shadow-conquista-500/30'
          : alreadyFlashed
          ? 'bg-balada-500/20 text-balada-400 border border-balada-500/30'
          : theyFlashed
          ? 'bg-gradient-to-r from-balada-500 to-energia-500 text-white shadow-lg shadow-balada-500/30 animate-pulse'
          : 'bg-noite-800 text-balada-400 border border-balada-500/30 hover:bg-balada-500/20'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isAnimating ? 'scale-110' : ''}
      `}
      title={
        isMutual
          ? `Match com ${targetUsername}! ⚡⚡`
          : alreadyFlashed
          ? `Você mandou Flash para ${targetUsername}`
          : theyFlashed
          ? `${targetUsername} mandou Flash! Responda!`
          : `Mandar Flash para ${targetUsername}`
      }
    >
      <Zap
        className={`w-4 h-4 ${isAnimating ? 'animate-ping' : ''}`}
        fill={isMutual || theyFlashed ? 'currentColor' : 'none'}
      />
      <span>
        {isMutual
          ? 'Match! ⚡⚡'
          : alreadyFlashed
          ? 'Enviado'
          : theyFlashed
          ? 'Flash! ⚡'
          : 'Flash'}
      </span>

      {/* Glow effect on animation */}
      {isAnimating && (
        <div className="absolute inset-0 rounded-xl bg-balada-500/30 animate-ping" />
      )}
    </button>
  )
}
