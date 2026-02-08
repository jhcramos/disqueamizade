import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Clock, Award, Users, Shield, ArrowLeft, Calendar,
  Lock, Edit3, Bell, Trash2, Download, MessageCircle,
  Gamepad2, Crown, Settings, ChevronRight, Camera, Video,
  Heart, Sparkles, Check, X, LogOut,
} from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/services/supabase/client'
import { useToastStore } from '@/components/common/ToastContainer'

type Tab = 'profile' | 'stats' | 'settings'

// ══════════════════════════════════════════════════════════════
// Interest categories with emojis for the selector
// ══════════════════════════════════════════════════════════════
const INTEREST_CATEGORIES = [
  {
    label: '🎵 Música & Arte',
    items: ['Sertanejo', 'Funk', 'Pagode', 'Rock', 'Pop', 'MPB', 'Rap', 'Eletrônica', 'Forró', 'Reggae', 'K-Pop', 'Jazz', 'Samba', 'Gospel', 'Dança', 'Teatro', 'Fotografia', 'Pintura'],
  },
  {
    label: '⚽ Esportes & Fitness',
    items: ['Futebol', 'Academia', 'Corrida', 'Surf', 'Skate', 'Natação', 'Vôlei', 'Basquete', 'MMA', 'Yoga', 'Crossfit', 'Ciclismo', 'Tênis', 'Jiu-Jitsu'],
  },
  {
    label: '🎮 Games & Tech',
    items: ['Games', 'Anime', 'Mangá', 'Cosplay', 'Programação', 'Tecnologia', 'Streamers', 'RPG', 'Board Games', 'E-sports'],
  },
  {
    label: '🍕 Lifestyle',
    items: ['Gastronomia', 'Viagens', 'Pets', 'Moda', 'Filmes', 'Séries', 'Leitura', 'Café', 'Cerveja', 'Vinho', 'Churrasco', 'Vegano', 'Natureza', 'Camping'],
  },
  {
    label: '💼 Profissional',
    items: ['Empreendedorismo', 'Marketing', 'Investimentos', 'Cripto', 'Design', 'Psicologia', 'Direito', 'Medicina', 'Engenharia', 'Educação'],
  },
  {
    label: '🌟 Social',
    items: ['Astrologia', 'Espiritualidade', 'Humor', 'Política', 'Filosofia', 'Voluntariado', 'LGBTQ+', 'Ativismo', 'Idiomas', 'Cultura Pop'],
  },
]

// Emoji map for selected interest pills
const INTEREST_EMOJI: Record<string, string> = {
  Sertanejo: '🤠', Funk: '🎤', Pagode: '🥁', Rock: '🎸', Pop: '🎵', MPB: '🇧🇷', Rap: '🎙️',
  'Eletrônica': '🎧', 'Forró': '🪗', Reggae: '🟢', 'K-Pop': '💜', Jazz: '🎷', Samba: '💃', Gospel: '🙏',
  'Dança': '💃', Teatro: '🎭', Fotografia: '📸', Pintura: '🎨',
  Futebol: '⚽', 'Academia': '💪', Corrida: '🏃', Surf: '🏄', Skate: '🛹', 'Natação': '🏊',
  'Vôlei': '🏐', Basquete: '🏀', MMA: '🥊', Yoga: '🧘', Crossfit: '🏋️', Ciclismo: '🚴', 'Tênis': '🎾', 'Jiu-Jitsu': '🥋',
  Games: '🎮', Anime: '⛩️', 'Mangá': '📖', Cosplay: '🦸', 'Programação': '💻', Tecnologia: '📱',
  Streamers: '📺', RPG: '🎲', 'Board Games': '♟️', 'E-sports': '🏆',
  Gastronomia: '🍕', Viagens: '✈️', Pets: '🐾', Moda: '👗', Filmes: '🎬', 'Séries': '📺',
  Leitura: '📚', 'Café': '☕', Cerveja: '🍺', Vinho: '🍷', Churrasco: '🔥', Vegano: '🥬',
  Natureza: '🌿', Camping: '⛺',
  Empreendedorismo: '🚀', Marketing: '📊', Investimentos: '📈', Cripto: '₿', Design: '🎨',
  Psicologia: '🧠', Direito: '⚖️', Medicina: '🏥', Engenharia: '🔧', 'Educação': '📝',
  Astrologia: '🔮', Espiritualidade: '✨', Humor: '😂', 'Política': '🏛️', Filosofia: '🤔',
  'Voluntariado': '❤️', 'LGBTQ+': '🏳️‍🌈', Ativismo: '✊', Idiomas: '🌍', 'Cultura Pop': '🌟',
}

function calcAge(birthDate?: string | null): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export const ProfilePage = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showInterestsModal, setShowInterestsModal] = useState(false)

  // Editable fields
  const [editBio, setEditBio] = useState('')
  const [editCity, setEditCity] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [savingInterests, setSavingInterests] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const user = useAuthStore((s) => s.user)
  const authProfile = useAuthStore((s) => s.profile)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const { addToast } = useToastStore()
  const isOwnProfile = userId === 'me' || userId === authProfile?.id

  const birthDate = user?.user_metadata?.birth_date || null
  const age = calcAge(birthDate)

  const profile = {
    id: authProfile?.id || '',
    username: authProfile?.username || authProfile?.display_name || 'Usuário',
    avatar: authProfile?.avatar_url || '',
    bio: authProfile?.bio || '',
    city: authProfile?.cidade || (authProfile as any)?.city || '',
    age,
    subscription_tier: authProfile?.subscription_tier || 'free',
    stars_balance: authProfile?.saldo_fichas || 0,
    is_online: true,
    is_featured: false,
    is_creator: authProfile?.is_creator || false,
    hobbies: user?.user_metadata?.hobbies || (authProfile as any)?.hobbies || [],
    joined_at: authProfile?.created_at || new Date().toISOString(),
    stats: {
      rooms_visited: authProfile?.rooms_visited || 0,
      messages_sent: authProfile?.messages_sent || 0,
      time_online_hours: authProfile?.time_online_minutes ? Math.floor(authProfile.time_online_minutes / 60) : 0,
      games_played: authProfile?.games_played || 0,
    },
  }

  useEffect(() => {
    setSelectedInterests(profile.hobbies)
  }, [authProfile])

  const handleStartEditing = () => {
    setEditBio(profile.bio)
    setEditCity(profile.city)
    setIsEditing(true)
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ bio: editBio, cidade: editCity } as any)
      addToast({ type: 'success', title: 'Salvo!', message: 'Perfil atualizado' })
      setIsEditing(false)
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível salvar' })
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      addToast({ type: 'error', title: 'Imagem muito grande', message: 'Máximo 2MB. Tente uma imagem menor.' })
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      addToast({ type: 'error', title: 'Formato inválido', message: 'Use JPG, PNG, WebP ou GIF.' })
      return
    }

    setUploadingAvatar(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (!token) throw new Error('Faça login novamente')

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ image: base64, contentType: file.type }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Falha no upload')
      }

      const { avatar_url } = await res.json()

      // Update local state
      await supabase.auth.refreshSession()
      const { data } = await supabase.auth.getUser()
      if (data.user) useAuthStore.getState().setUser(data.user)

      // Update profile in store
      useAuthStore.getState().setProfile({ ...authProfile!, avatar_url } as any)

      addToast({ type: 'success', title: '📸 Foto atualizada!', message: 'Sua nova foto de perfil está linda!' })
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erro no upload', message: err.message || 'Tente novamente' })
    } finally {
      setUploadingAvatar(false)
      e.target.value = '' // reset input
    }
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length >= 15
          ? prev // max 15
          : [...prev, interest]
    )
  }

  const handleSaveInterests = async () => {
    setSavingInterests(true)
    try {
      const isGuest = useAuthStore.getState().isGuest
      if (isGuest) {
        addToast({ type: 'warning', title: 'Conta de convidado', message: 'Crie uma conta para salvar seus interesses!' })
        setSavingInterests(false)
        return
      }

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) {
        addToast({ type: 'error', title: 'Sessão expirada', message: 'Faça login novamente para salvar.' })
        setSavingInterests(false)
        return
      }

      const res = await fetch('/api/update-interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ hobbies: selectedInterests }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        console.error('Save interests error:', res.status, errBody)
        throw new Error(errBody.error || `HTTP ${res.status}`)
      }

      // Refresh user metadata locally
      await supabase.auth.refreshSession()
      const { data } = await supabase.auth.getUser()
      if (data.user) useAuthStore.getState().setUser(data.user)

      addToast({ type: 'success', title: '✨ Interesses salvos!', message: `${selectedInterests.length} interesses selecionados` })
      setShowInterestsModal(false)
    } catch (err: any) {
      console.error('Save interests failed:', err)
      addToast({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível salvar interesses' })
    } finally {
      setSavingInterests(false)
    }
  }

  const tierLabel = profile.subscription_tier === 'premium' ? 'Elite' : profile.subscription_tier === 'basic' ? 'VIP' : 'Free'
  const tierColor = profile.subscription_tier === 'premium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : profile.subscription_tier === 'basic' ? 'text-primary-400 bg-primary-500/10 border-primary-500/20' : 'text-dark-400 bg-dark-800 border-dark-700'

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-6 w-full pb-24 md:pb-8">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        {/* ═══════════════════════════════════════════════
            PROFILE HEADER CARD
        ═══════════════════════════════════════════════ */}
        <div className="card overflow-hidden mb-6">
          {/* Gradient banner */}
          <div className="h-28 sm:h-36 bg-gradient-to-br from-primary-600 via-violet-500 to-pink-500 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTJ2LTZoMnptMC0xMHY2aC0ydi02aDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
            {profile.subscription_tier !== 'free' && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-amber-300 text-[11px] font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" /> {tierLabel}
              </div>
            )}
          </div>

          <div className="px-5 pb-5">
            {/* Avatar + Actions row */}
            <div className="relative -mt-14 mb-3 flex items-end justify-between">
              <div className="relative">
                {profile.avatar && !profile.avatar.includes('pravatar') ? (
                  <img src={profile.avatar} alt={profile.username} className="w-24 h-24 rounded-2xl object-cover border-4 border-dark-950 shadow-elevated" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-4 border-dark-950 shadow-elevated bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{profile.username[0]?.toUpperCase() || '?'}</span>
                  </div>
                )}
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-dark-950 ${profile.is_online ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                {isOwnProfile && (
                  <label className="absolute -bottom-1 -left-1 p-1.5 rounded-full bg-dark-800/90 border border-white/10 text-dark-400 hover:text-white transition-colors cursor-pointer">
                    {uploadingAvatar ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                )}
              </div>

              {isOwnProfile && (
                <button onClick={isEditing ? handleSaveProfile : handleStartEditing} className="btn-secondary btn-sm flex items-center gap-1.5">
                  {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  {isEditing ? 'Salvar' : 'Editar'}
                </button>
              )}
              {!isOwnProfile && (
                <div className="flex gap-2">
                  <button className="btn-sm bg-primary-500/15 text-primary-400 border border-primary-500/25 hover:bg-primary-500/25 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" /> Câmera
                  </button>
                  <button className="btn-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> Chat
                  </button>
                </div>
              )}
            </div>

            {/* Name + badges */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h1 className="text-xl font-bold text-white">{profile.username}</h1>
              {profile.is_creator && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20">Creator</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierColor}`}>{tierLabel}</span>
            </div>

            {/* Bio - editable or display */}
            {isEditing ? (
              <div className="space-y-3 mt-3">
                <div>
                  <label className="text-[11px] text-dark-500 mb-1 block font-medium uppercase tracking-wider">Bio</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Conte sobre você..." className="input w-full h-20 resize-none text-sm" maxLength={200} />
                  <span className="text-[10px] text-dark-600">{editBio.length}/200</span>
                </div>
                <div>
                  <label className="text-[11px] text-dark-500 mb-1 block font-medium uppercase tracking-wider">Cidade</label>
                  <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="Ex: São Paulo, SP" className="input w-full text-sm" />
                </div>
              </div>
            ) : (
              <p className="text-dark-400 text-sm mb-3">
                {profile.bio || (isOwnProfile ? 'Toque em Editar para escrever sua bio ✍️' : 'Sem bio ainda.')}
              </p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dark-500">
              {profile.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.city}</span>}
              {profile.age && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{profile.age} anos</span>}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Desde {new Date(profile.joined_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Fichas */}
            {isOwnProfile && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold">
                  💰 {profile.stars_balance} fichas
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            INTERESTS SECTION
        ═══════════════════════════════════════════════ */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              <h3 className="font-bold text-white">Meus Interesses</h3>
              {profile.hobbies.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 font-medium">{profile.hobbies.length}</span>
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={() => { setSelectedInterests(profile.hobbies); setShowInterestsModal(true) }}
                className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {profile.hobbies.length > 0 ? 'Editar' : 'Escolher'}
              </button>
            )}
          </div>

          {profile.hobbies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map((interest: string) => (
                <span
                  key={interest}
                  className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-dark-200 hover:bg-white/[0.08] transition-colors"
                >
                  {INTEREST_EMOJI[interest] || '🏷️'} {interest}
                </span>
              ))}
            </div>
          ) : isOwnProfile ? (
            <button
              onClick={() => setShowInterestsModal(true)}
              className="w-full py-8 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-primary-500/30 hover:bg-primary-500/[0.03] transition-all group"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-sm font-medium text-dark-300 group-hover:text-white transition-colors">Selecione seus interesses</p>
                <p className="text-xs text-dark-600 mt-1">Ajuda a encontrar pessoas com gostos parecidos</p>
              </div>
            </button>
          ) : (
            <p className="text-sm text-dark-600 text-center py-4">Nenhum interesse selecionado ainda.</p>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            TABS
        ═══════════════════════════════════════════════ */}
        <div className="flex gap-1 mb-6 p-1 bg-white/[0.02] rounded-xl border border-white/5">
          {([
            { id: 'profile' as Tab, label: 'Atividade', icon: Users },
            { id: 'stats' as Tab, label: 'Stats', icon: Award },
            ...(isOwnProfile ? [{ id: 'settings' as Tab, label: 'Config', icon: Settings }] : []),
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id ? 'bg-primary-500/15 text-primary-400' : 'text-dark-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ═══ ACTIVITY TAB ═══ */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Become Creator CTA */}
            {isOwnProfile && !profile.is_creator && (
              <div className="card p-5 border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.06] to-transparent">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🎬</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1 text-sm">Quer ser Creator?</h3>
                    <p className="text-xs text-dark-400 mb-3">Ofereça serviços, faça lives e ganhe fichas!</p>
                    <button
                      onClick={async () => {
                        try {
                          await updateProfile({ is_creator: true } as any)
                          addToast({ type: 'success', title: '🎬 Parabéns!', message: 'Agora você é Creator!' })
                        } catch {
                          addToast({ type: 'error', title: 'Erro', message: 'Tente novamente' })
                        }
                      }}
                      className="btn-sm bg-purple-500/15 text-purple-400 border border-purple-500/25 hover:bg-purple-500/25 transition-all font-bold text-xs"
                    >
                      Ativar Creator
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {isOwnProfile && !profile.bio && profile.hobbies.length === 0 && (
              <div className="card p-8 text-center">
                <div className="text-5xl mb-3">👋</div>
                <h3 className="font-bold text-white mb-2">Complete seu perfil!</h3>
                <p className="text-sm text-dark-400 mb-4">Adicione bio, cidade e interesses para conhecer pessoas legais.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={handleStartEditing} className="btn-primary px-5 py-2 text-sm">
                    <Edit3 className="w-4 h-4 mr-1.5 inline" /> Editar Bio
                  </button>
                  <button onClick={() => setShowInterestsModal(true)} className="btn-secondary px-5 py-2 text-sm">
                    <Heart className="w-4 h-4 mr-1.5 inline" /> Interesses
                  </button>
                </div>
              </div>
            )}

            {/* Future: Recent activity feed */}
            {(profile.bio || profile.hobbies.length > 0) && (
              <div className="card p-5 text-center">
                <p className="text-sm text-dark-500">Atividade recente aparecerá aqui em breve 🚀</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ STATS TAB ═══ */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, color: 'text-primary-400 bg-primary-500/10', value: profile.stats.rooms_visited, label: 'Salas' },
              { icon: MessageCircle, color: 'text-emerald-400 bg-emerald-500/10', value: profile.stats.messages_sent, label: 'Mensagens' },
              { icon: Clock, color: 'text-amber-400 bg-amber-500/10', value: `${profile.stats.time_online_hours}h`, label: 'Online' },
              { icon: Gamepad2, color: 'text-pink-400 bg-pink-500/10', value: profile.stats.games_played, label: 'Jogos' },
            ].map(({ icon: Icon, color, value, label }) => (
              <div key={label} className="card p-4 text-center">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                <div className="text-[11px] text-dark-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ SETTINGS TAB ═══ */}
        {activeTab === 'settings' && isOwnProfile && (
          <div className="space-y-4">
            <div className="card divide-y divide-white/5">
              <div className="p-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-3"><Bell className="w-4 h-4 text-primary-400" /> Notificações</h3>
                {['Convites para salas', 'Mensagens privadas', 'Promoções'].map((item) => (
                  <label key={item} className="flex items-center justify-between py-2">
                    <span className="text-sm text-dark-300">{item}</span>
                    <div className="w-9 h-5 bg-primary-500/30 rounded-full relative cursor-pointer">
                      <div className="absolute top-0.5 left-4 w-4 h-4 bg-primary-400 rounded-full transition-all" />
                    </div>
                  </label>
                ))}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-primary-400" /> Privacidade</h3>
                {['Mostrar status online', 'Perfil público', 'Aceitar convites'].map((item) => (
                  <label key={item} className="flex items-center justify-between py-2">
                    <span className="text-sm text-dark-300">{item}</span>
                    <div className="w-9 h-5 bg-primary-500/30 rounded-full relative cursor-pointer">
                      <div className="absolute top-0.5 left-4 w-4 h-4 bg-primary-400 rounded-full transition-all" />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="card divide-y divide-white/5">
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all group">
                <span className="flex items-center gap-2 text-sm text-dark-300"><Download className="w-4 h-4" /> Exportar meus dados</span>
                <ChevronRight className="w-4 h-4 text-dark-600 group-hover:text-white" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all group">
                <span className="flex items-center gap-2 text-sm text-dark-300"><Lock className="w-4 h-4" /> Política de Privacidade</span>
                <ChevronRight className="w-4 h-4 text-dark-600 group-hover:text-white" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition-all group">
                <span className="flex items-center gap-2 text-sm text-red-400"><Trash2 className="w-4 h-4" /> Excluir conta</span>
                <ChevronRight className="w-4 h-4 text-dark-600 group-hover:text-red-400" />
              </button>
            </div>

            <button
              onClick={async () => {
                await useAuthStore.getState().signOut()
                navigate('/')
              }}
              className="w-full card p-4 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-all font-semibold text-sm"
            >
              <LogOut className="w-4 h-4" /> Sair da Conta
            </button>
          </div>
        )}
      </main>
      <Footer />

      {/* ═══════════════════════════════════════════════
          INTERESTS SELECTOR MODAL
      ═══════════════════════════════════════════════ */}
      {showInterestsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowInterestsModal(false)}>
          <div
            className="w-full sm:max-w-lg bg-dark-950 border border-white/[0.08] rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-400" /> Seus Interesses
                </h2>
                <p className="text-xs text-dark-500 mt-0.5">
                  {selectedInterests.length}/15 selecionados — escolha o que te representa
                </p>
              </div>
              <button onClick={() => setShowInterestsModal(false)} className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected preview */}
            {selectedInterests.length > 0 && (
              <div className="px-5 py-3 border-b border-white/5 bg-white/[0.01]">
                <div className="flex flex-wrap gap-1.5">
                  {selectedInterests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-500/15 border border-primary-500/25 text-primary-300 text-xs font-medium hover:bg-red-500/15 hover:border-red-500/25 hover:text-red-300 transition-all group"
                    >
                      {INTEREST_EMOJI[interest] || '🏷️'} {interest}
                      <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {INTEREST_CATEGORIES.map((category) => (
                <div key={category.label}>
                  <h3 className="text-sm font-bold text-dark-300 mb-2.5">{category.label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map((interest) => {
                      const isSelected = selectedInterests.includes(interest)
                      return (
                        <button
                          key={interest}
                          onClick={() => toggleInterest(interest)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300 shadow-sm shadow-primary-500/10'
                              : 'bg-white/[0.03] border border-white/[0.06] text-dark-300 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          {INTEREST_EMOJI[interest] || '🏷️'} {interest}
                          {isSelected && <Check className="w-3 h-3 ml-1 inline" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setSelectedInterests([])}
                className="px-4 py-2.5 rounded-xl text-sm text-dark-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Limpar
              </button>
              <button
                onClick={handleSaveInterests}
                disabled={savingInterests}
                className="flex-1 btn-primary py-2.5 disabled:opacity-50 font-semibold"
              >
                {savingInterests ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  `Salvar ${selectedInterests.length > 0 ? `(${selectedInterests.length})` : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
