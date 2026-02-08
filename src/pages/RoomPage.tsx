import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Video, VideoOff, Mic, MicOff, Phone, Users, MessageCircle,
  Send, Flag, Crown, Lock, Smile, Volume2, Coins,
  Share2, X, Info, Shield, AlertTriangle, Sparkles, Maximize, Minimize,
} from 'lucide-react'
import { mockRooms } from '@/data/mockRooms'
import { useToastStore } from '@/components/common/ToastContainer'
import { CreateCamaroteModal } from '@/components/rooms/CreateCamaroteModal'
import { useCamera } from '@/hooks/useCamera'
import { useVideoFilter } from '@/hooks/useVideoFilter'
import { CameraMasksButton, FILTER_CSS } from '@/components/camera/CameraMasks'

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

const ghostNames = ['lucas_bh', 'thais_rj', 'bruno_sp', 'camila_df', 'rodrigo_pr', 'juliana_ba', 'gustavo_rs', 'amanda_ce']
const autoMessages = [
  'Que legal essa sala! 😄', 'Boa noite pessoal! 🌙', 'Alguém mais de SP aqui?', 'Adoro esse tema!',
  'Kkkkkk muito bom', 'Voltei! Tava jantando 🍕', 'Primeira vez aqui, gostei!', 'Quem quer jogar depois?',
  'Saudades daqui ❤️', 'Tô adorando a vibe', 'Salve salve! 👋', 'Essa sala é top demais',
  'Bom demais conversar com vcs', 'Alguém conhece alguma sala de música?', 'Que conversa boa!',
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
  const cameraTileRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [tileSize, setTileSize] = useState({ w: 320, h: 240 })
  const videoModalRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToastStore()

  // ─── Interactive state for video modal ───
  const [showPrivateChat, setShowPrivateChat] = useState(false)
  const [privateChatMessages, setPrivateChatMessages] = useState<{ text: string; fromMe: boolean }[]>([])
  const [privateChatInput, setPrivateChatInput] = useState('')
  const [showGiftPicker, setShowGiftPicker] = useState(false)
  const [showFichasPicker, setShowFichasPicker] = useState(false)
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())
  const [showDenunciarConfirm, setShowDenunciarConfirm] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('normal')
  const [activeMask, setActiveMask] = useState<string | null>(null)
  const [beautySmooth, setBeautySmooth] = useState(false)
  const [beautyBrighten, setBeautyBrighten] = useState(false)
  const filterStyle = FILTER_CSS[activeFilter] || 'none'
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [onlineJitter] = useState(() => Math.floor(Math.random() * 5) - 2)

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
    activeMask: activeMaskData,
    activeMaskEmoji: _activeMaskEmoji,
    faceBox,
    enableFilter: enableMask,
    disableFilter: disableMask,
    trackingStatus,
  } = useVideoFilter(videoRef, stream)

  // Sync activeMask with video filter
  useEffect(() => {
    if (activeMask) enableMask(activeMask)
    else disableMask()
  }, [activeMask, enableMask, disableMask])

  // Try Supabase first, fall back to mock
  const [supaRoom, setSupaRoom] = useState<any>(null)
  const [, setRoomLoading] = useState(true)
  
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { supabase: sb } = await import('@/services/supabase/client')
        // Try by UUID first, then by slug
        let { data } = await sb.from('rooms').select('*').eq('id', roomId).single()
        if (!data) {
          const res = await sb.from('rooms').select('*').eq('slug', roomId).single()
          data = res.data
        }
        if (data) {
          setSupaRoom({
            id: data.id,
            name: data.name,
            description: data.description || '',
            category: data.category || 'cidade',
            theme: data.name,
            participants: data.current_participants || 0,
            max_users: data.max_participants || 30,
            is_private: false,
            tags: [],
            owner: { username: 'disque_amizade', avatar: '' },
          })
        }
      } catch { /* ignore */ }
      setRoomLoading(false)
    }
    fetchRoom()
  }, [roomId])

  const room = supaRoom || mockRooms.find((r) => r.id === roomId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => { stopCamera() }
  }, [stopCamera])

  // Track camera tile pixel size for emoji scaling
  useEffect(() => {
    const el = cameraTileRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setTileSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Reset modal sub-states when modal closes
  useEffect(() => {
    if (!showVideoModal) {
      setShowPrivateChat(false)
      setPrivateChatMessages([])
      setPrivateChatInput('')
      setShowGiftPicker(false)
      setShowFichasPicker(false)
      setShowDenunciarConfirm(false)
    }
  }, [showVideoModal])

  // ─── AUTO-GENERATED CHAT MESSAGES (every 30s) ───
  const addSystemMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`,
      userId: 'system',
      username: 'Sistema',
      avatar: '',
      content,
      timestamp: new Date(),
      type: 'system',
    }])
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const allUsers = [...mockParticipants.filter(p => p.isOnline), ...ghostNames.map(n => ({ username: n, avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`, id: n, isOnline: true, videoEnabled: false, audioEnabled: true, role: 'participant' as const, tier: 'free' as const }))]
      const user = allUsers[Math.floor(Math.random() * allUsers.length)]
      const content = autoMessages[Math.floor(Math.random() * autoMessages.length)]
      setMessages(prev => [...prev, {
        id: `auto-${Date.now()}`,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        content,
        timestamp: new Date(),
        type: 'text',
      }])
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // ─── SIMULATED USER JOINS (every 45s) ───
  useEffect(() => {
    const interval = setInterval(() => {
      const name = ghostNames[Math.floor(Math.random() * ghostNames.length)]
      addSystemMessage(`${name} entrou na sala 👋`)
    }, 45000)
    return () => clearInterval(interval)
  }, [addSystemMessage])

  // ─── TYPING INDICATOR (random) ───
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        const user = mockParticipants.filter(p => p.isOnline)[Math.floor(Math.random() * mockParticipants.filter(p => p.isOnline).length)]
        setTypingUser(user.username)
        setTimeout(() => setTypingUser(null), 3000)
      }
    }, 20000)
    return () => clearInterval(interval)
  }, [])

  // ─── FULLSCREEN CHANGE LISTENER ───
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

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

  // ─── VIDEO MODAL ACTIONS ───
  const handleSendGift = (emoji: string, username: string) => {
    addToast({ type: 'success', title: '🎁 Presente enviado!', message: `Você enviou ${emoji} para ${username}!` })
    addSystemMessage(`🎁 você enviou ${emoji} para ${username}!`)
    setShowGiftPicker(false)
  }

  const handleSendFichas = (amount: number, username: string) => {
    addToast({ type: 'success', title: '💰 Fichas enviadas!', message: `Você enviou ${amount} fichas para ${username}!` })
    setShowFichasPicker(false)
  }

  const handleToggleFollow = (userId: string, username: string) => {
    setFollowedUsers(prev => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
        addToast({ type: 'info', title: 'Deixou de seguir', message: `Você deixou de seguir ${username}` })
      } else {
        next.add(userId)
        addToast({ type: 'success', title: '✅ Seguindo!', message: `Você está seguindo ${username}` })
      }
      return next
    })
  }

  const handleDenunciar = (username: string) => {
    addToast({ type: 'warning', title: '🚩 Denúncia enviada', message: `Denúncia contra ${username} foi registrada. Obrigado.` })
    setShowDenunciarConfirm(false)
    setShowVideoModal(null)
  }

  const handleToggleFullscreen = () => {
    if (!videoModalRef.current) return
    if (!document.fullscreenElement) {
      videoModalRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  const handleSendPrivateChat = (_username: string) => {
    if (!privateChatInput.trim()) return
    setPrivateChatMessages(prev => [...prev, { text: privateChatInput, fromMe: true }])
    setPrivateChatInput('')
    // Simulate reply after 2s
    setTimeout(() => {
      const replies = ['Oi! 😊', 'Tudo bem?', 'Que legal!', 'Hahaha', 'Valeu! ❤️', 'Bora conversar!']
      setPrivateChatMessages(prev => [...prev, { text: replies[Math.floor(Math.random() * replies.length)], fromMe: false }])
    }, 2000)
  }

  const handleParticipantClick = (p: typeof mockParticipants[0]) => {
    if (p.videoEnabled) {
      setShowVideoModal(p.id)
    } else {
      addToast({ type: 'info', title: '📷 Sem câmera', message: `${p.username} está sem câmera` })
    }
  }

  const handleGoToProfile = (p: typeof mockParticipants[0]) => {
    navigate(`/profile/${p.id}`, { state: { fromRoom: roomId, participantData: p } })
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
  const displayOnline = Math.max(1, onlineParticipants.length + onlineJitter)

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
              <span className="text-xs text-emerald-400 font-semibold">{displayOnline} online</span>
            </div>
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
                <div
                  key={p.id}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                    p.videoEnabled ? 'hover:bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Avatar + Name → navigate to profile */}
                  <button
                    onClick={() => handleGoToProfile(p)}
                    className="relative flex-shrink-0 group"
                    title={`Ver perfil de ${p.username}`}
                  >
                    <img src={p.avatar} alt={p.username} className="w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-primary-500/50 transition-colors" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-950 ${p.isOnline ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleGoToProfile(p)}
                        className="text-sm font-medium text-white truncate hover:text-primary-400 transition-colors"
                        title={`Ver perfil de ${p.username}`}
                      >
                        {p.username}
                      </button>
                      {p.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      {p.role === 'moderator' && <Shield className="w-3 h-3 text-primary-400 flex-shrink-0" />}
                      {p.tier === 'premium' && <span className="text-[10px] text-amber-400">👑</span>}
                    </div>
                    <div className="flex gap-2 mt-0.5">
                      {p.videoEnabled ? (
                        <button onClick={() => handleParticipantClick(p)} title="Abrir câmera">
                          <Video className="w-3 h-3 text-primary-400 hover:text-primary-300 cursor-pointer" />
                        </button>
                      ) : (
                        <VideoOff className="w-3 h-3 text-dark-600" />
                      )}
                      {p.audioEnabled ? <Volume2 className="w-3 h-3 text-primary-400" /> : <MicOff className="w-3 h-3 text-dark-600" />}
                    </div>
                  </div>
                </div>
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
                  <button
                    onClick={() => addToast({ type: 'warning', title: '🚩 Denúncia', message: 'Denúncia da sala registrada. Obrigado.' })}
                    className="px-3 py-2 rounded-xl border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1.5"
                  >
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
              <div ref={cameraTileRef} className="relative rounded-2xl border-2 border-primary-500/40 bg-dark-900 overflow-hidden min-h-[120px] sm:min-h-[160px] shadow-[0_0_20px_rgba(139,92,246,0.15)]">
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
                    {activeMaskData && (
                      <>
                        {/* Tracking status */}
                        <div className="absolute top-2 left-2 z-20 pointer-events-none">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium backdrop-blur-sm ${
                            trackingStatus === 'tracking' ? 'bg-green-500/30 text-green-300' :
                            trackingStatus === 'loading' ? 'bg-yellow-500/30 text-yellow-300' :
                            trackingStatus === 'no-face' ? 'bg-red-500/30 text-red-300' :
                            'bg-white/20 text-white/60'
                          }`}>
                            {trackingStatus === 'tracking' ? '🎯 Tracking' :
                             trackingStatus === 'loading' ? '⏳ Carregando...' :
                             trackingStatus === 'no-face' ? '👤 Sem rosto' :
                             trackingStatus === 'fallback' ? '📍 Fixo' : ''}
                          </span>
                        </div>
                        {/* Mask overlay */}
                        {faceBox && activeMaskData.emoji && (
                          <span
                            className="absolute pointer-events-none z-10 select-none leading-none"
                            style={{
                              left: `${faceBox.x + faceBox.w / 2}%`,
                              top: `${faceBox.y + faceBox.h * 0.35}%`,
                              transform: 'translate(-50%, -50%)',
                              fontSize: `${Math.round(Math.max(tileSize.w * faceBox.w, tileSize.h * faceBox.h) / 100 * 1.15)}px`,
                              transition: 'left 130ms ease-out, top 130ms ease-out, font-size 200ms ease-out',
                            }}
                          >
                            {activeMaskData.emoji}
                          </span>
                        )}
                        {faceBox && activeMaskData.image && (
                          <img
                            src={activeMaskData.image}
                            alt={activeMaskData.name}
                            className="absolute pointer-events-none z-10 select-none object-contain"
                            style={{
                              mixBlendMode: (activeMaskData.blendMode || 'normal') as any,
                              left: `${faceBox.x + faceBox.w / 2}%`,
                              top: activeMaskData.imageType === 'eyes'
                                ? `${faceBox.y}%`
                                : `${faceBox.y + faceBox.h / 2}%`,
                              transform: 'translate(-50%, -50%)',
                              width: `${faceBox.w * (activeMaskData.imageType === 'eyes' ? 1.8 : 1.4)}%`,
                              transition: 'left 130ms ease-out, top 130ms ease-out, width 200ms ease-out',
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                ) : (
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

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Mask active indicator */}

                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 rounded-lg bg-primary-500/20 text-xs font-semibold text-primary-400 backdrop-blur-sm border border-primary-500/30">
                    Você
                  </span>
                </div>

                {isCameraOn && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-500/80 text-[10px] font-bold text-white backdrop-blur-sm animate-pulse">
                    LIVE
                  </div>
                )}

                <div className="absolute top-2 left-2 flex gap-1">
                  {isCameraOn && !isMicOn && (
                    <span className="p-1 rounded-lg bg-red-500/20 backdrop-blur-sm"><MicOff className="w-3 h-3 text-red-400" /></span>
                  )}
                </div>
              </div>

              {/* ═══ OTHER PARTICIPANTS ═══ */}
              {videoParticipants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setShowVideoModal(p.id)}
                  className="relative rounded-2xl border border-white/5 bg-dark-900 overflow-hidden group min-h-[120px] sm:min-h-[160px] text-left"
                >
                  <img src={p.avatar} alt={p.username} className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

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
              <CameraMasksButton activeFilter={activeFilter} onFilterChange={setActiveFilter} activeMask={activeMask} onMaskChange={setActiveMask} beautySmooth={beautySmooth} onBeautySmoothChange={setBeautySmooth} beautyBrighten={beautyBrighten} onBeautyBrightenChange={setBeautyBrighten} />
              <button 
                onClick={() => setShowCreateCamarote(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-elite-500/10 text-elite-400 border border-elite-500/20 hover:bg-elite-500/20 transition-all text-sm font-semibold" 
                title="Criar Camarote VIP"
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
              <button
                onClick={() => addToast({ type: 'warning', title: '🚩 Denúncia', message: 'Denúncia da sala registrada.' })}
                className="hidden sm:block p-3 rounded-2xl bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1] transition-all"
              >
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
                  <button
                    onClick={() => {
                      if (!isMe) {
                        const participant = mockParticipants.find(p => p.id === msg.userId)
                        if (participant) navigate(`/profile/${participant.id}`, { state: { fromRoom: roomId, participantData: participant } })
                      }
                    }}
                    className={`flex-shrink-0 mt-0.5 ${!isMe ? 'cursor-pointer group/avatar' : ''}`}
                  >
                    <img src={msg.avatar} alt="" className={`w-7 h-7 rounded-full object-cover border border-white/10 ${!isMe ? 'group-hover/avatar:border-primary-500/50 transition-colors' : ''}`} />
                  </button>
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

          {/* Typing indicator */}
          {typingUser && (
            <div className="flex-shrink-0 px-4 pb-1">
              <span className="text-xs text-dark-500 italic">{typingUser} está digitando<span className="animate-pulse">...</span></span>
            </div>
          )}

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
        const isFollowing = followedUsers.has(user.id)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowVideoModal(null)}>
            <div ref={videoModalRef} className="card w-full max-w-2xl animate-slide-up bg-dark-950 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Video expandido */}
              <div className="aspect-video bg-dark-900 rounded-t-2xl overflow-hidden relative">
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={handleToggleFullscreen}
                    className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-all"
                    title={isFullscreen ? 'Sair do fullscreen' : 'Tela cheia'}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                  <span className="px-2 py-0.5 rounded bg-red-500/80 text-[11px] font-bold text-white animate-pulse">LIVE</span>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <img src={user.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white/30" />
                  <div>
                    <span className="text-sm font-bold text-white block">{user.username}</span>
                    <span className="text-[10px] text-white/70">{user.role === 'owner' ? '👑 Dono da sala' : user.tier === 'premium' ? '⭐ Premium' : 'Participante'}</span>
                  </div>
                </div>
              </div>

              {/* Ações interativas */}
              <div className="p-4 space-y-3">
                {/* Barra de ações rápidas */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => { setShowPrivateChat(!showPrivateChat); setShowGiftPicker(false); setShowFichasPicker(false); setShowDenunciarConfirm(false) }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showPrivateChat ? 'bg-primary-500/30 border border-primary-500/50 text-primary-300' : 'bg-primary-500/15 border border-primary-500/25 text-primary-400 hover:bg-primary-500/25'}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat Privado
                  </button>
                  <button
                    onClick={() => { setShowGiftPicker(!showGiftPicker); setShowPrivateChat(false); setShowFichasPicker(false); setShowDenunciarConfirm(false) }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showGiftPicker ? 'bg-pink-500/30 border border-pink-500/50 text-pink-300' : 'bg-pink-500/15 border border-pink-500/25 text-pink-400 hover:bg-pink-500/25'}`}
                  >
                    🎁 Enviar Presente
                  </button>
                  <button
                    onClick={() => { setShowFichasPicker(!showFichasPicker); setShowPrivateChat(false); setShowGiftPicker(false); setShowDenunciarConfirm(false) }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showFichasPicker ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300' : 'bg-amber-500/15 border border-amber-500/25 text-amber-400 hover:bg-amber-500/25'}`}
                  >
                    <Coins className="w-4 h-4" />
                    Enviar Fichas
                  </button>
                  <button
                    onClick={() => handleToggleFollow(user.id, user.username)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isFollowing ? 'bg-emerald-500/30 border border-emerald-500/50 text-emerald-300' : 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25'}`}
                  >
                    <Users className="w-4 h-4" />
                    {isFollowing ? 'Seguindo ✓' : 'Seguir'}
                  </button>
                </div>

                {/* ─── Private Chat Panel ─── */}
                {showPrivateChat && (
                  <div className="rounded-xl bg-white/[0.02] border border-primary-500/20 p-3 space-y-2 animate-fade-in">
                    <p className="text-xs text-dark-400 font-semibold">💬 Chat privado com {user.username}</p>
                    <div className="max-h-32 overflow-y-auto space-y-1.5">
                      {privateChatMessages.length === 0 && (
                        <p className="text-xs text-dark-600 text-center py-2">Envie a primeira mensagem!</p>
                      )}
                      {privateChatMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
                          <span className={`inline-block px-3 py-1.5 rounded-xl text-xs max-w-[80%] ${m.fromMe ? 'bg-primary-500/20 text-primary-200' : 'bg-white/[0.06] text-dark-200'}`}>
                            {m.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSendPrivateChat(user.username) }} className="flex gap-2">
                      <input
                        type="text"
                        value={privateChatInput}
                        onChange={(e) => setPrivateChatInput(e.target.value)}
                        placeholder={`Mensagem para ${user.username}...`}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white placeholder-dark-500 text-xs focus:outline-none focus:border-primary-500/40 transition-all"
                      />
                      <button type="submit" disabled={!privateChatInput.trim()} className="p-2 rounded-lg bg-primary-500 text-white text-xs disabled:opacity-30">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}

                {/* ─── Gift Picker ─── */}
                {showGiftPicker && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-pink-500/5 border border-pink-500/20 animate-fade-in">
                    <span className="text-xs text-pink-400 font-semibold">Escolha:</span>
                    <div className="flex gap-2 flex-wrap">
                      {['🌹', '💎', '🍾', '🎵', '🔥', '❤️', '⭐', '🎉'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleSendGift(emoji, user.username)}
                          className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-pink-500/20 hover:scale-110 transition-all flex items-center justify-center text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Fichas Picker ─── */}
                {showFichasPicker && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 animate-fade-in">
                    <p className="text-xs text-amber-400 font-semibold mb-2">💰 Enviar fichas para {user.username}</p>
                    <div className="flex gap-2 flex-wrap">
                      {[5, 10, 25, 50].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => handleSendFichas(amount, user.username)}
                          className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-all"
                        >
                          {amount} 💰
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Denunciar Confirm ─── */}
                {showDenunciarConfirm && (
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 animate-fade-in">
                    <p className="text-xs text-red-400 mb-2">⚠️ Tem certeza que deseja denunciar <strong>{user.username}</strong>?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDenunciar(user.username)}
                        className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-all"
                      >
                        Confirmar Denúncia
                      </button>
                      <button
                        onClick={() => setShowDenunciarConfirm(false)}
                        className="px-4 py-2 rounded-lg bg-white/[0.06] text-dark-400 text-xs hover:text-white transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Presentes rápidos (always visible) */}
                {!showGiftPicker && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-dark-400">Presentes:</span>
                    <div className="flex gap-2">
                      {['🌹', '💎', '🍾', '🎵', '🔥', '❤️', '⭐', '🎉'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleSendGift(emoji, user.username)}
                          className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] hover:scale-110 transition-all flex items-center justify-center text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => { setShowDenunciarConfirm(true); setShowPrivateChat(false); setShowGiftPicker(false); setShowFichasPicker(false) }}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                  >
                    <Flag className="w-3 h-3" /> Denunciar
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/profile/${user.id}`, { state: { fromRoom: roomId, participantData: user } })}
                      className="px-4 py-2 rounded-xl bg-primary-500/15 border border-primary-500/25 text-sm text-primary-400 hover:bg-primary-500/25 transition-all flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" /> Ver Perfil
                    </button>
                    <button onClick={() => setShowVideoModal(null)} className="px-4 py-2 rounded-xl bg-white/[0.06] text-sm text-dark-300 hover:text-white hover:bg-white/[0.1] transition-all">
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      <CreateCamaroteModal
        isOpen={showCreateCamarote}
        onClose={() => setShowCreateCamarote(false)}
        isPremium={true}
        onConfirm={(data) => {
          addToast({ 
            type: 'success', 
            title: '🛋️ Camarote criado!', 
            message: `"${data.name}" está pronto. Até 6 pessoas!` 
          })
          setShowCreateCamarote(false)
        }}
      />
    </div>
  )
}
