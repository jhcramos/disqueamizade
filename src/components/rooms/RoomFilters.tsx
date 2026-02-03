interface RoomFiltersProps {
  selectedTheme: string
  onThemeChange: (theme: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

const themes = [
  { value: 'all', label: 'Todos', icon: '🌟' },
  { value: 'vinhos', label: 'Vinhos', icon: '🍷' },
  { value: 'idiomas', label: 'Idiomas', icon: '🌍' },
  { value: 'cidades', label: 'Cidades', icon: '🏙️' },
  { value: 'musica', label: 'Música', icon: '🎵' },
]

export const RoomFilters = ({
  selectedTheme,
  onThemeChange,
  searchQuery,
  onSearchChange,
}: RoomFiltersProps) => {
  return (
    <div className="glass-card p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-rajdhani uppercase tracking-wider text-gray-400 mb-2">
            Buscar Sala
          </label>
          <input
            type="text"
            placeholder="Nome da sala..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-neon"
          />
        </div>

        {/* Theme Filter */}
        <div>
          <label className="block text-sm font-rajdhani uppercase tracking-wider text-gray-400 mb-2">
            Filtrar por Tema
          </label>
          <div className="flex gap-2 flex-wrap">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => onThemeChange(theme.value)}
                className={`px-4 py-2 rounded-lg font-rajdhani font-semibold uppercase text-sm transition-all ${
                  selectedTheme === theme.value
                    ? 'bg-neon-cyan text-dark-bg shadow-neon-cyan'
                    : 'bg-dark-surface/50 text-gray-400 hover:bg-dark-surface hover:text-neon-cyan'
                }`}
              >
                {theme.icon} {theme.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
