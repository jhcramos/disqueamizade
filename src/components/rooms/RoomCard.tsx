import { Link } from 'react-router-dom'
import { Card, Badge } from '@/components/common'

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
            <h3 className="text-xl font-bold text-neon-cyan mb-2 group-hover:text-glow-cyan">
              {room.name}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2">
              {room.description}
            </p>
          </div>

          {room.has_video && (
            <div className="ml-2">
              <span className="text-2xl" title="Vídeo ativo">
                📹
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Owner */}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center text-xs font-bold">
              {room.owner.username[0].toUpperCase()}
            </div>
            <span className="text-gray-400">
              por <span className="text-white">{room.owner.username}</span>
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="status-online" />
              <span className="text-gray-400">
                {room.online_count} online
              </span>
            </div>

            <div className="text-gray-400">
              {room.participants}/{room.max_users} participantes
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-dark-surface rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                isFull
                  ? 'bg-red-500'
                  : percentage > 80
                  ? 'bg-neon-yellow'
                  : 'bg-neon-cyan'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {room.is_private && (
              <Badge variant="warning" size="sm">
                🔒 Privada
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
