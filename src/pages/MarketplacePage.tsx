import { useState, useMemo } from 'react'
import { Search, TrendingUp, Briefcase } from 'lucide-react'
import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import { CreatorCard } from '../components/creators/CreatorCard'
import { mockCreators, serviceCategories, getFeaturedCreators, getOnlineCreators } from '../data/mockCreators'

export const MarketplacePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const featuredCreators = getFeaturedCreators()
  const onlineCreators = getOnlineCreators()

  const filteredCreators = useMemo(() => {
    return mockCreators.filter((creator) => {
      const matchesCategory = selectedCategory === 'all' || creator.serviceCategory === selectedCategory
      const matchesSearch = searchQuery === '' || creator.name.toLowerCase().includes(searchQuery.toLowerCase()) || creator.service.toLowerCase().includes(searchQuery.toLowerCase()) || creator.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Marketplace</h1>
            <p className="text-dark-500 mt-1.5 text-sm">Encontre profissionais incríveis para sessões ao vivo</p>
          </div>
          <button className="self-start md:self-auto btn-primary flex items-center gap-2">
            <Briefcase className="w-4 h-4" />Oferecer Serviço
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-white">{mockCreators.length}</div>
            <div className="text-[11px] text-dark-500 mt-0.5">Creators</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-success">{onlineCreators.length}</div>
            <div className="text-[11px] text-dark-500 mt-0.5">Online Agora</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-amber-400">{serviceCategories.length - 1}</div>
            <div className="text-[11px] text-dark-500 mt-0.5">Categorias</div>
          </div>
        </div>

        {selectedCategory === 'all' && searchQuery === '' && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Creators em Destaque</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredCreators.map((c) => (<CreatorCard key={c.id} creator={c} />))}
            </div>
          </div>
        )}

        <div className="card p-4 mb-6">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input type="text" placeholder="Buscar por nome, serviço ou tag..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-10" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {serviceCategories.map((cat) => (
                <button key={cat.value} onClick={() => setSelectedCategory(cat.value)} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${selectedCategory === cat.value ? 'bg-primary-600 text-white' : 'bg-white/[0.04] text-dark-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'}`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">{selectedCategory === 'all' ? 'Todos os Creators' : serviceCategories.find((c) => c.value === selectedCategory)?.label}</h2>
          <p className="text-xs text-dark-500 mt-0.5">{filteredCreators.length} encontrados</p>
        </div>

        {filteredCreators.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCreators.map((c) => (<CreatorCard key={c.id} creator={c} />))}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-dark-300 mb-2">Nenhum creator encontrado</h3>
            <p className="text-sm text-dark-500">Tente ajustar sua busca ou filtros</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
