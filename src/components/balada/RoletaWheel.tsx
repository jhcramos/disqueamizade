import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'

interface Participant {
  id: string
  username: string
  avatar: string
  hasFlashed?: boolean // ⚡ mandou Flash pra você
  youFlashed?: boolean // Você mandou Flash pra ele
}

interface RoletaWheelProps {
  participants: Participant[]
  isSpinning: boolean
  selectedIds?: string[] // IDs dos selecionados após o giro
  onSpinComplete?: () => void
  countdown?: number // segundos até próximo giro
}

export const RoletaWheel = ({
  participants,
  isSpinning,
  selectedIds = [],
  onSpinComplete,
  countdown = 0,
}: RoletaWheelProps) => {
  const [rotation, setRotation] = useState(0)
  const [glowIntensity, setGlowIntensity] = useState(0)

  // Animação de giro
  useEffect(() => {
    if (isSpinning) {
      // Gira várias voltas + posição aleatória
      const spins = 5 + Math.random() * 3
      const finalRotation = rotation + (spins * 360) + Math.random() * 360
      setRotation(finalRotation)
      setGlowIntensity(1)

      const timer = setTimeout(() => {
        setGlowIntensity(0)
        onSpinComplete?.()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [isSpinning])

  // Pulse effect no countdown
  useEffect(() => {
    if (countdown <= 10 && countdown > 0) {
      setGlowIntensity(0.3 + (10 - countdown) * 0.07)
    }
  }, [countdown])

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div
        className="absolute w-72 h-72 rounded-full transition-all duration-500"
        style={{
          background: `radial-gradient(circle, rgba(255,107,53,${glowIntensity * 0.3}) 0%, transparent 70%)`,
          filter: `blur(${20 + glowIntensity * 10}px)`,
        }}
      />

      {/* Main wheel */}
      <div
        className="relative w-64 h-64 rounded-full border-4 border-balada-500/30 bg-noite-900/80 backdrop-blur-sm"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          boxShadow: `0 0 ${30 + glowIntensity * 40}px rgba(255,107,53,${0.2 + glowIntensity * 0.3})`,
        }}
      >
        {/* Participant avatars around the wheel */}
        {participants.slice(0, 12).map((p, i) => {
          const angle = (i / 12) * 360
          const isSelected = selectedIds.includes(p.id)
          const radius = 100 // distance from center

          return (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg) rotate(-${rotation}deg)`,
              }}
            >
              <div
                className={`relative -ml-5 -mt-5 w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-300 ${
                  isSelected
                    ? 'border-conquista-400 ring-2 ring-conquista-400/50 scale-125'
                    : p.hasFlashed
                    ? 'border-balada-400 ring-2 ring-balada-400/30'
                    : p.youFlashed
                    ? 'border-festa-400'
                    : 'border-white/20'
                }`}
              >
                <img src={p.avatar} alt={p.username} className="w-full h-full object-cover" />
                
                {/* Flash indicator */}
                {(p.hasFlashed || p.youFlashed) && (
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                    p.hasFlashed && p.youFlashed ? 'bg-conquista-500' : 'bg-balada-500'
                  }`}>
                    <Zap className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Center piece */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-balada-500 to-energia-500 flex items-center justify-center shadow-lg transition-transform ${isSpinning ? 'scale-110' : ''}`}>
            {countdown > 0 && !isSpinning ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{formatCountdown(countdown)}</div>
                <div className="text-[8px] text-white/70 uppercase tracking-wider">Próxima</div>
              </div>
            ) : isSpinning ? (
              <div className="text-3xl animate-pulse">🎰</div>
            ) : (
              <div className="text-3xl">🕺</div>
            )}
          </div>
        </div>
      </div>

      {/* Pointer/Arrow at top */}
      <div className="absolute -top-2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-balada-500 drop-shadow-lg" />
    </div>
  )
}
