import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Users, Zap, Crown, Sparkles } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { RoomCard } from '@/components/rooms/RoomCard'
import { CreateRoomModal } from '@/components/rooms/CreateRoomModal'
import { mockRooms, roomCategories } from '@/data/mockRooms'

// Camarotes VIP - salas criadas por usuários (20💎)
const mockCamarotesVIP = [
  { id: 'vip1', name: 'Lounge do Carlos', owner: 'Carlos_RJ', ownerAvatar: 'https://i.pravatar.cc/150?img=3', participants: 3, maxParticipants: 6, isElite: true },
  { id: 'vip2', name: 'Cantinho da Mari', owner: 'Marina_SP', ownerAvatar: 'https://i.pravatar.cc/150?img=9', participants: 2, maxParticipants: 4, isElite: false },
  { id: 'vip3', name: 'Gamers BR', owner: 'Pedro_CWB', ownerAvatar: 'https://i.pravatar.cc/150?img=7', participants: 5, maxParticipants: 8, isElite: false },
]

export const RoomsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  const officialRooms = filteredRooms.filter(r => r.is_official)
  const communityRooms = filteredRooms.filter(r => !r.is_official)
  const totalOnline = mockRooms.reduce((acc, r) => acc + r.online_count, 0)

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Salas de Chat</h1>
            <p className="text-dark-500 mt-1.5 text-sm">
              Escolha uma sala e comece a conversar! Ligue o 145 da amizade 📞
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start md:self-auto btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Criar Sala
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-white">{mockRooms.length}</div>
            <div className="text-[11px] text-dark-500 mt-0.5">Salas Ativas</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-emerald-400 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {totalOnline}
            </div>
            <div className="text-[11px] text-dark-500 mt-0.5">Online Agora</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-primary-400">{filteredRooms.length}</div>
            <div className="text-[11px] text-dark-500 mt-0.5">Resultados</div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="Buscar sala por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                    : 'text-dark-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                Todas
              </button>
              {roomCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                      : 'text-dark-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Camarotes VIP Section - salas criadas por usuários */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-elite-400" />
              <h2 className="text-lg font-bold text-white">Camarotes VIP</h2>
              <span className="badge bg-elite-500/20 text-elite-400 border-elite-500/30">{mockCamarotesVIP.length}</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-elite-500/10 text-elite-400 text-sm font-semibold border border-elite-500/30 hover:bg-elite-500/20 transition-all">
              <Sparkles className="w-4 h-4" />
              Criar Camarote (20💎)
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockCamarotesVIP.map((camarote) => (
              <Link
                key={camarote.id}
                to={`/camarote/${camarote.id}`}
                className="card p-4 hover:border-elite-500/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={camarote.ownerAvatar} 
                        alt={camarote.owner}
                        className={`w-10 h-10 rounded-full border-2 ${camarote.isElite ? 'border-elite-400' : 'border-white/20'}`}
                      />
                      {camarote.isElite && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-elite-500 flex items-center justify-center">
                          <Crown className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-elite-400 transition-colors">{camarote.name}</h3>
                      <p className="text-xs text-dark-500">por {camarote.owner}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-dark-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{camarote.participants}/{camarote.maxParticipants}</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    camarote.participants < camarote.maxParticipants 
                      ? 'bg-conquista-500/20 text-conquista-400' 
                      : 'bg-energia-500/20 text-energia-400'
                  }`}>
                    {camarote.participants < camarote.maxParticipants ? 'Aberto' : 'Lotado'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Official Rooms Section */}
        {officialRooms.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Salas Oficiais</h2>
              <span className="badge badge-amber">{officialRooms.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {officialRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        )}

        {/* Community Rooms Section */}
        {communityRooms.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-bold text-white">Salas da Comunidade</h2>
              <span className="badge badge-primary">{communityRooms.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communityRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        )}

        {/* No rooms found */}
        {filteredRooms.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma sala encontrada</h3>
            <p className="text-dark-500 text-sm">Tente outro filtro ou crie sua própria sala!</p>
          </div>
        )}
      </main>
      <Footer />

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userTier="basic"
      />
    </div>
  )
}
