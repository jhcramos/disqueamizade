import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common'
import { mockServices, serviceCategories } from '@/data/mockServices'
import {
  Search,
  Star,
  Clock,
  ShoppingBag,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'

export const MarketplacePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredServices = useMemo(() => {
    return mockServices.filter((service) => {
      const matchesCategory =
        selectedCategory === 'all' || service.category === selectedCategory
      const matchesSearch =
        searchQuery === '' ||
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DA</span>
              </div>
              <h1 className="text-lg font-bold text-zinc-50 font-jakarta">
                Disque Amizade
              </h1>
            </Link>

            <div className="flex items-center gap-3">
              <Link to="/rooms">
                <Button variant="ghost" size="sm">
                  Salas
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="primary" size="sm">
                  Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-50 mb-2 font-jakarta">
            Marketplace de Talentos
          </h1>
          <p className="text-zinc-500">
            Conecte-se com especialistas e aprenda algo novo
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar serviços, habilidades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 flex-wrap">
              {serviceCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-glow-violet'
                      : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-50">
                  {mockServices.length}
                </div>
                <div className="text-xs text-zinc-500">Serviços Disponíveis</div>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-50">
                  {new Set(mockServices.map((s) => s.provider.id)).size}
                </div>
                <div className="text-xs text-zinc-500">Profissionais Ativos</div>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-50">
                  {mockServices.reduce(
                    (acc, s) => acc + s.provider.total_services_completed,
                    0
                  )}
                </div>
                <div className="text-xs text-zinc-500">Sessões Realizadas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 hover:-translate-y-0.5 transition-all group"
              >
                {/* Provider */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={service.provider.avatar_url}
                    alt={service.provider.username}
                    className="w-10 h-10 rounded-full ring-2 ring-zinc-800 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-300 truncate">
                      {service.provider.username}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-amber-300">
                          {service.provider.rating_average}
                        </span>
                      </div>
                      <span className="text-zinc-600 text-xs">·</span>
                      <span className="text-xs text-zinc-500">
                        {service.provider.total_services_completed} sessões
                      </span>
                    </div>
                  </div>
                </div>

                {/* Service Info */}
                <h3 className="text-lg font-semibold text-zinc-50 mb-2 group-hover:text-violet-300 transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
                  {service.description}
                </p>

                {/* Tags */}
                <div className="flex gap-1.5 flex-wrap mb-4">
                  {service.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 bg-zinc-800/80 text-zinc-400 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-300">
                        {service.price_stars}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">{service.duration_minutes}min</span>
                    </div>
                  </div>
                  <Button variant="primary" size="sm">
                    Agendar
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 inline" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">
              Nenhum serviço encontrado
            </h3>
            <p className="text-zinc-600 text-sm">
              Tente ajustar os filtros ou buscar por outro termo
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
