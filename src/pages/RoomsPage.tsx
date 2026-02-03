import { useState, useMemo } from 'react'
import { Search, Plus, Users } from 'lucide-react'
import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import { RoomCard } from '../components/rooms/RoomCard'
import { mockRooms, roomCategories } from '../data/mockRooms'

export const RoomsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRooms = useMemo(() => {
    return mockRooms.filter((room) => {
      const matchesCategory = selectedCategory === 'all' || room.category === selectedCategory
      const matchesSearch =
        searchQuery === '' ||
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  const totalOnline = mockRooms.reduce((acc, r) => acc + r.online_count, 0)

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Salas de Chat</h1>
            <p className="text-dark-500 mt-1.5 text-sm">Escolha uma sala e comece a conversar!</p>
          </div>
          <button className="self-start md:self-auto btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Criar Sala
            <span className="text-[11px] text-dark-500">(Basic+)</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-white">{mockRooms.length}</div>
            <div className="text-[11px] text-dark-500 mt-0.5">Salas Ativas</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-white">{totalOnline}</div>
            <div className="text-[11px] text-dark-500 mt-0.5">Online Agora</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-primary-400">{filteredRooms.length}</div>
            <div className="text-[11px] text-dark-500 mt-0.5">Resultados</div>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input type="text" placeholder="Buscar sala por nome..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-10" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {roomCategories.map((cat) => (
                <button key={cat.value} onClick={() => setSelectedCategory(cat.value)} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${selectedCategory === cat.value ? 'bg-primary-600 text-white' : 'bg-white/[0.04] text-dark-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'}`}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredRooms.map((room) => (<RoomCard key={room.id} room={room} />))}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-dark-300 mb-2">Nenhuma sala encontrada</h3>
            <p className="text-sm text-dark-500 mb-6">Tente ajustar os filtros ou criar uma nova sala</p>
            <button className="btn-primary flex items-center gap-2 mx-auto"><Plus className="w-4 h-4" />Criar Nova Sala</button>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-dark-500">
          <Users className="w-3.5 h-3.5" /><span>{totalOnline} pessoas online agora</span><span className="status-online" />
        </div>
      </main>
      <Footer />
    </div>
  )
}
