import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star, MapPin, X, Calendar, ChevronLeft, ChevronRight, Eye, Users, Zap, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { AgeGate } from '@/components/common/AgeGate'
import { mockCreators } from '@/data/mockCreators'

const VISUAL_CATEGORIES = [
  { value: 'all', label: 'Todos', emoji: '🌟', color: 'from-purple-500/20 to-pink-500/20' },
  { value: 'coaching', label: 'Coaching', emoji: '🧠', color: 'from-blue-500/20 to-cyan-500/20' },
  { value: 'musica', label: 'Música', emoji: '🎸', color: 'from-orange-500/20 to-red-500/20' },
  { value: 'espiritualidade', label: 'Espiritualidade', emoji: '🔮', color: 'from-violet-500/20 to-purple-500/20' },
  { value: 'fitness', label: 'Fitness', emoji: '💪', color: 'from-green-500/20 to-emerald-500/20' },
  { value: 'arte', label: 'Arte', emoji: '🎨', color: 'from-pink-500/20 to-rose-500/20' },
  { value: 'terapia', label: 'Terapia', emoji: '🗣️', color: 'from-teal-500/20 to-cyan-500/20' },
  { value: 'educacao', label: 'Educação', emoji: '📚', color: 'from-indigo-500/20 to-blue-500/20' },
  { value: 'culinaria', label: 'Culinária', emoji: '🍳', color: 'from-amber-500/20 to-yellow-500/20' },
  { value: 'adulto', label: '🔞 Adulto', emoji: '💋', color: 'from-red-500/20 to-pink-500/20' },
  { value: 'tech', label: 'Tech', emoji: '💻', color: 'from-cyan-500/20 to-blue-500/20' },
  { value: 'saude', label: 'Saúde', emoji: '🥗', color: 'from-lime-500/20 to-green-500/20' },
  { value: 'wellness', label: 'Wellness', emoji: '🧘', color: 'from-emerald-500/20 to-teal-500/20' },
  { value: 'gastronomia', label: 'Gastronomia', emoji: '🍷', color: 'from-rose-500/20 to-red-500/20' },
]

export const MarketplacePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'reviews'>('rating')
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const featuredCreators = useMemo(() => mockCreators.filter(c => c.isFeatured || c.isLive), [])
  const liveCreators = useMemo(() => mockCreators.filter(c => c.isLive), [])
  const adultCreators = useMemo(() => mockCreators.filter(c => c.serviceCategory === 'adulto'), [])

  const filteredCreators = useMemo(() => {
    let results = [...mockCreators]
    if (selectedCategory !== 'all') {
      results = results.filter(c => c.serviceCategory === selectedCategory)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.service.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    results.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'price') return a.priceInFichas - b.priceInFichas
      return b.reviewCount - a.reviewCount
    })
    return results
  }, [selectedCategory, searchQuery, sortBy])

  const provider = selectedProvider ? mockCreators.find(c => c.id === selectedProvider) : null

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 w-full pb-24 md:pb-8">

        {/* ═══ Hero Section ═══ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-sm text-purple-300 mb-6">
                <Zap className="w-4 h-4" /> Marketplace de Creators
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
                Conecte-se com os Melhores Influencers
              </h1>
              <p className="text-dark-400 text-lg">
                Coaching, aulas, shows, consultas e muito mais. Tudo ao vivo, tudo com fichas.
              </p>
            </div>
            {/* Stats */}
            <div className="flex justify-center gap-8 md:gap-16">
              {[
                { label: 'Creators', value: '200+', icon: Users },
                { label: 'Sessões', value: '50k+', icon: TrendingUp },
                { label: 'Satisfação', value: '97%', icon: Star },
                { label: 'Ao Vivo Agora', value: String(liveCreators.length), icon: Eye },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <s.icon className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                  <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-dark-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Featured Carousel ═══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">⭐ Creators em Destaque</h2>
            <div className="flex gap-2">
              <button onClick={() => scrollCarousel('left')} className="p-2 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/10 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollCarousel('right')} className="p-2 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/10 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div ref={carouselRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
            {featuredCreators.map(c => (
              <Link
                key={c.id}
                to={`/creator/${c.id}`}
                className="flex-shrink-0 w-[280px] snap-start rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden hover:border-purple-500/30 transition-all group"
              >
                <div className="relative h-36 overflow-hidden">
                  <img src={c.avatar} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent" />
                  {c.isLive && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="text-xs font-bold text-white">LIVE</span>
                      <span className="text-xs text-white/80">{c.liveViewers}</span>
                    </div>
                  )}
                  {c.camaroteIsOpen && !c.isLive && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur-sm text-xs font-bold text-white">
                      Camarote Aberto
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white truncate">{c.name}</h3>
                    {c.isVerified && <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-dark-400 mb-3">{c.serviceEmoji} {c.service}</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-amber-400 text-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {c.rating}
                    </span>
                    <span className="text-sm font-bold text-amber-400">{c.priceInFichas} ⭐</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ Live Now ═══ */}
        {liveCreators.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> Live Agora
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveCreators.map(c => (
                <Link
                  key={c.id}
                  to={`/creator/${c.id}`}
                  className="relative rounded-2xl overflow-hidden group border border-red-500/20 hover:border-red-500/40 transition-all"
                >
                  <div className="aspect-video overflow-hidden">
                    <img src={c.avatar} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <img src={c.avatar} alt="" className="w-8 h-8 rounded-full border-2 border-red-500" />
                      <div>
                        <h3 className="text-sm font-bold text-white">{c.name}</h3>
                        <p className="text-xs text-dark-400">{c.service}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-red-400">
                        <Eye className="w-3 h-3" /> {c.liveViewers} assistindo
                      </div>
                      <span className="text-xs font-bold text-amber-400">{c.priceInFichas} ⭐</span>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-bold text-white">LIVE</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══ Adult Section (18+) ═══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
          <AgeGate>
          <div className="relative rounded-2xl overflow-hidden border border-pink-500/20 bg-gradient-to-r from-pink-950/40 via-dark-950 to-red-950/40">
            {/* 18+ Banner */}
            <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-600/20 to-red-600/20 border-b border-pink-500/20">
              <span className="text-2xl">🔞</span>
              <h2 className="text-xl md:text-2xl font-bold text-white">Área Adulta</h2>
              <span className="px-3 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-xs text-pink-300 font-bold">+18</span>
              <span className="text-sm text-dark-400 ml-auto hidden sm:block">Conteúdo exclusivo para maiores de 18 anos</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {adultCreators.map(c => (
                  <Link
                    key={c.id}
                    to={`/creator/${c.id}`}
                    className="rounded-xl bg-white/[0.03] border border-pink-500/10 overflow-hidden hover:border-pink-500/30 transition-all group"
                  >
                    <div className="p-4 flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <img src={c.avatar} alt={c.name} className="w-14 h-14 rounded-xl object-cover border border-pink-500/20 group-hover:scale-105 transition-transform" />
                        {c.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-dark-950" />
                        )}
                        {c.isLive && (
                          <div className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded bg-red-500 text-[9px] font-bold text-white">LIVE</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white truncate text-sm">{c.name}</h3>
                          {c.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-pink-400/70 mb-1">{c.serviceEmoji} {c.service}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" /> {c.rating}
                          </span>
                          <span className="text-dark-500">({c.reviewCount})</span>
                          <span className="text-sm font-bold text-amber-400 ml-auto">{c.priceInFichas} ⭐</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-pink-500/10 text-[10px] text-pink-400/60">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          </AgeGate>
        </section>

        {/* ═══ Categories Grid ═══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Categorias</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {VISUAL_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-purple-500/15 border-purple-500/30 scale-105'
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs text-dark-300 font-medium text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ═══ Search + Sort + Grid ═══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="Buscar creator, serviço ou tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-dark-500 focus:outline-none focus:border-purple-500/40 transition-all"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'price' | 'reviews')}
              className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-purple-500/40 min-w-[180px]"
            >
              <option value="rating">⭐ Melhor avaliação</option>
              <option value="price">💰 Menor preço</option>
              <option value="reviews">📊 Mais avaliados</option>
            </select>
          </div>

          <p className="text-sm text-dark-500 mb-4">{filteredCreators.length} creators encontrados</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCreators.map(c => (
              <div
                key={c.id}
                className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden hover:border-purple-500/20 transition-all group"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <Link to={`/creator/${c.id}`} className="relative flex-shrink-0">
                      <img src={c.avatar} alt={c.name} className="w-16 h-16 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform" />
                      {c.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-dark-950" />
                      )}
                      {c.isLive && (
                        <div className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded bg-red-500 text-[9px] font-bold text-white">LIVE</div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={`/creator/${c.id}`} className="font-bold text-white truncate hover:text-purple-300 transition-colors">{c.name}</Link>
                        {c.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-dark-500 mb-1.5">{c.serviceEmoji} {c.service}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" /> {c.rating}
                        </span>
                        <span className="text-dark-500">({c.reviewCount})</span>
                        <span className="text-dark-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {c.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Camarote info */}
                  {c.camaroteIsOpen && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">Camarote Aberto</span>
                      <span className="text-xs text-dark-400 ml-auto">{c.camaroteViewers}/{c.camaroteCapacity}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[10px] text-dark-400">{tag}</span>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-amber-400">{c.priceInFichas} ⭐</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Link to={`/creator/${c.id}`} className="flex-1 text-center py-2 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/25 transition-all">
                      Ver Perfil
                    </Link>
                    {c.camaroteIsOpen && (
                      <button className="flex-1 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/25 transition-all">
                        Visitar Camarote
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCreators.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">Nenhum creator encontrado</h3>
              <p className="text-dark-500 text-sm">Tente outra categoria ou busca.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />

      {/* Provider Detail Modal */}
      {provider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProvider(null)}>
          <div className="bg-dark-950 border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img src={provider.avatar} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{provider.name}</h2>
                      {provider.isVerified && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-sm text-dark-400">{provider.serviceEmoji} {provider.service}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-amber-400 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400" /> {provider.rating}</span>
                      <span className="text-xs text-dark-500">({provider.reviewCount} avaliações)</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedProvider(null)} className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-dark-300 mb-6">{provider.bio}</p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 text-center">
                  <div className="text-lg font-bold text-white">{provider.sessionsCompleted}</div>
                  <div className="text-[10px] text-dark-500">Sessões</div>
                </div>
                <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 text-center">
                  <div className="text-lg font-bold text-emerald-400">{provider.satisfactionRate}%</div>
                  <div className="text-[10px] text-dark-500">Satisfação</div>
                </div>
                <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 text-center">
                  <div className="text-lg font-bold text-amber-400">{provider.priceInFichas}⭐</div>
                  <div className="text-[10px] text-dark-500">Por sessão</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {provider.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/15 text-xs text-purple-400">{tag}</span>
                ))}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" /> Disponibilidade
                </h3>
                <div className="flex flex-wrap gap-2">
                  {provider.schedule.map(slot => (
                    <span key={slot} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/5 text-xs text-dark-300">{slot}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Link to={`/creator/${provider.id}`} className="btn-primary flex-1 py-3 text-center">
                  Ver Perfil Completo
                </Link>
                <button
                  onClick={() => {
                    setShowBookingModal(true)
                    setSelectedProvider(null)
                  }}
                  className="btn-amber flex-1 py-3"
                >
                  Agendar — {provider.priceInFichas}⭐
                </button>
              </div>
              {provider.camaroteIsOpen && (
                <button className="w-full mt-3 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-sm font-medium hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" /> Visitar Camarote ({provider.camaroteViewers}/{provider.camaroteCapacity})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowBookingModal(false)}>
          <div className="bg-dark-950 border border-white/10 rounded-2xl w-full max-w-md animate-slide-up p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Agendamento Solicitado!</h2>
            <p className="text-dark-400 text-sm mb-6">
              Sua solicitação foi enviada ao profissional. Você receberá uma notificação quando for aceita.
            </p>
            <button onClick={() => setShowBookingModal(false)} className="btn-primary w-full py-3">Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}
