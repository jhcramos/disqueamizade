import { useState, useMemo } from 'react'
import { Search, Star, MapPin, Plus, X, Calendar, MessageCircle } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { mockCreators } from '@/data/mockCreators'

const SERVICE_CATEGORIES = [
  { id: 'all', name: 'Todos', emoji: '🌟' },
  { id: 'aulas', name: 'Aulas', emoji: '📚' },
  { id: 'coaching', name: 'Coaching', emoji: '🎯' },
  { id: 'terapia', name: 'Terapia', emoji: '🧘' },
  { id: 'entretenimento', name: 'Entretenimento', emoji: '🎭' },
  { id: 'consultoria', name: 'Consultoria', emoji: '💼' },
  { id: 'tarot', name: 'Tarot & Místico', emoji: '🔮' },
  { id: 'musica', name: 'Música', emoji: '🎵' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
]

export const MarketplacePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'reviews'>('rating')
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)

  const filteredCreators = useMemo(() => {
    let results = [...mockCreators]
    
    if (selectedCategory !== 'all') {
      results = results.filter(c =>
        c.serviceCategory.toLowerCase().includes(selectedCategory)
      )
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

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Marketplace</h1>
            <p className="text-dark-500 mt-1.5 text-sm">
              Conecte-se com profissionais e ofereça seus serviços!
            </p>
          </div>
          <button className="self-start md:self-auto btn-amber flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Oferecer Serviço
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                  : 'text-dark-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Buscar serviço ou profissional..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rating' | 'price' | 'reviews')}
            className="input w-auto min-w-[160px]"
          >
            <option value="rating">⭐ Melhor avaliação</option>
            <option value="price">💰 Menor preço</option>
            <option value="reviews">📊 Mais avaliados</option>
          </select>
        </div>

        {/* Results */}
        <p className="text-sm text-dark-500 mb-4">{filteredCreators.length} profissionais encontrados</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCreators.map((creator) => (
            <button
              key={creator.id}
              onClick={() => setSelectedProvider(creator.id)}
              className="card-interactive p-5 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <img src={creator.avatar} alt={creator.name} className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                  {creator.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-dark-950" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white truncate">{creator.name}</h3>
                    {creator.isFeatured && <span className="text-amber-400 text-xs">⭐</span>}
                  </div>
                  <p className="text-xs text-dark-500 mb-2">{creator.serviceEmoji} {creator.service}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" /> {creator.rating}
                    </span>
                    <span className="text-dark-500">({creator.reviewCount})</span>
                    <span className="text-dark-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {creator.city}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <div className="flex flex-wrap gap-1">
                  {creator.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[10px] text-dark-400">{tag}</span>
                  ))}
                </div>
                <span className="text-sm font-bold text-amber-400">
                  {creator.priceInFichas}⭐
                </span>
              </div>
            </button>
          ))}
        </div>

        {filteredCreators.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhum profissional encontrado</h3>
            <p className="text-dark-500 text-sm">Tente outra categoria ou busca.</p>
          </div>
        )}
      </main>
      <Footer />

      {/* Provider Detail Modal */}
      {provider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProvider(null)}>
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img src={provider.avatar} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                  <div>
                    <h2 className="text-xl font-bold text-white">{provider.name}</h2>
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

              {/* Bio */}
              <p className="text-sm text-dark-300 mb-6">{provider.bio}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="card p-3 text-center">
                  <div className="text-lg font-bold text-white">{provider.sessionsCompleted}</div>
                  <div className="text-[10px] text-dark-500">Sessões</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="text-lg font-bold text-emerald-400">{provider.satisfactionRate}%</div>
                  <div className="text-[10px] text-dark-500">Satisfação</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="text-lg font-bold text-amber-400">{provider.priceInFichas}⭐</div>
                  <div className="text-[10px] text-dark-500">Por sessão</div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {provider.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/15 text-xs text-primary-400">{tag}</span>
                ))}
              </div>

              {/* Schedule */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-400" /> Disponibilidade
                </h3>
                <div className="flex flex-wrap gap-2">
                  {provider.schedule.map((slot) => (
                    <span key={slot} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/5 text-xs text-dark-300">{slot}</span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBookingModal(true)
                    setSelectedProvider(null)
                  }}
                  className="btn-amber flex-1 py-3"
                >
                  <Star className="w-4 h-4" />
                  Agendar — {provider.priceInFichas}⭐
                </button>
                <button className="btn-secondary py-3">
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowBookingModal(false)}>
          <div className="card w-full max-w-md animate-slide-up p-8 text-center" onClick={(e) => e.stopPropagation()}>
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
