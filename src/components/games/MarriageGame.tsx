import { useState, useCallback } from 'react'
import { X, Heart, MessageCircle, Shuffle, Check } from 'lucide-react'
import type { GameParticipant, MarriagePair, GameStatus } from '@/types'

const MOCK_PARTICIPANTS: GameParticipant[] = [
  { user_id: 'u1', username: 'ana_paula', avatar_url: 'https://i.pravatar.cc/150?img=9', age: 28, city: 'São Paulo', bio: 'Amo viajar e conhecer pessoas!', joined_at: new Date().toISOString() },
  { user_id: 'u2', username: 'joao_silva', avatar_url: 'https://i.pravatar.cc/150?img=1', age: 32, city: 'Rio de Janeiro', bio: 'Gamer e músico', joined_at: new Date().toISOString() },
  { user_id: 'u5', username: 'carlos_edu', avatar_url: 'https://i.pravatar.cc/150?img=7', age: 25, city: 'Curitiba', bio: 'Dev e amante de café', joined_at: new Date().toISOString() },
  { user_id: 'u7', username: 'fernanda_m', avatar_url: 'https://i.pravatar.cc/150?img=25', age: 30, city: 'BH', bio: 'Fotógrafa nas horas vagas', joined_at: new Date().toISOString() },
  { user_id: 'u9', username: 'lucas_o', avatar_url: 'https://i.pravatar.cc/150?img=11', age: 27, city: 'Salvador', bio: 'Surfista e chef amador', joined_at: new Date().toISOString() },
  { user_id: 'u10', username: 'camila_r', avatar_url: 'https://i.pravatar.cc/150?img=23', age: 24, city: 'Fortaleza', bio: 'Amo dançar forró!', joined_at: new Date().toISOString() },
]

interface MarriageGameProps {
  isOpen: boolean
  onClose: () => void
  roomId: string  // eslint-disable-line @typescript-eslint/no-unused-vars
}

export const MarriageGame = ({ isOpen, onClose, roomId: _roomId }: MarriageGameProps) => {
  const [status, setStatus] = useState<GameStatus>('waiting')
  const [participants, setParticipants] = useState<GameParticipant[]>(MOCK_PARTICIPANTS)
  const [pairs, setPairs] = useState<MarriagePair[]>([])
  const [isJoined, setIsJoined] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const currentUserId = 'me'

  const shuffle = useCallback((array: GameParticipant[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const startMatching = useCallback(() => {
    if (participants.length < 4) return
    setStatus('matching')
    setCountdown(3)

    // 3-second countdown then pair
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Create pairs
          const shuffled = shuffle(participants)
          const newPairs: MarriagePair[] = []
          for (let i = 0; i < shuffled.length - 1; i += 2) {
            newPairs.push({
              id: `pair-${i}`,
              participant1: shuffled[i],
              participant2: shuffled[i + 1],
              matched_at: new Date().toISOString(),
              accepted_by_both: false,
              accepted_by_p1: false,
              accepted_by_p2: false,
            })
          }
          setPairs(newPairs)
          setStatus('revealing')
          // Auto-complete after 30 seconds
          setTimeout(() => setStatus('completed'), 30000)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [participants, shuffle])

  const acceptMatch = useCallback((pairId: string) => {
    setPairs((prev) =>
      prev.map((p) => {
        if (p.id !== pairId) return p
        // Simulate current user accepting
        const isP1 = p.participant1.user_id === currentUserId || p.participant1.user_id === 'me'
        const updated = isP1
          ? { ...p, accepted_by_p1: true }
          : { ...p, accepted_by_p2: true }
        // For demo, also auto-accept from the other side
        setTimeout(() => {
          setPairs((pp) =>
            pp.map((pair) =>
              pair.id === pairId
                ? { ...pair, accepted_by_p1: true, accepted_by_p2: true, accepted_by_both: true, chat_room_id: `private_${pairId}` }
                : pair
            )
          )
        }, 2000)
        return updated
      })
    )
  }, [])

  const joinGame = useCallback(() => {
    if (isJoined) return
    setParticipants((prev) => [
      ...prev,
      {
        user_id: 'me',
        username: 'você',
        avatar_url: 'https://i.pravatar.cc/150?img=68',
        age: 26,
        city: 'São Paulo',
        bio: 'Pronto pra diversão!',
        joined_at: new Date().toISOString(),
      },
    ])
    setIsJoined(true)
  }, [isJoined])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl">
              🚪
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Casamento Atrás da Porta</h2>
              <p className="text-xs text-dark-500">
                {status === 'waiting' && `${participants.length} participantes aguardando`}
                {status === 'matching' && `Pareando em ${countdown}...`}
                {status === 'revealing' && `${pairs.length} pares formados!`}
                {status === 'completed' && 'Jogo concluído!'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* ═══ WAITING PHASE ═══ */}
          {status === 'waiting' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-dark-400 text-sm">
                  O sistema vai sortear pares aleatórios. Se ambos aceitarem, um chat privado é criado! 💕
                </p>
                <p className="text-xs text-dark-600 mt-2">Mínimo 4 participantes necessários</p>
              </div>

              {/* Participants grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {participants.map((p) => (
                  <div key={p.user_id} className="card p-3 flex items-center gap-3">
                    <img src={p.avatar_url} alt={p.username} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.username}</p>
                      <p className="text-[10px] text-dark-500">{p.city}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {!isJoined ? (
                  <button onClick={joinGame} className="btn-primary flex-1 py-3">
                    <Heart className="w-4 h-4" />
                    Participar do Jogo
                  </button>
                ) : (
                  <button
                    onClick={startMatching}
                    disabled={participants.length < 4}
                    className="btn-primary flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Shuffle className="w-4 h-4" />
                    Iniciar Pareamento ({participants.length}/4 min)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ═══ MATCHING PHASE (Animation) ═══ */}
          {status === 'matching' && (
            <div className="text-center py-12">
              <div className="text-8xl mb-6 animate-spin" style={{ animationDuration: '1s' }}>🚪</div>
              <h3 className="text-3xl font-bold text-white mb-2">{countdown}</h3>
              <p className="text-dark-400">Formando pares...</p>
            </div>
          )}

          {/* ═══ REVEALING PHASE ═══ */}
          {(status === 'revealing' || status === 'completed') && (
            <div className="space-y-4">
              {pairs.map((pair) => {
                const isMyPair = pair.participant1.user_id === 'me' || pair.participant2.user_id === 'me'
                const myPartner = pair.participant1.user_id === 'me' ? pair.participant2 : pair.participant1
                
                return (
                  <div
                    key={pair.id}
                    className={`card p-4 ${
                      isMyPair
                        ? 'border-pink-500/30 bg-pink-500/5 shadow-[0_0_20px_rgba(236,72,153,0.15)]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Participant 1 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img src={pair.participant1.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-white/10" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{pair.participant1.username}</p>
                          <p className="text-[10px] text-dark-500">{pair.participant1.city}</p>
                        </div>
                      </div>

                      {/* Heart connector */}
                      <div className="flex-shrink-0">
                        {pair.accepted_by_both ? (
                          <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                          </div>
                        ) : (
                          <div className="text-2xl">💕</div>
                        )}
                      </div>

                      {/* Participant 2 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse text-right">
                        <img src={pair.participant2.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-white/10" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{pair.participant2.username}</p>
                          <p className="text-[10px] text-dark-500">{pair.participant2.city}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions for my pair */}
                    {isMyPair && (
                      <div className="mt-4 pt-3 border-t border-white/5">
                        {pair.accepted_by_both ? (
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-emerald-400 font-medium flex items-center gap-1.5">
                              <Check className="w-4 h-4" /> Match Confirmado!
                            </span>
                            <button className="btn-primary btn-sm ml-auto">
                              <MessageCircle className="w-3.5 h-3.5" />
                              Abrir Chat Privado
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => acceptMatch(pair.id)}
                            className="btn-primary w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500"
                          >
                            <Heart className="w-4 h-4" />
                            Aceitar Pareamento com {myPartner.username}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Status for other pairs */}
                    {!isMyPair && pair.accepted_by_both && (
                      <div className="mt-3 text-center">
                        <span className="badge badge-primary">💚 Match Confirmado!</span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Play again */}
              {status === 'completed' && (
                <button
                  onClick={() => {
                    setStatus('waiting')
                    setPairs([])
                    setIsJoined(false)
                    setParticipants(MOCK_PARTICIPANTS)
                  }}
                  className="btn-secondary w-full py-3 mt-4"
                >
                  <Shuffle className="w-4 h-4" />
                  Jogar Novamente
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
