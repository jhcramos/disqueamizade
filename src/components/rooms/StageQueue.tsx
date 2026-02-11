import type { QueueEntry } from '@/hooks/useStage'

const AVATAR_GRADIENTS = [
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-red-500 to-pink-600',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

interface StageQueueProps {
  queue: QueueEntry[]
  currentUserId: string
  onLeaveQueue: () => void
}

export const StageQueue = ({ queue, currentUserId, onLeaveQueue }: StageQueueProps) => {
  if (queue.length === 0) return null

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-fuchsia-400/70">🎫 Fila de espera</span>
        <span className="text-[10px] text-dark-500">({queue.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {queue.map((entry, i) => {
          const isMe = entry.userId === currentUserId
          const gradient = getGradient(entry.username)
          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                isMe
                  ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300'
                  : 'bg-white/[0.02] border-white/5 text-dark-300'
              }`}
              style={{
                background: isMe ? undefined : `linear-gradient(135deg, rgba(168,85,247,0.05), rgba(236,72,153,0.05))`,
              }}
            >
              <span className="text-[10px] font-bold text-fuchsia-500/60">{i + 1}º</span>
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0`}>
                {entry.username.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium truncate max-w-[80px]">{isMe ? 'Você' : entry.username}</span>
              {isMe && (
                <button
                  onClick={onLeaveQueue}
                  className="ml-1 text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                  title="Sair da fila"
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>
      {queue.length > 0 && (
        <div className="mt-1.5 text-[10px] text-fuchsia-400/50">
          Próximo: <span className="font-semibold text-fuchsia-300">{queue[0].username}</span>
        </div>
      )}
    </div>
  )
}
