import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RoomCard } from '@/components/rooms/RoomCard'
import { RoomFilters } from '@/components/rooms/RoomFilters'
import { Button } from '@/components/common'
import { mockRooms } from '@/data/mockRooms'

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
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="perspective-grid"></div>
      </div>

      {/* Header */}
      <header className="border-b border-neon-cyan/30 bg-dark-surface/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-glow-cyan">
                DISQUE AMIZADE
              </h1>
            </Link>

            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
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
          <h1 className="text-4xl md:text-5xl font-bold text-glow-cyan mb-4">
            Salas de Chat
          </h1>
          <p className="text-xl text-gray-400">
            Escolha uma sala e comece a conversar!
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
          <div className="glass-card p-4">
            <div className="text-3xl font-bold text-neon-cyan">
              {mockRooms.length}
            </div>
            <div className="text-sm text-gray-400">Salas Ativas</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-3xl font-bold text-neon-magenta">
              {mockRooms.reduce((acc, room) => acc + room.online_count, 0)}
            </div>
            <div className="text-sm text-gray-400">Usuários Online</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-3xl font-bold text-neon-yellow">
              {filteredRooms.length}
            </div>
            <div className="text-sm text-gray-400">Resultados</div>
          </div>
        </div>

        {/* Rooms Grid */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              Nenhuma sala encontrada
            </h3>
            <p className="text-gray-500">
              Tente ajustar os filtros ou criar uma nova sala
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
