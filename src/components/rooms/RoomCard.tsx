import { Link } from 'react-router-dom'
import { Users, Video, Lock, Crown } from 'lucide-react'
import type { MockRoom } from '../../types'

interface RoomCardProps {
  room: MockRoom
}

export const RoomCard = ({ room }: RoomCardProps) => {
  const isFull = room.participants >= room.max_users
  const percentage = (room.participants / room.max_users) * 100

  const categoryLabels: Record<string, string> = {
    cidade: '🏙️ Cidade',
    idade: '🎂 Idade',
    idioma: '🌍 Idioma',
    hobby: '🎯 Hobby',
    gamer: '🎮 Gamer',
    adulta: '🔞 Adulto',
  }

  return (
    <div className="card p-5 rounded-2xl transition-all duration-300 hover:border-primary/20 hover:shadow-card-hover group h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors truncate">
            {room.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{room.description}</p>
        </div>
        <div className="ml-3 flex items-center gap-1">
          {room.has_video && <Video className="w-4 h-4 text-primary-light" />}
          {room.is_private && <Lock className="w-4 h-4 text-pink-400" />}
        </div>
      </div>

      {/* Category Badge */}
      <div className="mb-3">
        <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-semibold ${
          room.category === 'adulta'
            ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
            : room.category === 'gamer'
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : room.category === 'idade'
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            : room.category === 'idioma'
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'bg-primary/20 text-primary-light border border-primary/30'
        }`}>
          {categoryLabels[room.category]}
        </span>
      </div>

      {/* Owner */}
      <div className="flex items-center gap-2 mb-3">
        <img
          src={room.owner.avatar}
          alt={room.owner.username}
          className="w-6 h-6 rounded-full border border-white/10"
        />
        <span className="text-xs text-gray-500">
          por <span className="text-gray-300">{room.owner.username}</span>
        </span>
      </div>

      {/* User count */}
      <div className="flex items-center gap-3 mb-3 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="status-online" />
          <span className="text-gray-400">{room.online_count} online</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <Users className="w-3.5 h-3.5" />
          <span>{room.participants}/{room.max_users}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-surface rounded-full overflow-hidden mb-4">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
            isFull ? 'bg-red-500' : percentage > 80 ? 'bg-accent' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Action */}
      <div className="mt-auto">
        {isFull ? (
          <div className="space-y-2">
            <span className="block text-center text-sm text-red-400 font-medium">Sala Cheia</span>
            <button className="w-full px-4 py-2 rounded-xl border border-accent/30 text-accent hover:bg-accent/10 transition-all text-sm font-semibold flex items-center justify-center gap-2">
              <Crown className="w-4 h-4" />
              Entrar como VIP
            </button>
          </div>
        ) : (
          <Link to={`/room/${room.id}`}>
            <button className="w-full px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary-light hover:bg-primary hover:text-white transition-all text-sm font-semibold">
              Entrar
            </button>
          </Link>
        )}
      </div>
    </div>
  )
}
