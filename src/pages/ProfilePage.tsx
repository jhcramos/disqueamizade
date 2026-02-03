import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin, Clock, Award, Users, Shield, ArrowLeft, Calendar,
  Lock, Edit3, Bell, Globe, Trash2, Download, MessageCircle,
  Gamepad2, Eye, Crown, Settings, ChevronRight, Camera,
} from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'

const MOCK_PROFILE = {
  id: 'me',
  username: 'disque_user',
  avatar: 'https://i.pravatar.cc/150?img=68',
  bio: 'Adoro conhecer pessoas novas e conversar sobre tecnologia, viagens e música! 🎵✈️💻',
  age: 28,
  city: 'São Paulo',
  languages: ['Português', 'Inglês', 'Espanhol'],
  hobbies: ['Tecnologia', 'Viagens', 'Música', 'Fotografia', 'Games'],
  subscription_tier: 'basic' as string,
  stars_balance: 150,
  is_online: true,
  is_featured: false,
  joined_at: '2024-06-15',
  stats: {
    rooms_visited: 47,
    messages_sent: 1234,
    time_online_hours: 89,
    games_played: 15,
  },
  badges: [
    { id: 'early', name: 'Early Adopter', emoji: '🏆', description: 'Um dos primeiros usuários' },
    { id: 'social', name: 'Social Butterfly', emoji: '🦋', description: 'Visitou 25+ salas' },
    { id: 'chatter', name: 'Tagarela', emoji: '💬', description: 'Enviou 1000+ mensagens' },
    { id: 'gamer', name: 'Jogador', emoji: '🎮', description: 'Participou de 10+ jogos' },
  ],
}

type Tab = 'profile' | 'stats' | 'settings'

export const ProfilePage = () => {
  const { userId } = useParams()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const profile = MOCK_PROFILE

  const isOwnProfile = userId === 'me' || userId === profile.id

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full pb-24 md:pb-8">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        {/* Profile Header Card */}
        <div className="card overflow-hidden mb-6">
          {/* Banner */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-primary-600 via-primary-500 to-purple-600 relative">
            {profile.is_featured && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 text-amber-300 text-xs font-bold">
                ⭐ Perfil Destaque
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4 flex items-end justify-between">
              <div className="relative">
                <img
                  src={profile.avatar}
                  alt={profile.username}
                  className="w-28 h-28 rounded-2xl object-cover border-4 border-dark-950 shadow-elevated"
                />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-dark-950 ${
                  profile.is_online ? 'bg-emerald-400' : 'bg-dark-600'
                }`} />
                {isOwnProfile && (
                  <button className="absolute bottom-0 left-0 p-1.5 rounded-lg bg-dark-950/80 backdrop-blur-sm text-dark-400 hover:text-white transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-secondary btn-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Salvar' : 'Editar'}
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
              <div className="flex items-center gap-2">
                <span className={`badge ${
                  profile.subscription_tier === 'premium' ? 'badge-amber' :
                  profile.subscription_tier === 'basic' ? 'badge-primary' :
                  'bg-dark-800 text-dark-400 border border-dark-700'
                }`}>
                  {profile.subscription_tier === 'premium' && <Crown className="w-3 h-3" />}
                  {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)}
                </span>
                {profile.is_online && (
                  <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Online</span>
                )}
              </div>
            </div>

            <p className="text-dark-400 text-sm mb-4 max-w-xl">{profile.bio}</p>

            <div className="flex flex-wrap gap-3 text-xs text-dark-400">
              {profile.city && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.city}</span>
              )}
              {profile.age && (
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{profile.age} anos</span>
              )}
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{profile.languages.join(', ')}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Desde {new Date(profile.joined_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
            </div>

            {/* Hobbies */}
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.hobbies.map((h) => (
                <span key={h} className="px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/15 text-xs text-primary-400 font-medium">
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white/[0.02] rounded-xl border border-white/5">
          {([
            { id: 'profile' as Tab, label: 'Perfil', icon: Users },
            { id: 'stats' as Tab, label: 'Estatísticas', icon: Award },
            ...(isOwnProfile ? [{ id: 'settings' as Tab, label: 'Configurações', icon: Settings }] : []),
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-primary-500/15 text-primary-400'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ═══ PROFILE TAB ═══ */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Badges */}
            <div className="card p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> Conquistas
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {profile.badges.map((badge) => (
                  <div key={badge.id} className="card p-3 text-center hover:border-amber-500/20 transition-all">
                    <div className="text-3xl mb-2">{badge.emoji}</div>
                    <p className="text-sm font-semibold text-white">{badge.name}</p>
                    <p className="text-[10px] text-dark-500 mt-1">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Profile CTA */}
            {isOwnProfile && !profile.is_featured && (
              <div className="card p-6 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⭐</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">Perfil em Destaque</h3>
                    <p className="text-xs text-dark-400 mb-3">
                      Apareça no carrossel da página inicial! Mais visibilidade = mais conexões.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all">1 dia — R$ 9,90</button>
                      <button className="btn-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all">7 dias — R$ 49,90</button>
                      <button className="btn-sm bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all font-bold">30 dias — R$ 149,90</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ STATS TAB ═══ */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 text-center">
              <MessageCircle className="w-8 h-8 text-primary-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{profile.stats.rooms_visited}</div>
              <div className="text-xs text-dark-500 mt-1">Salas Visitadas</div>
            </div>
            <div className="card p-5 text-center">
              <MessageCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{profile.stats.messages_sent.toLocaleString()}</div>
              <div className="text-xs text-dark-500 mt-1">Mensagens Enviadas</div>
            </div>
            <div className="card p-5 text-center">
              <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{profile.stats.time_online_hours}h</div>
              <div className="text-xs text-dark-500 mt-1">Tempo Online</div>
            </div>
            <div className="card p-5 text-center">
              <Gamepad2 className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{profile.stats.games_played}</div>
              <div className="text-xs text-dark-500 mt-1">Jogos Jogados</div>
            </div>
          </div>
        )}

        {/* ═══ SETTINGS TAB ═══ */}
        {activeTab === 'settings' && isOwnProfile && (
          <div className="space-y-4">
            {/* Notifications */}
            <div className="card p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-primary-400" /> Notificações</h3>
              <div className="space-y-3">
                {['Convites para salas', 'Novas mensagens', 'Convites para jogos', 'Promoções e novidades'].map((item) => (
                  <label key={item} className="flex items-center justify-between py-2">
                    <span className="text-sm text-dark-300">{item}</span>
                    <div className="w-10 h-6 bg-primary-500/30 rounded-full relative cursor-pointer">
                      <div className="absolute top-1 left-5 w-4 h-4 bg-primary-400 rounded-full transition-all" />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div className="card p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary-400" /> Privacidade</h3>
              <div className="space-y-3">
                {['Mostrar online status', 'Perfil visível para todos', 'Permitir convites de estranhos'].map((item) => (
                  <label key={item} className="flex items-center justify-between py-2">
                    <span className="text-sm text-dark-300">{item}</span>
                    <div className="w-10 h-6 bg-primary-500/30 rounded-full relative cursor-pointer">
                      <div className="absolute top-1 left-5 w-4 h-4 bg-primary-400 rounded-full transition-all" />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* LGPD */}
            <div className="card p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-primary-400" /> LGPD — Seus Dados</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-all group">
                  <span className="flex items-center gap-2 text-sm text-dark-300"><Download className="w-4 h-4" /> Exportar meus dados</span>
                  <ChevronRight className="w-4 h-4 text-dark-600 group-hover:text-white transition-colors" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-all group">
                  <span className="flex items-center gap-2 text-sm text-dark-300"><Eye className="w-4 h-4" /> Política de Privacidade</span>
                  <ChevronRight className="w-4 h-4 text-dark-600 group-hover:text-white transition-colors" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-500/5 transition-all group">
                  <span className="flex items-center gap-2 text-sm text-red-400"><Trash2 className="w-4 h-4" /> Excluir minha conta</span>
                  <ChevronRight className="w-4 h-4 text-dark-600 group-hover:text-red-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
