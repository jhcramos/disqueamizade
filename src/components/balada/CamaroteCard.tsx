import { Users, MessageCircle, Gamepad2, Heart, Flame, Mic, Music } from 'lucide-react'

export type CamaroteType = 'papo' | 'esquenta' | 'duo' | 'dark' | 'palco' | 'karaoke'

interface CamaroteCardProps {
  type: CamaroteType
  name: string
  participants: {
    id: string
    username: string
    avatar: string
  }[]
  maxParticipants: number
  isActive?: boolean
  isLocked?: boolean
  onClick?: () => void
}

const CAMAROTE_CONFIG: Record<CamaroteType, {
  icon: React.ElementType
  emoji: string
  color: string
  bgGradient: string
  description: string
}> = {
  papo: {
    icon: MessageCircle,
    emoji: '💬',
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-500/20 to-blue-500/10',
    description: 'Papo profundo, 3-4 pessoas',
  },
  esquenta: {
    icon: Gamepad2,
    emoji: '🎲',
    color: 'text-festa-400',
    bgGradient: 'from-festa-500/20 to-amber-500/10',
    description: 'Jogos e diversão, 4-6 pessoas',
  },
  duo: {
    icon: Heart,
    emoji: '💕',
    color: 'text-energia-400',
    bgGradient: 'from-energia-500/20 to-pink-500/10',
    description: 'Match romântico, 2 pessoas',
  },
  dark: {
    icon: Flame,
    emoji: '🔥',
    color: 'text-red-400',
    bgGradient: 'from-red-500/20 to-orange-500/10',
    description: '+18 privado',
  },
  palco: {
    icon: Mic,
    emoji: '🎤',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-violet-500/10',
    description: 'Performances ao vivo',
  },
  karaoke: {
    icon: Music,
    emoji: '🎵',
    color: 'text-conquista-400',
    bgGradient: 'from-conquista-500/20 to-emerald-500/10',
    description: 'Cante junto!',
  },
}

export const CamaroteCard = ({
  type,
  name,
  participants,
  maxParticipants,
  isActive = false,
  isLocked = false,
  onClick,
}: CamaroteCardProps) => {
  const config = CAMAROTE_CONFIG[type]
  const Icon = config.icon
  const isFull = participants.length >= maxParticipants

  return (
    <button
      onClick={onClick}
      disabled={isFull || isLocked}
      className={`
        relative w-full p-4 rounded-2xl border text-left transition-all
        ${isActive 
          ? 'border-balada-500/50 bg-gradient-to-br ' + config.bgGradient + ' shadow-lg shadow-balada-500/10' 
          : 'border-white/10 bg-noite-900/50 hover:bg-noite-800/50 hover:border-white/20'
        }
        ${(isFull || isLocked) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Type badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 ${config.color}`}>
          <span className="text-lg">{config.emoji}</span>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1 text-xs text-dark-400">
          <Users className="w-3 h-3" />
          <span>{participants.length}/{maxParticipants}</span>
        </div>
      </div>

      {/* Name */}
      <h3 className="font-bold text-white text-sm mb-1 truncate">{name}</h3>
      <p className="text-xs text-dark-500 mb-3">{config.description}</p>

      {/* Participant avatars */}
      <div className="flex -space-x-2">
        {participants.slice(0, 4).map((p, i) => (
          <img
            key={p.id}
            src={p.avatar}
            alt={p.username}
            className="w-7 h-7 rounded-full border-2 border-noite-900 object-cover"
            style={{ zIndex: 4 - i }}
          />
        ))}
        {participants.length > 4 && (
          <div className="w-7 h-7 rounded-full bg-dark-700 border-2 border-noite-900 flex items-center justify-center text-[10px] text-white font-bold">
            +{participants.length - 4}
          </div>
        )}
        {participants.length === 0 && (
          <span className="text-xs text-dark-600 italic">Vazio</span>
        )}
      </div>

      {/* Status indicators */}
      {isLocked && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-dark-700 text-[10px] text-dark-400">
          🔒 Privado
        </div>
      )}
      {isFull && !isLocked && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-energia-500/20 text-[10px] text-energia-400">
          Lotado
        </div>
      )}
      {isActive && !isFull && !isLocked && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-conquista-400 animate-pulse" />
      )}
    </button>
  )
}
