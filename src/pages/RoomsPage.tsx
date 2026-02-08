import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, Users, Zap } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { RoomCard } from '@/components/rooms/RoomCard'
import { CreateRoomModal } from '@/components/rooms/CreateRoomModal'
import { mockRooms, roomCategories } from '@/data/mockRooms'
import { databaseService } from '@/services/supabase/database.service'

export const RoomsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [dbRooms, setDbRooms] = useState<any[] | null>(null)

  // Fetch rooms from Supabase, fall back to mock
  useEffect(() => {
    databaseService.getRooms()
      .then((rooms) => {
        if (rooms && rooms.length > 0) {
          // Map DB rooms to MockRoom shape for RoomCard compat
          const mapped = rooms.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description || '',
            category: r.category || 'cidade',
            theme: r.theme || '',
            participants: 0,
            max_users: r.max_users || 30,
            is_private: r.is_private || false,
            owner: { username: 'Sistema', avatar: '' },
            has_video: true,
            online_count: Math.floor(Math.random() * 15),
            badge_color: 'primary',
            is_official: r.is_fixed || true,
            room_type: r.room_type || 'official',
            entry_cost_fichas: r.entry_cost_fichas || 0,
            is_fixed: r.is_fixed || false,
          }))
          setDbRooms(mapped)
        }
      })
      .catch(() => { /* use mock data */ })
  }, [])

  const rooms = dbRooms || mockRooms

  const filteredRooms = useMemo(() => {
    return rooms.filter((room: any) => {
      const matchesCategory = selectedCategory === 'all' || room.category === selectedCategory
      const matchesSearch =
        searchQuery === '' ||
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery, rooms])

  const officialRooms = filteredRooms.filter((r: any) => r.is_official)
  const communityRooms = filteredRooms.filter((r: any) => !r.is_official)
  const totalOnline = rooms.reduce((acc: number, r: any) => acc + (r.online_count || 0), 0)

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Salas de Chat</h1>
            <p className="text-dark-500 mt-1.5 text-sm">
              Escolha uma sala e converse com vídeo — use máscaras virtuais para ficar anônimo 🎭
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
            <div className="text-xl md:text-2xl font-bold text-white">{rooms.length}</div>
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
