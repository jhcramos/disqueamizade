import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Video, VideoOff, Mic, MicOff, Phone, Users, MessageCircle,
  Send, Flag, Crown, Lock, Smile, Volume2,
  Share2, X, Gamepad2, Info, Shield, AlertTriangle, Sparkles,
} from 'lucide-react'
import { mockRooms } from '@/data/mockRooms'
// MarriageGame removido - substituído por Pista/Roleta
import { useToastStore } from '@/components/common/ToastContainer'
import { CreateCamaroteModal } from '@/components/rooms/CreateCamaroteModal'
import { useCamera } from '@/hooks/useCamera'

// ─── Mock Data ───
const mockParticipants = [
  { id: 'u1', username: 'ana_paula', avatar: 'https://i.pravatar.cc/150?img=9', isOnline: true, videoEnabled: true, audioEnabled: true, role: 'owner' as const, tier: 'premium' as const },
  { id: 'u2', username: 'joao_silva', avatar: 'https://i.pravatar.cc/150?img=1', isOnline: true, videoEnabled: true, audioEnabled: true, role: 'moderator' as const, tier: 'basic' as const },
  { id: 'u3', username: 'maria_santos', avatar: 'https://i.pravatar.cc/150?img=5', isOnline: true, videoEnabled: false, audioEnabled: true, role: 'participant' as const, tier: 'free' as const },
  { id: 'u4', username: 'pedro_costa', avatar: 'https://i.pravatar.cc/150?img=3', isOnline: true, videoEnabled: true, audioEnabled: false, role: 'participant' as const, tier: 'basic' as const },
  { id: 'u5', username: 'carlos_edu', avatar: 'https://i.pravatar.cc/150?img=7', isOnline: true, videoEnabled: true, audioEnabled: true, role: 'participant' as const, tier: 'free' as const },
  { id: 'u6', username: 'lucia_r', avatar: 'https://i.pravatar.cc/150?img=20', isOnline: true, videoEnabled: false, audioEnabled: true, role: 'participant' as const, tier: 'premium' as const },
  { id: 'u7', username: 'fernanda_m', avatar: 'https://i.pravatar.cc/150?img=25', isOnline: true, videoEnabled: true, audioEnabled: true, role: 'participant' as const, tier: 'free' as const },
  { id: 'u8', username: 'rafa_coach', avatar: 'https://i.pravatar.cc/150?img=12', isOnline: false, videoEnabled: false, audioEnabled: false, role: 'participant' as const, tier: 'basic' as const },
]

type MockMessage = {
  id: string
  userId: string
  username: string
  avatar: string
  content: string
  timestamp: Date
  type: 'text' | 'emoji' | 'system'
}

const mockChatMessages: MockMessage[] = [
  { id: 'm0', userId: 'system', username: 'Sistema', avatar: '', content: 'ana_paula criou a sala 🎉', timestamp: new Date(Date.now() - 700000), type: 'system' },
  { id: 'm1', userId: 'u1', username: 'ana_paula', avatar: 'https://i.pravatar.cc/150?img=9', content: 'Oi pessoal! Bem-vindos à sala! 🎉', timestamp: new Date(Date.now() - 600000), type: 'text' },
  { id: 'm2', userId: 'u2', username: 'joao_silva', avatar: 'https://i.pravatar.cc/150?img=1', content: 'E aí galera! Tudo bom?', timestamp: new Date(Date.now() - 540000), type: 'text' },
  { id: 'm3', userId: 'u3', username: 'maria_santos', avatar: 'https://i.pravatar.cc/150?img=5', content: 'Boa noite! Acabei de chegar 😊', timestamp: new Date(Date.now() - 480000), type: 'text' },
  { id: 'm4', userId: 'u5', username: 'carlos_edu', avatar: 'https://i.pravatar.cc/150?img=7', content: 'Alguém viu o jogo ontem?', timestamp: new Date(Date.now() - 360000), type: 'text' },
  { id: 'm5', userId: 'u1', username: 'ana_paula', avatar: 'https://i.pravatar.cc/150?img=9', content: 'Sim!! Que virada incrível no segundo tempo', timestamp: new Date(Date.now() - 300000), type: 'text' },
  { id: 'm6', userId: 'u7', username: 'fernanda_m', avatar: 'https://i.pravatar.cc/150?img=25', content: 'Oi gente! Posso entrar na conversa? 👋', timestamp: new Date(Date.now() - 240000), type: 'text' },
  { id: 'm7', userId: 'u4', username: 'pedro_costa', avatar: 'https://i.pravatar.cc/150?img=3', content: 'Claro, Fer! Estamos falando do jogo de ontem', timestamp: new Date(Date.now() - 180000), type: 'text' },
  { id: 'm8', userId: 'u2', username: 'joao_silva', avatar: 'https://i.pravatar.cc/150?img=1', content: 'Alguém aqui joga alguma coisa? Tô procurando duo', timestamp: new Date(Date.now() - 120000), type: 'text' },
  { id: 'm9', userId: 'u6', username: 'lucia_r', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Eu jogo! Sou suporte main 🛡️', timestamp: new Date(Date.now() - 60000), type: 'text' },
  { id: 'm10', userId: 'u5', username: 'carlos_edu', avatar: 'https://i.pravatar.cc/150?img=7', content: 'Bora montar um time então! 💪', timestamp: new Date(Date.now() - 30000), type: 'text' },
]

export const RoomPage = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<MockMessage[]>(mockChatMessages)
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState<string | null>(null)
  const [showCreateCamarote, setShowCreateCamarote] = useState(false)
  const [userFichas] = useState(85) // Mock: fichas do usuário
  const messagesEndRef = useRef<HTMLDivElement>(null)
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

  const room = mockRooms.find((r) => r.id === roomId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup camera on unmount / leaving room
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    const newMsg: MockMessage = {
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

  const handleShareRoom = () => {
    navigator.clipboard?.writeText(window.location.href)
    addToast({ type: 'success', title: 'Link copiado!', message: 'Link da sala copiado para a área de transferência' })
  }

  const handleToggleVideo = () => {
    if (!stream && !isCameraOn) {
      startCamera()
    } else {
      toggleCamera()
    }
  }

  const handleToggleMic = () => {
    if (!stream) {
      startCamera()
    } else {
      toggleMic()
    }
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center">
        <div className="card p-10 text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">Sala não encontrada</h2>
          <p className="text-dark-500 text-sm mb-6">Esta sala pode ter sido encerrada ou o link está incorreto.</p>
          <Link to="/rooms"><button className="btn-primary px-6 py-3">← Voltar para Salas</button></Link>
        </div>
      </div>
    )
  }

  const onlineParticipants = mockParticipants.filter((p) => p.isOnline)
  const videoParticipants = mockParticipants.filter((p) => p.videoEnabled)
  const capacityPercent = Math.round((room.participants / room.max_users) * 100)

  return (
    <div className="h-screen bg-dark-950 text-white flex flex-col overflow-hidden">
      {/* ─── Top Bar ─── */}
      <header className="border-b border-white/5 bg-dark-950/80 backdrop-blur-lg z-40 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/rooms" className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate flex items-center gap-2">
                {room.name}
                {room.is_private && <Lock className="w-4 h-4 text-pink-400 flex-shrink-0" />}
              </h1>
              <p className="text-xs text-dark-500 truncate">{room.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-semibold">{onlineParticipants.length} online</span>
            </div>
            <button onClick={() => navigate('/pista')} className="p-2 rounded-xl text-balada-400 hover:bg-balada-500/10 transition-all" title="Pista & Roleta">
              <Gamepad2 className="w-5 h-5" />
            </button>
            <button onClick={() => setShowInfoPanel(!showInfoPanel)} className={`p-2 rounded-xl transition-all ${showInfoPanel ? 'bg-primary-500/20 text-primary-400' : 'text-dark-400 hover:text-white hover:bg-white/5'}`}>
              <Info className="w-5 h-5" />
            </button>
            <button onClick={() => { setShowParticipants(!showParticipants); if (!showParticipants) setShowChat(false) }} className={`p-2 rounded-xl transition-all md:hidden ${showParticipants ? 'bg-primary-500/20 text-primary-400' : 'text-dark-400 hover:text-white hover:bg-white/5'}`}>
              <Users className="w-5 h-5" />
            </button>
            <button onClick={() => { setShowChat(!showChat); if (!showChat) setShowParticipants(false) }} className={`p-2 rounded-xl transition-all md:hidden ${showChat ? 'bg-primary-500/20 text-primary-400' : 'text-dark-400 hover:text-white hover:bg-white/5'}`}>
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Camera permission denied banner */}
      {permissionState === 'denied' && (
        <div className="flex-shrink-0 bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">
            {cameraError || 'Câmera bloqueada. Habilite nas configurações do navegador.'}
          </p>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Participants Sidebar ─── */}
        <aside className={`${showParticipants ? 'block' : 'hidden'} md:block w-full md:w-60 lg:w-64 border-r border-white/5 bg-dark-950/50 overflow-y-auto flex-shrink-0`}>
          <div className="p-4">
            <h3 className="text-sm font-bold text-primary-400 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participantes ({mockParticipants.length})
            </h3>
            <div className="space-y-1">
              {mockParticipants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => p.videoEnabled ? setShowVideoModal(p.id) : undefined}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left ${
                    p.videoEnabled ? 'hover:bg-white/[0.06] cursor-pointer' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={p.avatar} alt={p.username} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-950 ${p.isOnline ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white truncate">{p.username}</span>
                      {p.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      {p.role === 'moderator' && <Shield className="w-3 h-3 text-primary-400 flex-shrink-0" />}
                      {p.tier === 'premium' && <span className="text-[10px] text-amber-400">👑</span>}
                    </div>
                    <div className="flex gap-2 mt-0.5">
                      {p.videoEnabled ? <Video className="w-3 h-3 text-primary-400" /> : <VideoOff className="w-3 h-3 text-dark-600" />}
                      {p.audioEnabled ? <Volume2 className="w-3 h-3 text-primary-400" /> : <MicOff className="w-3 h-3 text-dark-600" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Room Info Panel */}
            {showInfoPanel && (
              <div className="mt-6 pt-4 border-t border-white/5 animate-fade-in">
                <h4 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3">Informações da Sala</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-dark-400"><span>Categoria</span><span className="text-white capitalize">{room.category}</span></div>
                  <div className="flex justify-between text-dark-400"><span>Tema</span><span className="text-white">{room.theme}</span></div>
                  <div className="flex justify-between text-dark-400"><span>Dono</span><span className="text-primary-400">{room.owner.username}</span></div>
                  <div>
                    <div className="flex justify-between text-dark-400 mb-1"><span>Capacidade</span><span className="text-white">{room.participants}/{room.max_users}</span></div>
                    <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${capacityPercent > 90 ? 'bg-red-500' : capacityPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${capacityPercent}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-dark-400"><span>Vídeo</span><span className={room.has_video ? 'text-emerald-400' : 'text-dark-600'}>{room.has_video ? 'Ativo' : 'Desativado'}</span></div>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <h5 className="text-xs font-semibold text-dark-300 mb-2">📋 Regras</h5>
                  <ul className="text-[11px] text-dark-500 space-y-1">
                    <li>• Respeite todos os participantes</li>
                    <li>• Sem spam ou conteúdo inapropriado</li>
                    <li>• Denuncie comportamento inadequado</li>
                  </ul>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={handleShareRoom} className="flex-1 px-3 py-2 rounded-xl border border-white/5 text-xs text-dark-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 justify-center">
                    <Share2 className="w-3.5 h-3.5" /> Compartilhar
                  </button>
                  <button className="px-3 py-2 rounded-xl border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5" /> Denunciar
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ─── Main Area: Video Grid ─── */}
        <main className={`flex-1 flex flex-col min-w-0 ${(showChat || showParticipants) ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
            <div className={`grid gap-3 h-full ${
              videoParticipants.length <= 1 ? 'grid-cols-1 sm:grid-cols-2' :
              videoParticipants.length <= 2 ? 'grid-cols-2' :
              videoParticipants.length <= 4 ? 'grid-cols-2' :
              'grid-cols-2 lg:grid-cols-3'
            }`}>

              {/* ═══ YOUR REAL CAMERA TILE ═══ */}
              <div className="relative rounded-2xl border-2 border-primary-500/40 bg-dark-900 overflow-hidden min-h-[120px] sm:min-h-[160px] shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                {isCameraOn && stream ? (
                  /* Real camera feed */
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover absolute inset-0"
                  />
                ) : (
                  /* Placeholder */
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        isCameraOn
                          ? 'bg-gradient-to-br from-primary-500 to-primary-700'
                          : 'bg-dark-800 border border-white/10'
                      }`}>
                        {isCameraOn ? (
                          <Video className="w-7 h-7 text-white" />
                        ) : (
                          <VideoOff className="w-7 h-7 text-dark-500" />
                        )}
                      </div>
                      <p className="text-sm text-dark-400">
                        {permissionState === 'denied' ? 'Câmera bloqueada' : 'Câmera desligada'}
                      </p>
                      {!isCameraOn && permissionState !== 'denied' && (
                        <button
                          onClick={() => startCamera()}
                          className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-all"
                        >
                          Ligar Câmera
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* "Você" badge */}
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 rounded-lg bg-primary-500/20 text-xs font-semibold text-primary-400 backdrop-blur-sm border border-primary-500/30">
                    Você
                  </span>
                </div>

                {/* Live indicator */}
                {isCameraOn && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-500/80 text-[10px] font-bold text-white backdrop-blur-sm animate-pulse">
                    LIVE
                  </div>
                )}

                {/* Mic/Camera status */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {isCameraOn && !isMicOn && (
                    <span className="p-1 rounded-lg bg-red-500/20 backdrop-blur-sm"><MicOff className="w-3 h-3 text-red-400" /></span>
                  )}
                </div>
              </div>

              {/* ═══ OTHER PARTICIPANTS (mock with connecting animation) ═══ */}
              {videoParticipants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setShowVideoModal(p.id)}
                  className="relative rounded-2xl border border-white/5 bg-dark-900 overflow-hidden group min-h-[120px] sm:min-h-[160px] text-left"
                >
                  <img src={p.avatar} alt={p.username} className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Connecting overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-10 h-10 rounded-full border border-primary/20 animate-ping opacity-15" />
                  </div>

                  <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    <span className="px-2 py-1 rounded-lg bg-black/60 text-xs font-medium text-white backdrop-blur-sm">
                      {p.username}
                    </span>
                    {!p.audioEnabled && (
                      <span className="p-1 rounded-lg bg-red-500/20 backdrop-blur-sm"><MicOff className="w-3 h-3 text-red-400" /></span>
                    )}
                    {p.tier === 'premium' && (
                      <span className="p-1 rounded-lg bg-amber-500/20 backdrop-blur-sm text-[10px]">👑</span>
                    )}
                  </div>
                  {p.role === 'owner' && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-400 backdrop-blur-sm flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Dono
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-500/80 text-[10px] font-bold text-white backdrop-blur-sm animate-pulse">
                    LIVE
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex-shrink-0 border-t border-white/5 bg-dark-950/80 backdrop-blur-lg p-3 sm:p-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={handleToggleMic}
                className={`p-3 rounded-2xl transition-all ${!isMicOn ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1]'}`}
                title={isMicOn ? 'Desligar microfone' : 'Ligar microfone'}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={handleToggleVideo}
                className={`p-3 rounded-2xl transition-all ${!isCameraOn ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1]'}`}
                title={isCameraOn ? 'Desligar câmera' : 'Ligar câmera'}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button onClick={() => navigate('/pista')} className="p-3 rounded-2xl bg-balada-500/10 text-balada-400 border border-balada-500/20 hover:bg-balada-500/20 transition-all" title="Pista & Roleta">
                <Gamepad2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowCreateCamarote(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-elite-500/10 text-elite-400 border border-elite-500/20 hover:bg-elite-500/20 transition-all text-sm font-semibold" 
                title="Criar Camarote VIP (20💎)"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">Camarote</span>
              </button>
              <Link to="/rooms">
                <button className="p-3 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg hover:shadow-red-500/25">
                  <Phone className="w-5 h-5 rotate-[135deg]" />
                </button>
              </Link>
              <button onClick={handleShareRoom} className="hidden sm:block p-3 rounded-2xl bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1] transition-all">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="hidden sm:block p-3 rounded-2xl bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1] transition-all">
                <Flag className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>

        {/* ─── Chat Sidebar ─── */}
        <aside className={`${showChat ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-l border-white/5 bg-dark-950/50 flex-shrink-0`}>
          <div className="flex-shrink-0 p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary-400" /> Chat da Sala
            </h3>
            <button onClick={() => setShowChat(false)} className="md:hidden p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs text-primary-400">
                      {msg.content}
                    </span>
                  </div>
                )
              }
              const isMe = msg.userId === 'me'
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <img src={msg.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10 flex-shrink-0 mt-0.5" />
                  <div className={`flex-1 min-w-0 ${isMe ? 'text-right' : ''}`}>
                    <div className={`flex items-baseline gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-xs font-semibold ${isMe ? 'text-primary-400' : 'text-dark-300'}`}>{msg.username}</span>
                      <span className="text-[10px] text-dark-600">{msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`inline-block px-3 py-2 rounded-2xl text-sm max-w-[85%] ${
                      isMe ? 'bg-primary-500/20 text-primary-100 rounded-tr-sm' : 'bg-white/[0.04] text-dark-200 rounded-tl-sm'
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
              <button type="button" className="p-2.5 rounded-xl text-dark-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0">
                <Smile className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all"
              />
              <button type="submit" disabled={!message.trim()} className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* ─── Video Modal ─── */}
      {showVideoModal && (() => {
        const user = mockParticipants.find(p => p.id === showVideoModal)
        if (!user) return null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowVideoModal(null)}>
            <div className="card w-full max-w-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="aspect-video bg-dark-900 rounded-t-2xl overflow-hidden relative">
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-red-500/80 text-[11px] font-bold text-white animate-pulse">LIVE</div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border border-white/20" />
                  <span className="text-sm font-semibold text-white">{user.username}</span>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <p className="text-sm text-dark-400">Visualizando vídeo de {user.username}</p>
                <button onClick={() => setShowVideoModal(null)} className="btn-ghost btn-sm">Fechar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Jogo Pista/Roleta agora acessado via /pista */}

      {/* Create Camarote Modal */}
      <CreateCamaroteModal
        isOpen={showCreateCamarote}
        onClose={() => setShowCreateCamarote(false)}
        userFichas={userFichas}
        onConfirm={(data) => {
          addToast({ 
            type: 'success', 
            title: '🛋️ Camarote criado!', 
            message: `"${data.name}" está pronto. Até 6 pessoas!` 
          })
          navigate(`/camarote/vip-${Date.now()}`)
        }}
      />
    </div>
  )
}
