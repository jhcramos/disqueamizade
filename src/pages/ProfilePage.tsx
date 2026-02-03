import { Link } from 'react-router-dom'
import { Button, Badge } from '@/components/common'
import { useAuth } from '@/hooks/useAuth'
import {
  ArrowLeft,
  Star,
  MapPin,
  Globe,
  Calendar,
  Edit3,
  Settings,
  Award,
  TrendingUp,
  Clock,
  MessageCircle,
  Video,
} from 'lucide-react'

export const ProfilePage = () => {
  const { profile, isGuest } = useAuth()

  const displayProfile = profile || {
    id: 'guest',
    username: 'Convidado',
    bio: 'Explorando o Disque Amizade...',
    city: 'Brasil',
    languages: ['Português'],
    subscription_tier: 'free' as const,
    is_online: true,
    is_featured: false,
    stars_balance: 50,
    is_service_provider: false,
    total_earnings_stars: 0,
    rating_average: undefined,
    total_services_completed: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const memberSince = new Date(displayProfile.created_at).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const gradients = [
    'from-violet-500 to-indigo-500',
    'from-rose-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
  ]
  const gradientIndex = displayProfile.username.length % gradients.length

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/rooms" className="text-zinc-400 hover:text-zinc-50 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-bold text-zinc-50 font-jakarta">Perfil</h1>
            </div>
            {!isGuest && (
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-1.5 inline" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
          {/* Cover gradient */}
          <div className="h-32 bg-gradient-to-r from-violet-600/30 via-indigo-600/20 to-rose-600/30 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900/80" />
          </div>

          <div className="px-6 pb-6 -mt-12 relative">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              {/* Avatar */}
              <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center text-3xl font-bold ring-4 ring-zinc-900 flex-shrink-0`}>
                {displayProfile.avatar_url ? (
                  <img src={displayProfile.avatar_url} alt={displayProfile.username} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  displayProfile.username[0]?.toUpperCase() || '?'
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-zinc-50 font-jakarta">{displayProfile.username}</h2>
                  <Badge tier={displayProfile.subscription_tier} size="sm">
                    {displayProfile.subscription_tier === 'free' ? 'Free' : displayProfile.subscription_tier === 'basic' ? 'Basic' : 'Premium'}
                  </Badge>
                  {displayProfile.is_online && (
                    <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
                  )}
                </div>
                {displayProfile.bio && (
                  <p className="text-zinc-400 text-sm">{displayProfile.bio}</p>
                )}
              </div>

              {!isGuest && (
                <Button variant="outline" size="sm">
                  <Edit3 className="w-3.5 h-3.5 mr-1.5 inline" />
                  Editar Perfil
                </Button>
              )}
            </div>

            {/* Info chips */}
            <div className="flex flex-wrap gap-3 mt-4">
              {displayProfile.city && (
                <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <MapPin className="w-3.5 h-3.5" />
                  {displayProfile.city}
                </span>
              )}
              {displayProfile.languages && displayProfile.languages.length > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Globe className="w-3.5 h-3.5" />
                  {displayProfile.languages.join(', ')}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                <Calendar className="w-3.5 h-3.5" />
                Membro desde {memberSince}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-50">{displayProfile.stars_balance}</div>
            <div className="text-xs text-zinc-500">Estrelas</div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-2">
              <Award className="w-5 h-5 text-violet-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-50">
              {displayProfile.rating_average?.toFixed(1) || '—'}
            </div>
            <div className="text-xs text-zinc-500">Avaliação</div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-50">{displayProfile.total_services_completed}</div>
            <div className="text-xs text-zinc-500">Sessões</div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-50">{displayProfile.total_earnings_stars}</div>
            <div className="text-xs text-zinc-500">Ganhos (Stars)</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link to="/rooms" className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:-translate-y-0.5 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 group-hover:text-violet-300 transition-colors">Salas de Chat</h3>
                <p className="text-xs text-zinc-500">Entrar em uma sala</p>
              </div>
            </div>
          </Link>
          <Link to="/marketplace" className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:-translate-y-0.5 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 group-hover:text-rose-300 transition-colors">Marketplace</h3>
                <p className="text-xs text-zinc-500">Ver serviços disponíveis</p>
              </div>
            </div>
          </Link>
          <Link to="/video-filters" className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:-translate-y-0.5 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 group-hover:text-emerald-300 transition-colors">Filtros de Vídeo</h3>
                <p className="text-xs text-zinc-500">Personalizar câmera</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Service Provider Section */}
        {displayProfile.is_service_provider ? (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-zinc-50 mb-4 font-jakarta">Meus Serviços</h3>
            <p className="text-zinc-500 text-sm">Seus serviços publicados aparecerão aqui.</p>
          </div>
        ) : (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-50 mb-2 font-jakarta">Torne-se um Provedor</h3>
            <p className="text-zinc-500 text-sm mb-4 max-w-md mx-auto">
              Ofereça seus talentos no Marketplace e ganhe estrelas por sessão.
            </p>
            <Button variant="primary" size="sm">
              Começar a Oferecer Serviços
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
