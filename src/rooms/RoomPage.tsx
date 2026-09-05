// ═══════════════════════════════════════════════════════════════════════════
// RoomPage (nova) — sala de vídeo em LiveKit (SFU), modelo espectador+palco.
//
// Entra sem câmera (espectador). Botão "Ligar câmera" publica o stream com
// máscaras. Vídeo em SFU (banda constante), chat via Supabase realtime, DM em
// canal por par, denunciar/bloquear, compartilhar no WhatsApp.
//
// Substitui a antiga src/pages/RoomPage.tsx (malha P2P + bots).
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  LiveKitRoom, RoomAudioRenderer, useConnectionState,
} from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import {
  ArrowLeft, Video, VideoOff, Mic, MicOff, Send, Share2, Users, X,
} from 'lucide-react'
import { Header } from '@/components/common/Header'
import { useAuthStore } from '@/store/authStore'
import { useAgeVerification } from '@/components/common/AgeVerificationModal'
import { useToastStore } from '@/components/common/ToastContainer'
import { supabase } from '@/services/supabase/client'
import { roomChat, chatError } from '@/services/supabase/roomChat'
import { CameraSetupProvider, CameraPreview } from './CameraSetup'
import { track as analytics, startRoomSession } from '@/services/analytics'
import { isLiveKitConfigured, fetchRoomToken, LIVEKIT_URL } from './livekit'
import { useStageCamera } from './useStageCamera'
import { RoomVideoGrid } from './RoomVideoGrid'
import { IcebreakerPanel } from './icebreakers/IcebreakerPanel'
import { DMConversation, type DMMessage } from './dm'
import { reportUser, blockUser as persistBlock } from '@/services/moderation'
import { siteUrl } from '@/config/site'

type ChatMessage = {
  id: string; userId: string; username: string; content: string
  timestamp: Date; type: 'text' | 'emoji' | 'system'
}
type Presence = { userId: string; username: string; joinedAt: number }

export const RoomPage = () => {
  const { roomId } = useParams()
  const identity = useAuthStore(s => s.user?.id)
  return <CameraSetupProvider key={`${roomId}:${identity}`}><RoomEntry /></CameraSetupProvider>
}

const RoomEntry = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, profile, isGuest, initialized, signInAsGuest } = useAuthStore()
  const { verifyAge } = useAgeVerification()
  const { addToast } = useToastStore()

  const [ready, setReady] = useState(false)
  const [entryConfirmed, setEntryConfirmed] = useState(false)
  const [ageOk, setAgeOk] = useState(() => sessionStorage.getItem('age-verified') === 'true')
  const [roomName, setRoomName] = useState('Sala')
  const [roomSlug, setRoomSlug] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [tokenIdentity, setTokenIdentity] = useState('')
  const [tokenError, setTokenError] = useState<string | null>(null)

  const identity = user?.id || 'anon'
  const displayName = profile?.username || (user?.user_metadata?.username as string) || 'Convidado'

  // Convidado automático: quem cai direto na sala sem sessão vira convidado.
  useEffect(() => {
    if (initialized && ageOk && !user) void signInAsGuest().catch(() => { setTokenError('Não foi possível iniciar sua sessão.'); setReady(true) })
  }, [user, initialized, ageOk, signInAsGuest])

  // Verificação de idade
  useEffect(() => {
    if (!ageOk) verifyAge(() => { sessionStorage.setItem('age-verified', 'true'); setAgeOk(true) })
  }, [ageOk, verifyAge])

  // Carrega a sala e busca o token
  useEffect(() => {
    setReady(false); setToken(null); setTokenError(null)
    if (!ageOk || !identity || identity === 'anon') return
    let cancelled = false
    ;(async () => {
      let slug = roomId || ''
      let name = 'Sala'
      try {
        const bySlug = await supabase.from('rooms').select('*').eq('slug', roomId).maybeSingle()
        const data = bySlug.data || (await supabase.from('rooms').select('*').eq('id', roomId).maybeSingle()).data
        if (data) { slug = data.slug || data.id; name = data.name }
      } catch { /* usa roomId como slug */ }
      if (cancelled) return
      setRoomSlug(slug); setRoomName(name)
      try {
        if (!isLiveKitConfigured()) throw new Error('LiveKit não configurado')
        const t = await fetchRoomToken(slug, identity)
        if (!cancelled) { setToken(t); setTokenIdentity(identity) }
      } catch (e) {
        if (!cancelled) setTokenError(e instanceof Error ? e.message : 'Erro ao conectar')
      }
      if (!cancelled) setReady(true)
    })()
    return () => { cancelled = true }
  }, [ageOk, identity, roomId])

  if (!ready || (token && tokenIdentity !== identity)) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center">
        <div className="text-dark-400">Entrando na sala…</div>
      </div>
    )
  }

  if (tokenError || !token) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">📡</div>
            <h2 className="text-2xl font-bold mb-2">Vídeo indisponível</h2>
            <p className="text-dark-400 text-sm mb-6">
              {tokenError || 'Não foi possível conectar ao servidor de vídeo.'} Tente novamente em instantes.
            </p>
            <Link to="/rooms"><button className="btn-primary px-6 py-3 rounded-xl">← Voltar para Salas</button></Link>
          </div>
        </div>
      </div>
    )
  }

  if (!entryConfirmed) return <CameraPreview onContinue={() => setEntryConfirmed(true)} onSkip={() => setEntryConfirmed(true)} onCancel={() => navigate('/rooms')} />

  return (
    <LiveKitRoom
      key={`${identity}:${roomSlug}`}
      serverUrl={LIVEKIT_URL}
      token={token}
      connect
      audio={false}
      video={false}
      onDisconnected={() => navigate('/rooms')}
      className="min-h-screen bg-dark-950 text-white"
    >
      <RoomAudioRenderer />
      <RoomStage
        roomId={roomSlug}
        roomName={roomName}
        identity={identity}
        displayName={displayName}
        isGuest={isGuest}
        onReport={(name) => addToast({ type: 'success', title: 'Denúncia enviada', message: `Obrigado. A equipe vai revisar ${name}.` })}
      />
    </LiveKitRoom>
  )
}

// ─── Interior conectado ao LiveKit ───

interface StageProps {
  roomId: string; roomName: string; identity: string; displayName: string
  isGuest: boolean; onReport: (name: string) => void
}

const RoomStage = ({ roomId, roomName, identity, displayName, isGuest, onReport }: StageProps) => {
  const connState = useConnectionState()
  const { addToast } = useToastStore()
  const setGuestNickname = useAuthStore((s) => s.setGuestNickname)
  const [editingNick, setEditingNick] = useState(false)
  const [nickInput, setNickInput] = useState(displayName)
  const cam = useStageCamera(roomId)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [names, setNames] = useState<Map<string, string>>(new Map())
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [blocked, setBlocked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('blocked-users') || '[]')) } catch { return new Set() }
  })
  const [dm, setDm] = useState<{ peerId: string; peerName: string } | null>(null)
  const msgEndRef = useRef<HTMLDivElement>(null)

  // Sessão de sala (analytics room_joined + room_5min)
  useEffect(() => startRoomSession(roomId), [roomId])

  // Chat público + presença
  useEffect(() => {
    if (connState !== ConnectionState.Connected) return
    setMessages([])
    const fail = (error: unknown) => addToast({ type: 'error', title: 'Chat indisponível', message: chatError(error) })
    void roomChat.join(
      roomId, identity, displayName,
      (msg) => {
        setMessages((prev) => [...prev, msg as ChatMessage].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()))
        if (msg.type !== 'system' && msg.userId !== identity) analytics('chat_msg_received_human', { room: roomId })
      },
      (users: Presence[]) => {
        setNames(new Map(users.map((u) => [u.userId, u.username])))
      }, fail,
    ).catch(fail)
    return () => { roomChat.leave() }
  }, [connState, roomId, identity, displayName, addToast])

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    try {
      await roomChat.sendMessage(identity, displayName, text)
      setInput((current) => current === input ? '' : current)
    } catch (error) {
      addToast({ type: 'error', title: 'Mensagem não enviada', message: chatError(error) })
    } finally { setSending(false) }
  }, [input, sending, identity, displayName, addToast])

  const handleBlock = useCallback((id: string, name: string) => {
    setBlocked(persistBlock(id))
    addToast({ type: 'success', title: 'Bloqueado', message: `Você não verá mais ${name}.` })
  }, [addToast])

  const handleReport = useCallback((id: string, name: string) => {
    analytics('report_sent', { room: roomId })
    reportUser({ reportedIdentity: id, reporterIdentity: identity, reason: 'inappropriate_content', roomSlug: roomId })
    onReport(name)
  }, [roomId, identity, onReport])

  const handleShare = useCallback(() => {
    const url = siteUrl(`/sala/${roomId}`)
    if (navigator.share) navigator.share({ title: roomName, url }).catch(() => {})
    else { navigator.clipboard?.writeText(url); addToast({ type: 'success', title: 'Link copiado', message: 'Cole no WhatsApp para chamar alguém.' }) }
  }, [roomId, roomName, addToast])

  const connecting = connState !== ConnectionState.Connected

  return (
    <div className="h-screen flex flex-col">
      {/* Topo */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-white/5 bg-dark-950/80 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/rooms" className="p-2 rounded-xl hover:bg-white/5 flex-shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="min-w-0">
            <h1 className="font-bold truncate">{roomName}</h1>
            <p className="text-[11px] text-dark-400">
              {connecting ? 'conectando…' : `${names.size} na sala`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isGuest && !editingNick && (
            <button onClick={() => { setNickInput(displayName); setEditingNick(true) }} title="Trocar apelido" className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs">
              <span className="text-dark-300">você:</span> <span className="font-semibold">{displayName}</span> <span className="text-dark-500">✎</span>
            </button>
          )}
          {isGuest && editingNick && (
            <form onSubmit={(e) => { e.preventDefault(); void setGuestNickname(nickInput).then(() => { setEditingNick(false); addToast({ type: 'success', title: 'Apelido atualizado', message: `Agora você é ${nickInput.trim().slice(0, 24)}.` }) }).catch(() => addToast({ type: 'error', title: 'Apelido não atualizado', message: 'Tente novamente em instantes.' })) }} className="flex items-center gap-1">
              <input value={nickInput} onChange={(e) => setNickInput(e.target.value)} maxLength={24} autoFocus className="w-28 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-primary-500/40" />
              <button type="submit" disabled={sending} className="px-2 py-1.5 rounded-xl bg-primary-500 text-white text-xs font-bold">ok</button>
            </form>
          )}
          <button onClick={handleShare} title="Compartilhar" className="p-2 rounded-xl bg-white/5 hover:bg-white/10"><Share2 className="w-4 h-4" /></button>
          <button onClick={() => setShowChat((v) => !v)} title="Chat" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 lg:hidden"><Users className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Vídeo */}
        <main className="relative flex-1 flex flex-col min-w-0 min-h-0">
          <RoomVideoGrid
            roomId={roomId}
            names={names}
            localIdentity={identity}
            onReport={handleReport}
            onBlock={handleBlock}
            blocked={blocked}
          />

          {/* Autovisualização (você): mostra o vídeo com máscara que os outros veem */}
          {cam.isLive && cam.isCameraOn && cam.previewStream && (
            <SelfView stream={cam.previewStream} name={displayName} hint={cam.activeMask ? TRACK_HINT[cam.trackingStatus] : undefined} />
          )}

          <IcebreakerPanel key={`${roomId}:${identity}`} roomId={roomId} identity={identity} connected={connState === ConnectionState.Connected} blocked={blocked} />

          {/* Barra de controles */}
          <div className="flex-shrink-0 border-t border-white/5 bg-dark-950/80 backdrop-blur p-3">
            {cam.error && <p role="alert" className="text-sm text-red-300 text-center mb-2">{cam.error}</p>}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {!cam.isLive ? (
                <button
                  onClick={cam.goLive}
                  disabled={cam.starting}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold disabled:opacity-50"
                >
                  <Video className="w-5 h-5" /> {cam.starting ? 'Ligando…' : 'Ligar minha câmera'}
                </button>
              ) : (
                <>
                  <button onClick={cam.toggleCamera} className={`p-3 rounded-2xl border ${cam.isCameraOn ? 'bg-white/5 border-white/10' : 'bg-red-500/20 border-red-500/40'}`}>
                    {cam.isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                  <button onClick={cam.toggleMic} className={`p-3 rounded-2xl border ${cam.isMicOn ? 'bg-white/5 border-white/10' : 'bg-red-500/20 border-red-500/40'}`}>
                    {cam.isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  <button onClick={cam.goLive} className="p-3 rounded-2xl border border-white/10 bg-white/5" title="Ajustar máscara na prévia privada">🎭</button>
                  <button onClick={cam.leaveStage} className="p-3 rounded-2xl bg-red-500 text-white font-bold">
                    <VideoOff className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

          </div>
        </main>

        {/* Chat */}
        {showChat && (
          <aside className="w-full h-[42vh] border-t lg:h-auto lg:w-80 lg:border-t-0 lg:border-l flex-shrink-0 flex flex-col border-white/5 bg-dark-950 min-h-0">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <span className="font-bold text-sm">Chat</span>
              <button onClick={() => setShowChat(false)} className="p-1.5 rounded-lg hover:bg-white/5 lg:hidden"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={m.type === 'system' ? 'text-center' : ''}>
                  {m.type === 'system' ? (
                    <span className="text-[11px] text-dark-500">{m.content}</span>
                  ) : (
                    <div className="text-sm">
                      <button
                        onClick={() => m.userId !== identity && setDm({ peerId: m.userId, peerName: m.username })}
                        className={`font-semibold ${m.userId === identity ? 'text-primary-400' : 'text-pink-400 hover:underline'}`}
                      >
                        {m.username}
                      </button>
                      <span className="text-dark-200">: {m.content}</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-3 border-t border-white/5 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Mensagem…"
                maxLength={500}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary-500/40"
              />
              <button type="submit" disabled={sending} className="p-2 rounded-xl bg-primary-500 hover:bg-primary-600"><Send className="w-4 h-4" /></button>
            </form>
          </aside>
        )}
      </div>

      {dm && (
        <DMPanel
          myId={identity}
          myName={displayName}
          peerId={dm.peerId}
          peerName={dm.peerName}
          onClose={() => setDm(null)}
        />
      )}
    </div>
  )
}

// ─── Autovisualização local (PiP) ───
// Mostra o stream composto (com máscara) que os outros participantes veem.
// Fica mudo (o próprio áudio não deve voltar) e espelhado, como toda self-view.

const TRACK_HINT: Record<string, string | undefined> = {
  loading: 'carregando máscara…',
  'no-face': 'procurando seu rosto…',
  error: 'máscara indisponível',
}

const SelfView = ({ stream, name, hint }: { stream: MediaStream; name: string; hint?: string }) => {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el && el.srcObject !== stream) {
      el.srcObject = stream
      el.play().catch(() => {})
    }
  }, [stream])
  return (
    <div className="absolute bottom-24 right-4 z-20 w-28 sm:w-40 rounded-xl overflow-hidden bg-dark-900 border border-white/15 shadow-2xl aspect-[4/3]">
      <video ref={ref} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
        <span className="text-[10px] font-semibold text-white truncate">{hint ?? `Você · ${name}`}</span>
      </div>
    </div>
  )
}

// ─── DM privada (canal por par) ───

const DMPanel = ({ myId, myName, peerId, peerName, onClose }: { myId: string; myName: string; peerId: string; peerName: string; onClose: () => void }) => {
  const [msgs, setMsgs] = useState<DMMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const { addToast } = useToastStore()
  const convRef = useRef<DMConversation | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const conv = new DMConversation(myId, myName, peerId)
    convRef.current = conv
    setMsgs([])
    const fail = (error: unknown) => addToast({ type: 'error', title: 'Conversa indisponível', message: chatError(error) })
    void conv.join((m) => setMsgs((prev) => [...prev, m].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())), fail).catch(fail)
    return () => conv.leave()
  }, [myId, myName, peerId, addToast])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const conversation = convRef.current
    if (!conversation || !input.trim() || sending) return
    setSending(true)
    try {
      await conversation.send(input)
      setInput((current) => current === input ? '' : current)
    } catch (error) { addToast({ type: 'error', title: 'Mensagem não enviada', message: chatError(error) }) }
    finally { setSending(false) }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 sm:w-80 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: 380 }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <span className="font-bold text-sm truncate">Privado · {peerName}</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {msgs.map((m) => (
          <div key={m.id} className="text-sm">
            <span className={`font-semibold ${m.fromId === myId ? 'text-primary-400' : 'text-pink-400'}`}>{m.fromName}</span>
            <span className="text-dark-200">: {m.content}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="p-3 border-t border-white/5 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Mensagem privada…" maxLength={500} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary-500/40" />
        <button type="submit" disabled={sending} className="p-2 rounded-xl bg-primary-500 hover:bg-primary-600"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  )
}

export default RoomPage
