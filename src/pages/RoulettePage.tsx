import { useState, useEffect, useCallback, useRef } from 'react'
import { Shuffle, X, Video, VideoOff, Mic, MicOff, Settings, AlertTriangle, Send, Sparkles } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { useCamera } from '@/hooks/useCamera'
import { useVideoFilter } from '@/hooks/useVideoFilter'
// import { useToastStore } from '@/components/common/ToastContainer'
import { CameraMasksButton, FILTER_CSS } from '@/components/camera/CameraMasks'
import type { RouletteStatus, RouletteFilters } from '@/types'

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
  const [searchTime, setSearchTime] = useState(0)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [activeFilter, setActiveFilter] = useState('normal')
  const [activeMask, setActiveMask] = useState<string | null>(null)
  const [beautySmooth, setBeautySmooth] = useState(false)
  const [beautyBrighten, setBeautyBrighten] = useState(false)
  const filterStyle = FILTER_CSS[activeFilter] || 'none'
  const chatEndRef = useRef<HTMLDivElement>(null)
  const cameraTileRef = useRef<HTMLDivElement>(null)
  const [tileSize, setTileSize] = useState({ w: 320, h: 240 })
  const [noMatchMessage, setNoMatchMessage] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Search timer
  useEffect(() => {
    if (status !== 'searching') return
    const interval = setInterval(() => setSearchTime(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    return () => { stopCamera() }
  }, [stopCamera])

  const startSearch = useCallback(async () => {
    if (!stream) await startCamera()
    setStatus('searching')
    setSearchTime(0)
    setNoMatchMessage('')
    setChatMessages([])

    // After 10-15 seconds, show no-match message
    const delay = 10000 + Math.random() * 5000
    searchTimerRef.current = setTimeout(() => {
      setStatus('no-match')
      setNoMatchMessage('Nenhum usuário disponível no momento. Tente novamente em breve!')
    }, delay)
  }, [stream, startCamera])

  const endSession = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setStatus('idle')
    setSearchTime(0)
    setNoMatchMessage('')
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-all ${
              showFilters ? 'bg-primary-500/15 border-primary-500/30 text-primary-400' : 'border-white/10 text-dark-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

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
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="lg:flex-1">
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
                          fontSize: `${Math.round(Math.max(tileSize.w * faceBox.w, tileSize.h * faceBox.h) / 100 * 2.0)}px`,
                          transition: 'left 80ms ease-out, top 80ms ease-out, font-size 150ms ease-out',
                        }}
                      >
                        {activeMaskEmoji}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {status === 'idle' ? (
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-700/20 border border-primary-500/30 flex items-center justify-center mb-3 mx-auto">
                            <Video className="w-8 h-8 text-primary-400" />
                          </div>
                          <p className="text-sm text-dark-400">Sua câmera aparecerá aqui</p>
                          <p className="text-xs text-dark-500 mt-1">Clique em "Buscar" para começar</p>
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
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
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

              {/* PARTNER SIDE */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-dark-900 border border-white/10">
                {status === 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center max-w-xs">
                      <div className="text-5xl mb-4">🎰</div>
                      <h3 className="text-lg font-bold text-white mb-2">Pronto para conhecer alguém?</h3>
                      <p className="text-sm text-dark-400 mb-6">Clique no botão abaixo para iniciar</p>
                      <button onClick={startSearch} className="btn-primary btn-lg flex items-center gap-2 mx-auto">
                        <Shuffle className="w-5 h-5" />
                        Buscar
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
                      <p className="text-xs text-dark-500 mt-2">Buscando alguém disponível</p>
                    </div>
                  </div>
                )}

                {status === 'no-match' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center max-w-xs px-4">
                      <div className="text-4xl mb-3">😔</div>
                      <h3 className="text-base font-bold text-white mb-2">Ninguém encontrado</h3>
                      <p className="text-sm text-dark-400 mb-4">{noMatchMessage}</p>
                      <button onClick={startSearch} className="btn-primary flex items-center gap-2 mx-auto">
                        <Shuffle className="w-4 h-4" />
                        Tentar Novamente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat sidebar - always visible for future real matches */}
          {(status === 'searching' || status === 'no-match') && (
            <div className="lg:w-80 flex flex-col rounded-2xl bg-dark-900/50 border border-white/5 overflow-hidden" style={{ maxHeight: '480px' }}>
              <div className="p-3 border-b border-white/5 flex items-center gap-2">
                <Send className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-bold text-white">Chat</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-dark-500">O chat estará disponível quando conectado com alguém</p>
                  </div>
                )}
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
                  disabled
                  className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 transition-all disabled:opacity-50"
                />
                <button type="submit" disabled className="p-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all disabled:opacity-30">
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
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={handleToggleMic}
            className={`p-3 rounded-xl border transition-all ${
              isMicOn ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <CameraMasksButton activeFilter={activeFilter} onFilterChange={setActiveFilter} activeMask={activeMask} onMaskChange={setActiveMask} beautySmooth={beautySmooth} onBeautySmoothChange={setBeautySmooth} beautyBrighten={beautyBrighten} onBeautyBrightenChange={setBeautyBrighten} />

          {status === 'searching' ? (
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
              Buscar
            </button>
          )}

          {(status === 'searching' || status === 'no-match') && (
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
    </div>
  )
}
