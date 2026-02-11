import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, ChevronRight } from 'lucide-react'

interface RoomItem {
  emoji: string
  name: string
  slug: string
  online: number
  category: string
  categoryColor: string
}

const ALL_ROOMS: RoomItem[] = [
  { emoji: '💬', name: 'Bate-Papo Geral', slug: 'geral', online: 47, category: 'Geral', categoryColor: 'bg-blue-500/20 text-blue-300' },
  { emoji: '🏙️', name: 'São Paulo', slug: 'sao-paulo', online: 63, category: 'Cidades', categoryColor: 'bg-cyan-500/20 text-cyan-300' },
  { emoji: '🌊', name: 'Rio de Janeiro', slug: 'rio-de-janeiro', online: 55, category: 'Cidades', categoryColor: 'bg-cyan-500/20 text-cyan-300' },
  { emoji: '💕', name: 'Paquera & Amizade', slug: 'paquera', online: 72, category: 'Interesses', categoryColor: 'bg-pink-500/20 text-pink-300' },
  { emoji: '🎮', name: 'Gamers BR', slug: 'gamers', online: 38, category: 'Interesses', categoryColor: 'bg-purple-500/20 text-purple-300' },
  { emoji: '🍺', name: 'Bebida & Papo', slug: 'bebida-papo', online: 29, category: 'Bebida & Papo', categoryColor: 'bg-amber-500/20 text-amber-300' },
  { emoji: '🌎', name: 'English Room', slug: 'english', online: 21, category: 'Idiomas', categoryColor: 'bg-green-500/20 text-green-300' },
  { emoji: '🎵', name: 'Música & Som', slug: 'musica', online: 34, category: 'Interesses', categoryColor: 'bg-purple-500/20 text-purple-300' },
  { emoji: '🔥', name: '+18 Chat', slug: 'mais-18', online: 58, category: '+18', categoryColor: 'bg-red-500/20 text-red-300' },
  { emoji: '👥', name: 'Comunidade', slug: 'comunidade', online: 41, category: 'Comunidade', categoryColor: 'bg-emerald-500/20 text-emerald-300' },
]

const CATEGORY_ROOM_MAPPING: Record<string, string[]> = {
  chat: ['Geral', 'Interesses', 'Comunidade'],
  video: ['Geral', 'Interesses'],
  cidades: ['Cidades'],
  seguranca: ['Geral', 'Comunidade'],
  dicas: ['Geral', 'Interesses'],
  relacionamento: ['Interesses', '+18'],
  comparativo: ['Geral', 'Cidades', 'Interesses'],
}

interface RelatedRoomsProps {
  category: string
  tags?: string[]
}

export const RelatedRooms = ({ category, tags: _tags = [] }: RelatedRoomsProps) => {
  const [rooms] = useState<RoomItem[]>(() => {
    const relevantCategories = CATEGORY_ROOM_MAPPING[category] || ['Geral', 'Interesses']
    const filtered = ALL_ROOMS.filter(r => relevantCategories.includes(r.category))
    // Add some randomness to online counts
    return (filtered.length >= 3 ? filtered : ALL_ROOMS)
      .slice(0, 4)
      .map(r => ({ ...r, online: r.online + Math.floor(Math.random() * 20) - 10 }))
  })

  return (
    <div className="lg:sticky lg:top-6">
      <div className="bg-dark-900 rounded-2xl border border-white/5 p-5">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-pink-400" />
          Salas Relacionadas
        </h3>

        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-1 px-1 snap-x snap-mandatory">
          {rooms.map(room => (
            <Link
              key={room.slug}
              to={`/rooms#${room.slug}`}
              className="flex-shrink-0 w-56 lg:w-full snap-start"
            >
              <div className="bg-dark-800 rounded-xl p-4 border border-white/5 hover:border-pink-500/30 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{room.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-pink-400 transition-colors">
                      {room.name}
                    </h4>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${room.categoryColor}`}>
                      {room.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-medium">{Math.max(5, room.online)} online</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          to="/rooms"
          className="mt-4 flex items-center justify-center gap-1 text-sm text-pink-400 hover:text-pink-300 font-medium transition-colors"
        >
          Ver todas as salas <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
