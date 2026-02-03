import { Search } from 'lucide-react'

interface RoomFiltersProps {
  selectedTheme: string
  onThemeChange: (theme: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

const themes = [
  { value: 'all', label: 'Todos' },
  { value: 'vinhos', label: 'Vinhos' },
  { value: 'idiomas', label: 'Idiomas' },
  { value: 'cidades', label: 'Cidades' },
  { value: 'musica', label: 'Música' },
]

export const RoomFilters = ({
  selectedTheme,
  onThemeChange,
  searchQuery,
  onSearchChange,
}: RoomFiltersProps) => {
  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Buscar Sala
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Nome da sala..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        {/* Theme Filter */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Filtrar por Tema
          </label>
          <div className="flex gap-2 flex-wrap">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => onThemeChange(theme.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTheme === theme.value
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-glow-violet'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
