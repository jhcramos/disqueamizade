import { Link } from 'react-router-dom'
import { Users, Video, Lock } from 'lucide-react'
import type { MockRoom } from '@/types'

interface RoomCardProps {
  room: MockRoom
}

export const RoomCard = ({ room }: RoomCardProps) => {
  const capacityPercent = Math.round((room.participants / room.max_users) * 100)
  const isFull = room.participants >= room.max_users

  return (
    <Link to={`/room/${room.id}`}>
      <div className="card-interactive p-5 group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-white truncate group-hover:text-primary-400 transition-colors">
                {room.name}
              </h3>
              {room.is_official && (
                <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                  Oficial
                </span>
              )}
              {room.is_private && <Lock className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />}
            </div>
            <p className="text-xs text-dark-500 line-clamp-1">{room.description}</p>
          </div>
          {room.has_video && (
            <div className="flex-shrink-0 ml-2 p-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20">
              <Video className="w-3.5 h-3.5 text-primary-400" />
            </div>
          )}
        </div>

        {/* Capacity bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-dark-500 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {room.participants}/{room.max_users}
            </span>
            <span className={`font-semibold ${
              isFull ? 'text-red-400' :
              capacityPercent > 80 ? 'text-amber-400' :
              'text-emerald-400'
            }`}>
              {isFull ? 'CHEIA' : capacityPercent > 80 ? 'Quase cheia' : 'Aberta'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull ? 'bg-red-500' :
                capacityPercent > 80 ? 'bg-amber-500' :
                'bg-emerald-500'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {room.owner.avatar && !room.owner.avatar.includes('pravatar') ? (
              <img
                src={room.owner.avatar}
                alt={room.owner.username}
                className="w-5 h-5 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center border border-white/10">
                <span className="text-[8px] font-bold text-white">
                  {room.is_official ? '🎯' : (room.owner.username?.[0] || '?').toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-[11px] text-dark-500">
              {room.is_official ? 'Disque Amizade' : room.owner.username}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-medium">{room.online_count}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
