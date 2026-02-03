import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import type { MockCreator } from '../../types'

interface FeaturedCarouselProps {
  profiles: MockCreator[]
  perSlide?: number
  intervalMs?: number
}

export const FeaturedCarousel = ({
  profiles,
  perSlide = 4,
  intervalMs = 5000,
}: FeaturedCarouselProps) => {
  const [current, setCurrent] = useState(0)
  const totalSlides = Math.ceil(profiles.length / perSlide)

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % totalSlides)
  }, [totalSlides])

  const prev = () => {
    setCurrent((p) => (p - 1 + totalSlides) % totalSlides)
  }

  // Auto-rotate
  useEffect(() => {
    const timer = setInterval(next, intervalMs)
    return () => clearInterval(timer)
  }, [next, intervalMs])

  // Reset to 0 when resizing could change perSlide
  const visible = profiles.slice(
    current * perSlide,
    current * perSlide + perSlide
  )

  return (
    <div>
      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {visible.map((profile) => (
          <Link key={profile.id} to={`/profile/${profile.id}`}>
            <div className="card-interactive overflow-hidden group">
              {/* Photo */}
              <div className="relative aspect-square bg-surface overflow-hidden">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />

                {/* Online badge */}
                {profile.isOnline && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-dark-950/70 backdrop-blur-sm border border-white/10">
                    <span className="status-online" />
                    <span className="text-[11px] text-success font-medium">Online</span>
                  </div>
                )}

                {/* Service badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-950/70 backdrop-blur-sm border border-white/10">
                  <span className="text-sm">{profile.serviceEmoji}</span>
                  <span className="text-xs text-white font-medium">{profile.service}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3.5">
                <h3 className="font-semibold text-white text-sm group-hover:text-primary-400 transition-colors">
                  {profile.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-amber-400 font-bold">{profile.rating}</span>
                  <span className="text-[11px] text-dark-500">({profile.reviewCount})</span>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/[0.06]">
                  <span className="text-amber-400 font-bold text-sm">{profile.priceInFichas} fichas</span>
                  <span className="text-[11px] text-primary-400 font-medium">Ver Perfil →</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        {/* Prev/Next arrows */}
        <button
          onClick={prev}
          className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-dark-400 hover:text-white hover:bg-white/[0.08] transition-all"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2 bg-primary-500'
                  : 'w-2 h-2 bg-white/15 hover:bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Next arrow */}
        <button
          onClick={next}
          className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-dark-400 hover:text-white hover:bg-white/[0.08] transition-all"
          aria-label="Próximo"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
