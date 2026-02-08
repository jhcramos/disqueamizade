import { useState, useEffect, useCallback, useRef } from 'react'
import { Shuffle, X, Video, VideoOff, Mic, MicOff, Settings, AlertTriangle, Send, Sparkles } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { useCamera } from '@/hooks/useCamera'
import { useVideoFilter } from '@/hooks/useVideoFilter'
import { useCompositeStream } from '@/hooks/useCompositeStream'
import { useAuthStore } from '@/store/authStore'
import { matchmaking } from '@/services/supabase/matchmaking'
import { roomChat } from '@/services/supabase/roomChat'
import { webrtcRoom } from '@/services/webrtc/peer'
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

  // Composite stream = video + filters + masks (this is what gets sent via WebRTC)
  const compositeStream = useCompositeStream(videoRef, stream, filterStyle, activeMaskEmoji, faceBox, beautySmooth, beautyBrighten)

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
    return () => { stopCamera(); matchmaking.leaveQueue(); webrtcRoom.leave(); roomChat.leave() }
  }, [stopCamera])

  const [matchedPeer, setMatchedPeer] = useState<string | null>(null)
  const [, setMatchedRoomId] = useState<string | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  // Keep streamRef in sync — use composite stream (with effects) for WebRTC
  useEffect(() => { streamRef.current = compositeStream ?? stream ?? null }, [compositeStream, stream])

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const startSearch = useCallback(async () => {
    if (!stream) await startCamera()
    setStatus('searching')
    setSearchTime(0)
    setNoMatchMessage('')
    setChatMessages([])
    setMatchedPeer(null)
    setMatchedRoomId(null)
    setRemoteStream(null)

    const userId = user?.id
    if (!userId) {
      setStatus('no-match')
      setNoMatchMessage('Faça login para usar o chat aleatório!')
      return
    }

    matchmaking.joinQueue(
      userId,
      (peerId, roomId) => {
        setMatchedPeer(peerId)
        setMatchedRoomId(roomId)
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          username: 'Sistema',
          content: '🎉 Match encontrado! Conectando vídeo...',
          type: 'system' as const,
          timestamp: new Date(),
        }])

        // Join chat room for real-time messaging
        const myUsername = useAuthStore.getState().profile?.username || useAuthStore.getState().user?.user_metadata?.username || 'Anônimo'
        roomChat.join(
          `roulette-${roomId}`,
          userId,
          myUsername,
          (msg) => { setChatMessages(prev => [...prev, { ...msg, type: msg.type === 'emoji' ? 'text' : msg.type } as ChatMessage]) },
          () => {},
        )

        // Start WebRTC video connection (use ref to get latest stream)
        const currentStream = streamRef.current
        if (currentStream) {
          webrtcRoom.join(roomId, userId, currentStream, {
            onRemoteStream: (_peerId, peerStream) => {
              setRemoteStream(peerStream)
              setChatMessages(prev => [...prev, {
                id: `vid-${Date.now()}`,
                username: 'Sistema',
                content: '📹 Vídeo conectado!',
                type: 'system' as const,
                timestamp: new Date(),
              }])
            },
            onPeerDisconnect: () => {
              setRemoteStream(null)
              setChatMessages(prev => [...prev, {
                id: `disc-${Date.now()}`,
                username: 'Sistema',
                content: '👋 O outro usuário desconectou.',
                type: 'system' as const,
                timestamp: new Date(),
              }])
            },
          })
        }
      },
      (newStatus) => {
        setStatus(newStatus)
        if (newStatus === 'no-match') {
          setNoMatchMessage('Nenhum usuário disponível no momento. Tente novamente!')
        }
      },
      30000,
    )
  }, [stream, startCamera, user])

  const endSession = useCallback(() => {
    matchmaking.leaveQueue()
    webrtcRoom.leave()
    roomChat.leave()
    setStatus('idle')
    setSearchTime(0)
    setNoMatchMessage('')
    setMatchedPeer(null)
    setMatchedRoomId(null)
    setRemoteStream(null)
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

    const myUsername = profile?.username || user?.user_metadata?.username || 'Anônimo'
    const userId = user?.id || 'guest'

    // Send via realtime to the other person
    roomChat.sendMessage(userId, myUsername, chatInput.trim())

    // Add locally (broadcast doesn't echo back)
    setChatMessages(prev => [...prev, {
      id: `me-${Date.now()}`,
      userId,
      username: myUsername,
      content: chatInput.trim(),
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
        <div className="flex flex-col lg:flex-row gap-4 mb-6" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
          {/* Video Area */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-dark-900 border border-white/10">
            {/* ═══ MAIN VIEW: Remote video (large) or status screens ═══ */}
            {status === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-xs">
                  <div className="text-6xl mb-4">🎰</div>
                  <h3 className="text-xl font-bold text-white mb-2">Pronto para conhecer alguém?</h3>
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
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-primary-500/30 border-t-primary-400 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">🔍</div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Procurando...</h3>
                  <p className="text-base text-dark-400">{formatTime(searchTime)}</p>
                  <p className="text-xs text-dark-500 mt-2">Buscando alguém disponível</p>
                </div>
              </div>
            )}

            {status === 'matched' && matchedPeer && !remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/10">
                <div className="text-center">
                  <div className="text-5xl mb-3 animate-bounce">🎉</div>
                  <h3 className="text-lg font-bold text-white mb-2">Match encontrado!</h3>
                  <p className="text-sm text-dark-400 animate-pulse">Conectando vídeo...</p>
                </div>
              </div>
            )}

            {status === 'matched' && remoteStream && (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-500/80 text-[10px] font-bold text-white backdrop-blur-sm animate-pulse">
                  LIVE
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-xs font-semibold text-emerald-400 backdrop-blur-sm border border-emerald-500/30">
                    Parceiro
                  </span>
                </div>
              </>
            )}

            {status === 'no-match' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-xs px-4">
                  <div className="text-5xl mb-3">😔</div>
                  <h3 className="text-lg font-bold text-white mb-2">Ninguém encontrado</h3>
                  <p className="text-sm text-dark-400 mb-4">{noMatchMessage}</p>
                  <button onClick={startSearch} className="btn-primary flex items-center gap-2 mx-auto">
                    <Shuffle className="w-5 h-5" />
                    Tentar Novamente
                  </button>
                </div>
              </div>
            )}

            {/* ═══ PIP: Your camera (small overlay, bottom-right) ═══ */}
            {(status === 'searching' || status === 'matched') && (
              <div ref={cameraTileRef} className="absolute bottom-3 right-3 w-32 h-24 sm:w-44 sm:h-32 rounded-xl overflow-hidden border-2 border-primary-500/50 shadow-xl z-20 cursor-pointer hover:scale-105 transition-transform bg-dark-800">
                {isCameraOn && stream ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
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
                          fontSize: `${Math.round(Math.max(tileSize.w * faceBox.w, tileSize.h * faceBox.h) / 100 * 0.8)}px`,
                        }}
                      >
                        {activeMaskEmoji}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoOff className="w-5 h-5 text-dark-500" />
                  </div>
                )}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-primary-500/30 backdrop-blur-sm text-[9px] text-primary-300 font-semibold">Você</div>
              </div>
            )}
          </div>

          {/* Chat sidebar */}
          {(status === 'searching' || status === 'no-match' || status === 'matched') && (
            <div className="lg:w-80 flex flex-col rounded-2xl bg-dark-900/50 border border-white/5 overflow-hidden">
              <div className="p-3 border-b border-white/5 flex items-center gap-2">
                <Send className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-bold text-white">Chat</span>
                {status === 'matched' && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
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
                  const myId = user?.id
                  const isMe = (msg as any).userId === myId || msg.username === profile?.username
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
                  placeholder={status === 'matched' ? 'Digite uma mensagem...' : 'Aguardando match...'}
                  disabled={status !== 'matched'}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 transition-all disabled:opacity-50"
                />
                <button type="submit" disabled={status !== 'matched'} className="p-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all disabled:opacity-30">
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

          {(status === 'searching' || status === 'no-match' || status === 'matched') && (
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
