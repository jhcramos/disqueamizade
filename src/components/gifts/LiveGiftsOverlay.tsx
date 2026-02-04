import { useState, useEffect, useCallback } from 'react'
import { LIVE_GIFTS, useFichaStore } from '@/store/fichaStore'
import type { LiveGift, SentGift } from '@/types'

interface ActiveGiftAnimation {
  id: string
  gift: LiveGift
  senderName: string
  x: number
  y: number
  opacity: number
}

interface LiveGiftsOverlayProps {
  roomId: string
  receiverId: string
  onGiftSent?: (gift: SentGift) => void
}

export const LiveGiftsOverlay = ({ roomId, receiverId, onGiftSent: _onGiftSent }: LiveGiftsOverlayProps) => {
  const [showPicker, setShowPicker] = useState(false)
  const [animations, setAnimations] = useState<ActiveGiftAnimation[]>([])
  const { balance, sendGift, canAfford } = useFichaStore()

  // Cleanup old animations
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimations(prev => prev.filter(a => a.opacity > 0))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Simulate incoming gifts for demo
  useEffect(() => {
    const demoGifts = ['heart', 'rose', 'star', 'heart', 'fireworks']
    let i = 0
    const interval = setInterval(() => {
      const giftDef = LIVE_GIFTS.find(g => g.id === demoGifts[i % demoGifts.length])
      if (giftDef) {
        triggerAnimation(giftDef, ['Marina', 'Carlos', 'Julia', 'Pedro', 'Ana'][i % 5])
      }
      i++
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const triggerAnimation = useCallback((gift: LiveGift, senderName: string) => {
    const anim: ActiveGiftAnimation = {
      id: `anim-${Date.now()}-${Math.random()}`,
      gift,
      senderName,
      x: 10 + Math.random() * 30,
      y: 60 + Math.random() * 20,
      opacity: 1,
    }
    setAnimations(prev => [...prev, anim])
    
    // Fade out
    setTimeout(() => {
      setAnimations(prev =>
        prev.map(a => a.id === anim.id ? { ...a, opacity: 0 } : a)
      )
    }, 2500)
  }, [])

  const handleSendGift = (gift: LiveGift) => {
    if (!canAfford(gift.fichas_cost)) return
    
    const success = sendGift(gift, receiverId, roomId)
    if (success) {
      triggerAnimation(gift, 'Você')
      setShowPicker(false)
    }
  }

  const rarityColors = {
    common: 'border-dark-700 hover:border-dark-500',
    rare: 'border-blue-500/30 hover:border-blue-400/50',
    epic: 'border-purple-500/30 hover:border-purple-400/50',
    legendary: 'border-amber-500/30 hover:border-amber-400/50 shadow-glow-amber',
  }

  return (
    <>
      {/* Floating gift animations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {animations.map((anim) => (
          <div
            key={anim.id}
            className="absolute transition-all duration-[2500ms] ease-out"
            style={{
              left: `${anim.x}%`,
              bottom: `${anim.y}%`,
              opacity: anim.opacity,
              transform: `translateY(${anim.opacity > 0 ? '-80px' : '-200px'}) scale(${anim.opacity > 0 ? 1 : 0.3})`,
            }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-950/70 backdrop-blur-sm border border-white/10">
              <span className="text-2xl">{anim.gift.emoji}</span>
              <div>
                <p className="text-[10px] text-amber-300 font-semibold">{anim.senderName}</p>
                <p className="text-[10px] text-dark-400">{anim.gift.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gift button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="relative z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-amber-500/20 border border-pink-500/30 text-pink-300 hover:from-pink-500/30 hover:to-amber-500/30 transition-all text-sm font-semibold"
      >
        <span className="text-lg">🎁</span>
        Presente
      </button>

      {/* Gift picker */}
      {showPicker && (
        <div className="absolute bottom-16 left-0 right-0 z-40 mx-4">
          <div className="card p-4 animate-slide-up max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Enviar Presente</h3>
              <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                💰 {balance} fichas
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {LIVE_GIFTS.map((gift) => {
                const affordable = canAfford(gift.fichas_cost)
                return (
                  <button
                    key={gift.id}
                    onClick={() => handleSendGift(gift)}
                    disabled={!affordable}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                      affordable
                        ? `${rarityColors[gift.rarity]} bg-white/[0.02] hover:bg-white/[0.06] cursor-pointer`
                        : 'border-dark-800 bg-dark-900/50 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-2xl mb-1">{gift.emoji}</span>
                    <span className="text-[10px] text-white font-medium">{gift.name}</span>
                    <span className="text-[10px] text-amber-400 font-bold">{gift.fichas_cost} 💰</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setShowPicker(false)}
              className="w-full mt-3 py-2 text-xs text-dark-400 hover:text-white transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
