import { useState, useEffect } from 'react'
import { Timer, Heart, X, SkipForward, Users } from 'lucide-react'
import { OstentacaoBadge } from '@/components/fichas/OstentacaoBadge'

interface SpeedDatingPartner {
  id: string
  username: string
  avatar: string
  age: number
  city: string
  bio: string
  is_ostentacao: boolean
}

const MOCK_PARTNERS: SpeedDatingPartner[] = [
  { id: '1', username: 'Marina_SP', avatar: 'https://i.pravatar.cc/200?img=1', age: 24, city: 'São Paulo', bio: 'Amo viajar e cozinhar 🌍🍳', is_ostentacao: false },
  { id: '2', username: 'Carlos_RJ', avatar: 'https://i.pravatar.cc/200?img=3', age: 28, city: 'Rio de Janeiro', bio: 'Surfista e gamer nas horas vagas 🏄‍♂️🎮', is_ostentacao: true },
  { id: '3', username: 'Julia_BH', avatar: 'https://i.pravatar.cc/200?img=5', age: 22, city: 'Belo Horizonte', bio: 'Artista e apaixonada por café ☕🎨', is_ostentacao: false },
  { id: '4', username: 'Pedro_CWB', avatar: 'https://i.pravatar.cc/200?img=7', age: 31, city: 'Curitiba', bio: 'Dev por dia, músico à noite 💻🎸', is_ostentacao: false },
  { id: '5', username: 'Ana_SSA', avatar: 'https://i.pravatar.cc/200?img=9', age: 26, city: 'Salvador', bio: 'Dançarina e confeiteira 💃🧁', is_ostentacao: true },
]

type GamePhase = 'waiting' | 'countdown' | 'chatting' | 'rating' | 'results'

export const SpeedDating = () => {
  const [phase, setPhase] = useState<GamePhase>('waiting')
  const [currentRound, setCurrentRound] = useState(0)
  const [timeLeft, setTimeLeft] = useState(180) // 3 min
  const [countdown, setCountdown] = useState(3)
  const [ratings, setRatings] = useState<Record<string, 'like' | 'pass'>>({})
  const totalRounds = MOCK_PARTNERS.length
  const currentPartner = MOCK_PARTNERS[currentRound]

  // Countdown timer
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setPhase('chatting')
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, countdown])

  // Chat timer
  useEffect(() => {
    if (phase !== 'chatting') return
    if (timeLeft <= 0) {
      setPhase('rating')
      return
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [phase, timeLeft])

  const startGame = () => {
    setPhase('countdown')
    setCountdown(3)
    setCurrentRound(0)
    setRatings({})
    setTimeLeft(180)
  }

  const ratePartner = (rating: 'like' | 'pass') => {
    setRatings(prev => ({ ...prev, [currentPartner.id]: rating }))
    if (currentRound < totalRounds - 1) {
      setCurrentRound(r => r + 1)
      setTimeLeft(180)
      setPhase('countdown')
      setCountdown(3)
    } else {
      setPhase('results')
    }
  }

  const skipToRating = () => {
    setPhase('rating')
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const timerColor = timeLeft > 60 ? 'text-emerald-400' : timeLeft > 30 ? 'text-amber-400' : 'text-red-400'
  const timerBg = timeLeft > 60 ? 'bg-emerald-500/10 border-emerald-500/20' : timeLeft > 30 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Waiting */}
      {phase === 'waiting' && (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="text-2xl font-bold text-white mb-2">Speed Dating</h2>
          <p className="text-dark-400 text-sm mb-2">3 minutos por match — {totalRounds} rounds</p>
          <p className="text-dark-500 text-xs mb-8">Converse, conheça e no final vote em quem você mais gostou!</p>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <Users className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-dark-300">{totalRounds} participantes esperando</span>
          </div>
          
          <button onClick={startGame} className="btn-primary btn-lg">
            Iniciar Speed Dating ⚡
          </button>
        </div>
      )}

      {/* Countdown */}
      {phase === 'countdown' && (
        <div className="card p-8 text-center">
          <p className="text-dark-400 text-sm mb-4">Round {currentRound + 1} de {totalRounds}</p>
          <div className="text-8xl font-bold text-primary-400 mb-4 animate-pulse">
            {countdown || '🚀'}
          </div>
          <p className="text-white font-semibold">Preparando próximo match...</p>
        </div>
      )}

      {/* Chatting */}
      {phase === 'chatting' && currentPartner && (
        <div className="space-y-4">
          {/* Timer bar */}
          <div className={`card px-4 py-3 flex items-center justify-between ${timerBg} border`}>
            <div className="flex items-center gap-2">
              <Timer className={`w-4 h-4 ${timerColor}`} />
              <span className={`font-mono font-bold text-lg ${timerColor}`}>{formatTime(timeLeft)}</span>
            </div>
            <span className="text-xs text-dark-400">Round {currentRound + 1}/{totalRounds}</span>
            <button onClick={skipToRating} className="text-xs text-dark-400 hover:text-white transition-colors flex items-center gap-1">
              <SkipForward className="w-3 h-3" /> Pular
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-dark-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${timerColor.replace('text-', 'bg-')}`}
              style={{ width: `${(timeLeft / 180) * 100}%` }}
            />
          </div>

          {/* Partner info + video placeholder */}
          <div className="card overflow-hidden">
            <div className="relative aspect-video bg-dark-900">
              <img
                src={currentPartner.avatar}
                alt={currentPartner.username}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white">{currentPartner.username}</h3>
                  {currentPartner.is_ostentacao && <OstentacaoBadge size="sm" />}
                </div>
                <p className="text-sm text-dark-300">{currentPartner.age} anos · 📍 {currentPartner.city}</p>
                <p className="text-xs text-dark-400 mt-1">{currentPartner.bio}</p>
              </div>
            </div>
          </div>

          {/* Chat placeholder */}
          <div className="card p-4">
            <div className="h-32 flex items-center justify-center border border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-dark-500">💬 Chat de texto ativo — converse!</p>
            </div>
          </div>
        </div>
      )}

      {/* Rating */}
      {phase === 'rating' && currentPartner && (
        <div className="card p-8 text-center">
          <img 
            src={currentPartner.avatar} 
            alt="" 
            className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-white/20" 
          />
          <h3 className="text-lg font-bold text-white mb-1">{currentPartner.username}</h3>
          <p className="text-sm text-dark-400 mb-6">O que você achou?</p>
          
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => ratePartner('pass')}
              className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/25 transition-all"
            >
              <X className="w-7 h-7" />
            </button>
            <button
              onClick={() => ratePartner('like')}
              className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/25 transition-all"
            >
              <Heart className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {phase === 'results' && (
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">Speed Dating Finalizado!</h2>
            <p className="text-dark-400 text-sm">Aqui estão seus resultados</p>
          </div>

          <div className="space-y-3">
            {MOCK_PARTNERS.map(partner => {
              const rating = ratings[partner.id]
              const isLiked = rating === 'like'
              // Simulate mutual matches
              const isMutual = isLiked && Math.random() > 0.4
              
              return (
                <div key={partner.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isMutual ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.02] border-white/5'
                }`}>
                  <img src={partner.avatar} alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{partner.username}</span>
                      {partner.is_ostentacao && <OstentacaoBadge size="sm" showLabel={false} />}
                    </div>
                    <span className="text-[11px] text-dark-500">{partner.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLiked ? (
                      <span className="text-emerald-400 text-xs font-semibold">❤️ Like</span>
                    ) : (
                      <span className="text-dark-500 text-xs">Pass</span>
                    )}
                    {isMutual && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-dark-950 text-[10px] font-bold">
                        MATCH! 🎉
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={startGame} className="btn-primary w-full mt-6 py-3">
            Jogar Novamente ⚡
          </button>
        </div>
      )}
    </div>
  )
}
