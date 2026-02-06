import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Video, VideoOff, Mic, MicOff, Users, MessageCircle,
  Send, Smile, X, Crown, LogOut, Zap, Clock, Gamepad2, Heart,
  Music, AlertTriangle
} from 'lucide-react'
import { useToastStore } from '@/components/common/ToastContainer'
import { useCamera } from '@/hooks/useCamera'
import { PhaseProgress } from '@/components/design-system/PhaseIndicator'
import type { CamaroteType } from '@/components/balada/CamaroteCard'

// Mock data for different camarote types
const CAMAROTE_CONFIGS: Record<CamaroteType, {
  emoji: string
  title: string
  maxParticipants: number
  color: string
  bgGradient: string
  phases?: { emoji: string; label: string; duration: string }[]
}> = {
  papo: {
    emoji: '💬',
    title: 'Papo Reto',
    maxParticipants: 4,
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-500/5 to-blue-500/5',
    phases: [
      { emoji: '👋', label: 'Quebra-gelo', duration: '2min' },
      { emoji: '💭', label: 'Conversa', duration: '5min' },
      { emoji: '🎯', label: 'Profundo', duration: '∞' },
    ],
  },
  esquenta: {
    emoji: '🎲',
    title: 'Esquenta',
    maxParticipants: 6,
    color: 'text-festa-400',
    bgGradient: 'from-festa-500/5 to-amber-500/5',
  },
  duo: {
    emoji: '💕',
    title: 'Duo',
    maxParticipants: 2,
    color: 'text-energia-400',
    bgGradient: 'from-energia-500/5 to-pink-500/5',
    phases: [
      { emoji: '🍿', label: 'Pipoca', duration: '3min' },
      { emoji: '☕', label: 'Café', duration: '5min' },
      { emoji: '🥃', label: 'Cachaça', duration: '∞' },
    ],
  },
  dark: {
    emoji: '🔥',
    title: 'Dark Room',
    maxParticipants: 2,
    color: 'text-red-400',
    bgGradient: 'from-red-500/5 to-orange-500/5',
  },
  palco: {
    emoji: '🎤',
    title: 'Palco',
    maxParticipants: 20,
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/5 to-violet-500/5',
  },
  karaoke: {
    emoji: '🎵',
    title: 'Karaokê',
    maxParticipants: 8,
    color: 'text-conquista-400',
    bgGradient: 'from-conquista-500/5 to-emerald-500/5',
  },
}

const mockParticipants = [
  { id: 'u1', username: 'Marina_SP', avatar: 'https://i.pravatar.cc/150?img=9', isOnline: true, videoEnabled: true, audioEnabled: true, isHost: true, hasFlashed: false },
  { id: 'u2', username: 'Carlos_RJ', avatar: 'https://i.pravatar.cc/150?img=3', isOnline: true, videoEnabled: true, audioEnabled: true, isHost: false, hasFlashed: true },
  { id: 'u3', username: 'Julia_BH', avatar: 'https://i.pravatar.cc/150?img=5', isOnline: true, videoEnabled: false, audioEnabled: true, isHost: false, hasFlashed: false },
]

type ChatMessage = {
  id: string
  userId: string
  username: string
  avatar: string
  content: string
  timestamp: Date
  type: 'text' | 'system' | 'game'
}

const mockMessages: ChatMessage[] = [
  { id: 'm0', userId: 'system', username: 'Sistema', avatar: '', content: 'Camarote criado! Bem-vindos 🎉', timestamp: new Date(Date.now() - 300000), type: 'system' },
  { id: 'm1', userId: 'u1', username: 'Marina_SP', avatar: 'https://i.pravatar.cc/150?img=9', content: 'Oi galera! Bora conversar?', timestamp: new Date(Date.now() - 240000), type: 'text' },
  { id: 'm2', userId: 'u2', username: 'Carlos_RJ', avatar: 'https://i.pravatar.cc/150?img=3', content: 'E aí! De onde vocês são?', timestamp: new Date(Date.now() - 180000), type: 'text' },
]

export const CamarotePage = () => {
  const { camaroteId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages)
  const [showChat, setShowChat] = useState(true)
  const [currentPhase] = useState(0)
  const [timeInRoom, setTimeInRoom] = useState(0)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToastStore()

  // Camera
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

  // Determine camarote type from ID (in real app, fetch from API)
  const camaroteType: CamaroteType = camaroteId?.startsWith('match') ? 'duo' : 
    camaroteId === 'c1' ? 'papo' :
    camaroteId === 'c2' ? 'esquenta' :
    camaroteId === 'c5' ? 'karaoke' :
    camaroteId === 'c6' ? 'palco' : 'papo'
  
  const config = CAMAROTE_CONFIGS[camaroteType]

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Time in room counter
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInRoom(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Start camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    
    const newMsg: ChatMessage = {
      id: `m${Date.now()}`,
      userId: 'me',
      username: 'você',
      avatar: 'https://i.pravatar.cc/150?img=68',
      content: message,
      timestamp: new Date(),
      type: 'text',
    }
    setMessages([...messages, newMsg])
    setMessage('')
  }

  const handleLeave = () => {
    setShowLeaveConfirm(true)
  }

  const confirmLeave = () => {
    stopCamera()
    addToast({ type: 'info', title: 'Saiu do Camarote', message: 'Voltando para a sala...' })
    navigate(-1) // Volta para página anterior (sala de onde veio)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Determine video grid layout
  const getGridClass = () => {
    const count = mockParticipants.length + 1 // +1 for self
    if (count <= 2) return 'grid-cols-1 sm:grid-cols-2'
    if (count <= 4) return 'grid-cols-2'
    return 'grid-cols-2 lg:grid-cols-3'
  }

  return (
    <div className={`h-screen bg-gradient-to-br ${config.bgGradient} bg-noite-950 text-white flex flex-col overflow-hidden`}>
      {/* Header */}
      <header className="border-b border-white/5 bg-noite-950/80 backdrop-blur-lg z-40 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLeave}
              className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-lg font-bold flex items-center gap-2 ${config.color}`}>
                <span>{config.emoji}</span>
                {config.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-dark-500">
                <Clock className="w-3 h-3" />
                <span>{formatTime(timeInRoom)}</span>
                <span>•</span>
                <Users className="w-3 h-3" />
                <span>{mockParticipants.length + 1}/{config.maxParticipants}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Phase indicator for types that have phases */}
            {config.phases && (
              <div className="hidden sm:block">
                <PhaseProgress 
                  currentPhase={(['pipoca', 'cafe', 'cachaca'] as const)[currentPhase]}
                />
              </div>
            )}
            
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-xl transition-all md:hidden ${showChat ? 'bg-balada-500/20 text-balada-400' : 'text-dark-400 hover:text-white'}`}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Camera permission warning */}
      {permissionState === 'denied' && (
        <div className="flex-shrink-0 bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <p className="text-xs text-red-400">{cameraError || 'Câmera bloqueada'}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <main className={`flex-1 flex flex-col min-w-0 ${showChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 p-3 overflow-y-auto">
            <div className={`grid gap-3 h-full ${getGridClass()}`}>
              {/* Your video */}
              <div className="relative rounded-2xl border-2 border-balada-500/40 bg-noite-900 overflow-hidden min-h-[140px] shadow-lg shadow-balada-500/10">
                {isCameraOn && stream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover absolute inset-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-noite-800 border border-white/10 flex items-center justify-center mx-auto mb-2">
                        <VideoOff className="w-6 h-6 text-dark-500" />
                      </div>
                      <p className="text-xs text-dark-500">Câmera off</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 rounded-lg bg-balada-500/20 text-xs font-semibold text-balada-400 backdrop-blur-sm border border-balada-500/30">
                    Você
                  </span>
                </div>
                {isCameraOn && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-500/80 text-[10px] font-bold text-white animate-pulse">
                    LIVE
                  </div>
                )}
              </div>

              {/* Other participants */}
              {mockParticipants.map((p) => (
                <div
                  key={p.id}
                  className="relative rounded-2xl border border-white/10 bg-noite-900 overflow-hidden min-h-[140px]"
                >
                  {p.videoEnabled ? (
                    <img src={p.avatar} alt={p.username} className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img src={p.avatar} alt={p.username} className="w-16 h-16 rounded-full border-2 border-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Username + badges */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    <span className="px-2 py-1 rounded-lg bg-black/50 text-xs font-medium text-white backdrop-blur-sm">
                      {p.username}
                    </span>
                    {p.isHost && (
                      <span className="p-1 rounded-lg bg-amber-500/20 backdrop-blur-sm">
                        <Crown className="w-3 h-3 text-amber-400" />
                      </span>
                    )}
                    {p.hasFlashed && (
                      <span className="p-1 rounded-lg bg-balada-500/20 backdrop-blur-sm">
                        <Zap className="w-3 h-3 text-balada-400" />
                      </span>
                    )}
                  </div>
                  
                  {/* Audio/Video status */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {!p.audioEnabled && (
                      <span className="p-1 rounded-lg bg-red-500/20 backdrop-blur-sm">
                        <MicOff className="w-3 h-3 text-red-400" />
                      </span>
                    )}
                  </div>
                  
                  {p.videoEnabled && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-500/80 text-[10px] font-bold text-white animate-pulse">
                      LIVE
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 border-t border-white/5 bg-noite-950/80 backdrop-blur-lg p-3">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-2xl transition-all ${!isMicOn ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleCamera}
                className={`p-3 rounded-2xl transition-all ${!isCameraOn ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              
              {/* Type-specific action */}
              {camaroteType === 'esquenta' && (
                <button className="p-3 rounded-2xl bg-festa-500/20 text-festa-400 border border-festa-500/30 hover:bg-festa-500/30">
                  <Gamepad2 className="w-5 h-5" />
                </button>
              )}
              {camaroteType === 'duo' && (
                <button className="p-3 rounded-2xl bg-energia-500/20 text-energia-400 border border-energia-500/30 hover:bg-energia-500/30">
                  <Heart className="w-5 h-5" />
                </button>
              )}
              {camaroteType === 'karaoke' && (
                <button className="p-3 rounded-2xl bg-conquista-500/20 text-conquista-400 border border-conquista-500/30 hover:bg-conquista-500/30">
                  <Music className="w-5 h-5" />
                </button>
              )}
              
              {/* Leave button */}
              <button
                onClick={handleLeave}
                className="p-3 rounded-2xl bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-red-500/25"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>

        {/* Chat Sidebar */}
        <aside className={`${showChat ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-l border-white/5 bg-noite-950/50 flex-shrink-0`}>
          <div className="flex-shrink-0 p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-balada-400" />
              Chat
            </h3>
            <button onClick={() => setShowChat(false)} className="md:hidden p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-balada-500/10 border border-balada-500/20 text-xs text-balada-400">
                      {msg.content}
                    </span>
                  </div>
                )
              }
              const isMe = msg.userId === 'me'
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <img src={msg.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10 flex-shrink-0" />
                  <div className={`flex-1 min-w-0 ${isMe ? 'text-right' : ''}`}>
                    <div className={`flex items-baseline gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-xs font-semibold ${isMe ? 'text-balada-400' : 'text-dark-300'}`}>{msg.username}</span>
                      <span className="text-[10px] text-dark-600">{msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`inline-block px-3 py-2 rounded-2xl text-sm max-w-[85%] ${
                      isMe ? 'bg-balada-500/20 text-white rounded-tr-sm' : 'bg-white/5 text-dark-200 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 border-t border-white/5 p-3">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <button type="button" className="p-2.5 rounded-xl text-dark-400 hover:text-white hover:bg-white/5 flex-shrink-0">
                <Smile className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-balada-500/40"
              />
              <button type="submit" disabled={!message.trim()} className="p-2.5 rounded-xl bg-balada-500 text-white hover:bg-balada-600 disabled:opacity-30">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* Modal de confirmação para sair */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowLeaveConfirm(false)}>
          <div className="card w-full max-w-xs p-5 text-center animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🚪</div>
            <h3 className="text-lg font-bold text-white mb-2">Sair do Camarote?</h3>
            <p className="text-sm text-dark-400 mb-5">Você pode voltar a qualquer momento</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
              >
                Ficar
              </button>
              <button 
                onClick={confirmLeave}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
