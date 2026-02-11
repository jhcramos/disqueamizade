import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Video, VideoOff, ArrowDown, Expand } from 'lucide-react'
import { StageQueue } from './StageQueue'
import { FloatingCamera } from './FloatingCamera'
import type { StageUser, QueueEntry } from '@/hooks/useStage'

const AVATAR_GRADIENTS = [
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

interface StageProps {
  performer: StageUser | null
  queue: QueueEntry[]
  isTransitioning: boolean
  stageTimer: string
  currentUserId: string
  isOnStage: boolean
  isInQueue: boolean
  queuePosition: number
  localStream: MediaStream | null
  onJoinStage: () => string | undefined
  onLeaveStage: () => { leavingName: string; nextName: string | null } | null
  onLeaveQueue: () => void
  onToggleMic: () => void
  onToggleCamera: () => void
}

export const Stage = ({
  performer,
  queue,
  isTransitioning,
  stageTimer,
  currentUserId,
  isOnStage,
  isInQueue,
  localStream,
  onJoinStage,
  onLeaveStage,
  onLeaveQueue,
  onToggleMic,
  onToggleCamera,
}: StageProps) => {
  const stageVideoRef = useRef<HTMLVideoElement>(null)
  const [isFloating, setIsFloating] = useState(false)
  const isCurrentUser = performer?.userId === currentUserId

  // Attach local stream to stage video when current user is performing
  useEffect(() => {
    if (stageVideoRef.current && isCurrentUser && localStream) {
      stageVideoRef.current.srcObject = localStream
    }
  }, [isCurrentUser, localStream])
  // Close floating when performer leaves or camera turns off
  useEffect(() => {
    if (!performer || !isCurrentUser || !performer.isCameraOn || !localStream) {
      setIsFloating(false)
    }
  }, [performer, isCurrentUser, localStream])

  return (
    <>
    {isFloating && performer && localStream && (
      <FloatingCamera
        stream={localStream}
        performerName={performer.userId === currentUserId ? 'Você' : performer.username}
        stageTimer={stageTimer}
        isMicOn={performer.isMicOn}
        onClose={() => setIsFloating(false)}
      />
    )}
    <div className="flex-shrink-0 border-b border-white/5">
      {/* Stage Area */}
      <div
        className="relative px-4 py-3 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.08) 50%, rgba(139,92,246,0.05) 100%)',
        }}
      >
        {/* Subtle scan line effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }}
        />

        {performer && !isTransitioning ? (
          /* ═══ SOMEONE ON STAGE ═══ */
          <div className="relative z-10">
            {/* Camera highlight — large video area */}
            <div
              className="relative w-full aspect-video max-h-[240px] rounded-xl overflow-hidden mb-3"
              style={{
                boxShadow: '0 0 30px rgba(236,72,153,0.3), 0 0 60px rgba(139,92,246,0.15)',
                border: '2px solid rgba(236,72,153,0.4)',
              }}
            >
              {/* Pop-out button */}
              {isCurrentUser && performer.isCameraOn && localStream && (
                <button
                  onClick={() => setIsFloating(true)}
                  className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white/70 hover:text-white transition-all"
                  title="Pop out"
                >
                  <Expand className="w-4 h-4" />
                </button>
              )}
              {/* Camera feed: real video for current user, avatar for others */}
              {isCurrentUser && performer.isCameraOn && localStream && isFloating ? (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-900/80">
                  <button
                    onClick={() => setIsFloating(false)}
                    className="text-xs text-fuchsia-300/70 hover:text-fuchsia-300 transition-colors"
                  >
                    📹 Câmera em modo flutuante — clique para voltar
                  </button>
                </div>
              ) : isCurrentUser && performer.isCameraOn && localStream ? (
                <video
                  ref={stageVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(performer.username)} opacity-20`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/60">
                    <div
                      className={`w-20 h-20 rounded-full bg-gradient-to-br ${getGradient(performer.username)} flex items-center justify-center font-bold text-white text-3xl shadow-lg`}
                    >
                      {performer.username.charAt(0).toUpperCase()}
                    </div>
                    {performer.isCameraOn && (
                      <div className="mt-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/30">
                        📹 Câmera ao vivo
                      </div>
                    )}
                  </div>
                </>
              )}
              {/* Spotlight corner glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-fuchsia-500/10 blur-2xl rounded-full" />
              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      🎤 {performer.userId === currentUserId ? 'Você' : performer.username}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 animate-pulse">
                      NO PALCO
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/70 font-mono">⏱️ {stageTimer}</span>
                    <span className={`text-[10px] ${performer.isMicOn ? 'text-emerald-400' : 'text-red-400'}`}>
                      {performer.isMicOn ? '🔊' : '🔇'}
                    </span>
                  </div>
                </div>
              </div>
              {/* Pulsing border animation */}
              <div className="absolute inset-0 rounded-xl border-2 border-fuchsia-500/20 animate-pulse pointer-events-none" style={{ animationDuration: '3s' }} />
            </div>

            {/* Controls bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isOnStage ? (
                  <>
                    <button
                      onClick={onToggleMic}
                      className={`p-2 rounded-xl transition-all ${performer.isMicOn ? 'bg-white/[0.06] text-white border border-white/10' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                      title={performer.isMicOn ? 'Mutar' : 'Desmutar'}
                    >
                      {performer.isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={onToggleCamera}
                      className={`p-2 rounded-xl transition-all ${performer.isCameraOn ? 'bg-white/[0.06] text-white border border-white/10' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                      title={performer.isCameraOn ? 'Desligar câmera' : 'Ligar câmera'}
                    >
                      {performer.isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={onLeaveStage}
                      className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                      title="Descer do palco"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </>
                ) : !isInQueue ? (
                  <button
                    onClick={onJoinStage}
                    className="px-3 py-1.5 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-500/30 transition-all text-xs font-semibold"
                  >
                    🎤 Entrar na fila
                  </button>
                ) : (
                  <button
                    onClick={onLeaveQueue}
                    className="px-3 py-1.5 rounded-xl bg-dark-800 text-dark-400 border border-white/5 hover:bg-dark-700 transition-all text-xs"
                  >
                    Sair da fila
                  </button>
                )}
              </div>
              {queue.length > 0 && (
                <span className="text-[11px] text-dark-400">
                  🎫 {queue.length} na fila
                </span>
              )}
            </div>

            {/* Queue */}
            <StageQueue queue={queue} currentUserId={currentUserId} onLeaveQueue={onLeaveQueue} />
          </div>
        ) : isTransitioning ? (
          /* ═══ TRANSITIONING ═══ */
          <div className="relative z-10 text-center py-2">
            <div className="text-lg font-bold text-fuchsia-300 animate-pulse">
              ✨ Trocando de palco... ✨
            </div>
          </div>
        ) : (
          /* ═══ EMPTY STAGE ═══ */
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎤</span>
              <div>
                <span className="text-sm font-semibold text-fuchsia-300/70">Palco livre!</span>
                <p className="text-[11px] text-dark-500">Quem vai ser o primeiro?</p>
              </div>
            </div>
            {!isInQueue && (
              <button
                onClick={onJoinStage}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(236,72,153,0.4))',
                  border: '1px solid rgba(236,72,153,0.3)',
                  boxShadow: '0 0 15px rgba(236,72,153,0.2)',
                }}
              >
                🎤 Subir no Palco
              </button>
            )}
            {/* Queue even when stage is empty (shouldn't normally happen but safety) */}
            {queue.length > 0 && (
              <StageQueue queue={queue} currentUserId={currentUserId} onLeaveQueue={onLeaveQueue} />
            )}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
