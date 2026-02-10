import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
import { supabase } from '@/services/supabase/client'

// ─── Simulated Presence (cold-start bots to keep rooms alive) ───
const BOT_POOL = [
  'gabizinha_22', 'thiago.m', 'bruninha💜', 'duda_carioca', 'leoferreira', 'juh.santos',
  'marquinhos_zl', 'carol.vibes', 'ricardooo', 'natyyy_', 'felipão92', 'isa.morena',
  'andrelucas', 'amandinha.s', 'diegomv', 'pris.costa', 'rapha_top', 'luaninha',
  'gustavotm', 'milena.rj', 'kadu_oficial', 'tata.love', 'dudusilva87', 'larissaf',
  'biel_mc', 'camis_art', 'paulohenriq', 'fer.oliveira', 'viniciusrp', 'manuzinha_',
  'renatobh', 'ju.morais', 'rafa.luna', 'taynaraa', 'brunolimaa', 'livia_dz',
]
// Pick a random subset each session so participants vary
function pickBotNames(count: number): string[] {
  const shuffled = [...BOT_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
const BOT_MESSAGES = [
  'Que legal essa sala! 😄', 'Boa noite pessoal! 🌙', 'Alguém mais de SP aqui?', 'Adoro esse tema!',
  'Kkkkkk muito bom', 'Primeira vez aqui, gostei!', 'Tô adorando a vibe', 'Salve salve! 👋',
  'Bom demais conversar com vcs', 'Que conversa boa!', 'Alguém quer jogar?', 'Voltei! 🍕',
  'Eita que sala boa 🔥', 'Tô aqui de novo kk', 'Manda mais', 'Quem é daqui?',
  'Gente bonita demais nessa sala', 'Aff saudade daqui', 'Olá mundo 🌎', 'Bora papo!',
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

const InitialsAvatar = ({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const gradient = getAvatarGradient(name)
  const letter = name.charAt(0).toUpperCase()
  const cls = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs'
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {letter}
    </div>
  )
}

export const RoomPage = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'sys-0', userId: 'system', username: 'Sistema', content: 'Bem-vindo à sala! 🎉', timestamp: new Date(), type: 'system' },
  ])
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showCreateCamarote, setShowCreateCamarote] = useState(false)
  const [allMuted, setAllMuted] = useState(false)
  const [camarotes, setCamarotes] = useState<{ name: string; memberCount: number }[]>([])
  const [featuredPeer, setFeaturedPeer] = useState<string | null>(null)
  const [forceMuted, setForceMuted] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ userId: string; username: string; bio?: string; avatar_url?: string } | null>(null)
  const [privateChat, setPrivateChat] = useState<{ userId: string; username: string } | null>(null)
  const [privateMsgs, setPrivateMsgs] = useState<Map<string, ChatMessage[]>>(new Map())
  const [privateMsgInput, setPrivateMsgInput] = useState('')
  const privateChatEndRef = useRef<HTMLDivElement>(null)

  // ─── 1-on-1 Video Call ───
  const [oneOnOneCall, setOneOnOneCall] = useState<{ userId: string; username: string; status: 'inviting' | 'active' } | null>(null)
  const [incomingCall, setIncomingCall] = useState<{ userId: string; username: string } | null>(null)
  const [oneOnOneMsgs, setOneOnOneMsgs] = useState<ChatMessage[]>([])
  const [oneOnOneMsgInput, setOneOnOneMsgInput] = useState('')
  const oneOnOneChatEndRef = useRef<HTMLDivElement>(null)
  const [pipPos, setPipPos] = useState({ x: 16, y: 16 })
  const [pipDragging, setPipDragging] = useState(false)
  const pipDragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 })
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
  const [botCount] = useState(() => 5 + Math.floor(Math.random() * 10))
  const [botNames] = useState(() => pickBotNames(botCount))

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
  // roomLoading removed — using roomReady instead

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const sb = supabase
        // Try slug first, then by UUID id
        let data = null
        const slugRes = await sb.from('rooms').select('*').eq('slug', roomId).maybeSingle()
        data = slugRes.data
        if (!data) {
          const idRes = await sb.from('rooms').select('*').eq('id', roomId).maybeSingle()
          data = idRes.data
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

  // ─── Rei da Sala (Room King) ───
  const kingUserId = onlineUsers.length > 0
    ? onlineUsers.reduce((oldest, u) => u.joinedAt < oldest.joinedAt ? u : oldest).userId
    : null
  const isKing = kingUserId === user?.id

  // ─── Moderador (2nd longest in room) ───
  const modUserId = onlineUsers.length > 1
    ? onlineUsers.filter(u => u.userId !== kingUserId).reduce((oldest, u) => u.joinedAt < oldest.joinedAt ? u : oldest).userId
    : null
  const isMod = modUserId === user?.id

  // ─── VIP / Paid User System ───
  const VIP_USER_IDS = new Set<string>([]) // Hardcoded VIP list (add user IDs here)
  const isVip = (userId: string) => {
    if (VIP_USER_IDS.has(userId)) return true
    // Check if user is the room creator or has is_creator metadata
    const u = onlineUsers.find(ou => ou.userId === userId)
    if (u && (u as any).is_creator) return true
    return false
  }

  // Listen for mute commands via broadcast
  useEffect(() => {
    if (!roomReady || !roomSlug || !user) return
    const setupMuteListener = async () => {
      const sb = supabase
      const channel = sb.channel(`mute-${roomSlug}`)
      channel
        .on('broadcast', { event: 'mute-user' }, (payload: any) => {
          if (payload.payload?.targetUserId === user.id) {
            setForceMuted(payload.payload?.muted ?? true)
          }
        })
        .on('broadcast', { event: 'ban-user' }, (payload: any) => {
          if (payload.payload?.targetUserId === user.id) {
            addToast({ type: 'error', title: '🚫 Banido', message: 'Você foi removido da sala pelo moderador' })
            navigate('/rooms')
          }
        })
        .on('broadcast', { event: 'mute-all' }, (payload: any) => {
          // Don't mute the king
          if (user.id !== kingUserId) {
            setForceMuted(payload.payload?.muted ?? true)
          }
        })
        .subscribe()
      return channel
    }
    let channelRef: any = null
    setupMuteListener().then(ch => { channelRef = ch })
    return () => { if (channelRef) channelRef.unsubscribe() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomReady, roomSlug, user?.id, kingUserId])

  // Apply force mute to local mic
  useEffect(() => {
    if (!stream) return
    const audioTracks = stream.getAudioTracks()
    if (forceMuted) {
      audioTracks.forEach(t => { t.enabled = false })
    }
  }, [forceMuted, stream])

  const sendMuteCommand = async (targetUserId: string, muted: boolean) => {
    const sb = supabase
    const channel = sb.channel(`mute-${roomSlug}`)
    await channel.subscribe()
    await channel.send({ type: 'broadcast', event: 'mute-user', payload: { targetUserId, muted } })
    channel.unsubscribe()
  }

  const sendMuteAll = async (muted: boolean) => {
    const sb = supabase
    const channel = sb.channel(`mute-${roomSlug}`)
    await channel.subscribe()
    await channel.send({ type: 'broadcast', event: 'mute-all', payload: { muted } })
    channel.unsubscribe()
  }

  const sendBanUser = async (targetUserId: string) => {
    const sb = supabase
    const channel = sb.channel(`mute-${roomSlug}`)
    await channel.subscribe()
    await channel.send({ type: 'broadcast', event: 'ban-user', payload: { targetUserId } })
    channel.unsubscribe()
    addToast({ type: 'success', title: '🚫 Usuário banido', message: 'O usuário foi removido da sala' })
  }

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
      const botName = BOT_POOL[Math.floor(Math.random() * BOT_POOL.length)]
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
  const handleUserClick = async (userId: string, username: string) => {
    if (userId === user?.id || userId === 'system' || userId.startsWith('bot-') || userId.startsWith('sim-')) return
    setSelectedUser({ userId, username })
    // Fetch profile with bio
    try {
      const sb = supabase
      const { data } = await sb.from('profiles').select('bio, avatar_url').eq('id', userId).single()
      if (data) {
        setSelectedUser(prev => prev?.userId === userId ? { ...prev, bio: data.bio || undefined, avatar_url: data.avatar_url || undefined } : prev)
      }
    } catch { /* ignore */ }
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

  // ─── 1-on-1 Call Handlers ───
  const handleInviteOneOnOne = (targetUser: { userId: string; username: string }) => {
    setSelectedUser(null)
    setOneOnOneCall({ ...targetUser, status: 'inviting' })
    addToast({ type: 'info', title: '📞 Chamando...', message: `Convidando ${targetUser.username} para 1:1` })
    // Simulate bot acceptance after 2-4s
    if (targetUser.userId.startsWith('sim-') || targetUser.userId.startsWith('bot-')) {
      const delay = 2000 + Math.random() * 2000
      setTimeout(() => {
        setOneOnOneCall(prev => prev?.userId === targetUser.userId ? { ...prev, status: 'active' } : prev)
        addToast({ type: 'success', title: '✅ Conectado!', message: `${targetUser.username} aceitou o 1:1` })
      }, delay)
    }
  }

  const handleAcceptCall = () => {
    if (!incomingCall) return
    setOneOnOneCall({ ...incomingCall, status: 'active' })
    setIncomingCall(null)
    addToast({ type: 'success', title: '✅ Conectado!', message: `Você entrou em 1:1 com ${incomingCall.username}` })
  }

  const handleEndCall = () => {
    if (oneOnOneCall) {
      addToast({ type: 'info', title: '📞 Encerrado', message: `Chamada com ${oneOnOneCall.username} encerrada` })
    }
    setOneOnOneCall(null)
    setOneOnOneMsgs([])
    setOneOnOneMsgInput('')
  }

  const handleSendOneOnOneMsg = (e: React.FormEvent) => {
    e.preventDefault()
    if (!oneOnOneMsgInput.trim() || !oneOnOneCall) return
    const newMsg: ChatMessage = {
      id: `1on1-${Date.now()}`,
      userId: user?.id || 'you',
      username: 'Você',
      content: oneOnOneMsgInput.trim(),
      timestamp: new Date(),
      type: 'text',
    }
    setOneOnOneMsgs(prev => [...prev, newMsg])
    setOneOnOneMsgInput('')
    // Bot auto-reply
    if (oneOnOneCall.userId.startsWith('sim-') || oneOnOneCall.userId.startsWith('bot-')) {
      const replies = ['Haha legal! 😄', 'Concordo!', 'Me conta mais', 'Que massa 🔥', 'Sério? kkkk', 'Tô curtindo conversar com vc', 'Hmm interessante...', 'Boa! 👏']
      setTimeout(() => {
        setOneOnOneMsgs(prev => [...prev, {
          id: `1on1-bot-${Date.now()}`,
          userId: oneOnOneCall!.userId,
          username: oneOnOneCall!.username,
          content: replies[Math.floor(Math.random() * replies.length)],
          timestamp: new Date(),
          type: 'text',
        }])
      }, 1000 + Math.random() * 2000)
    }
    setTimeout(() => oneOnOneChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  // PiP drag handlers
  const handlePipMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setPipDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    pipDragStart.current = { x: clientX, y: clientY, startX: pipPos.x, startY: pipPos.y }
  }

  useEffect(() => {
    if (!pipDragging) return
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const dx = clientX - pipDragStart.current.x
      const dy = clientY - pipDragStart.current.y
      setPipPos({
        x: Math.max(0, Math.min(window.innerWidth - 160, pipDragStart.current.startX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 120, pipDragStart.current.startY + dy)),
      })
    }
    const handleUp = () => setPipDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [pipDragging])

  // Simulate incoming call from bots occasionally
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!oneOnOneCall && !incomingCall && Math.random() < 0.3) {
        const caller = botNames[Math.floor(Math.random() * botNames.length)]
        setIncomingCall({ userId: `sim-${caller}`, username: caller })
      }
    }, 15000 + Math.random() * 30000)
    return () => clearTimeout(timer)
  }, [oneOnOneCall, incomingCall, botNames])

  const capacityPercent = Math.round((room.participants / room.max_users) * 100)

  // DEBUG: find error #310 — which value is an object?
  console.log('🔍 RoomPage render debug:', {
    roomName: typeof room.name, roomDesc: typeof room.description,
    roomCategory: typeof room.category, roomTheme: typeof room.theme,
    ownerUsername: typeof room.owner?.username,
    participants: typeof room.participants, maxUsers: typeof room.max_users,
    capacityPercent: typeof capacityPercent,
    roomSlug: typeof roomSlug, isGuest: typeof isGuest,
    cameraError: typeof cameraError, permissionState: typeof permissionState,
    trackingStatus: typeof trackingStatus,
    msgCount: messages.length,
    onlineCount: onlineUsers.length,
    user: typeof user, profile: typeof profile,
  })

  // Check messages for object values
  for (const msg of messages) {
    if (typeof msg.content !== 'string') console.error('🔴 msg.content is not string:', msg.id, msg.content)
    if (typeof msg.username !== 'string') console.error('🔴 msg.username is not string:', msg.id, msg.username)
    if (!(msg.timestamp instanceof Date)) console.error('🔴 msg.timestamp is not Date:', msg.id, msg.timestamp)
  }

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
              {/* Real online users from Realtime Presence (sorted: King → Mod → VIP → Regular) */}
              {onlineUsers.length > 0 ? (
                [...onlineUsers].sort((a, b) => {
                  if (a.userId === kingUserId) return -1
                  if (b.userId === kingUserId) return 1
                  if (a.userId === modUserId) return -1
                  if (b.userId === modUserId) return 1
                  const aVip = isVip(a.userId)
                  const bVip = isVip(b.userId)
                  if (aVip && !bVip) return -1
                  if (!aVip && bVip) return 1
                  return a.joinedAt - b.joinedAt
                }).map((u) => {
                  const isMe = u.userId === user?.id
                  const isUserKing = u.userId === kingUserId
                  const isUserMod = u.userId === modUserId
                  const isUserVip = isVip(u.userId)
                  return (
                    <div key={u.userId} className={`w-full flex items-center gap-3 p-2.5 rounded-xl ${isMe ? 'bg-primary-500/5 border border-primary-500/10' : 'hover:bg-white/[0.03]'} transition-colors`}>
                      <InitialsAvatar name={u.username} size="md" />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${isMe ? 'text-primary-400' : 'text-white'} truncate flex items-center gap-1.5`}>
                          {isUserKing && '👑 '}
                          {isUserMod && !isUserKing && '🛡️ '}
                          {isMe ? `${u.username} (você)` : <span className="cursor-pointer hover:text-primary-400 transition-colors" onClick={() => handleUserClick(u.userId, u.username)}>{u.username}</span>}
                          {isUserVip && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">✨ VIP</span>
                          )}
                        </span>
                        {isUserKing && <span className="text-[10px] text-amber-400 font-medium">Rei da Sala</span>}
                        {isUserMod && !isUserKing && <span className="text-[10px] text-blue-400 font-medium">Moderador</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {isKing && !isMe && (
                          <button
                            onClick={() => sendMuteCommand(u.userId, true)}
                            className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title={`Mutar ${u.username}`}
                          >
                            <MicOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isMod && !isMe && !isUserKing && !isUserVip && (
                          <button
                            onClick={() => sendBanUser(u.userId)}
                            className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title={`Banir ${u.username}`}
                          >
                            🚫
                          </button>
                        )}
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
                  {botNames.map((name) => (
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

            {/* King Controls */}
            {isKing && onlineUsers.length > 1 && (
              <div className="mt-4">
                <button
                  onClick={() => sendMuteAll(true)}
                  className="w-full px-3 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <MicOff className="w-3.5 h-3.5" /> 👑 Mutar Todos
                </button>
              </div>
            )}

            {/* Camarotes Section */}
            {camarotes.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/5">
                <h4 className="text-sm font-bold text-elite-400 mb-3 flex items-center gap-2">
                  🛋️ Camarotes ({camarotes.length})
                </h4>
                <div className="space-y-1.5">
                  {camarotes.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-elite-500/5 border border-elite-500/10">
                      <span className="text-sm font-medium text-white">{c.name}</span>
                      <span className="text-xs text-dark-400">{c.memberCount} 👤</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            {/* Featured peer large view */}
            {featuredPeer && (
              <div className="max-w-4xl mx-auto mb-3">
                {featuredPeer === 'local' ? (
                  <div className="relative rounded-2xl border-2 border-primary-500/40 bg-dark-900 overflow-hidden cursor-pointer aspect-[4/3] max-h-[60vh]" onClick={() => setFeaturedPeer(null)}>
                    {isCameraOn && stream ? (
                      <video ref={(el) => { if (el && compositeStream) el.srcObject = compositeStream }} autoPlay playsInline muted className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><InitialsAvatar name="Você" size="lg" /></div>
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <span className="px-2 py-1 rounded-lg bg-primary-500/20 text-xs font-semibold text-primary-400 backdrop-blur-sm border border-primary-500/30">
                        {kingUserId === user?.id && '👑 '}{modUserId === user?.id && kingUserId !== user?.id && '🛡️ '}Você
                      </span>
                    </div>
                  </div>
                ) : remoteStreams.has(featuredPeer) ? (
                  <div className="relative rounded-2xl border-2 border-emerald-500/40 bg-dark-900 overflow-hidden cursor-pointer aspect-[4/3] max-h-[60vh]" onClick={() => setFeaturedPeer(null)}>
                    <video
                      ref={(el) => { if (el) { const s = remoteStreams.get(featuredPeer!); if (s && el.srcObject !== s) el.srcObject = s } }}
                      autoPlay playsInline muted={allMuted}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-xs font-semibold text-emerald-400 backdrop-blur-sm border border-emerald-500/30">
                        {featuredPeer === kingUserId && '👑 '}{featuredPeer === modUserId && featuredPeer !== kingUserId && '🛡️ '}{onlineUsers.find(u => u.userId === featuredPeer)?.username || 'Usuário'}
                      </span>
                      {isVip(featuredPeer!) && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-sm">✨ VIP</span>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            <div className={`grid gap-3 max-w-4xl mx-auto ${
              featuredPeer
                ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'
                : (() => {
                    const totalCams = 1 + remoteStreams.size + (remoteStreams.size === 0 ? Math.min(botCount, 5) : 0)
                    return totalCams <= 1
                      ? 'grid-cols-1 max-w-2xl'
                      : totalCams <= 4
                        ? 'grid-cols-1 sm:grid-cols-2'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  })()
            }`}>
              {/* ═══ YOUR REAL CAMERA TILE ═══ */}
              <div ref={cameraTileRef} className={`relative rounded-2xl border-2 border-primary-500/40 bg-dark-900 overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.15)] cursor-pointer ${featuredPeer ? 'aspect-square' : 'aspect-[4/3]'}`} onClick={() => setFeaturedPeer(featuredPeer === 'local' ? null : 'local')}>
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
                      className={`absolute inset-0 w-full h-full object-contain ${bgImage && bgImage !== 'blur' ? 'z-10 mix-blend-normal' : ''}`}
                      style={{
                        filter: [
                          filterStyle !== 'none' ? filterStyle : '',
                          beautySmooth ? 'blur(0.5px) contrast(1.05)' : '',
                          beautyBrighten ? 'brightness(1.15) saturate(1.05)' : '',
                        ].filter(Boolean).join(' ') || 'none',
                      }}
                    />
                    {/* Emoji mask overlay on face */}
                    {activeMaskData?.emoji && faceBox && (
                      <div
                        className="absolute z-20 pointer-events-none select-none"
                        style={{
                          left: `${faceBox.x}%`,
                          top: `${faceBox.y}%`,
                          width: `${faceBox.w}%`,
                          height: `${faceBox.h}%`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: `${Math.max(faceBox.w, faceBox.h) * 0.6}vmin`,
                          lineHeight: 1,
                          transition: 'all 80ms ease-out',
                        }}
                      >
                        {activeMaskData.emoji}
                      </div>
                    )}
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

                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <span className="px-2 py-1 rounded-lg bg-primary-500/20 text-xs font-semibold text-primary-400 backdrop-blur-sm border border-primary-500/30">
                    {isKing && '👑 '}{isMod && !isKing && '🛡️ '}Você
                  </span>
                  {isVip(user?.id || '') && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-sm">✨ VIP</span>
                  )}
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

              {/* ═══ SIMULATED PARTICIPANT TILES (cold-start) ═══ */}
              {remoteStreams.size === 0 && botNames.slice(0, Math.min(botCount, 5)).map((name, i) => (
                <div key={`sim-${name}`} className={`relative rounded-2xl border-2 border-white/5 bg-dark-900 overflow-hidden cursor-pointer ${featuredPeer ? 'aspect-square' : 'aspect-[4/3]'}`} onClick={() => handleUserClick(`sim-${name}`, name)}>
                  <div className="w-full h-full flex items-center justify-center">
                    <InitialsAvatar name={name} size="lg" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 rounded-lg bg-white/10 text-xs font-semibold text-white/80 backdrop-blur-sm border border-white/10">
                      {name}
                    </span>
                  </div>
                  <div className="absolute top-2 left-2 p-1 rounded bg-dark-800/60 backdrop-blur-sm">
                    <VideoOff className="w-3 h-3 text-dark-500" />
                  </div>
                  {i % 3 !== 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-emerald-400">online</span>
                    </div>
                  )}
                </div>
              ))}

              {/* ═══ REMOTE VIDEO TILES ═══ */}
              {Array.from(remoteStreams.entries()).map(([peerId, _remoteStream]) => {
                const peerUser = onlineUsers.find(u => u.userId === peerId)
                const peerName = peerUser?.username || 'Usuário'
                const isPeerKing = peerId === kingUserId
                const isPeerMod = peerId === modUserId
                const isPeerVip = isVip(peerId)
                return (
                  <div key={peerId} className={`relative rounded-2xl border-2 border-emerald-500/40 bg-dark-900 overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-pointer ${featuredPeer ? 'aspect-square' : 'aspect-[4/3]'}`} onClick={() => setFeaturedPeer(featuredPeer === peerId ? null : peerId)}>
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
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-xs font-semibold text-emerald-400 backdrop-blur-sm border border-emerald-500/30">
                        {isPeerKing && '👑 '}{isPeerMod && !isPeerKing && '🛡️ '}{peerName}
                      </span>
                      {isPeerVip && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-sm">✨ VIP</span>
                      )}
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
                className="flex items-center gap-1.5 p-3 sm:px-3 sm:py-2.5 rounded-2xl bg-elite-500/10 text-elite-400 border border-elite-500/20 hover:bg-elite-500/20 transition-all text-sm font-semibold"
                title="Criar Camarote VIP"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Camarote</span>
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
                  <div className="flex-shrink-0 mt-0.5">
                    {isMe ? (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-white text-xs">V</div>
                    ) : (
                      <InitialsAvatar name={msg.username} />
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 ${isMe ? 'text-right' : ''}`}>
                    <div className={`flex items-baseline gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-xs font-semibold cursor-pointer hover:underline ${isMe ? 'text-primary-400' : 'text-dark-300 hover:text-white'}`} onClick={() => handleUserClick(msg.userId, msg.username)}>
                        {msg.userId === kingUserId && '👑 '}
                        {msg.userId === modUserId && msg.userId !== kingUserId && '🛡️ '}
                        {msg.username}
                      </span>
                      {isVip(msg.userId) && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">VIP</span>
                      )}
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

      {/* ─── Mobile Bottom Tab Bar (outside main/aside so always visible) ─── */}
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

      <CreateCamaroteModal
        isOpen={showCreateCamarote}
        onClose={() => setShowCreateCamarote(false)}
        isPremium={true}
        onConfirm={(data) => {
          setCamarotes(prev => [...prev, { name: data.name, memberCount: 1 }])
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
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt={selectedUser.username} className="w-20 h-20 rounded-full object-cover mx-auto mb-2 border-2 border-emerald-500/30" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-3xl mx-auto mb-2">
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="text-sm text-dark-400">{selectedUser.username}</p>
                </div>
              </div>
            )}

            {/* Info + Profile Tabs */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                {selectedUser.userId === kingUserId && '👑 '}
                {selectedUser.userId === modUserId && selectedUser.userId !== kingUserId && '🛡️ '}
                {selectedUser.username}
                {isVip(selectedUser.userId) && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">✨ VIP</span>
                )}
              </h3>
              <p className="text-xs text-dark-500 mb-3">
                {selectedUser.userId === kingUserId ? 'Rei da Sala 👑' : selectedUser.userId === modUserId ? 'Moderador 🛡️' : 'Na sala agora'}
              </p>

              {/* Bio */}
              {selectedUser.bio ? (
                <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-sm text-dark-300 leading-relaxed">{selectedUser.bio}</p>
                </div>
              ) : (
                <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-sm text-dark-500 italic">Sem bio ainda</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-dark-500 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Online agora
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleInviteOneOnOne({ userId: selectedUser!.userId, username: selectedUser!.username })}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold hover:from-pink-600 hover:to-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
                >
                  <Video className="w-4 h-4" /> Chamar para 1:1
                </button>
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
                    onClick={() => {
                      addToast({ type: 'info', title: '👤 Perfil', message: `Você está vendo o perfil de ${selectedUser.username}` })
                      setSelectedUser(null)
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-semibold hover:bg-emerald-500/30 transition-all"
                  >
                    Ver Perfil
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full mt-2 px-4 py-2 rounded-xl bg-white/[0.04] text-dark-500 text-xs hover:bg-white/[0.08] transition-all"
              >
                Fechar
              </button>
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

      {/* ═══ INCOMING CALL MODAL ═══ */}
      {incomingCall && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-dark-900 border border-white/10 rounded-3xl w-full max-w-xs mx-4 p-6 text-center animate-bounce-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center font-bold text-white text-3xl mx-auto mb-4 animate-pulse shadow-lg shadow-pink-500/30">
              {incomingCall.username.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{incomingCall.username}</h3>
            <p className="text-sm text-dark-400 mb-6">Quer conversar 1:1 com você 📹</p>
            <div className="flex gap-3">
              <button
                onClick={() => setIncomingCall(null)}
                className="flex-1 py-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 font-semibold hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 rotate-[135deg]" /> Recusar
              </button>
              <button
                onClick={handleAcceptCall}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold hover:from-emerald-600 hover:to-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Video className="w-4 h-4" /> Aceitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 1-ON-1 CALL: INVITING ═══ */}
      {oneOnOneCall?.status === 'inviting' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-dark-900 border border-white/10 rounded-3xl w-full max-w-xs mx-4 p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center font-bold text-white text-3xl mx-auto mb-4 shadow-lg shadow-primary-500/30">
              {oneOnOneCall.username.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{oneOnOneCall.username}</h3>
            <p className="text-sm text-dark-400 mb-2">Chamando...</p>
            <div className="flex justify-center gap-1 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '200ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
            <button
              onClick={handleEndCall}
              className="w-full py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 rotate-[135deg]" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ═══ 1-ON-1 CALL: ACTIVE (Full Screen) ═══ */}
      {oneOnOneCall?.status === 'active' && (
        <div className="fixed inset-0 z-[60] bg-dark-950 flex flex-col">
          {/* Main video area (the other person) */}
          <div className="flex-1 relative bg-dark-900 overflow-hidden">
            {/* Remote video / avatar */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <InitialsAvatar name={oneOnOneCall.username} size="lg" />
                <p className="text-white font-semibold mt-3">{oneOnOneCall.username}</p>
                <p className="text-dark-400 text-sm mt-1">Conectado 🟢</p>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

            {/* PiP: Your camera (draggable) */}
            <div
              className="absolute z-20 w-32 h-24 sm:w-40 sm:h-30 rounded-2xl overflow-hidden border-2 border-primary-500/50 shadow-xl cursor-grab active:cursor-grabbing"
              style={{ left: pipPos.x, top: pipPos.y }}
              onMouseDown={handlePipMouseDown}
              onTouchStart={handlePipMouseDown}
            >
              {isCameraOn && stream ? (
                <video
                  ref={(el) => { if (el && el.srcObject !== stream) el.srcObject = stream }}
                  autoPlay playsInline muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-dark-800 flex items-center justify-center">
                  <span className="text-2xl">🙈</span>
                </div>
              )}
              <div className="absolute bottom-1 left-1">
                <span className="px-1.5 py-0.5 rounded bg-primary-500/30 text-[9px] text-primary-300 backdrop-blur-sm font-medium">Você</span>
              </div>
            </div>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-white font-medium">1:1 com {oneOnOneCall.username}</span>
              </div>
              <button
                onClick={handleEndCall}
                className="p-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg"
              >
                <Phone className="w-5 h-5 rotate-[135deg]" />
              </button>
            </div>
          </div>

          {/* Chat area (bottom) */}
          <div className="flex-shrink-0 border-t border-white/10 bg-dark-950 flex flex-col" style={{ height: '35vh', minHeight: '200px' }}>
            {/* Chat header */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
              <MessageCircle className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold text-white">Chat com {oneOnOneCall.username}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {oneOnOneMsgs.length === 0 && (
                <p className="text-center text-xs text-dark-500 py-4">Diga algo para {oneOnOneCall.username}! 👋</p>
              )}
              {oneOnOneMsgs.map(msg => {
                const isMe = msg.userId === (user?.id || 'you')
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                      isMe ? 'bg-primary-500/20 text-primary-100 rounded-br-sm' : 'bg-white/[0.05] text-dark-200 rounded-bl-sm'
                    }`}>
                      {!isMe && <span className="text-[10px] text-primary-400 font-semibold block mb-0.5">{msg.username}</span>}
                      {msg.content}
                    </div>
                  </div>
                )
              })}
              <div ref={oneOnOneChatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendOneOnOneMsg} className="flex-shrink-0 p-3 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={oneOnOneMsgInput}
                onChange={e => setOneOnOneMsgInput(e.target.value)}
                placeholder="Mensagem..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20"
                autoFocus
              />
              <button type="submit" disabled={!oneOnOneMsgInput.trim()} className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all disabled:opacity-30">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 border-t border-white/5 bg-dark-950 p-3 flex items-center justify-center gap-3">
            <button
              onClick={handleToggleMic}
              className={`p-3 rounded-2xl transition-all ${!isMicOn ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.06] text-white border border-white/10'}`}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={handleToggleVideo}
              className={`p-3 rounded-2xl transition-all ${!isCameraOn ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.06] text-white border border-white/10'}`}
            >
              {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={handleEndCall}
              className="px-6 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
            >
              <Phone className="w-5 h-5 rotate-[135deg]" /> Encerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
