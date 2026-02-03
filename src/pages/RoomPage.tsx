import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Users,
  MessageCircle,
  Send,
  Flag,
  Settings,
  Crown,
  Lock,
  Smile,
  MoreVertical,
  Volume2,
  Share2,
  X,
} from 'lucide-react'
import { mockRooms } from '../data/mockRooms'

// ─── Mock participants for the room ───
const mockParticipants = [
  { id: 'u1', username: 'ana_paula', avatar: 'https://i.pravatar.cc/150?img=9', isOnline: true, videoEnabled: true, audioEnabled: true, role: 'owner' as const },
  { id: 'u2', username: 'joao_silva', avatar: 'https://i.pravatar.cc/150?img=1', isOnline: true, videoEnabled: true, audioEnabled: true, role: 'moderator' as const },
  { id: 'u3', username: 'maria_santos', avatar: 'https://i.pravatar.cc/150?img=5', isOnline: true, videoEnabled: false, audioEnabled: true, role: 'participant' as const },
  { id: 'u4', username: 'pedro_costa', avatar: 'https://i.pravatar.cc/150?img=3', isOnline: true, videoEnabled: true, audioEnabled: false, role: 'participant' as const },
  { id: 'u5', username: 'carlos_edu', avatar: 'https://i.pravatar.cc/150?img=7', isOnline: true, videoEnabled: true, audioEnabled: true, role: 'participant' as const },
  { id: 'u6', username: 'lucia_r', avatar: 'https://i.pravatar.cc/150?img=20', isOnline: true, videoEnabled: false, audioEnabled: true, role: 'participant' as const },
  { id: 'u7', username: 'fernanda_m', avatar: 'https://i.pravatar.cc/150?img=25', isOnline: true, videoEnabled: true, audioEnabled: true, role: 'participant' as const },
  { id: 'u8', username: 'rafa_coach', avatar: 'https://i.pravatar.cc/150?img=12', isOnline: false, videoEnabled: false, audioEnabled: false, role: 'participant' as const },
]

const mockChatMessages = [
  { id: 'm1', userId: 'u1', username: 'ana_paula', avatar: 'https://i.pravatar.cc/150?img=9', content: 'Oi pessoal! Bem-vindos à sala! 🎉', timestamp: new Date(Date.now() - 600000) },
  { id: 'm2', userId: 'u2', username: 'joao_silva', avatar: 'https://i.pravatar.cc/150?img=1', content: 'E aí galera! Tudo bom?', timestamp: new Date(Date.now() - 540000) },
  { id: 'm3', userId: 'u3', username: 'maria_santos', avatar: 'https://i.pravatar.cc/150?img=5', content: 'Boa noite! Acabei de chegar 😊', timestamp: new Date(Date.now() - 480000) },
  { id: 'm4', userId: 'u5', username: 'carlos_edu', avatar: 'https://i.pravatar.cc/150?img=7', content: 'Alguém viu o jogo ontem?', timestamp: new Date(Date.now() - 360000) },
  { id: 'm5', userId: 'u1', username: 'ana_paula', avatar: 'https://i.pravatar.cc/150?img=9', content: 'Sim!! Que virada incrível no segundo tempo', timestamp: new Date(Date.now() - 300000) },
  { id: 'm6', userId: 'u7', username: 'fernanda_m', avatar: 'https://i.pravatar.cc/150?img=25', content: 'Oi gente! Posso entrar na conversa? 👋', timestamp: new Date(Date.now() - 240000) },
  { id: 'm7', userId: 'u4', username: 'pedro_costa', avatar: 'https://i.pravatar.cc/150?img=3', content: 'Claro, Fer! Estamos falando do jogo de ontem', timestamp: new Date(Date.now() - 180000) },
  { id: 'm8', userId: 'u2', username: 'joao_silva', avatar: 'https://i.pravatar.cc/150?img=1', content: 'Alguém aqui joga alguma coisa? Tô procurando duo pro LoL', timestamp: new Date(Date.now() - 120000) },
  { id: 'm9', userId: 'u6', username: 'lucia_r', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Eu jogo! Sou suporte main 🛡️', timestamp: new Date(Date.now() - 60000) },
  { id: 'm10', userId: 'u5', username: 'carlos_edu', avatar: 'https://i.pravatar.cc/150?img=7', content: 'Bora montar um time então! 💪', timestamp: new Date(Date.now() - 30000) },
]

export const RoomPage = () => {
  const { roomId } = useParams()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(mockChatMessages)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const room = mockRooms.find((r) => r.id === roomId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    const newMsg = {
      id: `m${Date.now()}`,
      userId: 'me',
      username: 'você',
      avatar: 'https://i.pravatar.cc/150?img=68',
      content: message,
      timestamp: new Date(),
    }
    setMessages([...messages, newMsg])
    setMessage('')
  }

  // Room not found state
  if (!room) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center">
        <div className="card p-10 text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">Sala não encontrada</h2>
          <p className="text-dark-500 text-sm mb-6">
            Esta sala pode ter sido encerrada ou o link está incorreto.
          </p>
          <Link to="/rooms">
            <button className="btn-primary px-6 py-3 rounded-xl font-semibold">
              ← Voltar para Salas
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const onlineParticipants = mockParticipants.filter((p) => p.isOnline)
  const videoParticipants = mockParticipants.filter((p) => p.videoEnabled).slice(0, 6)

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
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-semibold">{onlineParticipants.length} online</span>
            </div>
            <button
              onClick={() => { setShowParticipants(!showParticipants); if (!showParticipants) setShowChat(false) }}
              className={`p-2 rounded-xl transition-all md:hidden ${showParticipants ? 'bg-primary/20 text-primary-400' : 'text-dark-400 hover:text-white hover:bg-white/5'}`}
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setShowChat(!showChat); if (!showChat) setShowParticipants(false) }}
              className={`p-2 rounded-xl transition-all md:hidden ${showChat ? 'bg-primary/20 text-primary-400' : 'text-dark-400 hover:text-white hover:bg-white/5'}`}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5 transition-all">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Participants Sidebar (desktop + mobile toggle) ─── */}
        <aside className={`${showParticipants ? 'block' : 'hidden'} md:block w-full md:w-60 lg:w-64 border-r border-white/5 bg-dark-950/50 overflow-y-auto flex-shrink-0`}>
          <div className="p-4">
            <h3 className="text-sm font-bold text-primary-400 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participantes ({mockParticipants.length})
            </h3>
            <div className="space-y-1">
              {mockParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="relative flex-shrink-0">
                    <img src={p.avatar} alt={p.username} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-950 ${p.isOnline ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white truncate">{p.username}</span>
                      {p.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      {p.role === 'moderator' && <Settings className="w-3 h-3 text-primary-400 flex-shrink-0" />}
                    </div>
                    <div className="flex gap-2 mt-0.5">
                      {p.videoEnabled ? (
                        <Video className="w-3 h-3 text-primary-400" />
                      ) : (
                        <VideoOff className="w-3 h-3 text-dark-600" />
                      )}
                      {p.audioEnabled ? (
                        <Volume2 className="w-3 h-3 text-primary-400" />
                      ) : (
                        <MicOff className="w-3 h-3 text-dark-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Room Info */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <h4 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3">Informações</h4>
              <div className="space-y-2 text-xs text-dark-400">
                <div className="flex justify-between">
                  <span>Categoria</span>
                  <span className="text-white">{room.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacidade</span>
                  <span className="text-white">{room.participants}/{room.max_users}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vídeo</span>
                  <span className={room.has_video ? 'text-emerald-400' : 'text-dark-600'}>{room.has_video ? 'Ativo' : 'Desativado'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dono</span>
                  <span className="text-primary-400">{room.owner.username}</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button className="w-full px-3 py-2 rounded-xl border border-white/5 text-xs text-dark-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 justify-center">
                <Share2 className="w-3.5 h-3.5" />
                Compartilhar Sala
              </button>
            </div>
          </div>
        </aside>

        {/* ─── Main Area: Video Grid + Controls ─── */}
        <main className={`flex-1 flex flex-col min-w-0 ${(showChat || showParticipants) ? 'hidden md:flex' : 'flex'}`}>
          {/* Video Grid */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
            <div className={`grid gap-3 h-full ${
              videoParticipants.length <= 1 ? 'grid-cols-1' :
              videoParticipants.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' :
              videoParticipants.length <= 4 ? 'grid-cols-2' :
              'grid-cols-2 lg:grid-cols-3'
            }`}>
              {videoParticipants.map((p) => (
                <div
                  key={p.id}
                  className="relative rounded-2xl border border-white/5 bg-dark-900 overflow-hidden group min-h-[120px] sm:min-h-[160px]"
                >
                  {p.videoEnabled ? (
                    <>
                      <img
                        src={p.avatar}
                        alt={p.username}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-dark-900">
                      <div className="text-center">
                        <img src={p.avatar} alt={p.username} className="w-16 h-16 rounded-full mx-auto border-2 border-white/10" />
                        <p className="text-sm text-dark-400 mt-2">{p.username}</p>
                      </div>
                    </div>
                  )}

                  {/* Username overlay */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    <span className="px-2 py-1 rounded-lg bg-black/60 text-xs font-medium text-white backdrop-blur-sm">
                      {p.username}
                    </span>
                    {!p.audioEnabled && (
                      <span className="p-1 rounded-lg bg-red-500/20 backdrop-blur-sm">
                        <MicOff className="w-3 h-3 text-red-400" />
                      </span>
                    )}
                  </div>

                  {/* Role badge */}
                  {p.role === 'owner' && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-400 backdrop-blur-sm flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Dono
                    </div>
                  )}
                </div>
              ))}

              {/* Your own video placeholder */}
              <div className="relative rounded-2xl border-2 border-primary/30 bg-dark-900 overflow-hidden min-h-[120px] sm:min-h-[160px]">
                <div className="w-full h-full flex items-center justify-center">
                  {isVideoOn ? (
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center mx-auto mb-2">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-sm text-dark-400">Sua câmera</p>
                      <p className="text-xs text-dark-600 mt-1">Modo demo — vídeo simulado</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-2 border border-white/10">
                        <VideoOff className="w-8 h-8 text-dark-500" />
                      </div>
                      <p className="text-sm text-dark-500">Câmera desligada</p>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 rounded-lg bg-primary/20 text-xs font-semibold text-primary-400 backdrop-blur-sm border border-primary/30">
                    Você
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Controls Bar ─── */}
          <div className="flex-shrink-0 border-t border-white/5 bg-dark-950/80 backdrop-blur-lg p-3 sm:p-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 sm:p-4 rounded-2xl transition-all ${
                  isMuted
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1]'
                }`}
                title={isMuted ? 'Ativar microfone' : 'Mutar microfone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-3 sm:p-4 rounded-2xl transition-all ${
                  !isVideoOn
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1]'
                }`}
                title={isVideoOn ? 'Desligar câmera' : 'Ligar câmera'}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <Link to="/rooms">
                <button className="p-3 sm:p-4 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg hover:shadow-red-500/25" title="Sair da sala">
                  <Phone className="w-5 h-5 rotate-[135deg]" />
                </button>
              </Link>

              <button className="p-3 sm:p-4 rounded-2xl bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1] transition-all" title="Reportar">
                <Flag className="w-5 h-5" />
              </button>

              <button className="hidden sm:block p-3 sm:p-4 rounded-2xl bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1] transition-all" title="Configurações">
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-[11px] text-dark-600 mt-2">
              💡 Modo demonstração — funcionalidades de vídeo em breve
            </p>
          </div>
        </main>

        {/* ─── Chat Sidebar ─── */}
        <aside className={`${showChat ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-l border-white/5 bg-dark-950/50 flex-shrink-0`}>
          {/* Chat header */}
          <div className="flex-shrink-0 p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary-400" />
              Chat da Sala
            </h3>
            <button
              onClick={() => setShowChat(false)}
              className="md:hidden p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* System message */}
            <div className="text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary-400">
                Você entrou na sala 🎉
              </span>
            </div>

            {messages.map((msg) => {
              const isMe = msg.userId === 'me'
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <img
                    src={msg.avatar}
                    alt={msg.username}
                    className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0 mt-0.5"
                  />
                  <div className={`flex-1 min-w-0 ${isMe ? 'text-right' : ''}`}>
                    <div className={`flex items-baseline gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-xs font-semibold ${isMe ? 'text-primary-400' : 'text-dark-300'}`}>
                        {msg.username}
                      </span>
                      <span className="text-[10px] text-dark-600">
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`inline-block px-3 py-2 rounded-2xl text-sm max-w-[85%] ${
                      isMe
                        ? 'bg-primary/20 text-primary-100 rounded-tr-sm'
                        : 'bg-white/[0.04] text-dark-200 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-600 transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  )
}
