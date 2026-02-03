import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RoomCard } from '@/components/rooms/RoomCard'
import { RoomFilters } from '@/components/rooms/RoomFilters'
import { Button } from '@/components/common'
import { mockRooms } from '@/data/mockRooms'
import { Users, Radio, Search, Plus } from 'lucide-react'

export const RoomsPage = () => {
  const [selectedTheme, setSelectedTheme] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRooms = useMemo(() => {
    return mockRooms.filter((room) => {
      const matchesTheme = selectedTheme === 'all' || room.theme === selectedTheme
      const matchesSearch =
        searchQuery === '' ||
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesTheme && matchesSearch
    })
  }, [selectedTheme, searchQuery])

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
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1.5 inline" />
                Criar Sala
              </Button>
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
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-50 mb-2">
            Salas de Chat
          </h1>
          <p className="text-zinc-500">
            Escolha uma sala e comece a conversar
          </p>
        </div>

        {/* Filters */}
        <RoomFilters
          selectedTheme={selectedTheme}
          onThemeChange={setSelectedTheme}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Radio className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-50">
                  {mockRooms.length}
                </div>
                <div className="text-xs text-zinc-500">Salas Ativas</div>
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
                  {mockRooms.reduce((acc, room) => acc + room.online_count, 0)}
                </div>
                <div className="text-xs text-zinc-500">Usuários Online</div>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-50">
                  {filteredRooms.length}
                </div>
                <div className="text-xs text-zinc-500">Resultados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">
              Nenhuma sala encontrada
            </h3>
            <p className="text-zinc-600 text-sm">
              Tente ajustar os filtros ou criar uma nova sala
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
