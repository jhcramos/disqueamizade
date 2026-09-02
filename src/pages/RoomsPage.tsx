import { useState, useMemo } from 'react'
import { Search, Plus, Flame, Globe, Beer, Heart, Gamepad2, Languages, Crown, MessageCircle, Calendar } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { RoomCard } from '@/components/rooms/RoomCard'
import { CreateRoomModal } from '@/components/rooms/CreateRoomModal'
import { AgeGate } from '@/components/common/AgeVerificationModal'
import type { MockRoom } from '@/types'
import { useRooms } from '@/hooks/useSupabaseData'

// ══════════════════════════════════════════════════════════════
// CATEGORY SYSTEM
// ══════════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: 'all', label: 'Todas', emoji: '🌐', icon: Globe, color: 'primary' },
  { id: 'hot', label: 'Em Alta', emoji: '🔥', icon: Flame, color: 'orange' },
  { id: 'general', label: 'Geral', emoji: '💬', icon: MessageCircle, color: 'gray' },
  { id: 'cities', label: 'Cidades', emoji: '🏙️', icon: Globe, color: 'blue' },
  { id: 'drinks', label: 'Bebida & Papo', emoji: '🍺', icon: Beer, color: 'amber' },
  { id: 'languages', label: 'Idiomas', emoji: '🌍', icon: Languages, color: 'green' },
  { id: 'interests', label: 'Interesses', emoji: '🎯', icon: Gamepad2, color: 'purple' },
  { id: 'age', label: 'Faixa Etária', emoji: '👥', icon: Calendar, color: 'cyan' },
  { id: 'vip', label: 'VIP', emoji: '👑', icon: Crown, color: 'amber' },
  { id: 'adult', label: '+18', emoji: '🔞', icon: Heart, color: 'pink' },
  { id: 'community', label: 'Comunidade', emoji: '🫂', icon: MessageCircle, color: 'teal' },
]

// Slugs for drink rooms
const DRINK_SLUGS = new Set([
  'boteco-virtual','sexta-feira-nois','whisky-conversa','vinho-fofoca',
  'happy-hour-papo','drinks-risadas','cervejeiros-anonimos',
  'madrugadao-alcoolico','role-sabado','brindando-vida',
])

const INTEREST_SLUGS = new Set([
  'tecnologia-ia','futebol','musica','games','series-filmes',
  'fitness-saude','karaoke','dj-room','danca',
])

const LANGUAGE_SLUGS = new Set([
  'english-practice','espanol','idioma-frances','idioma-alemao','idioma-italiano',
  'idioma-japones','idioma-coreano','idioma-mandarim','idioma-russo',
  'idioma-arabe','idioma-portugues-gringos','idioma-poliglota-mix',
])

const AGE_SLUGS = new Set(['18-25-anos','26-35-anos','36-45-anos','46-plus'])
const VIP_SLUGS = new Set(['lounge-vip','diamond-club'])
const GENERAL_SLUGS = new Set(['geral-brasil','papo-livre'])

function classifyRoom(slug: string, ownerId?: string | null): string {
  if (slug.startsWith('community-')) return 'community'
  if (slug.startsWith('adult-')) return 'adult'
  if (DRINK_SLUGS.has(slug)) return 'drinks'
  if (LANGUAGE_SLUGS.has(slug) || slug.startsWith('idioma-')) return 'languages'
  if (INTEREST_SLUGS.has(slug)) return 'interests'
  if (AGE_SLUGS.has(slug)) return 'age'
  if (VIP_SLUGS.has(slug)) return 'vip'
  if (GENERAL_SLUGS.has(slug)) return 'general'
  // If it has an owner and doesn't match any official pattern, it's community
  if (ownerId) return 'community'
  return 'cities'
}

/** Salas "em alta" = as com mais gente real agora (nada aleatório). */
function getHotRoomIds(rooms: any[]): Set<string> {
  const ids = new Set<string>()
  ;[...rooms]
    .filter(r => (r.current_participants || 0) > 0)
    .sort((a, b) => (b.current_participants || 0) - (a.current_participants || 0))
    .slice(0, 15)
    .forEach(r => ids.add(r.id))
  return ids
}

/** Map DB room to MockRoom shape for RoomCard compatibility */
function mapDbRoom(r: any, hotIds: Set<string>): MockRoom {
  const cat = classifyRoom(r.slug, r.owner_id)
  const isHot = hotIds.has(r.id)

  // Real participant count only
  const simParticipants = r.current_participants || 0

  let category: MockRoom['category'] = 'hobby'
  if (cat === 'cities') category = 'cidade'
  else if (cat === 'age') category = 'idade'
  else if (cat === 'interests') category = 'gamer'
  else if (cat === 'languages') category = 'idioma'
  else if (cat === 'vip' || cat === 'adult' || cat === 'drinks' || cat === 'general') category = 'especial'

  return {
    id: r.id,
    name: r.name,
    description: r.description || '',
    category,
    theme: r.cidade || cat,
    participants: simParticipants,
    max_users: r.max_participants || 30,
    is_private: false,
    owner: { username: 'Disque Amizade', avatar: '' },
    has_video: true,
    online_count: simParticipants,
    badge_color: 'primary',
    is_official: true,
    is_fixed: true,
    room_type: r.ficha_cost > 0 ? 'vip' : 'official',
    entry_cost_fichas: r.ficha_cost || 0,
    _category: cat,
    _isHot: isHot,
    _slug: r.slug || r.id,
  } as any
}

export const RoomsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { rooms: dbRooms, loading, refetch } = useRooms()

  // Generate hot room ids once per page load
  const hotIds = useMemo(() => getHotRoomIds(dbRooms || []), [dbRooms])

  const rooms = useMemo(() => {
    if (dbRooms && dbRooms.length > 0) {
      return dbRooms.map(r => mapDbRoom(r, hotIds))
    }
    return []
  }, [dbRooms, hotIds])

  // Count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rooms.length, hot: 0 }
    rooms.forEach((r: any) => {
      const cat = r._category || 'general'
      counts[cat] = (counts[cat] || 0) + 1
      if (r._isHot) counts.hot++
    })
    return counts
  }, [rooms])

  const filteredRooms = useMemo(() => {
    return rooms.filter((room: any) => {
      const cat = room._category || 'general'
      let matchesCat = selectedCategory === 'all'
      if (selectedCategory === 'hot') matchesCat = room._isHot
      else if (selectedCategory !== 'all') matchesCat = cat === selectedCategory

      const matchesSearch = !searchQuery ||
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.description || '').toLowerCase().includes(searchQuery.toLowerCase())

      return matchesCat && matchesSearch
    }).sort((a: any, b: any) => b.online_count - a.online_count) // Sort by activity
  }, [selectedCategory, searchQuery, rooms])

  const totalOnline = rooms.reduce((acc: number, r: any) => acc + (r.online_count || 0), 0)

  // Sala principal única: com menos de 20 pessoas no total, concentramos todo
  // mundo na "Geral Brasil" para a conversa começar. As demais só aparecem
  // quando há gente suficiente para não parecerem vazias. (Plano V4, item 1.5)
  const MAIN_THRESHOLD = 20
  const MAIN_SLUG = 'geral-brasil'
  const concentrated = totalOnline < MAIN_THRESHOLD
  const visibleRooms = useMemo(() => {
    if (!concentrated) return filteredRooms
    const main = rooms.find((r: any) => r._slug === MAIN_SLUG)
      || [...rooms].sort((a: any, b: any) => (b.online_count || 0) - (a.online_count || 0))[0]
    return main ? [main] : []
  }, [concentrated, filteredRooms, rooms])

  return (
    <AgeGate>
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Salas de Chat</h1>
            <p className="text-dark-500 mt-1 text-sm">
              {rooms.length} salas • {totalOnline} pessoas online agora 🟢
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="self-start md:self-auto btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Criar Sala
          </button>
        </div>

        {/* Live stats bar */}
        <div className="flex items-center gap-4 mb-6 p-3 rounded-xl bg-gradient-to-r from-primary-500/[0.06] to-pink-500/[0.06] border border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-400">{totalOnline} online</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-xs text-dark-400">🏠 {rooms.length} salas</span>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-xs text-dark-400">🔞 {categoryCounts.adult || 0} adultas</span>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-xs text-dark-400">🔥 {categoryCounts.hot || 0} em alta</span>
        </div>

        {/* Search + Category Filters */}
        {!concentrated && (
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input type="text" placeholder="🔍 Buscar sala..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full max-w-md input pl-10" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => {
              const count = categoryCounts[cat.id] || 0
              const isActive = selectedCategory === cat.id
              const isAdult = cat.id === 'adult'
              return (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                    isActive
                      ? isAdult
                        ? 'bg-pink-500/15 text-pink-400 border border-pink-500/25'
                        : 'bg-primary-500/15 text-primary-400 border border-primary-500/25'
                      : isAdult
                        ? 'text-dark-500 hover:text-pink-400 hover:bg-pink-500/[0.05] border border-transparent'
                        : 'text-dark-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}>
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1 py-0 rounded-full ${isActive ? 'bg-primary-500/20 text-primary-300' : 'bg-white/[0.03] text-dark-600'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        )}

        {concentrated && !loading && (
          <div className="mb-6 p-4 rounded-xl bg-primary-500/[0.06] border border-primary-500/15 text-sm text-dark-300">
            👋 Começamos concentrando todo mundo na <b className="text-white">sala principal</b> para a conversa fluir. As outras salas abrem quando passar de 20 pessoas online.
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <p className="text-dark-400">Carregando salas...</p>
          </div>
        )}

        {/* Rooms Grid */}
        {!loading && visibleRooms.length > 0 && (
          <div>
            {/* Section header with context */}
            <div className="flex items-center gap-2 mb-4">
              {selectedCategory === 'hot' && <Flame className="w-5 h-5 text-orange-400" />}
              {selectedCategory === 'adult' && <Heart className="w-5 h-5 text-pink-400" />}
              {selectedCategory === 'drinks' && <Beer className="w-5 h-5 text-amber-400" />}
              <h2 className="text-lg font-bold text-white">
                {selectedCategory === 'all' ? 'Todas as Salas' :
                 selectedCategory === 'hot' ? '🔥 Rolando Agora — As Mais Movimentadas' :
                 selectedCategory === 'adult' ? '🔞 Salas Adultas — Só pra Maiores' :
                 selectedCategory === 'drinks' ? '🍺 Tá Bebendo? Cola Aqui!' :
                 selectedCategory === 'cities' ? '🏙️ Cidades — Encontre Gente da Sua Região' :
                 selectedCategory === 'languages' ? '🌍 Idiomas — Pratique e Conheça Culturas' :
                 selectedCategory === 'interests' ? '🎯 Interesses — Encontre Sua Tribo' :
                 selectedCategory === 'age' ? '👥 Faixa Etária — Galera da Sua Idade' :
                 selectedCategory === 'vip' ? '👑 VIP — Experiência Premium' :
                 selectedCategory === 'community' ? '🫂 Salas da Comunidade — Criadas por Vocês' :
                 '💬 Papo Geral'}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-dark-400">{visibleRooms.length}</span>
            </div>

            {/* Subtitle per category */}
            {selectedCategory === 'adult' && (
              <p className="text-xs text-pink-400/60 mb-4 -mt-2">Conteúdo explícito. Verificação de idade obrigatória. 18+</p>
            )}
            {selectedCategory === 'hot' && (
              <p className="text-xs text-orange-400/60 mb-4 -mt-2">Salas com mais gente agora — a festa tá rolando! 🎉</p>
            )}
            {selectedCategory === 'drinks' && (
              <p className="text-xs text-amber-400/60 mb-4 -mt-2">Pegue sua bebida e venha bater papo. Sem julgamento 🍻</p>
            )}
            {selectedCategory === 'community' && (
              <p className="text-xs text-teal-400/60 mb-4 -mt-2">Salas criadas pela comunidade. Crie a sua também! 🙌</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        )}

        {/* No rooms */}
        {!loading && visibleRooms.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma sala encontrada</h3>
            <p className="text-dark-500 text-sm">Tente outro filtro ou crie sua própria sala!</p>
          </div>
        )}
      </main>
      <Footer />

      <CreateRoomModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} userTier="basic" onCreated={refetch} />
    </div>
    </AgeGate>
  )
}
