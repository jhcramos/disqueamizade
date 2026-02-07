import { useState, useEffect, useCallback, useRef } from 'react'
import { Shuffle, SkipForward, UserPlus, Flag, Video, VideoOff, Mic, MicOff, Settings, X, Sparkles, AlertTriangle, Send, Coins } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { OstentacaoBadge } from '@/components/fichas/OstentacaoBadge'
import { useCamera } from '@/hooks/useCamera'
import { useVideoFilter } from '@/hooks/useVideoFilter'
import { useToastStore } from '@/components/common/ToastContainer'
import { CameraMasksButton, FILTER_CSS } from '@/components/camera/CameraMasks'
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

const GIFT_EMOJIS = ['🌹', '💎', '🍾', '🎵', '🔥', '❤️', '⭐', '🎉']
const FICHA_AMOUNTS = [5, 10, 25, 50]

type ChatMessage = {
  id: string
  username: string
  content: string
  type: 'text' | 'system' | 'gift'
  timestamp: Date
}

export const RoulettePage = () => {
  const [status, setStatus] = useState<RouletteStatus>('idle')
  const [showFilters, setShowFilters] = useState(false)
  const [_filters, _setFilters] = useState<RouletteFilters>({})
  const [currentPartner, setCurrentPartner] = useState<typeof MOCK_PARTNERS[0] | null>(null)
  const [matchesCount, setMatchesCount] = useState(0)
  const [searchTime, setSearchTime] = useState(0)
  const [connectionTime, setConnectionTime] = useState(0)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string }[]>([])
  const [showFichas, setShowFichas] = useState(false)
  const [activeFilter, setActiveFilter] = useState('normal')
  const [activeMask, setActiveMask] = useState<string | null>(null)
  const [beautySmooth, setBeautySmooth] = useState(false)
  const [beautyBrighten, setBeautyBrighten] = useState(false)
  const filterStyle = FILTER_CSS[activeFilter] || 'none'
  const chatEndRef = useRef<HTMLDivElement>(null)
  const cameraTileRef = useRef<HTMLDivElement>(null)
  const [tileSize, setTileSize] = useState({ w: 320, h: 240 })
  const { addToast } = useToastStore()

  // ─── REAL CAMERA ───
  const {
    stream,
    videoRef,
    isCameraOn,
    isMicOn,
    permissionState,
    error: cameraError,
    startCamera,
    stopCamera,
    toggleCamera,
    toggleMic,
  } = useCamera()

  // ─── VIDEO FILTER (emoji overlay with face tracking) ───
  const {
    activeMaskEmoji,
    faceBox,
    enableFilter: enableMask,
    disableFilter: disableMask,
  } = useVideoFilter(videoRef, stream)

  useEffect(() => {
    if (activeMask) enableMask(activeMask)
    else disableMask()
  }, [activeMask, enableMask, disableMask])

  useEffect(() => {
    const el = cameraTileRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setTileSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Mock initial messages when connected
  useEffect(() => {
    if (status === 'connected' && currentPartner) {
      const msgs: ChatMessage[] = [
        { id: 'sys1', username: 'Sistema', content: `Você foi conectado com ${currentPartner.username}! 🎉`, type: 'system', timestamp: new Date() },
        { id: 'p1', username: currentPartner.username, content: 'Oi! Tudo bem? 😊', type: 'text', timestamp: new Date(Date.now() + 500) },
        { id: 'p2', username: currentPartner.username, content: 'De onde você é?', type: 'text', timestamp: new Date(Date.now() + 1500) },
      ]
      setChatMessages(msgs)
    } else if (status !== 'connected') {
      setChatMessages([])
    }
  }, [status, currentPartner])

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

  // Cleanup camera on unmount
  useEffect(() => {
    return () => { stopCamera() }
  }, [stopCamera])

  const startSearch = useCallback(async () => {
    if (!stream) await startCamera()
    setStatus('searching')
    setSearchTime(0)
    setCurrentPartner(null)
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
  }, [stream, startCamera])

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

  const endSession = useCallback(() => {
    setStatus('idle')
    setCurrentPartner(null)
    setSearchTime(0)
    setConnectionTime(0)
    stopCamera()
  }, [stopCamera])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleToggleVideo = () => {
    if (!stream) startCamera()
    else toggleCamera()
  }

  const handleToggleMic = () => {
    if (!stream) startCamera()
    else toggleMic()
  }

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    setChatMessages(prev => [...prev, {
      id: `me-${Date.now()}`,
      username: 'Você',
      content: chatInput,
      type: 'text',
      timestamp: new Date(),
    }])
    setChatInput('')

    // Mock reply after 1-3s
    if (currentPartner) {
      const replies = ['Que legal! 😄', 'Haha verdade!', 'Conte mais!', 'Adorei! 🥰', 'Sério? 😮', 'Demais! 🔥']
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: `p-${Date.now()}`,
          username: currentPartner.username,
          content: replies[Math.floor(Math.random() * replies.length)],
          type: 'text',
          timestamp: new Date(),
        }])
      }, 1000 + Math.random() * 2000)
    }
  }

  const sendGift = (emoji: string) => {
    if (!currentPartner) return
    addToast({ type: 'success', title: `🎁 Você enviou ${emoji} para ${currentPartner.username}!` })
    setChatMessages(prev => [...prev, {
      id: `gift-${Date.now()}`,
      username: 'Você',
      content: `Enviou ${emoji}`,
      type: 'gift',
      timestamp: new Date(),
    }])
    // Floating animation
    const id = `float-${Date.now()}`
    setFloatingEmojis(prev => [...prev, { id, emoji }])
    setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 2000)
  }

  const sendFichas = (amount: number) => {
    if (!currentPartner) return
    addToast({ type: 'success', title: `💰 Você enviou ${amount} fichas para ${currentPartner.username}!` })
    setChatMessages(prev => [...prev, {
      id: `ficha-${Date.now()}`,
      username: 'Sistema',
      content: `Você enviou ${amount} fichas para ${currentPartner.username} 💰`,
      type: 'system',
      timestamp: new Date(),
    }])
    setShowFichas(false)
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full pb-24 md:pb-8">
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

        {/* Camera permission warning */}
        {permissionState === 'denied' && (
          <div className="card p-4 mb-6 border-l-4 border-red-500 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-400 mb-1">Câmera Bloqueada</h4>
                <p className="text-sm text-gray-400">{cameraError || 'Habilite o acesso à câmera nas configurações do navegador para usar a roleta.'}</p>
              </div>
            </div>
          </div>
        )}

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

        {/* Main Layout: Video + Chat */}
        <div className={`flex flex-col ${status === 'connected' ? 'lg:flex-row' : ''} gap-4 mb-6`}>
          {/* Video Area */}
          <div className={`${status === 'connected' ? 'lg:flex-1' : 'w-full'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* YOUR REAL CAMERA */}
              <div ref={cameraTileRef} className="relative aspect-video rounded-2xl overflow-hidden bg-dark-900 border-2 border-primary-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                {isCameraOn && stream ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        filter: [
                          filterStyle !== 'none' ? filterStyle : '',
                          beautySmooth ? 'blur(0.5px) contrast(1.05)' : '',
                          beautyBrighten ? 'brightness(1.15) saturate(1.05)' : '',
                        ].filter(Boolean).join(' ') || 'none',
                      }}
                    />
                    {activeMaskEmoji && faceBox && (
                      <span
                        className="absolute pointer-events-none z-10 select-none leading-none"
                        style={{
                          left: `${faceBox.x + faceBox.w / 2}%`,
                          top: `${faceBox.y + faceBox.h / 2}%`,
                          transform: 'translate(-50%, -50%)',
                          fontSize: `${Math.round(Math.max(tileSize.w * faceBox.w, tileSize.h * faceBox.h) / 100 * 1.15)}px`,
                          transition: 'left 120ms ease-out, top 120ms ease-out, font-size 200ms ease-out',
                        }}
                      >
                        {activeMaskEmoji}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-transparent" />
                )}
                {(!isCameraOn || !stream) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {status === 'idle' ? (
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-700/20 border border-primary-500/30 flex items-center justify-center mb-3 mx-auto">
                          <Video className="w-8 h-8 text-primary-400" />
                        </div>
                        <p className="text-sm text-dark-400">Sua câmera aparecerá aqui</p>
                        <p className="text-xs text-dark-500 mt-1">Clique em "Encontrar Alguém" para começar</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center mb-2 mx-auto">
                          <VideoOff className="w-7 h-7 text-dark-500" />
                        </div>
                        <p className="text-sm text-dark-500">Câmera desligada</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                {/* Mask active indicator */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-primary-500/20 backdrop-blur-sm border border-primary-500/30 text-xs text-primary-400 font-semibold">Você</div>
                {isCameraOn && stream && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-red-500/80 text-[10px] font-bold text-white animate-pulse">LIVE</div>
                )}
                {isCameraOn && !isMicOn && (
                  <div className="absolute top-3 left-3">
                    <span className="p-1.5 rounded-lg bg-red-500/20 backdrop-blur-sm"><MicOff className="w-3.5 h-3.5 text-red-400" /></span>
                  </div>
                )}
              </div>

              {/* PARTNER VIDEO */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-dark-900 border border-white/10">
                {/* Floating emoji animations */}
                {floatingEmojis.map(fe => (
                  <div key={fe.id} className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                    <span className="text-6xl animate-float-up">{fe.emoji}</span>
                  </div>
                ))}

                {status === 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center max-w-xs">
                      <div className="text-5xl mb-4">🎰</div>
                      <h3 className="text-lg font-bold text-white mb-2">Pronto para conhecer alguém?</h3>
                      <p className="text-sm text-dark-400 mb-6">Clique no botão abaixo para iniciar</p>
                      <button onClick={startSearch} className="btn-primary btn-lg flex items-center gap-2 mx-auto">
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
                    <img src={currentPartner.avatar_url} alt={currentPartner.username} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute w-12 h-12 rounded-full border border-cyan-400/20 animate-ping opacity-10" />
                    </div>
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

            {/* Gift bar - visible when connected */}
            {status === 'connected' && currentPartner && (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-dark-400 hidden sm:block">Presentes:</span>
                <div className="flex gap-1.5 flex-1">
                  {GIFT_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => sendGift(emoji)}
                      className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] hover:scale-110 transition-all flex items-center justify-center text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {/* Fichas button */}
                <div className="relative">
                  <button
                    onClick={() => setShowFichas(!showFichas)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-all"
                  >
                    <Coins className="w-4 h-4" />
                    <span className="hidden sm:inline">Fichas</span>
                  </button>
                  {showFichas && (
                    <div className="absolute bottom-full mb-2 right-0 p-3 rounded-xl bg-dark-900 border border-white/10 shadow-2xl z-30 animate-slide-up">
                      <p className="text-[10px] text-dark-400 mb-2 whitespace-nowrap">Enviar Fichas</p>
                      <div className="flex gap-1.5">
                        {FICHA_AMOUNTS.map(amount => (
                          <button
                            key={amount}
                            onClick={() => sendFichas(amount)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
                          >
                            {amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat sidebar - visible when connected */}
          {status === 'connected' && currentPartner && (
            <div className="lg:w-80 flex flex-col rounded-2xl bg-dark-900/50 border border-white/5 overflow-hidden" style={{ maxHeight: '480px' }}>
              <div className="p-3 border-b border-white/5 flex items-center gap-2">
                <Send className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-bold text-white">Chat com {currentPartner.username}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.map(msg => {
                  if (msg.type === 'system') {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[11px] text-primary-400">
                          {msg.content}
                        </span>
                      </div>
                    )
                  }
                  if (msg.type === 'gift') {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="inline-block px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-[11px] text-pink-400">
                          🎁 {msg.content}
                        </span>
                      </div>
                    )
                  }
                  const isMe = msg.username === 'Você'
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        isMe ? 'bg-primary-500/20 text-primary-100 rounded-br-sm' : 'bg-white/[0.05] text-dark-200 rounded-bl-sm'
                      }`}>
                        {!isMe && <div className="text-[10px] text-dark-400 font-semibold mb-0.5">{msg.username}</div>}
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={sendChatMessage} className="p-3 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Digite algo..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 transition-all"
                />
                <button type="submit" disabled={!chatInput.trim()} className="p-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all disabled:opacity-30">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleToggleVideo}
            className={`p-3 rounded-xl border transition-all ${
              isCameraOn ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}
            title={isCameraOn ? 'Desligar câmera' : 'Ligar câmera'}
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={handleToggleMic}
            className={`p-3 rounded-xl border transition-all ${
              isMicOn ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}
            title={isMicOn ? 'Desligar microfone' : 'Ligar microfone'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <CameraMasksButton activeFilter={activeFilter} onFilterChange={setActiveFilter} activeMask={activeMask} onMaskChange={setActiveMask} beautySmooth={beautySmooth} onBeautySmoothChange={setBeautySmooth} beautyBrighten={beautyBrighten} onBeautyBrightenChange={setBeautyBrighten} />

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
              <div className="text-3xl mb-3">📹</div>
              <h3 className="font-bold text-white text-sm mb-1">Câmera Real</h3>
              <p className="text-xs text-dark-500">Sua câmera real é ativada automaticamente ao buscar um match</p>
            </div>
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
          </div>
        )}
      </main>
      <Footer />

      {/* CSS for floating emoji animation */}
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-200px) scale(1.5); }
        }
        .animate-float-up {
          animation: floatUp 2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
