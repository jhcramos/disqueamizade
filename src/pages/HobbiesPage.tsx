import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Users, ArrowRight, Heart, Compass, Zap } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { RoomCard } from '@/components/rooms/RoomCard'
import { useAuthStore } from '@/store/authStore'
import { useRooms } from '@/hooks/useSupabaseData'
import type { MockRoom } from '@/types'

// ══════════════════════════════════════════════════════════════
// Hobby categories with matching room slugs + interest keywords
// ══════════════════════════════════════════════════════════════
const HOBBY_HUBS = [
  { id: 'games', emoji: '🎮', name: 'Games', color: '#8B5CF6', keywords: ['Games', 'Anime', 'E-sports', 'RPG', 'Board Games', 'Streamers'], slugs: ['games'] },
  { id: 'futebol', emoji: '⚽', name: 'Futebol', color: '#10B981', keywords: ['Futebol'], slugs: ['futebol'] },
  { id: 'musica', emoji: '🎵', name: 'Música', color: '#EC4899', keywords: ['Sertanejo', 'Funk', 'Pagode', 'Rock', 'Pop', 'MPB', 'Rap', 'Eletrônica', 'Forró', 'Reggae', 'K-Pop', 'Jazz', 'Samba', 'Gospel'], slugs: ['musica', 'karaoke', 'dj-room'] },
  { id: 'fitness', emoji: '💪', name: 'Fitness & Saúde', color: '#F59E0B', keywords: ['Academia', 'Corrida', 'Yoga', 'Crossfit', 'Ciclismo', 'Natação', 'Jiu-Jitsu', 'MMA'], slugs: ['fitness-saude'] },
  { id: 'tech', emoji: '💻', name: 'Tecnologia', color: '#3B82F6', keywords: ['Programação', 'Tecnologia', 'Games'], slugs: ['tecnologia-ia'] },
  { id: 'series', emoji: '📺', name: 'Séries & Filmes', color: '#EF4444', keywords: ['Filmes', 'Séries', 'Anime', 'Mangá'], slugs: ['series-filmes'] },
  { id: 'danca', emoji: '💃', name: 'Dança', color: '#D946EF', keywords: ['Dança', 'Forró', 'Samba'], slugs: ['danca'] },
  { id: 'gastronomia', emoji: '🍕', name: 'Gastronomia', color: '#F97316', keywords: ['Gastronomia', 'Café', 'Cerveja', 'Vinho', 'Churrasco', 'Vegano'], slugs: [] },
  { id: 'viagens', emoji: '✈️', name: 'Viagens', color: '#06B6D4', keywords: ['Viagens', 'Natureza', 'Camping'], slugs: [] },
  { id: 'pets', emoji: '🐾', name: 'Pets', color: '#84CC16', keywords: ['Pets'], slugs: [] },
  { id: 'esportes', emoji: '🏄', name: 'Esportes', color: '#14B8A6', keywords: ['Surf', 'Skate', 'Vôlei', 'Basquete', 'Tênis', 'Natação'], slugs: [] },
  { id: 'leitura', emoji: '📚', name: 'Leitura', color: '#8B5CF6', keywords: ['Leitura', 'Filosofia'], slugs: [] },
  { id: 'moda', emoji: '👗', name: 'Moda', color: '#EC4899', keywords: ['Moda'], slugs: [] },
  { id: 'negocios', emoji: '🚀', name: 'Negócios', color: '#6366F1', keywords: ['Empreendedorismo', 'Marketing', 'Investimentos', 'Cripto'], slugs: [] },
  { id: 'astrologia', emoji: '🔮', name: 'Astrologia', color: '#A855F7', keywords: ['Astrologia', 'Espiritualidade'], slugs: [] },
  { id: 'humor', emoji: '😂', name: 'Humor', color: '#FBBF24', keywords: ['Humor', 'Cultura Pop'], slugs: [] },
]

function mapDbRoom(r: any): MockRoom {
  const hourBR = (new Date().getUTCHours() - 3 + 24) % 24
  const isNight = hourBR >= 20 || hourBR <= 3
  const sim = Math.max(r.current_participants || 0, (isNight ? 5 : 2) + Math.floor(Math.random() * 12))

  return {
    id: r.id,
    name: r.name,
    description: r.description || '',
    category: 'hobby',
    theme: '',
    participants: sim,
    max_users: r.max_participants || 30,
    is_private: false,
    owner: { username: 'Disque Amizade', avatar: '' },
    has_video: true,
    online_count: sim,
    badge_color: 'primary',
    is_official: true,
    is_fixed: true,
    room_type: r.ficha_cost > 0 ? 'vip' : 'official',
    entry_cost_fichas: r.ficha_cost || 0,
  }
}

export const HobbiesPage = () => {
  
  const [selectedHub, setSelectedHub] = useState<string | null>(null)
  const user = useAuthStore(s => s.user)
  const profile = useAuthStore(s => s.profile)
  const { rooms: dbRooms } = useRooms()

  // User's interests from profile
  const userInterests: string[] = user?.user_metadata?.hobbies || (profile as any)?.hobbies || []

  // Find hubs that match user's interests
  const matchedHubs = useMemo(() => {
    if (userInterests.length === 0) return []
    return HOBBY_HUBS.filter(hub =>
      hub.keywords.some(kw => userInterests.includes(kw))
    ).map(hub => ({
      ...hub,
      matchCount: hub.keywords.filter(kw => userInterests.includes(kw)).length,
    })).sort((a, b) => b.matchCount - a.matchCount)
  }, [userInterests])

  const unmatchedHubs = useMemo(() => {
    const matchedIds = new Set(matchedHubs.map(h => h.id))
    return HOBBY_HUBS.filter(h => !matchedIds.has(h.id))
  }, [matchedHubs])

  // Find rooms for selected hub
  const hubRooms = useMemo(() => {
    if (!selectedHub || !dbRooms) return []
    const hub = HOBBY_HUBS.find(h => h.id === selectedHub)
    if (!hub) return []

    return dbRooms
      .filter(r => hub.slugs.some(s => r.slug === s || r.slug?.startsWith(`community-${s}`)))
      .map(mapDbRoom)
  }, [selectedHub, dbRooms])

  // Community rooms matching hobby keywords
  const communityHobbyRooms = useMemo(() => {
    if (!selectedHub || !dbRooms) return []
    const hub = HOBBY_HUBS.find(h => h.id === selectedHub)
    if (!hub) return []

    return dbRooms
      .filter(r => {
        if (!r.owner_id) return false
        const name = (r.name || '').toLowerCase()
        const desc = (r.description || '').toLowerCase()
        return hub.keywords.some(kw => name.includes(kw.toLowerCase()) || desc.includes(kw.toLowerCase()))
      })
      .map(mapDbRoom)
  }, [selectedHub, dbRooms])

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full pb-24 md:pb-8">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-xs text-primary-400 font-medium">Encontre sua tribo</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Explore por <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-pink-400">Hobbies</span>
          </h1>
          <p className="text-dark-400 text-sm max-w-md mx-auto">
            {HOBBY_HUBS.length} comunidades • Conecte-se com quem compartilha suas paixões
          </p>
        </div>

        {/* ══════════════════════════════════════════
            YOUR MATCHES (if user has interests)
        ══════════════════════════════════════════ */}
        {matchedHubs.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-400" />
              <h2 className="text-lg font-bold text-white">Pra Você</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400">baseado nos seus interesses</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {matchedHubs.map(hub => (
                <button key={hub.id} onClick={() => setSelectedHub(selectedHub === hub.id ? null : hub.id)}
                  className={`relative p-4 rounded-2xl border text-center transition-all group ${
                    selectedHub === hub.id
                      ? 'border-primary-500/40 bg-primary-500/10 shadow-lg shadow-primary-500/5'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                  }`}>
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400 text-[9px] font-bold">
                    ❤️ Match
                  </div>
                  <div className="text-3xl mb-2 transition-transform group-hover:scale-110">{hub.emoji}</div>
                  <h3 className="font-bold text-white text-sm mb-0.5">{hub.name}</h3>
                  <p className="text-[10px] text-dark-500">{hub.matchCount} interesse{hub.matchCount > 1 ? 's' : ''} em comum</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No interests CTA */}
        {userInterests.length === 0 && user && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-primary-500/[0.06] to-pink-500/[0.06] border border-white/5">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎯</div>
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1">Personalize sua experiência!</h3>
                <p className="text-xs text-dark-400 mb-3">Selecione seus interesses no perfil e veremos quais comunidades combinam com você.</p>
                <Link to="/profile/me" className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300">
                  Escolher Interesses <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            SELECTED HUB — ROOMS
        ══════════════════════════════════════════ */}
        {selectedHub && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">
                  Salas de {HOBBY_HUBS.find(h => h.id === selectedHub)?.name}
                </h2>
              </div>
              <button onClick={() => setSelectedHub(null)} className="text-xs text-dark-400 hover:text-white">✕ Fechar</button>
            </div>

            {hubRooms.length > 0 || communityHobbyRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...hubRooms, ...communityHobbyRooms].map(room => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-3xl mb-2">🏗️</p>
                <p className="text-sm text-dark-400">Nenhuma sala ainda. Seja o primeiro a criar!</p>
                <Link to="/rooms" className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 mt-2 hover:text-primary-300">
                  Criar Sala <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            DISCOVER ALL HUBS
        ══════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-bold text-white">
              {matchedHubs.length > 0 ? 'Descobrir Mais' : 'Todas as Comunidades'}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {(matchedHubs.length > 0 ? unmatchedHubs : HOBBY_HUBS).map(hub => {
              // Count rooms for this hub
              const roomCount = dbRooms?.filter(r => hub.slugs.some(s => r.slug === s)).length || 0
              return (
                <button key={hub.id} onClick={() => setSelectedHub(selectedHub === hub.id ? null : hub.id)}
                  className={`p-4 rounded-2xl border text-center transition-all group ${
                    selectedHub === hub.id
                      ? 'border-primary-500/40 bg-primary-500/10'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                  }`}>
                  <div className="text-3xl mb-2 transition-transform group-hover:scale-110">{hub.emoji}</div>
                  <h3 className="font-bold text-white text-sm mb-0.5">{hub.name}</h3>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-dark-500">
                    <Users className="w-2.5 h-2.5" />
                    {roomCount > 0 ? `${roomCount} sala${roomCount > 1 ? 's' : ''}` : 'Em breve'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            BECOME INSTRUCTOR CTA
        ══════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500/[0.08] via-transparent to-pink-500/[0.08] border border-white/5 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-3">
                <span className="text-xs text-primary-400 font-bold">🎓 Para Instrutores</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Ensine o que você <span className="text-primary-400">ama</span>
              </h2>
              <p className="text-dark-400 text-sm mb-4 max-w-md">
                Crie mini-cursos ao vivo, compartilhe conhecimento e ganhe fichas.
                Defina horários, preços e capacidade — a plataforma cuida do resto.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Defina seus preços', 'Vídeo profissional', 'Ganhe até 85%', 'Suporte dedicado'].map(item => (
                  <span key={item} className="inline-flex items-center gap-1 text-xs text-dark-300 bg-white/[0.03] px-2.5 py-1 rounded-full border border-white/5">
                    ✓ {item}
                  </span>
                ))}
              </div>
              <Link to="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-all">
                Começar <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="w-full md:w-64 shrink-0">
              <div className="rounded-xl bg-dark-900/80 border border-white/5 p-4">
                <div className="text-center mb-3">
                  <span className="text-2xl">🎓</span>
                  <p className="text-xs text-primary-400 font-bold mt-1">Exemplo de Ganhos</p>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-dark-400">5 alunos × 30 fichas</span><span className="text-amber-400 font-bold">150</span></div>
                  <div className="flex justify-between"><span className="text-dark-400">4 cursos/semana</span><span className="text-amber-400 font-bold">600</span></div>
                  <div className="flex justify-between border-t border-white/5 pt-2"><span className="text-dark-400">Mensal</span><span className="text-emerald-400 font-bold">~R$480</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  )
}
