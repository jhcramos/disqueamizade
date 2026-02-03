import React, { useState, useMemo, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom'
import './styles/index.css'

// ==================== MOCK DATA ====================
const mockRooms = [
  {
    id: '1',
    name: 'Vinhos Franceses',
    description: 'Discussão sobre vinhos da França e degustação virtual',
    theme: 'vinhos',
    participants: 12,
    max_users: 30,
    is_private: false,
    owner: { username: 'sommelier_pro' },
    has_video: true,
    online_count: 8,
  },
  {
    id: '2',
    name: 'Prática de Inglês',
    description: 'Conversação em inglês para todos os níveis',
    theme: 'idiomas',
    participants: 24,
    max_users: 30,
    is_private: false,
    owner: { username: 'teacher_mary' },
    has_video: true,
    online_count: 18,
  },
  {
    id: '3',
    name: 'São Paulo 30+',
    description: 'Pessoal de SP com 30 anos ou mais',
    theme: 'cidades',
    participants: 18,
    max_users: 30,
    is_private: false,
    owner: { username: 'paulistano' },
    has_video: false,
    online_count: 15,
  },
  {
    id: '4',
    name: 'Música Brasileira',
    description: 'MPB, Samba, Bossa Nova e muito mais',
    theme: 'musica',
    participants: 30,
    max_users: 30,
    is_private: false,
    owner: { username: 'musico_123' },
    has_video: true,
    online_count: 30,
  },
  {
    id: '5',
    name: 'Espanhol Básico',
    description: 'Aprendendo espanhol do zero',
    theme: 'idiomas',
    participants: 15,
    max_users: 30,
    is_private: false,
    owner: { username: 'profesor_jose' },
    has_video: true,
    online_count: 12,
  },
  {
    id: '6',
    name: 'Rio de Janeiro 25-35',
    description: 'Cariocas entre 25 e 35 anos',
    theme: 'cidades',
    participants: 20,
    max_users: 30,
    is_private: false,
    owner: { username: 'carioca_girl' },
    has_video: true,
    online_count: 16,
  },
  {
    id: '7',
    name: 'Vinhos Italianos',
    description: 'Chianti, Barolo, Prosecco e mais',
    theme: 'vinhos',
    participants: 8,
    max_users: 30,
    is_private: false,
    owner: { username: 'italia_lover' },
    has_video: false,
    online_count: 6,
  },
  {
    id: '8',
    name: 'Rock Clássico',
    description: 'Anos 70, 80 e 90 - Rock n Roll!',
    theme: 'musica',
    participants: 25,
    max_users: 30,
    is_private: false,
    owner: { username: 'rockstar_dude' },
    has_video: true,
    online_count: 22,
  },
]

const themes = [
  { value: 'all', label: 'Todos', icon: '🌟' },
  { value: 'vinhos', label: 'Vinhos', icon: '🍷' },
  { value: 'idiomas', label: 'Idiomas', icon: '🌍' },
  { value: 'cidades', label: 'Cidades', icon: '🏙️' },
  { value: 'musica', label: 'Música', icon: '🎵' },
]

const mockUsers = [
  { id: '1', username: 'João Silva', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', username: 'Maria Santos', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '3', username: 'Pedro Costa', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', username: 'Ana Paula', avatar: 'https://i.pravatar.cc/150?img=9' },
  { id: '5', username: 'Carlos Eduardo', avatar: 'https://i.pravatar.cc/150?img=7' },
]

const initialMessages = [
  { id: '1', user: mockUsers[0], content: 'Olá pessoal! Como estão?', timestamp: new Date(Date.now() - 300000) },
  { id: '2', user: mockUsers[1], content: 'Oi João! Tudo bem por aqui!', timestamp: new Date(Date.now() - 240000) },
  { id: '3', user: mockUsers[2], content: 'Alguém já experimentou o vinho que o sommelier recomendou?', timestamp: new Date(Date.now() - 180000) },
  { id: '4', user: mockUsers[3], content: 'Sim! É excelente! Super recomendo', timestamp: new Date(Date.now() - 120000) },
  { id: '5', user: mockUsers[0], content: 'Vou experimentar também então!', timestamp: new Date(Date.now() - 60000) },
]

// ==================== HOME PAGE ====================
const HomePage = () => (
  <div className="min-h-screen bg-dark-bg text-white">
    <header className="border-b border-neon-cyan/30 bg-dark-surface/50 p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold text-neon-cyan">DISQUE AMIZADE</h1>
      </div>
    </header>

    <div className="container mx-auto px-4 py-16">
      <h1 className="text-5xl md:text-7xl font-bold text-glow-cyan mb-6 text-center">
        CONECTE-SE COM O
        <br />
        <span className="text-glow-magenta">FUTURO</span>
      </h1>

      <p className="text-xl text-gray-400 text-center mb-8">
        Plataforma de bate-papo com vídeo em grupo
      </p>

      <div className="flex justify-center gap-4">
        <Link to="/rooms" className="btn-neon">
          Entrar nas Salas
        </Link>
        <Link to="/pricing" className="btn-neon">
          Ver Planos
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <div className="glass-card p-8">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-2xl mb-3 text-neon-cyan">Salas de Chat</h3>
          <p className="text-gray-400">Entre em salas temáticas e conheça pessoas</p>
        </div>

        <div className="glass-card p-8">
          <div className="text-4xl mb-4">📹</div>
          <h3 className="text-2xl mb-3 text-neon-magenta">Vídeo em Grupo</h3>
          <p className="text-gray-400">Até 30 pessoas com vídeo em alta qualidade</p>
        </div>

        <div className="glass-card p-8">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="text-2xl mb-3 text-neon-yellow">Marketplace</h3>
          <p className="text-gray-400">Ofereça ou contrate serviços</p>
        </div>
      </div>
    </div>
  </div>
)

// ==================== ROOMS PAGE ====================
const RoomsPage = () => {
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
      <header className="border-b border-neon-cyan/30 bg-dark-surface/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-glow-cyan">DISQUE AMIZADE</h1>
            </Link>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 rounded-lg border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 transition-all text-sm">
                Criar Sala
              </button>
              <Link to="/pricing">
                <button className="px-4 py-2 rounded-lg bg-neon-cyan text-dark-bg hover:bg-neon-cyan/80 transition-all text-sm">
                  Premium
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-glow-cyan mb-4">Salas de Chat</h1>
          <p className="text-xl text-gray-400">Escolha uma sala e comece a conversar!</p>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-rajdhani uppercase tracking-wider text-gray-400 mb-2">
                Buscar Sala
              </label>
              <input
                type="text"
                placeholder="Nome da sala..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-neon"
              />
            </div>
            <div>
              <label className="block text-sm font-rajdhani uppercase tracking-wider text-gray-400 mb-2">
                Filtrar por Tema
              </label>
              <div className="flex gap-2 flex-wrap">
                {themes.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => setSelectedTheme(theme.value)}
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4">
            <div className="text-3xl font-bold text-neon-cyan">{mockRooms.length}</div>
            <div className="text-sm text-gray-400">Salas Ativas</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-3xl font-bold text-neon-magenta">
              {mockRooms.reduce((acc, room) => acc + room.online_count, 0)}
            </div>
            <div className="text-sm text-gray-400">Usuários Online</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-3xl font-bold text-neon-yellow">{filteredRooms.length}</div>
            <div className="text-sm text-gray-400">Resultados</div>
          </div>
        </div>

        {/* Rooms Grid */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => {
              const isFull = room.participants >= room.max_users
              const percentage = (room.participants / room.max_users) * 100

              return (
                <Link key={room.id} to={`/room/${room.id}`}>
                  <div className="glass-card p-6 rounded-xl transition-all duration-300 hover:border-neon-cyan hover:shadow-neon-cyan cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-neon-cyan mb-2">{room.name}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{room.description}</p>
                      </div>
                      {room.has_video && (
                        <div className="ml-2">
                          <span className="text-2xl" title="Vídeo ativo">📹</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center text-xs font-bold">
                          {room.owner.username[0].toUpperCase()}
                        </div>
                        <span className="text-gray-400">
                          por <span className="text-white">{room.owner.username}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="status-online" />
                          <span className="text-gray-400">{room.online_count} online</span>
                        </div>
                        <div className="text-gray-400">
                          {room.participants}/{room.max_users} participantes
                        </div>
                      </div>

                      <div className="relative h-2 bg-dark-surface rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                            isFull ? 'bg-red-500' : percentage > 80 ? 'bg-neon-yellow' : 'bg-neon-cyan'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {isFull && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                            Cheia
                          </span>
                        )}
                        {!isFull && percentage < 50 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            Vagas disponíveis
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-400 mb-2">Nenhuma sala encontrada</h3>
            <p className="text-gray-500">Tente ajustar os filtros ou criar uma nova sala</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== ROOM PAGE ====================
const RoomPage = () => {
  const { roomId } = useParams()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(initialMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const room = mockRooms.find((r) => r.id === roomId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMessage = {
      id: Date.now().toString(),
      user: mockUsers[0],
      content: message,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setMessage('')
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Sala não encontrada</h2>
          <Link to="/rooms" className="btn-neon">Voltar para Salas</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col">
      <header className="border-b border-neon-cyan/30 bg-dark-surface/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/rooms">
                <button className="px-4 py-2 text-sm rounded-lg border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 transition-all">
                  ← Voltar
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-glow-cyan">{room.name}</h1>
                <p className="text-sm text-gray-400">{room.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400">{room.online_count} online</div>
              <span className="px-3 py-1 text-xs rounded-full bg-gray-700/50 text-gray-300 border border-gray-600/30">
                ⚪ Modo Demo
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Users */}
        <aside className="w-64 border-r border-neon-cyan/30 bg-dark-surface/30 backdrop-blur-sm overflow-y-auto hidden md:block">
          <div className="p-4">
            <h3 className="text-lg font-bold text-neon-cyan mb-4">Participantes ({mockUsers.length})</h3>
            <div className="space-y-3">
              {mockUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-surface/50 transition-colors"
                >
                  <div className="relative">
                    <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
                    <span className="status-online absolute bottom-0 right-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{user.username}</div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-neon-cyan">📹</span>
                      <span className="text-neon-cyan">🎤</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Video Grid Placeholder */}
          <div className="border-b border-neon-cyan/30 bg-dark-surface/20 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-48">
              {mockUsers.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="aspect-video bg-dark-surface rounded-lg border border-neon-cyan/30 flex items-center justify-center relative overflow-hidden"
                >
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 text-xs font-bold">{user.username}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <img src={msg.user.avatar} alt={msg.user.username} className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-neon-cyan">{msg.user.username}</span>
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-300">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-neon-cyan/30 bg-dark-surface/30 backdrop-blur-sm p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="input-neon flex-1"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="px-6 py-2 rounded-lg bg-neon-cyan text-dark-bg hover:bg-neon-cyan/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Enviar
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">💡 Modo demo - mensagens não são salvas</p>
          </div>
        </main>
      </div>
    </div>
  )
}

// ==================== PRICING PAGE ====================
const PricingPage = () => (
  <div className="min-h-screen bg-dark-bg text-white p-4">
    <div className="container mx-auto py-16">
      <h1 className="text-5xl font-bold text-glow-cyan mb-12 text-center">Planos e Preços</h1>
      <div className="text-center mt-12">
        <Link to="/" className="btn-neon">Voltar ao Início</Link>
      </div>
    </div>
  </div>
)

// ==================== APP ====================
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-bg text-white">
        <div className="fixed inset-0 pointer-events-none opacity-20">
          <div className="perspective-grid"></div>
        </div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
