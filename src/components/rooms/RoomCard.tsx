import { Link } from 'react-router-dom'
import { Card, Badge } from '@/components/common'
import { Video, Users, Lock } from 'lucide-react'

interface RoomCardProps {
  room: {
    id: string
    name: string
    description: string
    theme: string
    participants: number
    max_users: number
    is_private: boolean
    owner: {
      username: string
      avatar_url?: string
    }
    has_video: boolean
    online_count: number
  }
}

export const RoomCard = ({ room }: RoomCardProps) => {
  const isFull = room.participants >= room.max_users
  const percentage = (room.participants / room.max_users) * 100

  return (
    <Link to={`/room/${room.id}`}>
      <Card hover clickable className="h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-50 mb-1.5">
              {room.name}
            </h3>
            <p className="text-sm text-zinc-500 line-clamp-2">
              {room.description}
            </p>
          </div>

          {room.has_video && (
            <div className="ml-3 p-2 bg-violet-500/10 rounded-lg">
              <Video className="w-4 h-4 text-violet-400" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Owner */}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold ring-1 ring-zinc-800">
              {room.owner.username[0].toUpperCase()}
            </div>
            <span className="text-zinc-500">
              por <span className="text-zinc-300">{room.owner.username}</span>
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">
                {room.online_count} online
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-500">
              <Users className="w-3.5 h-3.5" />
              {room.participants}/{room.max_users}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                isFull
                  ? 'bg-red-500'
                  : percentage > 80
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-violet-500 to-indigo-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {room.is_private && (
              <Badge variant="warning" size="sm">
                <Lock className="w-3 h-3" /> Privada
              </Badge>
            )}
            {isFull && (
              <Badge variant="error" size="sm">
                Cheia
              </Badge>
            )}
            {!isFull && percentage < 50 && (
              <Badge variant="success" size="sm">
                Vagas disponíveis
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
