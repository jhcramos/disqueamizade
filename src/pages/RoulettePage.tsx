import { useState, useEffect, useCallback } from 'react'
import { Shuffle, SkipForward, UserPlus, Flag, Video, VideoOff, Mic, MicOff, Settings, X, Sparkles } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { OstentacaoBadge } from '@/components/fichas/OstentacaoBadge'
import type { RouletteStatus, RouletteFilters } from '@/types'

const MOCK_PARTNERS = [
  { id: '1', username: 'Marina_SP', avatar_url: 'https://i.pravatar.cc/300?img=1', age: 24, city: 'São Paulo, SP', hobbies: ['música', 'viagens'], is_ostentacao: false },
  { id: '2', username: 'Carlos_RJ', avatar_url: 'https://i.pravatar.cc/300?img=3', age: 28, city: 'Rio de Janeiro, RJ', hobbies: ['futebol', 'games'], is_ostentacao: true },
  { id: '3', username: 'Julia_BH', avatar_url: 'https://i.pravatar.cc/300?img=5', age: 22, city: 'Belo Horizonte, MG', hobbies: ['arte', 'yoga'], is_ostentacao: false },
  { id: '4', username: 'Pedro_CWB', avatar_url: 'https://i.pravatar.cc/300?img=7', age: 31, city: 'Curitiba, PR', hobbies: ['tech', 'café'], is_ostentacao: false },
  { id: '5', username: 'Ana_SSA', avatar_url: 'https://i.pravatar.cc/300?img=9', age: 26, city: 'Salvador, BA', hobbies: ['dança', 'culinária'], is_ostentacao: true },
  { id: '6', username: 'Lucas_POA', avatar_url: 'https://i.pravatar.cc/300?img=11', age: 29, city: 'Porto Alegre, RS', hobbies: ['churrasco', 'vinhos'], is_ostentacao: false },
]

const AGE_RANGES = [
  { label: 'Qualquer', value: '' },
  { label: '18-25', value: '18-25' },
  { label: '26-35', value: '26-35' },
  { label: '36-45', value: '36-45' },
  { label: '46+', value: '46+' },
]

const CITIES = [
  'Qualquer', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba',
  'Salvador', 'Porto Alegre', 'Recife', 'Fortaleza', 'Brasília',
]

export const RoulettePage = () => {
  const [status, setStatus] = useState<RouletteStatus>('idle')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<RouletteFilters>({})
  const [currentPartner, setCurrentPartner] = useState<typeof MOCK_PARTNERS[0] | null>(null)
  const [matchesCount, setMatchesCount] = useState(0)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [searchTime, setSearchTime] = useState(0)
  const [connectionTime, setConnectionTime] = useState(0)

  // Search timer
  useEffect(() => {
    if (status !== 'searching') return
    const interval = setInterval(() => setSearchTime(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [status])

  // Connection timer
  useEffect(() => {
    if (status !== 'connected') return
    const interval = setInterval(() => setConnectionTime(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [status])

  const startSearch = useCallback(() => {
    setStatus('searching')
    setSearchTime(0)
    setCurrentPartner(null)
    
    // Simulate finding a match
    const delay = 1500 + Math.random() * 3000
    setTimeout(() => {
      setStatus('connecting')
      setTimeout(() => {
        const partner = MOCK_PARTNERS[Math.floor(Math.random() * MOCK_PARTNERS.length)]
        setCurrentPartner(partner)
        setStatus('connected')
        setConnectionTime(0)
        setMatchesCount(c => c + 1)
      }, 1000)
    }, delay)
  }, [])

  const nextMatch = useCallback(() => {
    setStatus('searching')
    setSearchTime(0)
    setCurrentPartner(null)
    setConnectionTime(0)
    
    const delay = 1000 + Math.random() * 2000
    setTimeout(() => {
      setStatus('connecting')
      setTimeout(() => {
        const partner = MOCK_PARTNERS[Math.floor(Math.random() * MOCK_PARTNERS.length)]
        setCurrentPartner(partner)
        setStatus('connected')
        setConnectionTime(0)
        setMatchesCount(c => c + 1)
      }, 800)
    }, delay)
  }, [])

  const endSession = () => {
    setStatus('idle')
    setCurrentPartner(null)
    setSearchTime(0)
    setConnectionTime(0)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <Shuffle className="w-5 h-5 text-white" />
              </div>
              Roleta 1:1
            </h1>
            <p className="text-dark-500 text-sm mt-1">Encontre alguém aleatório para uma conversa incrível!</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center px-3">
              <div className="text-lg font-bold text-primary-400">{matchesCount}</div>
              <div className="text-[10px] text-dark-500">Matches</div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-all ${
                showFilters ? 'bg-primary-500/15 border-primary-500/30 text-primary-400' : 'border-white/10 text-dark-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card p-5 mb-6 animate-slide-up">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-400" />
              Filtros de Match
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block">Faixa etária</label>
                <select className="input w-full">
                  {AGE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block">Cidade</label>
                <select className="input w-full">
                  {CITIES.map(c => <option key={c} value={c === 'Qualquer' ? '' : c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block">Hobby</label>
                <select className="input w-full">
                  <option value="">Qualquer</option>
                  <option value="musica">Música</option>
                  <option value="games">Games</option>
                  <option value="esportes">Esportes</option>
                  <option value="tech">Tecnologia</option>
                  <option value="arte">Arte</option>
                  <option value="viagens">Viagens</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Video Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Your video */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-dark-900 border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              {videoEnabled ? (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-3 mx-auto">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-dark-400">Sua câmera</p>
                </div>
              ) : (
                <div className="text-center">
                  <VideoOff className="w-10 h-10 text-dark-600 mx-auto mb-2" />
                  <p className="text-sm text-dark-500">Câmera desligada</p>
                </div>
              )}
            </div>
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-dark-950/70 backdrop-blur-sm border border-white/10 text-xs text-white font-medium">
              Você
            </div>
          </div>

          {/* Partner video */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-dark-900 border border-white/10">
            {status === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-xs">
                  <div className="text-5xl mb-4">🎰</div>
                  <h3 className="text-lg font-bold text-white mb-2">Pronto para conhecer alguém?</h3>
                  <p className="text-sm text-dark-400 mb-6">Clique no botão abaixo para iniciar</p>
                  <button
                    onClick={startSearch}
                    className="btn-primary btn-lg flex items-center gap-2 mx-auto"
                  >
                    <Shuffle className="w-5 h-5" />
                    Encontrar Alguém
                  </button>
                </div>
              </div>
            )}

            {status === 'searching' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-primary-500/30 border-t-primary-400 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">Procurando...</h3>
                  <p className="text-sm text-dark-400">{formatTime(searchTime)}</p>
                </div>
              </div>
            )}

            {status === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-3 animate-bounce">🤝</div>
                  <h3 className="text-base font-bold text-primary-400">Match encontrado!</h3>
                  <p className="text-xs text-dark-400">Conectando...</p>
                </div>
              </div>
            )}

            {status === 'connected' && currentPartner && (
              <>
                <img
                  src={currentPartner.avatar_url}
                  alt={currentPartner.username}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm">{currentPartner.username}</span>
                    {currentPartner.is_ostentacao && <OstentacaoBadge size="sm" showLabel={false} />}
                    <span className="text-[10px] text-dark-300">{currentPartner.age} anos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-dark-400">📍 {currentPartner.city}</span>
                    <span className="text-[10px] text-dark-500">•</span>
                    <span className="text-[10px] text-dark-400">{formatTime(connectionTime)}</span>
                  </div>
                  {currentPartner.hobbies && (
                    <div className="flex gap-1 mt-1.5">
                      {currentPartner.hobbies.map(h => (
                        <span key={h} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white">{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {/* Video toggle */}
          <button
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={`p-3 rounded-xl border transition-all ${
              videoEnabled ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-3 rounded-xl border transition-all ${
              audioEnabled ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Main action button */}
          {status === 'connected' ? (
            <>
              <button
                onClick={nextMatch}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm hover:from-pink-600 hover:to-purple-700 transition-all flex items-center gap-2 shadow-glow-primary"
              >
                <SkipForward className="w-5 h-5" />
                Próximo
              </button>

              <button className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all">
                <UserPlus className="w-5 h-5" />
              </button>

              <button className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
                <Flag className="w-5 h-5" />
              </button>
            </>
          ) : status === 'searching' || status === 'connecting' ? (
            <button
              onClick={endSession}
              className="px-8 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/25 transition-all flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          ) : (
            <button
              onClick={startSearch}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm hover:from-pink-600 hover:to-purple-700 transition-all flex items-center gap-2 shadow-glow-primary"
            >
              <Shuffle className="w-5 h-5" />
              Encontrar Alguém
            </button>
          )}

          {/* End session */}
          {status === 'connected' && (
            <button
              onClick={endSession}
              className="p-3 rounded-xl bg-dark-800 border border-white/10 text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tips section */}
        {status === 'idle' && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-bold text-white text-sm mb-1">Use Filtros</h3>
              <p className="text-xs text-dark-500">Encontre pessoas por idade, cidade ou hobby</p>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold text-white text-sm mb-1">Rápido e Seguro</h3>
              <p className="text-xs text-dark-500">Pule a qualquer momento com "Próximo"</p>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-bold text-white text-sm mb-1">Faça Amigos</h3>
              <p className="text-xs text-dark-500">Adicione quem curtir e continue a conversa</p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
