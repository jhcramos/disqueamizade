// ═══════════════════════════════════════════════════════════════════════════
// RouletteCall — chamada 1:1 da roleta em LiveKit (Plano V4, item 1.7)
//
// Recebe o par já formado pelo matchmaking e conecta os dois numa sala LiveKit
// (nome = id do par). Publica a câmera COMPOSTA (máscaras) automaticamente e
// mostra o parceiro grande + PiP local. Chat via Supabase realtime.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  LiveKitRoom, RoomAudioRenderer, useTracks, VideoTrack, useConnectionState,
} from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import { Video, VideoOff, Mic, MicOff, SkipForward, X, Send, Flag } from 'lucide-react'
import { CameraMasksButton } from '@/components/camera/CameraMasks'
import { roomChat } from '@/services/supabase/roomChat'
import { track as analytics } from '@/services/analytics'
import { LIVEKIT_URL } from './livekit'
import { useStageCamera } from './useStageCamera'

interface Props {
  roomId: string
  token: string
  identity: string
  displayName: string
  peerId: string
  isGuest: boolean
  onNext: () => void
  onEnd: () => void
  onReport: (peerId: string) => void
}

type ChatMsg = { id: string; userId: string; username: string; content: string; type: string; timestamp: Date }

export const RouletteCall = (props: Props) => {
  return (
    <LiveKitRoom
      serverUrl={LIVEKIT_URL}
      token={props.token}
      connect
      audio={false}
      video={false}
      className="contents"
    >
      <RoomAudioRenderer />
      <CallInner {...props} />
    </LiveKitRoom>
  )
}

const CallInner = ({ roomId, identity, displayName, peerId, isGuest, onNext, onEnd, onReport }: Props) => {
  const connState = useConnectionState()
  const cam = useStageCamera(roomId)
  const cameraTracks = useTracks(['camera' as any], { onlySubscribed: false })
  const remote = cameraTracks.find((t) => t.participant.identity !== identity)

  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const goneLiveRef = useRef(false)

  // Publica a câmera automaticamente ao conectar (roleta = todo mundo com vídeo)
  useEffect(() => {
    if (connState === ConnectionState.Connected && !goneLiveRef.current) {
      goneLiveRef.current = true
      cam.goLive()
    }
  }, [connState, cam])

  useEffect(() => {
    if (remote) analytics('roulette_matched', { room: roomId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!remote])

  // Chat 1:1
  useEffect(() => {
    if (connState !== ConnectionState.Connected) return
    roomChat.join(
      `roulette-${roomId}`, identity, displayName,
      (msg) => setMessages((prev) => [...prev, msg as ChatMsg]),
      () => {},
    )
    return () => { roomChat.leave() }
  }, [connState, roomId, identity, displayName])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    if (roomChat.sendMessage(identity, displayName, text)) {
      setMessages((prev) => [...prev, { id: `me-${Date.now()}`, userId: identity, username: displayName, content: text, type: 'text', timestamp: new Date() }])
      setInput('')
    }
  }, [input, identity, displayName])

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Vídeo do parceiro */}
      <div className="flex-1 relative rounded-2xl overflow-hidden bg-dark-900 border border-white/10 min-h-[300px]">
        {remote ? (
          <>
            <VideoTrack trackRef={remote} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-500/80 text-[10px] font-bold text-white animate-pulse">LIVE</div>
            <button
              onClick={() => onReport(peerId)}
              className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-red-500/30 text-red-100 text-xs font-bold backdrop-blur-sm flex items-center gap-1"
            >
              <Flag className="w-3 h-3" /> Denunciar
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-3 animate-bounce">🎉</div>
              <p className="text-sm text-dark-400 animate-pulse">Conectando vídeo…</p>
            </div>
          </div>
        )}

        {/* PiP local */}
        <div className="absolute bottom-3 right-3 w-32 h-24 sm:w-44 sm:h-32 rounded-xl overflow-hidden border-2 border-primary-500/50 shadow-xl bg-dark-800 z-20">
          <video ref={cam.videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-primary-500/30 backdrop-blur-sm text-[9px] text-primary-300 font-semibold">Você</div>
        </div>
      </div>

      {/* Chat */}
      <div className="lg:w-80 flex flex-col rounded-2xl bg-dark-900/50 border border-white/5 overflow-hidden min-h-[200px]">
        <div className="p-3 border-b border-white/5 flex items-center gap-2">
          <Send className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-bold">Chat</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((m) => {
            if (m.type === 'system') {
              return <div key={m.id} className="text-center"><span className="text-[11px] text-dark-500">{m.content}</span></div>
            }
            const isMe = m.userId === identity
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary-500/20 text-primary-100 rounded-br-sm' : 'bg-white/[0.05] text-dark-200 rounded-bl-sm'}`}>
                  {!isMe && <div className="text-[10px] text-dark-400 font-semibold mb-0.5">{m.username}</div>}
                  {m.content}
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>
        <form onSubmit={send} className="p-3 border-t border-white/5 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Mensagem…" maxLength={500} className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-primary-500/40" />
          <button type="submit" className="p-2 rounded-xl bg-primary-500 hover:bg-primary-600"><Send className="w-4 h-4" /></button>
        </form>
      </div>

      {/* Controles (mobile: barra flutuante embaixo) */}
      <div className="lg:hidden fixed bottom-4 inset-x-0 flex justify-center gap-2 z-30">
        <ControlBar cam={cam} isGuest={isGuest} onNext={onNext} onEnd={onEnd} />
      </div>
      <div className="hidden lg:flex absolute bottom-6 left-1/2 -translate-x-1/2 gap-2 z-30">
        <ControlBar cam={cam} isGuest={isGuest} onNext={onNext} onEnd={onEnd} />
      </div>
    </div>
  )
}

const ControlBar = ({ cam, isGuest, onNext, onEnd }: { cam: ReturnType<typeof useStageCamera>; isGuest: boolean; onNext: () => void; onEnd: () => void }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-dark-900/90 border border-white/10 backdrop-blur">
    <button onClick={cam.toggleCamera} className={`p-2.5 rounded-xl border ${cam.isCameraOn ? 'bg-white/5 border-white/10' : 'bg-red-500/20 border-red-500/40'}`}>
      {cam.isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
    </button>
    <button onClick={cam.toggleMic} className={`p-2.5 rounded-xl border ${cam.isMicOn ? 'bg-white/5 border-white/10' : 'bg-red-500/20 border-red-500/40'}`}>
      {cam.isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
    </button>
    <CameraMasksButton
      userTier={isGuest ? 'free' : 'basic'}
      activeFilter={cam.activeFilter} onFilterChange={cam.setActiveFilter}
      activeMask={cam.activeMask} onMaskChange={cam.setActiveMask}
      beautySmooth={cam.beautySmooth} onBeautySmoothChange={cam.setBeautySmooth}
      beautyBrighten={cam.beautyBrighten} onBeautyBrightenChange={cam.setBeautyBrighten}
    />
    <button onClick={onNext} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm flex items-center gap-1.5">
      <SkipForward className="w-4 h-4" /> Próximo
    </button>
    <button onClick={onEnd} className="p-2.5 rounded-xl bg-red-500 text-white"><X className="w-5 h-5" /></button>
  </div>
)

export default RouletteCall
