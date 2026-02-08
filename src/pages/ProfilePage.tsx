import { useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  MapPin, Clock, Award, Users, Shield, ArrowLeft, Calendar,
  Lock, Edit3, Bell, Globe, Trash2, Download, MessageCircle,
  Gamepad2, Eye, Crown, Settings, ChevronRight, Camera, Video, Send,
} from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { useAuthStore } from '@/store/authStore'

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
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [showPrivateChat, setShowPrivateChat] = useState(false)
  const [privateChatMessages, setPrivateChatMessages] = useState<{ text: string; fromMe: boolean }[]>([])
  const [privateChatInput, setPrivateChatInput] = useState('')
  const authProfile = useAuthStore((s) => s.profile)
  const isOwnProfile = userId === 'me' || userId === authProfile?.id
  
  // Use real profile if logged in and viewing own profile, else mock
  const profile = (isOwnProfile && authProfile) ? {
    ...MOCK_PROFILE,
    id: authProfile.id,
    username: authProfile.username || authProfile.display_name || MOCK_PROFILE.username,
    bio: authProfile.bio || MOCK_PROFILE.bio,
    city: authProfile.cidade || authProfile.city || MOCK_PROFILE.city,
    avatar: authProfile.avatar_url || MOCK_PROFILE.avatar,
    stars_balance: authProfile.saldo_fichas || 0,
    subscription_tier: authProfile.subscription_tier || 'free',
    is_creator: authProfile.is_creator || false,
  } : MOCK_PROFILE

  // Room context passed via navigation state
  const roomState = (location.state as { fromRoom?: string; participantData?: any }) || {}
  const fromRoom = roomState.fromRoom
  const participantData = roomState.participantData

  // Use participant data from room if available, otherwise use mock profile
  const displayName = participantData?.username || profile.username
  const displayAvatar = participantData?.avatar || profile.avatar
  const hasVideo = participantData?.videoEnabled ?? false

  const handleSendPrivateChat = () => {
    if (!privateChatInput.trim()) return
    setPrivateChatMessages(prev => [...prev, { text: privateChatInput, fromMe: true }])
    setPrivateChatInput('')
    setTimeout(() => {
      const replies = ['Oi! 😊', 'Tudo bem?', 'Que legal!', 'Hahaha', 'Valeu! ❤️', 'Bora conversar!']
      setPrivateChatMessages(prev => [...prev, { text: replies[Math.floor(Math.random() * replies.length)], fromMe: false }])
    }, 2000)
  }

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

              <div className="flex items-center gap-2">
                {!isOwnProfile && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCameraModal(true)}
                      className="btn-sm bg-primary-500/15 text-primary-400 border border-primary-500/25 hover:bg-primary-500/25 transition-all flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Abrir Câmera
                    </button>
                    <button
                      onClick={() => setShowPrivateChat(true)}
                      className="btn-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat Privado
                    </button>
                  </div>
                )}
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

      {/* ─── Camera Modal (from chat room, not roulette) ─── */}
      {showCameraModal && !isOwnProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowCameraModal(false)}>
          <div className="card w-full max-w-2xl animate-slide-up bg-dark-950 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Video area */}
            <div className="aspect-video bg-dark-900 rounded-t-2xl overflow-hidden relative">
              {hasVideo ? (
                <>
                  <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded bg-red-500/80 text-[11px] font-bold text-white animate-pulse">LIVE</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <img src={displayAvatar} alt={displayName} className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-white/20" />
                    <p className="text-sm text-dark-400">📷 {displayName} está sem câmera no momento</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <img src={displayAvatar} alt="" className="w-10 h-10 rounded-full border-2 border-white/30" />
                <span className="text-sm font-bold text-white">{displayName}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { setShowCameraModal(false); setShowPrivateChat(true) }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary-500/15 border border-primary-500/25 text-primary-400 hover:bg-primary-500/25 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat Privado
                </button>
                {fromRoom && (
                  <button
                    onClick={() => navigate(`/rooms/${fromRoom}`)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar à Sala
                  </button>
                )}
              </div>

              <div className="flex justify-end">
                <button onClick={() => setShowCameraModal(false)} className="px-4 py-2 rounded-xl bg-white/[0.06] text-sm text-dark-300 hover:text-white hover:bg-white/[0.1] transition-all">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Private Chat Modal ─── */}
      {showPrivateChat && !isOwnProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowPrivateChat(false)}>
          <div className="card w-full max-w-md animate-slide-up bg-dark-950 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <img src={displayAvatar} alt="" className="w-10 h-10 rounded-full border border-white/10" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{displayName}</p>
                <p className="text-[10px] text-emerald-400">Online</p>
              </div>
              <button
                onClick={() => setShowCameraModal(true)}
                className="p-2 rounded-lg bg-primary-500/15 text-primary-400 hover:bg-primary-500/25 transition-all"
                title="Abrir câmera"
              >
                <Video className="w-4 h-4" />
              </button>
              <button onClick={() => setShowPrivateChat(false)} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-all">
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px]">
              {privateChatMessages.length === 0 && (
                <p className="text-xs text-dark-600 text-center py-8">Envie a primeira mensagem para {displayName}! 💬</p>
              )}
              {privateChatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
                  <span className={`inline-block px-3 py-2 rounded-2xl text-sm max-w-[80%] ${m.fromMe ? 'bg-primary-500/20 text-primary-200 rounded-tr-sm' : 'bg-white/[0.06] text-dark-200 rounded-tl-sm'}`}>
                    {m.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-white/5 p-3">
              <form onSubmit={(e) => { e.preventDefault(); handleSendPrivateChat() }} className="flex gap-2">
                <input
                  type="text"
                  value={privateChatInput}
                  onChange={(e) => setPrivateChatInput(e.target.value)}
                  placeholder={`Mensagem para ${displayName}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 transition-all"
                  autoFocus
                />
                <button type="submit" disabled={!privateChatInput.trim()} className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all disabled:opacity-30">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
