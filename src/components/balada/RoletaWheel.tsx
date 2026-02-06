import { useState, useEffect } from 'react'
import { Zap, Sparkles } from 'lucide-react'

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
  const [showConfetti, setShowConfetti] = useState(false)

  // Animação de giro
  useEffect(() => {
    if (isSpinning) {
      // Gira várias voltas + posição aleatória
      const spins = 5 + Math.random() * 3
      const finalRotation = rotation + (spins * 360) + Math.random() * 360
      setRotation(finalRotation)
      setGlowIntensity(1)

      const timer = setTimeout(() => {
        setGlowIntensity(0.5)
        setShowConfetti(true)
        onSpinComplete?.()
        
        setTimeout(() => setShowConfetti(false), 2000)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [isSpinning])

  // Pulse effect no countdown (últimos 10 segundos)
  useEffect(() => {
    if (countdown <= 10 && countdown > 0) {
      setGlowIntensity(0.3 + (10 - countdown) * 0.07)
    } else if (countdown > 10) {
      setGlowIntensity(0.1)
    }
  }, [countdown])

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const isUrgent = countdown <= 10 && countdown > 0

  return (
    <div className="relative flex items-center justify-center">
      {/* Confetti effect on spin complete */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
              }}
            >
              <Sparkles className={`w-4 h-4 ${['text-balada-400', 'text-energia-400', 'text-festa-400', 'text-conquista-400'][i % 4]}`} />
            </div>
          ))}
        </div>
      )}

      {/* Outer glow ring */}
      <div
        className="absolute w-80 h-80 rounded-full transition-all duration-500"
        style={{
          background: `radial-gradient(circle, rgba(255,107,53,${glowIntensity * 0.3}) 0%, transparent 70%)`,
          filter: `blur(${20 + glowIntensity * 20}px)`,
        }}
      />

      {/* Spinning light rays (visible when spinning) */}
      {isSpinning && (
        <div className="absolute w-72 h-72 animate-spin" style={{ animationDuration: '1s' }}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <div
              key={angle}
              className="absolute w-1 h-36 bg-gradient-to-t from-balada-500/30 to-transparent left-1/2 top-0 origin-bottom"
              style={{ transform: `rotate(${angle}deg) translateX(-50%)` }}
            />
          ))}
        </div>
      )}

      {/* Main wheel */}
      <div
        className={`relative w-64 h-64 rounded-full border-4 bg-noite-900/90 backdrop-blur-sm ${
          isUrgent ? 'border-energia-500 animate-pulse' : 'border-balada-500/40'
        }`}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          boxShadow: `
            0 0 ${30 + glowIntensity * 50}px rgba(255,107,53,${0.2 + glowIntensity * 0.3}),
            inset 0 0 40px rgba(0,0,0,0.5)
          `,
        }}
      >
        {/* Wheel segments background */}
        <div className="absolute inset-2 rounded-full overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: `conic-gradient(
                from 0deg,
                rgba(255,107,53,0.1) 0deg,
                rgba(255,209,102,0.1) 45deg,
                rgba(239,71,111,0.1) 90deg,
                rgba(6,214,160,0.1) 135deg,
                rgba(255,107,53,0.1) 180deg,
                rgba(255,209,102,0.1) 225deg,
                rgba(239,71,111,0.1) 270deg,
                rgba(6,214,160,0.1) 315deg,
                rgba(255,107,53,0.1) 360deg
              )`,
            }}
          />
        </div>

        {/* Participant avatars around the wheel */}
        {participants.slice(0, 12).map((p, i) => {
          const angle = (i / 12) * 360
          const isSelected = selectedIds.includes(p.id)
          const isMutualFlash = p.hasFlashed && p.youFlashed
          const radius = 100 // distance from center

          return (
            <div
              key={p.id}
              className="absolute z-10"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg) rotate(-${rotation}deg)`,
              }}
            >
              <div
                className={`relative -ml-5 -mt-5 w-10 h-10 rounded-full overflow-hidden transition-all duration-300 ${
                  isSelected
                    ? 'border-3 border-conquista-400 ring-4 ring-conquista-400/50 scale-125 z-20'
                    : isMutualFlash
                    ? 'border-2 border-conquista-400 ring-2 ring-conquista-400/30'
                    : p.hasFlashed
                    ? 'border-2 border-energia-400 ring-2 ring-energia-400/30'
                    : p.youFlashed
                    ? 'border-2 border-balada-400'
                    : 'border-2 border-white/20'
                }`}
              >
                <img src={p.avatar} alt={p.username} className="w-full h-full object-cover" />
                
                {/* Flash indicator */}
                {(p.hasFlashed || p.youFlashed) && (
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-lg ${
                    isMutualFlash ? 'bg-conquista-500' : p.hasFlashed ? 'bg-energia-500' : 'bg-balada-500'
                  }`}>
                    <Zap className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              
              {/* Username on hover/selected */}
              {isSelected && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[10px] font-bold text-conquista-400 bg-noite-900/90 px-1.5 py-0.5 rounded">
                    {p.username}
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {/* Center piece */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div 
            className={`w-24 h-24 rounded-full bg-gradient-to-br from-balada-500 to-energia-500 flex items-center justify-center shadow-xl transition-all duration-300 ${
              isSpinning ? 'scale-110 shadow-glow-balada' : ''
            } ${isUrgent ? 'animate-pulse' : ''}`}
          >
            {countdown > 0 && !isSpinning ? (
              <div className="text-center">
                <div className={`font-display font-bold text-white ${isUrgent ? 'text-3xl' : 'text-2xl'}`}>
                  {formatCountdown(countdown)}
                </div>
                <div className={`text-[9px] text-white/80 uppercase tracking-wider font-medium ${isUrgent ? 'text-energia-200' : ''}`}>
                  {isUrgent ? '⚡ QUASE!' : 'Próxima'}
                </div>
              </div>
            ) : isSpinning ? (
              <div className="text-4xl animate-bounce">🎰</div>
            ) : selectedIds.length > 0 ? (
              <div className="text-center">
                <div className="text-3xl">🎉</div>
                <div className="text-[10px] text-white/80 font-bold">{selectedIds.length} match!</div>
              </div>
            ) : (
              <div className="text-4xl">🕺</div>
            )}
          </div>
        </div>
      </div>

      {/* Pointer/Arrow at top */}
      <div 
        className={`absolute -top-3 z-30 transition-all duration-300 ${isUrgent || isSpinning ? 'scale-110' : ''}`}
      >
        <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[24px] border-l-transparent border-r-transparent border-b-balada-500 drop-shadow-lg" />
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-2 h-2 bg-balada-500 rounded-full" />
      </div>

      {/* Status text below */}
      <div className="absolute -bottom-12 text-center">
        <p className="text-xs text-noite-400">
          {isSpinning ? (
            <span className="text-balada-400 font-semibold animate-pulse">🎰 Girando...</span>
          ) : selectedIds.length > 0 ? (
            <span className="text-conquista-400 font-semibold">🎉 {selectedIds.length} pessoas selecionadas!</span>
          ) : isUrgent ? (
            <span className="text-energia-400 font-semibold animate-pulse">⚡ Prepara que vai girar!</span>
          ) : (
            <span>Próximo giro sorteia grupos pro Camarote</span>
          )}
        </p>
      </div>
    </div>
  )
}
