import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock, Video, ArrowRight, Crown, Timer } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import type { SecretCabin } from '@/types'

const mockCabins: SecretCabin[] = [
  { id: 'cab1', number: 1, name: 'Cabine Rosa', description: 'Conversa íntima e romântica', capacity: 2, status: 'available', occupants: [], icon: '💗', color: 'pink' },
  { id: 'cab2', number: 2, name: 'Cabine Azul', description: 'Papo tranquilo e descontraído', capacity: 2, status: 'occupied', occupants: [
    { user_id: 'u1', username: 'ana_paula', avatar_url: 'https://i.pravatar.cc/150?img=9', joined_at: new Date(Date.now() - 600000).toISOString(), is_broadcasting: true },
    { user_id: 'u2', username: 'joao_silva', avatar_url: 'https://i.pravatar.cc/150?img=1', joined_at: new Date(Date.now() - 500000).toISOString(), is_broadcasting: true },
  ], icon: '💙', color: 'blue', occupied_since: new Date(Date.now() - 600000).toISOString() },
  { id: 'cab3', number: 3, name: 'Cabine Verde', description: 'Espaço acolhedor para 3', capacity: 3, status: 'available', occupants: [], icon: '💚', color: 'green' },
  { id: 'cab4', number: 4, name: 'Cabine Roxa', description: 'Reunião com amigos', capacity: 4, status: 'occupied', occupants: [
    { user_id: 'u3', username: 'maria_santos', avatar_url: 'https://i.pravatar.cc/150?img=5', joined_at: new Date(Date.now() - 900000).toISOString(), is_broadcasting: false },
  ], icon: '💜', color: 'purple', occupied_since: new Date(Date.now() - 900000).toISOString() },
  { id: 'cab5', number: 5, name: 'Cabine Dourada', description: 'Experiência VIP exclusiva', capacity: 2, status: 'reserved', occupants: [], icon: '💛', color: 'amber', reserved_by: 'u5', reserved_until: new Date(Date.now() + 240000).toISOString() },
  { id: 'cab6', number: 6, name: 'Cabine Prateada', description: 'Elegância e privacidade', capacity: 2, status: 'available', occupants: [], icon: '🤍', color: 'gray' },
  { id: 'cab7', number: 7, name: 'Cabine Laranja', description: 'Energia e boas vibes!', capacity: 3, status: 'available', occupants: [], icon: '🧡', color: 'orange' },
  { id: 'cab8', number: 8, name: 'Cabine Turquesa', description: 'Conversas em grupo', capacity: 4, status: 'occupied', occupants: [
    { user_id: 'u6', username: 'pedro_costa', avatar_url: 'https://i.pravatar.cc/150?img=3', joined_at: new Date(Date.now() - 300000).toISOString(), is_broadcasting: true },
    { user_id: 'u7', username: 'lucia_r', avatar_url: 'https://i.pravatar.cc/150?img=20', joined_at: new Date(Date.now() - 250000).toISOString(), is_broadcasting: true },
    { user_id: 'u8', username: 'carlos_edu', avatar_url: 'https://i.pravatar.cc/150?img=7', joined_at: new Date(Date.now() - 200000).toISOString(), is_broadcasting: false },
  ], icon: '🩵', color: 'cyan', occupied_since: new Date(Date.now() - 300000).toISOString() },
  { id: 'cab9', number: 9, name: 'Cabine Coral', description: 'Aconchegante e reservada', capacity: 2, status: 'available', occupants: [], icon: '🩷', color: 'rose' },
  { id: 'cab10', number: 10, name: 'Cabine Esmeralda', description: 'Encontros especiais', capacity: 3, status: 'available', occupants: [], icon: '💎', color: 'emerald' },
]

// Demo: user is Premium
const USER_TIER = 'premium' as const

export const SecretCabinsPage = () => {
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied'>('all')

  const filteredCabins = mockCabins.filter(c => {
    if (filter === 'available') return c.status === 'available'
    if (filter === 'occupied') return c.status === 'occupied' || c.status === 'reserved'
    return true
  })

  const available = mockCabins.filter(c => c.status === 'available').length
  const occupied = mockCabins.filter(c => c.status === 'occupied').length
  const reserved = mockCabins.filter(c => c.status === 'reserved').length

  const isPremium = USER_TIER === 'premium'

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Cabines Secretas</h1>
            <span className="badge badge-amber flex items-center gap-1"><Crown className="w-3 h-3" /> Premium</span>
          </div>
          <p className="text-dark-500 text-sm">
            Salas privadas exclusivas para conversas íntimas. {isPremium ? 'Escolha uma cabine!' : 'Faça upgrade para acessar.'}
          </p>
        </div>

        {!isPremium ? (
          /* Upgrade CTA for non-premium */
          <div className="card p-10 text-center max-w-lg mx-auto">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-3">Exclusivo Premium</h2>
            <p className="text-dark-400 text-sm mb-6 leading-relaxed">
              As Cabines Secretas são salas privadas exclusivas para assinantes Premium. 
              Tenha conversas íntimas com total privacidade e qualidade superior.
            </p>
            <Link to="/pricing" className="btn-amber inline-flex"><Crown className="w-4 h-4" /> Assinar Premium — R$ 39,90/mês</Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="card p-4 text-center">
                <div className="text-xl font-bold text-emerald-400">{available}</div>
                <div className="text-[11px] text-dark-500 mt-0.5">Disponíveis</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-xl font-bold text-red-400">{occupied}</div>
                <div className="text-[11px] text-dark-500 mt-0.5">Ocupadas</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-xl font-bold text-amber-400">{reserved}</div>
                <div className="text-[11px] text-dark-500 mt-0.5">Reservadas</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
              {(['all', 'available', 'occupied'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                      : 'text-dark-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {f === 'all' ? 'Todas' : f === 'available' ? '🟢 Disponíveis' : '🔴 Ocupadas'}
                </button>
              ))}
            </div>

            {/* Cabins Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCabins.map((cabin) => (
                <CabinCard key={cabin.id} cabin={cabin} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

function CabinCard({ cabin }: { cabin: SecretCabin }) {
  const statusColors = {
    available: 'border-emerald-500/30 hover:border-emerald-500/50',
    occupied: 'border-red-500/30',
    reserved: 'border-amber-500/30',
  }

  const statusGlow = {
    available: 'shadow-[0_0_15px_rgba(34,197,94,0.08)]',
    occupied: 'shadow-[0_0_15px_rgba(239,68,68,0.08)]',
    reserved: 'shadow-[0_0_15px_rgba(245,158,11,0.08)]',
  }

  return (
    <div className={`card p-5 border ${statusColors[cabin.status]} ${statusGlow[cabin.status]} transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{cabin.icon}</div>
          <div>
            <h3 className="font-bold text-white">{cabin.name}</h3>
            <p className="text-xs text-dark-500">{cabin.description}</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          cabin.status === 'available' ? 'bg-emerald-500/15 text-emerald-400' :
          cabin.status === 'occupied' ? 'bg-red-500/15 text-red-400' :
          'bg-amber-500/15 text-amber-400'
        }`}>
          {cabin.status === 'available' ? 'Livre' : cabin.status === 'occupied' ? 'Ocupada' : 'Reservada'}
        </div>
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-2 text-xs text-dark-400 mb-3">
        <Users className="w-3.5 h-3.5" />
        <span>{cabin.occupants.length}/{cabin.capacity} pessoas</span>
        {cabin.occupied_since && (
          <span className="flex items-center gap-1 ml-auto text-dark-500">
            <Timer className="w-3 h-3" />
            {Math.round((Date.now() - new Date(cabin.occupied_since).getTime()) / 60000)} min
          </span>
        )}
      </div>

      {/* Occupants */}
      {cabin.occupants.length > 0 && (
        <div className="flex items-center gap-1 mb-4">
          {cabin.occupants.map((o) => (
            <div key={o.user_id} className="relative" title={o.username}>
              <img src={o.avatar_url} alt={o.username} className="w-8 h-8 rounded-full border-2 border-dark-950 object-cover" />
              {o.is_broadcasting && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border border-dark-950" />
              )}
            </div>
          ))}
          {cabin.occupants.length < cabin.capacity && (
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-dark-600 flex items-center justify-center text-dark-600 text-xs">+</div>
          )}
        </div>
      )}

      {/* Actions */}
      {cabin.status === 'available' && (
        <div className="flex gap-2">
          <button className="btn-primary flex-1 btn-sm">
            <Video className="w-3.5 h-3.5" /> Entrar
          </button>
          <button className="btn-secondary btn-sm">
            <Clock className="w-3.5 h-3.5" /> Reservar
          </button>
        </div>
      )}

      {cabin.status === 'occupied' && cabin.occupants.length < cabin.capacity && (
        <button className="btn-secondary w-full btn-sm">
          <ArrowRight className="w-3.5 h-3.5" /> Entrar ({cabin.occupants.length}/{cabin.capacity})
        </button>
      )}

      {cabin.status === 'occupied' && cabin.occupants.length >= cabin.capacity && (
        <div className="text-center text-xs text-dark-500 py-2">Cabine lotada</div>
      )}

      {cabin.status === 'reserved' && (
        <div className="text-center text-xs text-amber-400 py-2 flex items-center justify-center gap-1.5">
          <Clock className="w-3 h-3" />
          Reservada — expira em breve
        </div>
      )}
    </div>
  )
}
