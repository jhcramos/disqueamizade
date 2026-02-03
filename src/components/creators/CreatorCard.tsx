import { Link } from 'react-router-dom'
import { Star, MapPin } from 'lucide-react'
import type { MockCreator } from '../../types'

interface CreatorCardProps {
  creator: MockCreator
  compact?: boolean
}

export const CreatorCard = ({ creator, compact = false }: CreatorCardProps) => {
  return (
    <Link to={`/profile/${creator.id}`}>
      <div className="card rounded-2xl transition-all duration-300 hover:border-primary/20 hover:shadow-card-hover group overflow-hidden h-full flex flex-col">
        {/* Avatar section */}
        <div className="relative">
          <div className="aspect-square bg-surface overflow-hidden">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Online indicator */}
          {creator.isOnline && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-dark-bg/80 backdrop-blur-sm border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-semibold">Online</span>
            </div>
          )}

          {/* Featured badge */}
          {creator.isFeatured && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-bold">
              ⭐ Destaque
            </div>
          )}

          {/* Service badge */}
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-dark-bg/80 backdrop-blur-sm border border-white/10">
            <span className="text-lg mr-1">{creator.serviceEmoji}</span>
            <span className="text-sm text-primary-light font-semibold">{creator.service}</span>
          </div>
        </div>

        {/* Info section */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors">
              {creator.name}
            </h3>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span className="text-sm font-bold text-accent">{creator.rating}</span>
              <span className="text-xs text-gray-500">({creator.reviewCount})</span>
            </div>
          </div>

          {!compact && (
            <>
              <div className="flex items-center gap-1 mb-2 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {creator.city}
              </div>
              <p className="text-sm text-gray-400 line-clamp-2 mb-3">{creator.bio}</p>
            </>
          )}

          {/* Tags */}
          {!compact && (
            <div className="flex flex-wrap gap-1 mb-3">
              {creator.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-surface text-gray-400 border border-white/5">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-1">
              <span className="text-accent font-bold">{creator.priceInFichas}</span>
              <span className="text-xs text-gray-500">fichas/sessão</span>
            </div>
            <span className="text-xs text-primary-light font-semibold hover:text-white transition-colors">
              Ver Perfil →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
