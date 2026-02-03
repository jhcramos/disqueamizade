import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { useAuth } from '@/hooks/useAuth'
import {
  Lock,
  Users,
  Crown,
  ArrowLeft,
  Video,
  Info,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react'

const mockCabins = [
  { id: '1', number: 1, name: 'Cabine Violeta', capacity: 2, occupants: [], status: 'available' as const, theme: 'romantic' },
  { id: '2', number: 2, name: 'Cabine Indigo', capacity: 4, occupants: [
    { user_id: 'u1', username: 'ana_paula', avatar_url: 'https://i.pravatar.cc/150?img=9' },
    { user_id: 'u2', username: 'joao_silva', avatar_url: 'https://i.pravatar.cc/150?img=1' },
  ], status: 'occupied' as const, theme: 'friends' },
  { id: '3', number: 3, name: 'Cabine Aurora', capacity: 2, occupants: [
    { user_id: 'u3', username: 'maria_santos', avatar_url: 'https://i.pravatar.cc/150?img=5' },
  ], status: 'available' as const, theme: 'casual' },
  { id: '4', number: 4, name: 'Cabine Nebulosa', capacity: 6, occupants: [
    { user_id: 'u4', username: 'pedro_costa', avatar_url: 'https://i.pravatar.cc/150?img=3' },
    { user_id: 'u5', username: 'carlos_edu', avatar_url: 'https://i.pravatar.cc/150?img=7' },
    { user_id: 'u6', username: 'lucia_r', avatar_url: 'https://i.pravatar.cc/150?img=20' },
    { user_id: 'u7', username: 'fernanda', avatar_url: 'https://i.pravatar.cc/150?img=25' },
  ], status: 'occupied' as const, theme: 'group' },
  { id: '5', number: 5, name: 'Cabine Eclipse', capacity: 2, occupants: [
    { user_id: 'u8', username: 'rafa_coach', avatar_url: 'https://i.pravatar.cc/150?img=12' },
    { user_id: 'u9', username: 'bruno_dev', avatar_url: 'https://i.pravatar.cc/150?img=15' },
  ], status: 'full' as const, theme: 'mentoring' },
  { id: '6', number: 6, name: 'Cabine Cosmos', capacity: 4, occupants: [], status: 'available' as const, theme: 'casual' },
]

type CabinFilter = 'all' | 'available' | 'occupied'

export const SecretCabinsPage = () => {
  const { isPremium } = useAuth()
  const [filter, setFilter] = useState<CabinFilter>('all')

  const filteredCabins = mockCabins.filter((cabin) => {
    if (filter === 'all') return true
    if (filter === 'available') return cabin.status === 'available'
    return cabin.status === 'occupied' || cabin.status === 'full'
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'border-emerald-500/20 bg-emerald-500/5'
      case 'occupied': return 'border-amber-500/20 bg-amber-500/5'
      case 'full': return 'border-red-500/20 bg-red-500/5'
      default: return 'border-white/5'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return { text: 'Disponível', color: 'text-emerald-400 bg-emerald-500/10' }
      case 'occupied': return { text: 'Parcial', color: 'text-amber-400 bg-amber-500/10' }
      case 'full': return { text: 'Lotada', color: 'text-red-400 bg-red-500/10' }
      default: return { text: status, color: 'text-gray-400' }
    }
  }

  // Premium lock screen
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-lg text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-pink-500/20 border border-primary/30 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Cabines Secretas</h1>
            <p className="text-dark-400 mb-2">
              Salas exclusivas e privadas para conversas íntimas com vídeo.
            </p>
            <p className="text-dark-500 text-sm mb-8">
              Disponível apenas para assinantes <span className="text-amber-400 font-semibold">Premium</span>.
            </p>
            <Link to="/pricing">
              <Button variant="primary" size="lg">
                <Crown className="w-4 h-4 mr-2 inline" />
                Ver Planos Premium
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary-400" />
              Cabines Secretas
            </h1>
            <p className="text-dark-500 mt-1.5 text-sm">Conversas privadas e exclusivas</p>
          </div>
          <span className="self-start md:self-auto px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Premium
          </span>
        </div>

        {/* Stats + Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex gap-4 flex-1">
            <div className="card rounded-2xl p-5 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary-light" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{mockCabins.length}</div>
                  <div className="text-xs text-gray-500">Total de Cabines</div>
                </div>
              </div>
            </div>
            <div className="card rounded-2xl p-5 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {mockCabins.filter(c => c.status === 'available').length}
                  </div>
                  <div className="text-xs text-gray-500">Disponíveis</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {(['all', 'available', 'occupied'] as CabinFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-primary text-white shadow-card-hover'
                    : 'bg-surface text-gray-400 hover:text-white hover:bg-surface-light'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 'available' ? 'Livres' : 'Ocupadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Cabins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {filteredCabins.map((cabin) => {
            const statusInfo = getStatusLabel(cabin.status)
            return (
              <div
                key={cabin.id}
                className={`card rounded-2xl p-6 hover:-translate-y-0.5 transition-all ${getStatusColor(cabin.status)}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    #{cabin.number} {cabin.name}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Users className="w-4 h-4" />
                  <span>{cabin.occupants.length}/{cabin.capacity} pessoas</span>
                </div>

                {/* Occupants */}
                {cabin.occupants.length > 0 && (
                  <div className="flex -space-x-2 mb-4">
                    {cabin.occupants.map((occ) => (
                      <img
                        key={occ.user_id}
                        src={occ.avatar_url}
                        alt={occ.username}
                        className="w-8 h-8 rounded-full ring-2 ring-dark-bg object-cover"
                      />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {cabin.status !== 'full' ? (
                    <Button variant="primary" size="sm" fullWidth>
                      <Video className="w-3.5 h-3.5 mr-1.5 inline" />
                      Entrar
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" fullWidth disabled>
                      Cabine Lotada
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* How it works */}
        <div className="card rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary-light" />
            Como Funcionam as Cabines Secretas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary-light" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-1">Privacidade Total</h4>
                <p className="text-sm text-gray-500">Conversas criptografadas e sem registro. Apenas os participantes têm acesso.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                <EyeOff className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-1">Modo Anônimo</h4>
                <p className="text-sm text-gray-500">Ative o modo anônimo para conversar sem revelar seu perfil.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-1">Vídeo HD</h4>
                <p className="text-sm text-gray-500">Qualidade de vídeo superior com baixa latência para conversas fluidas.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
