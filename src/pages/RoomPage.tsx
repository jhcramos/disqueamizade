import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Video, VideoOff, Mic, MicOff, Phone, Users, MessageCircle,
  Send, Flag, Lock, Smile,
  Share2, X, Info, AlertTriangle, Sparkles,
} from 'lucide-react'
import { useToastStore } from '@/components/common/ToastContainer'
import { CreateCamaroteModal } from '@/components/rooms/CreateCamaroteModal'
import { useCamera } from '@/hooks/useCamera'
import { useVideoFilter } from '@/hooks/useVideoFilter'
import { useCompositeStream } from '@/hooks/useCompositeStream'
import { useAuthStore } from '@/store/authStore'
import { roomChat } from '@/services/supabase/roomChat'
import { webrtcRoom } from '@/services/webrtc/peer'
import { CameraMasksButton, FILTER_CSS } from '@/components/camera/CameraMasks'
import { BackgroundSelector, type BackgroundOption } from '@/components/rooms/BackgroundSelector'

// ─── Simulated Presence (cold-start bots to keep rooms alive) ───
const BOT_NAMES = ['ana_sp', 'joao_rj', 'maria_bh', 'pedro_cwb', 'carlos_poa', 'lucia_ssa', 'fernanda_rec', 'rafael_bsb']
const BOT_MESSAGES = [
  'Que legal essa sala! 😄', 'Boa noite pessoal! 🌙', 'Alguém mais de SP aqui?', 'Adoro esse tema!',
  'Kkkkkk muito bom', 'Primeira vez aqui, gostei!', 'Tô adorando a vibe', 'Salve salve! 👋',
  'Bom demais conversar com vcs', 'Que conversa boa!', 'Alguém quer jogar?', 'Voltei! 🍕',
]

// ─── Gradient colors for bot initials avatars ───
const AVATAR_GRADIENTS = [
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-red-500 to-pink-600',
  'from-indigo-500 to-blue-600',
  'from-lime-500 to-green-600',
]

function getAvatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

type ChatMessage = {
  id: string
  userId: string
  username: string
  content: string
  timestamp: Date
  type: 'text' | 'emoji' | 'system'
}

const InitialsAvatar = ({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) => {
  const gradient = getAvatarGradient(name)
  const letter = name.charAt(0).toUpperCase()
  const cls = size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs'
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {letter}
    </div>
  )
}

export const RoomPage = () => {
  const { roomId } = useParams()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'sys-0', userId: 'system', username: 'Sistema', content: 'Bem-vindo à sala! 🎉', timestamp: new Date(), type: 'system' },
  ])
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showCreateCamarote, setShowCreateCamarote] = useState(false)
  const [allMuted, setAllMuted] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ userId: string; username: string } | null>(null)
  const [privateChat, setPrivateChat] = useState<{ userId: string; username: string } | null>(null)
  const [privateMsgs, setPrivateMsgs] = useState<Map<string, ChatMessage[]>>(new Map())
  const [privateMsgInput, setPrivateMsgInput] = useState('')
  const privateChatEndRef = useRef<HTMLDivElement>(null)
  const cameraTileRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [, setTileSize] = useState({ w: 320, h: 240 })
  const { addToast } = useToastStore()

  const [activeFilter, setActiveFilter] = useState('normal')
  const [activeMask, setActiveMask] = useState<string | null>(null)
  const [beautySmooth, setBeautySmooth] = useState(false)
  const [beautyBrighten, setBeautyBrighten] = useState(false)
  const [selectedBg, setSelectedBg] = useState<string | null>(null)
  const [bgImage, setBgImage] = useState<string | null>(null)
  const filterStyle = FILTER_CSS[activeFilter] || 'none'

  const handleBgSelect = (bg: BackgroundOption) => {
    setSelectedBg(bg.id)
    setBgImage(bg.src)
  }
  const [botCount] = useState(() => 3 + Math.floor(Math.random() * 6))

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
    faceBox,
    enableFilter: enableMask,
    disableFilter: disableMask,
    trackingStatus,
  } = useVideoFilter(videoRef, stream)

  // Composite stream with effects for WebRTC
  const { compositeStream, canvasRef: _compositeCanvasRef } = useCompositeStream(videoRef, stream, filterStyle, activeMaskData?.emoji || null, faceBox, beautySmooth, beautyBrighten)
  const pipVideoRef = useRef<HTMLVideoElement>(null)

  // Show composite stream in local camera tile so preview matches what remote sees
  useEffect(() => {
    if (pipVideoRef.current && compositeStream) {
      pipVideoRef.current.srcObject = compositeStream
    }
  }, [compositeStream])

  useEffect(() => {
    if (activeMask) enableMask(activeMask)
    else disableMask()
  }, [activeMask, enableMask, disableMask])

  // Try Supabase first, fall back to mock
  const [supaRoom, setSupaRoom] = useState<any>(null)
  const [roomSlug, setRoomSlug] = useState<string>('')
  const [roomReady, setRoomReady] = useState(false)
  const [, setRoomLoading] = useState(true)

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { supabase: sb } = await import('@/services/supabase/client')
        let { data } = await sb.from('rooms').select('*').eq('id', roomId).single()
        if (!data) {
          const res = await sb.from('rooms').select('*').eq('slug', roomId).single()
          data = res.data
        }
        if (data) {
          // Always use slug as the canonical channel identifier
          setRoomSlug(data.slug || data.id)
          setSupaRoom({
            id: data.id,
            slug: data.slug,
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
      } catch {
        // Fallback: use roomId from URL as channel name
        setRoomSlug(roomId || '')
      }
      setRoomReady(true)
    }
    fetchRoom()
  }, [roomId])

  const room = supaRoom
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; username: string; joinedAt: number }[]>([])
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())

  // Join realtime room chat + presence — only after room data is fetched
  useEffect(() => {
    if (!roomReady || !roomSlug || !user) return

    const username = profile?.username || profile?.display_name || user.user_metadata?.username || 'Anônimo'

    roomChat.join(
      roomSlug,
      user.id,
      username,
      (msg) => {
        setMessages(prev => [...prev, msg])
      },
      (users) => {
        setOnlineUsers(users)
      },
    )

    return () => { roomChat.leave() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomReady, roomSlug, user?.id])

  // Join WebRTC room ONCE when camera is first available
  const webrtcJoinedRef = useRef(false)
  const webrtcRoomSlugRef = useRef('')

  useEffect(() => {
    if (!roomReady || !roomSlug || !user || isGuest || !stream) return
    // Only join once per room
    if (webrtcJoinedRef.current && webrtcRoomSlugRef.current === roomSlug) return

    webrtcJoinedRef.current = true
    webrtcRoomSlugRef.current = roomSlug

    webrtcRoom.join(roomSlug, user.id, stream, {
      onRemoteStream: (peerId, remoteStream) => {
        setRemoteStreams(prev => new Map(prev).set(peerId, remoteStream))
      },
      onPeerDisconnect: (peerId) => {
        setRemoteStreams(prev => {
          const next = new Map(prev)
          next.delete(peerId)
          return next
        })
        remoteVideoRefs.current.delete(peerId)
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomReady, roomSlug, user?.id, isGuest, stream])

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      webrtcRoom.leave()
      webrtcJoinedRef.current = false
    }
  }, [])

  // Update WebRTC tracks when stream changes
  useEffect(() => {
    if (stream && webrtcJoinedRef.current) webrtcRoom.updateStream(stream)
  }, [stream])

  // Attach remote streams to video elements
  useEffect(() => {
    for (const [peerId, remoteStream] of remoteStreams) {
      const el = remoteVideoRefs.current.get(peerId)
      if (el && el.srcObject !== remoteStream) {
        el.srcObject = remoteStream
      }
    }
  }, [remoteStreams])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => { stopCamera(); roomChat.leave(); webrtcRoom.leave() }
  }, [stopCamera])

  useEffect(() => {
    const el = cameraTileRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setTileSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ─── BOT CHAT MESSAGES (every 30-45s) ───
  useEffect(() => {
    const tick = () => {
      const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
      const content = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)]
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        userId: `bot-${botName}`,
        username: botName,
        content,
        timestamp: new Date(),
        type: 'text',
      }])
    }
    const schedule = () => setTimeout(() => { tick(); id = schedule() }, 30000 + Math.random() * 15000)
    let id = schedule()
    return () => clearTimeout(id)
  }, [])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const username = profile?.username || profile?.display_name || user?.user_metadata?.username || 'Anônimo'
    const userId = user?.id || 'guest'

    // Send via realtime (others will receive via broadcast)
    roomChat.sendMessage(userId, username, message.trim())

    // Add to own messages locally (broadcast doesn't echo back to sender)
    const newMsg: ChatMessage = {
      id: `m${Date.now()}`,
      userId,
      username,
      content: message.trim(),
      timestamp: new Date(),
      type: 'text',
    }
    setMessages(prev => [...prev, newMsg])
    setMessage('')
  }

  // Toggle mute all remote videos
  const handleMuteAll = () => {
    setAllMuted(prev => !prev)
  }

  // Send private message
  const handleSendPrivateMsg = (e: React.FormEvent) => {
    e.preventDefault()
    if (!privateMsgInput.trim() || !privateChat) return

    const myUsername = profile?.username || user?.user_metadata?.username || 'Anônimo'
    const myId = user?.id || 'guest'

    // Send via room broadcast with private flag
    roomChat.sendMessage(myId, myUsername, `[DM:${privateChat.userId}] ${privateMsgInput.trim()}`)

    const msg: ChatMessage = {
      id: `pm-${Date.now()}`,
      userId: myId,
      username: myUsername,
      content: privateMsgInput.trim(),
      timestamp: new Date(),
      type: 'text',
    }
    setPrivateMsgs(prev => {
      const next = new Map(prev)
      const existing = next.get(privateChat.userId) || []
      next.set(privateChat.userId, [...existing, msg])
      return next
    })
    setPrivateMsgInput('')
  }

  // Handle user click (from chat or participants)
  const handleUserClick = (userId: string, username: string) => {
    if (userId === user?.id || userId === 'system' || userId.startsWith('bot-')) return
    setSelectedUser({ userId, username })
  }

  const handleShareRoom = () => {
    navigator.clipboard?.writeText(window.location.href)
    addToast({ type: 'success', title: 'Link copiado!', message: 'Link da sala copiado para a área de transferência' })
  }

  const handleToggleVideo = () => {
    if (!stream && !isCameraOn) startCamera()
    else toggleCamera()
  }

  const handleToggleMic = () => {
    if (!stream) startCamera()
    else toggleMic()
  }

  if (!roomReady) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center">
        <div className="text-dark-400 text-lg">Entrando na sala...</div>
      </div>
    )
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
              <span className="text-xs text-emerald-400 font-semibold">{onlineUsers.length || (botCount + 1)} online</span>
              {/* Debug - remove later */}
              <span className="text-[9px] text-dark-600 ml-1">ch:{roomSlug?.slice(0,8)} {isGuest ? 'G' : 'U'}</span>
            </div>
            <button onClick={() => setShowInfoPanel(!showInfoPanel)} className={`p-2 rounded-xl transition-all ${showInfoPanel ? 'bg-primary-500/20 text-primary-400' : 'text-dark-400 hover:text-white hover:bg-white/5'}`}>
              <Info className="w-5 h-5" />
            </button>
            {/* Mobile toggle buttons moved to bottom tab bar */}
          </div>
        </div>
      </header>

      {isGuest && (
        <div className="flex-shrink-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400">Crie uma conta para participar do chat e vídeo</p>
        </div>
      )}

      {permissionState === 'denied' && (
        <div className="flex-shrink-0 bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{cameraError || 'Câmera bloqueada. Habilite nas configurações do navegador.'}</p>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Participants Sidebar ─── */}
        <aside className={`${showParticipants ? 'block' : 'hidden'} md:block w-full md:w-60 lg:w-64 border-r border-white/5 bg-dark-950/50 overflow-y-auto flex-shrink-0`}>
          <div className="p-4">
            <h3 className="text-sm font-bold text-primary-400 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participantes ({onlineUsers.length || (botCount + 1)})
            </h3>
            <div className="space-y-1">
              {/* Real online users from Realtime Presence */}
              {onlineUsers.length > 0 ? (
                onlineUsers.map((u) => {
                  const isMe = u.userId === user?.id
                  return (
                    <div key={u.userId} className={`w-full flex items-center gap-3 p-2.5 rounded-xl ${isMe ? 'bg-primary-500/5 border border-primary-500/10' : 'hover:bg-white/[0.03]'} transition-colors`}>
                      <InitialsAvatar name={u.username} size="md" />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${isMe ? 'text-primary-400' : 'text-white'} truncate block`}>
                          {isMe ? `${u.username} (você)` : <span className="cursor-pointer hover:text-primary-400 transition-colors" onClick={() => handleUserClick(u.userId, u.username)}>{u.username}</span>}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <>
                  {/* Fallback: You + bots when no realtime users */}
                  <div className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-primary-500/5 border border-primary-500/10">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                      V
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-primary-400">Você</span>
                      <div className="flex gap-2 mt-0.5">
                        {isCameraOn ? <Video className="w-3 h-3 text-primary-400" /> : <VideoOff className="w-3 h-3 text-dark-600" />}
                        {isMicOn ? <Mic className="w-3 h-3 text-primary-400" /> : <MicOff className="w-3 h-3 text-dark-600" />}
                      </div>
                    </div>
                  </div>
                  {BOT_NAMES.slice(0, botCount).map((name) => (
                    <div key={name} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                      <InitialsAvatar name={name} size="md" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white truncate block">{name}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
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

        {/* ─── Main Area: Video ─── */}
        <main className={`flex-1 flex flex-col min-w-0 ${(showChat || showParticipants) ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
            <div className={`grid gap-3 h-full max-w-4xl mx-auto ${remoteStreams.size > 0 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-2xl'}`}>
              {/* ═══ YOUR REAL CAMERA TILE ═══ */}
              <div ref={cameraTileRef} className="relative rounded-2xl border-2 border-primary-500/40 bg-dark-900 overflow-hidden min-h-[200px] sm:min-h-[300px] shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                {/* Virtual Background Layer */}
                {bgImage && bgImage !== 'blur' && isCameraOn && (
                  <img src={bgImage} alt="Background" className="absolute inset-0 w-full h-full object-cover z-0" />
                )}
                {bgImage === 'blur' && isCameraOn && (
                  <div className="absolute inset-0 z-0 backdrop-blur-xl bg-dark-800/50" />
                )}

                {isCameraOn && stream ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`absolute inset-0 w-full h-full object-cover ${bgImage && bgImage !== 'blur' ? 'z-10 mix-blend-normal' : ''}`}
                      style={{
                        filter: [
                          filterStyle !== 'none' ? filterStyle : '',
                          beautySmooth ? 'blur(0.5px) contrast(1.05)' : '',
                          beautyBrighten ? 'brightness(1.15) saturate(1.05)' : '',
                        ].filter(Boolean).join(' ') || 'none',
                      }}
                    />
                    {activeMaskData && trackingStatus && (
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
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        isCameraOn ? 'bg-gradient-to-br from-primary-500 to-primary-700' : 'bg-dark-800 border border-white/10'
                      }`}>
                        {isCameraOn ? <Video className="w-7 h-7 text-white" /> : <VideoOff className="w-7 h-7 text-dark-500" />}
                      </div>
                      <p className="text-sm text-dark-400">{permissionState === 'denied' ? 'Câmera bloqueada' : 'Câmera desligada'}</p>
                      {!isCameraOn && permissionState !== 'denied' && (
                        <button onClick={() => startCamera()} className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-all">
                          Ligar Câmera
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

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

              {/* ═══ REMOTE VIDEO TILES ═══ */}
              {Array.from(remoteStreams.entries()).map(([peerId, _remoteStream]) => {
                const peerUser = onlineUsers.find(u => u.userId === peerId)
                const peerName = peerUser?.username || 'Usuário'
                return (
                  <div key={peerId} className="relative rounded-2xl border-2 border-emerald-500/40 bg-dark-900 overflow-hidden min-h-[200px] sm:min-h-[300px] shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-pointer" onClick={() => handleUserClick(peerId, peerName)}>
                    <video
                      ref={(el) => {
                        if (el) {
                          remoteVideoRefs.current.set(peerId, el)
                          if (el.srcObject !== _remoteStream) el.srcObject = _remoteStream
                          el.muted = allMuted
                        }
                      }}
                      autoPlay
                      playsInline
                      muted={allMuted}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-xs font-semibold text-emerald-400 backdrop-blur-sm border border-emerald-500/30">
                        {peerName}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500/80 text-[10px] font-bold text-white backdrop-blur-sm animate-pulse">
                      LIVE
                    </div>
                    {allMuted && (
                      <div className="absolute top-2 left-2 p-1 rounded bg-red-500/30 backdrop-blur-sm">
                        <MicOff className="w-3 h-3 text-red-400" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex-shrink-0 border-t border-white/5 bg-dark-950/80 backdrop-blur-lg p-3 sm:p-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={handleToggleMic}
                disabled={isGuest}
                className={`p-3 rounded-2xl transition-all ${isGuest ? 'opacity-40 cursor-not-allowed' : ''} ${!isMicOn ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1]'}`}
                title={isGuest ? 'Crie uma conta para usar o microfone' : isMicOn ? 'Desligar microfone' : 'Ligar microfone'}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={handleToggleVideo}
                disabled={isGuest}
                className={`p-3 rounded-2xl transition-all ${isGuest ? 'opacity-40 cursor-not-allowed' : ''} ${!isCameraOn ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1]'}`}
                title={isGuest ? 'Crie uma conta para usar a câmera' : isCameraOn ? 'Desligar câmera' : 'Ligar câmera'}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              {remoteStreams.size > 0 && (
                <button
                  onClick={handleMuteAll}
                  className={`p-3 rounded-2xl transition-all ${allMuted ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1]'}`}
                  title={allMuted ? 'Desmutar todos' : 'Mutar todos'}
                >
                  {allMuted ? <MicOff className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </button>
              )}
              <CameraMasksButton activeFilter={activeFilter} onFilterChange={setActiveFilter} activeMask={activeMask} onMaskChange={setActiveMask} beautySmooth={beautySmooth} onBeautySmoothChange={setBeautySmooth} beautyBrighten={beautyBrighten} onBeautyBrightenChange={setBeautyBrighten} />
              <BackgroundSelector selectedBg={selectedBg} onSelect={handleBgSelect} compact />
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

          {/* ─── Mobile Bottom Tab Bar ─── */}
          <nav className="md:hidden flex-shrink-0 border-t border-white/5 bg-dark-950/95 backdrop-blur-lg">
            <div className="flex">
              <button
                onClick={() => { setShowChat(false); setShowParticipants(false) }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[56px] transition-all ${
                  !showChat && !showParticipants
                    ? 'text-primary-400 border-t-2 border-primary-500 -mt-px'
                    : 'text-dark-500'
                }`}
              >
                <Video className="w-5 h-5" />
                <span className="text-[11px] font-medium">Vídeo</span>
              </button>
              <button
                onClick={() => { setShowParticipants(true); setShowChat(false) }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[56px] transition-all ${
                  showParticipants
                    ? 'text-primary-400 border-t-2 border-primary-500 -mt-px'
                    : 'text-dark-500'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[11px] font-medium">Pessoas ({onlineUsers.length || botCount + 1})</span>
              </button>
              <button
                onClick={() => { setShowChat(true); setShowParticipants(false) }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[56px] transition-all ${
                  showChat
                    ? 'text-primary-400 border-t-2 border-primary-500 -mt-px'
                    : 'text-dark-500'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-[11px] font-medium">Chat</span>
              </button>
            </div>
          </nav>
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
                  <div className="flex-shrink-0 mt-0.5">
                    {isMe ? (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-white text-xs">V</div>
                    ) : (
                      <InitialsAvatar name={msg.username} />
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 ${isMe ? 'text-right' : ''}`}>
                    <div className={`flex items-baseline gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-xs font-semibold cursor-pointer hover:underline ${isMe ? 'text-primary-400' : 'text-dark-300 hover:text-white'}`} onClick={() => handleUserClick(msg.userId, msg.username)}>{msg.username}</span>
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
                placeholder={isGuest ? "Crie uma conta para enviar mensagens" : "Digite sua mensagem..."}
                disabled={isGuest}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button type="submit" disabled={!message.trim() || isGuest} className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </aside>
      </div>

      <CreateCamaroteModal
        isOpen={showCreateCamarote}
        onClose={() => setShowCreateCamarote(false)}
        isPremium={true}
        onConfirm={(data) => {
          addToast({ type: 'success', title: '🛋️ Camarote criado!', message: `"${data.name}" está pronto. Até 6 pessoas!` })
          setShowCreateCamarote(false)
        }}
      />

      {/* ═══ USER PROFILE MODAL ═══ */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="bg-dark-900 border border-white/10 rounded-2xl w-full max-w-sm mx-4 overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
            {/* Video grande do usuário */}
            {remoteStreams.has(selectedUser.userId) ? (
              <div className="relative aspect-video bg-dark-800">
                <video
                  ref={(el) => {
                    if (el) {
                      const s = remoteStreams.get(selectedUser.userId)
                      if (s && el.srcObject !== s) el.srcObject = s
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500/80 text-[10px] font-bold text-white animate-pulse">LIVE</div>
              </div>
            ) : (
              <div className="aspect-video bg-dark-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-2xl mx-auto mb-2">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-dark-400">Câmera não disponível</p>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-white mb-1">{selectedUser.username}</h3>
              <p className="text-xs text-dark-500 mb-4">Na sala agora</p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPrivateChat(selectedUser)
                    setSelectedUser(null)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary-500/20 text-primary-400 border border-primary-500/30 text-sm font-semibold hover:bg-primary-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Chat Privado
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-dark-300 border border-white/10 text-sm hover:bg-white/[0.1] transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PRIVATE CHAT OVERLAY (bottom-right) ═══ */}
      {privateChat && (
        <div className="fixed bottom-20 right-4 z-40 w-72 sm:w-80 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col" style={{ maxHeight: '350px' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/5 bg-dark-800/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-[10px]">
                {privateChat.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-white">{privateChat.username}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <button onClick={() => setPrivateChat(null)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-dark-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[120px]">
            {!(privateMsgs.get(privateChat.userId)?.length) && (
              <p className="text-center text-xs text-dark-500 py-4">Envie uma mensagem para {privateChat.username}</p>
            )}
            {(privateMsgs.get(privateChat.userId) || []).map(msg => {
              const isMe = msg.userId === user?.id
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    isMe ? 'bg-primary-500/20 text-primary-100 rounded-br-sm' : 'bg-white/[0.05] text-dark-200 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              )
            })}
            <div ref={privateChatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendPrivateMsg} className="p-2 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={privateMsgInput}
              onChange={e => setPrivateMsgInput(e.target.value)}
              placeholder="Mensagem privada..."
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-dark-500 text-xs focus:outline-none focus:border-primary-500/40"
              autoFocus
            />
            <button type="submit" className="p-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all">
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
