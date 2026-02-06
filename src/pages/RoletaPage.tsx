import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Users, Settings, Volume2, VolumeX,
  MessageCircle, Gamepad2, Heart, Flame, Mic, Music, Eye, EyeOff
} from 'lucide-react'
import { RoletaWheel } from '@/components/balada/RoletaWheel'
import { type CamaroteType } from '@/components/balada/CamaroteCard'
import { FlashButton } from '@/components/balada/FlashButton'

// Mock data
const MOCK_PISTA_PARTICIPANTS = Array.from({ length: 24 }, (_, i) => ({
  id: `p${i + 1}`,
  username: ['Ana', 'Bruno', 'Carla', 'Diego', 'Eva', 'Felipe', 'Gabi', 'Hugo', 'Iris', 'João', 'Kelly', 'Leo', 'Marina', 'Nico', 'Paula', 'Rafael', 'Sara', 'Tiago', 'Ursula', 'Vitor', 'Wanda', 'Xavier', 'Yara', 'Zeca'][i] + '_' + ['SP', 'RJ', 'MG', 'PR', 'BA', 'RS'][i % 6],
  avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
  hasFlashed: i === 3 || i === 7, // Alguns mandaram Flash pra você
  youFlashed: i === 5 || i === 7, // Você mandou Flash pra alguns
}))

// Matches recentes do jogo (criados pela Roleta)
const MOCK_RECENT_MATCHES = [
  { id: 'm1', type: 'duo' as CamaroteType, users: ['Ana_SP', 'Bruno_RJ'], timestamp: Date.now() - 120000 },
  { id: 'm2', type: 'papo' as CamaroteType, users: ['Carla_MG', 'Diego_PR', 'Eva_BA'], timestamp: Date.now() - 300000 },
  { id: 'm3', type: 'esquenta' as CamaroteType, users: ['Felipe_RS', 'Gabi_SP', 'Hugo_RJ', 'Iris_MG'], timestamp: Date.now() - 480000 },
]

const CAMAROTE_MODES = [
  { type: 'papo' as CamaroteType, icon: MessageCircle, emoji: '💬', label: 'Papo Reto', description: 'Conversa profunda' },
  { type: 'esquenta' as CamaroteType, icon: Gamepad2, emoji: '🎲', label: 'Esquenta', description: 'Jogos e diversão' },
  { type: 'duo' as CamaroteType, icon: Heart, emoji: '💕', label: 'Duo', description: 'Match romântico' },
  { type: 'dark' as CamaroteType, icon: Flame, emoji: '🔥', label: 'Dark Room', description: '+18' },
  { type: 'karaoke' as CamaroteType, icon: Music, emoji: '🎵', label: 'Karaokê', description: 'Cante junto' },
  { type: 'palco' as CamaroteType, icon: Mic, emoji: '🎤', label: 'Palco', description: 'Performances' },
]

export const RoletaPage = () => {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(287) // 4:47 inicial
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [enabledModes, setEnabledModes] = useState<CamaroteType[]>(['papo', 'esquenta', 'duo'])
  const [isInLounge, setIsInLounge] = useState(false) // No Lounge = só assiste
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [flashedUsers, setFlashedUsers] = useState<string[]>(['p6', 'p8']) // IDs que você flashou

  // Countdown timer
  useEffect(() => {
    if (isInLounge) return // Lounge não participa da roleta
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // ROLETA GIRA!
          handleSpin()
          return 300 // Reset 5 minutos
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isInLounge])

  const handleSpin = useCallback(() => {
    setIsSpinning(true)
    
    // Simula seleção de participantes (matching inteligente)
    // Prioriza: Flash mútuo > Flash recebido > aleatório
    setTimeout(() => {
      const selected = MOCK_PISTA_PARTICIPANTS
        .filter(p => p.hasFlashed || Math.random() > 0.7)
        .slice(0, 4)
        .map(p => p.id)
      
      setSelectedIds(selected)
    }, 3500)
  }, [])

  const handleSpinComplete = () => {
    setIsSpinning(false)
    
    // Se você foi selecionado, navega pro camarote
    if (selectedIds.length > 0) {
      // Simula: 30% chance de ser puxado
      if (Math.random() > 0.7) {
        navigate('/camarote/match-' + Date.now())
      }
    }
    
    // Reset selection after a bit
    setTimeout(() => setSelectedIds([]), 3000)
  }

  const toggleMode = (mode: CamaroteType) => {
    setEnabledModes(prev => 
      prev.includes(mode) 
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    )
  }

  const handleFlash = (userId: string) => {
    setFlashedUsers(prev => [...prev, userId])
    // TODO: Send flash via WebSocket
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-noite-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-noite-950/90 backdrop-blur-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/pista')}
              className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                🎰 Roleta da Balada
              </h1>
              <p className="text-xs text-dark-500">
                {isInLounge ? '🍹 No Lounge — só assistindo' : `Próximo giro em ${formatTime(countdown)}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-conquista-500/10 border border-conquista-500/20">
              <Users className="w-3.5 h-3.5 text-conquista-400" />
              <span className="text-xs text-conquista-400 font-semibold">{MOCK_PISTA_PARTICIPANTS.length} na Pista</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-all ${showSettings ? 'bg-balada-500/20 text-balada-400' : 'text-dark-400 hover:text-white hover:bg-white/5'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Mode Selection Panel */}
        {showSettings && (
          <div className="mb-6 p-4 rounded-2xl bg-noite-900/50 border border-white/5 animate-slide-down">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-balada-400" />
              Modos de Camarote
            </h3>
            <p className="text-xs text-dark-500 mb-4">Escolha quais tipos de Camarote você quer participar quando a Roleta girar</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {CAMAROTE_MODES.map(mode => {
                const isEnabled = enabledModes.includes(mode.type)
                const Icon = mode.icon
                return (
                  <button
                    key={mode.type}
                    onClick={() => toggleMode(mode.type)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isEnabled
                        ? 'bg-balada-500/10 border-balada-500/30 text-white'
                        : 'bg-noite-800/50 border-white/5 text-dark-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{mode.emoji}</span>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-semibold truncate">{mode.label}</div>
                  </button>
                )
              })}
            </div>

            {/* Lounge Toggle */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <button
                onClick={() => setIsInLounge(!isInLounge)}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isInLounge
                    ? 'bg-festa-500/10 border-festa-500/30'
                    : 'bg-noite-800/50 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isInLounge ? <EyeOff className="w-5 h-5 text-festa-400" /> : <Eye className="w-5 h-5 text-dark-400" />}
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">No Lounge 🍹</div>
                    <div className="text-xs text-dark-500">Só assistir, não participar da Roleta</div>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all ${isInLounge ? 'bg-festa-500' : 'bg-dark-700'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5 ${isInLounge ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center py-8">
          <RoletaWheel
            participants={MOCK_PISTA_PARTICIPANTS}
            isSpinning={isSpinning}
            selectedIds={selectedIds}
            onSpinComplete={handleSpinComplete}
            countdown={countdown}
          />

          {/* Manual spin button (for testing) */}
          <button
            onClick={handleSpin}
            disabled={isSpinning || isInLounge}
            className="mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-balada-500 to-energia-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-balada-500/30 transition-all"
          >
            {isSpinning ? '🎰 Girando...' : isInLounge ? '🍹 No Lounge' : '🎰 Girar Agora!'}
          </button>

          {/* Flash someone in the wheel */}
          <div className="mt-6 text-center">
            <p className="text-xs text-dark-500 mb-3">⚡ Mande um Flash para aumentar chances de match</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {MOCK_PISTA_PARTICIPANTS.slice(0, 6).map(p => (
                <FlashButton
                  key={p.id}
                  targetUsername={p.username}
                  onFlash={() => handleFlash(p.id)}
                  alreadyFlashed={flashedUsers.includes(p.id)}
                  theyFlashed={p.hasFlashed}
                />
              ))}
            </div>
          </div>

          {/* Matches Recentes do Jogo */}
          {MOCK_RECENT_MATCHES.length > 0 && (
            <div className="mt-10 w-full max-w-lg">
              <h3 className="text-sm font-bold text-dark-400 mb-3 text-center">
                🎯 Matches Recentes (criados pela Roleta)
              </h3>
              <div className="space-y-2">
                {MOCK_RECENT_MATCHES.map(match => (
                  <button
                    key={match.id}
                    onClick={() => navigate(`/camarote/${match.id}`)}
                    className="w-full p-3 rounded-xl bg-noite-900/50 border border-white/5 hover:border-balada-500/30 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {match.type === 'duo' ? '💕' : match.type === 'papo' ? '💬' : '🎲'}
                      </span>
                      <span className="text-sm text-white">{match.users.join(', ')}</span>
                    </div>
                    <span className="text-xs text-dark-500">
                      {Math.floor((Date.now() - match.timestamp) / 60000)}min atrás
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
