import { Link } from 'react-router-dom'
import { MessageCircle, ShoppingBag, Users, ArrowRight, Star, ChevronRight, Phone, Shuffle, Crown, Coins } from 'lucide-react'
import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import { FeaturedCarousel } from '../components/featured/FeaturedCarousel'
import { mockRooms } from '../data/mockRooms'
import { spotlightProfiles, getLiveCreators } from '../data/mockCreators'
import { getPopularHobbies } from '../data/mockHobbies'

const popularRooms = mockRooms.filter((r) => r.online_count > 10).slice(0, 6)
const popularHobbies = getPopularHobbies()
const liveCreators = getLiveCreators()

const features = [
  {
    icon: MessageCircle,
    title: 'Salas de Chat',
    description: 'Salas temáticas por cidade, idade, hobby ou idioma. Até 30 pessoas com vídeo.',
  },
  {
    icon: Shuffle,
    title: 'Roleta 1:1',
    description: 'Conheça alguém aleatório! Filtros por idade, cidade e hobby. "Próximo" sempre disponível.',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Ofereça ou contrate: aulas, coaching, terapia, entretenimento e muito mais com fichas.',
  },
  {
    icon: Crown,
    title: 'Ostentação',
    description: 'Com 300+ fichas, ganhe o badge dourado, efeitos especiais e prioridade em tudo!',
  },
]

const testimonials = [
  {
    name: 'Mariana S.',
    city: 'São Paulo, SP',
    text: 'A roleta é incrível! Já fiz amizades de verdade conversando com pessoas aleatórias.',
    avatar: 'https://i.pravatar.cc/100?img=1',
    rating: 5,
  },
  {
    name: 'Carlos R.',
    city: 'Rio de Janeiro, RJ',
    text: 'As aulas de guitarra pelo marketplace são excelentes. Pagar com fichas é muito prático!',
    avatar: 'https://i.pravatar.cc/100?img=3',
    rating: 5,
  },
  {
    name: 'Ana Paula M.',
    city: 'Curitiba, PR',
    text: 'O speed dating é viciante! 3 minutos de conversa e já consegui 3 matches.',
    avatar: 'https://i.pravatar.cc/100?img=9',
    rating: 4,
  },
]

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-600/[0.07] via-transparent to-transparent" />
        <div className="absolute top-32 left-1/3 w-[500px] h-[500px] bg-primary-600/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-500/[0.04] rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36 text-center">
          {/* Nostalgia badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] mb-8 animate-fade-in">
            <Phone className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-sm text-dark-400">O clássico 145 reinventado · V2 com Roleta e Fichas</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up">
            <span className="text-white">Conecte-se com</span>
            <br />
            <span className="bg-gradient-to-r from-primary-400 via-pink-400 to-primary-600 bg-clip-text text-transparent">
              o futuro da conversa
            </span>
          </h1>

          <p className="text-lg md:text-xl text-dark-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Salas de vídeo, roleta 1:1, presentes ao vivo, speed dating e uma economia de fichas. 
            A plataforma brasileira de vídeo chat mais completa.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link to="/roulette" className="btn-primary btn-lg flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0">
              <Shuffle className="w-4 h-4" />
              Roleta 1:1
            </Link>
            <Link to="/rooms" className="btn-secondary btn-lg flex items-center gap-2">
              Entrar nas Salas
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/pricing" className="btn-ghost btn-lg text-amber-400 hover:text-amber-300 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Fichas & Planos
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-14">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{mockRooms.length}+</div>
              <div className="text-xs text-dark-500 mt-1">Salas Ativas</div>
            </div>
            <div className="w-px h-10 bg-white/[0.08]" />
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">
                {mockRooms.reduce((a, r) => a + r.online_count, 0).toLocaleString()}+
              </div>
              <div className="text-xs text-dark-500 mt-1">Online Agora</div>
            </div>
            <div className="w-px h-10 bg-white/[0.08]" />
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-amber-400">20+</div>
              <div className="text-xs text-dark-500 mt-1">Creators</div>
            </div>
            <div className="w-px h-10 bg-white/[0.08]" />
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-pink-400">{liveCreators.length}</div>
              <div className="text-xs text-dark-500 mt-1">Ao Vivo</div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══ 🔴 LIVE NOW — Creators ao Vivo ═══ */}
      {liveCreators.length > 0 && (
        <>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Ao Vivo Agora</h2>
                  <p className="text-dark-500 text-xs mt-0.5">{liveCreators.length} creators transmitindo</p>
                </div>
              </div>
              <Link to="/marketplace" className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {liveCreators.map(creator => (
                <Link key={creator.id} to={`/profile/${creator.id}`} className="flex-shrink-0 w-48">
                  <div className="card-interactive overflow-hidden group">
                    <div className="relative aspect-square bg-surface overflow-hidden">
                      <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/90 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] text-white font-bold">LIVE</span>
                      </div>
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-dark-950/70 backdrop-blur-sm">
                        <Users className="w-3 h-3 text-white" />
                        <span className="text-[10px] text-white font-semibold">{creator.liveViewers}</span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-dark-950/70 backdrop-blur-sm">
                        <span className="text-xs text-white font-medium">{creator.serviceEmoji} {creator.service}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-white text-sm group-hover:text-primary-400 transition-colors truncate">{creator.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-amber-400">{creator.rating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <div className="divider" />
        </>
      )}

      {/* ═══ ⭐ PERFIS EM DESTAQUE — Paid Spotlight Carousel ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Perfis em Destaque</h2>
              <p className="text-dark-500 text-sm mt-0.5">Profissionais promovidos · <Link to="/pricing" className="text-primary-400 hover:underline">Destacar meu perfil</Link></p>
            </div>
          </div>
        </div>

        <FeaturedCarousel profiles={spotlightProfiles} perSlide={4} intervalMs={5000} />
      </section>

      <div className="divider" />

      {/* ═══ FEATURES ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Tudo que Você Precisa</h2>
          <p className="text-dark-500 max-w-lg mx-auto text-sm leading-relaxed">
            Uma plataforma completa para conectar pessoas, criar comunidades e monetizar talentos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="card p-6 hover:border-primary-500/20 transition-all">
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-dark-500 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <div className="divider" />

      {/* ═══ 🎰 ROULETTE CTA ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="card p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/[0.08] via-purple-600/[0.05] to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/[0.06] rounded-full blur-[80px]" />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 mb-4">
                <Shuffle className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-xs text-pink-400 font-semibold">Novidade V2</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Roleta 1:1 — Conheça Alguém Agora!
              </h2>
              <p className="text-dark-400 text-sm mb-6 leading-relaxed max-w-lg">
                Encontre pessoas aleatoriamente para conversas de vídeo. Use filtros por idade, cidade e hobby. 
                Não curtiu? Clique "Próximo" e conheça outra pessoa em segundos.
              </p>
              <Link to="/roulette" className="btn-primary btn-lg inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0">
                <Shuffle className="w-5 h-5" />
                Experimentar Agora
              </Link>
            </div>
            <div className="flex-shrink-0 text-center">
              <div className="text-8xl mb-2">🎰</div>
              <div className="text-4xl font-bold text-pink-400">1:1</div>
              <p className="text-xs text-dark-500 mt-1">Matching instantâneo</p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══ POPULAR ROOMS ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Salas Populares Agora</h2>
            <p className="text-dark-500 text-sm mt-1.5">As salas mais movimentadas neste momento</p>
          </div>
          <Link to="/rooms" className="hidden sm:flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium">
            Todas as Salas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {popularRooms.map((room) => {
            const percentage = (room.participants / room.max_users) * 100
            const isFull = room.participants >= room.max_users
            const isVIP = room.room_type === 'vip'
            return (
              <Link key={room.id} to={`/room/${room.id}`}>
                <div className="card-interactive p-4 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-white group-hover:text-primary-400 transition-colors">{room.name}</h3>
                      {isVIP && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-[10px] font-bold text-amber-400">
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-dark-500" />
                      <span className={`text-xs font-semibold ${isFull ? 'text-danger' : 'text-dark-300'}`}>
                        {room.participants}/{room.max_users}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-dark-500 mb-3">{room.description}</p>
                  {room.entry_cost_fichas && room.entry_cost_fichas > 0 && (
                    <div className="flex items-center gap-1 mb-2 text-amber-400 text-[11px] font-semibold">
                      <Coins className="w-3 h-3" /> {room.entry_cost_fichas} fichas para entrar
                    </div>
                  )}
                  <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFull ? 'bg-danger' : percentage > 80 ? 'bg-amber-500' : 'bg-primary-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="divider" />

      {/* ═══ 🏆 OSTENTAÇÃO PROMO ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="card p-8 relative overflow-hidden bg-gradient-to-br from-amber-500/[0.05] via-transparent to-transparent border-amber-500/10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/[0.06] rounded-full blur-[60px]" />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                <Crown className="w-12 h-12 text-dark-950" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-amber-300 mb-2">Status Ostentação 🏆</h2>
              <p className="text-dark-300 text-sm mb-4 leading-relaxed">
                Tenha <span className="text-amber-400 font-bold">300+ fichas</span> e ganhe o badge dourado exclusivo, 
                nome brilhante no chat, prioridade em filas e efeitos visuais especiais!
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-dark-300">
                  <span className="text-amber-400">✦</span> Badge dourado
                </div>
                <div className="flex items-center gap-1.5 text-xs text-dark-300">
                  <span className="text-amber-400">✦</span> Nome destacado
                </div>
                <div className="flex items-center gap-1.5 text-xs text-dark-300">
                  <span className="text-amber-400">✦</span> Prioridade
                </div>
                <div className="flex items-center gap-1.5 text-xs text-dark-300">
                  <span className="text-amber-400">✦</span> Efeitos especiais
                </div>
              </div>
              <Link to="/pricing" className="btn-amber mt-4 inline-flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Comprar Fichas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══ HOBBIES ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Explore por Hobbies</h2>
            <p className="text-dark-500 text-sm mt-1.5">Encontre pessoas com os mesmos interesses</p>
          </div>
          <Link to="/hobbies" className="hidden sm:flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium">
            Ver Todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
          {popularHobbies.map((hobby) => (
            <Link key={hobby.id} to="/hobbies" className="flex-shrink-0">
              <div className="card-interactive px-5 py-4 min-w-[150px] text-center">
                <div className="text-3xl mb-2">{hobby.emoji}</div>
                <h3 className="font-semibold text-white text-sm">{hobby.name}</h3>
                <p className="text-[11px] text-dark-500 mt-1">{hobby.activeRooms} salas ativas</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-10">
          O que Dizem Nossos Usuários
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-dark-300 mb-4 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full ring-1 ring-white/10" />
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-[11px] text-dark-500">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ═══ CTA ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
        <div className="card p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/[0.06] to-pink-500/[0.03]" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para começar?
            </h2>
            <p className="text-dark-400 mb-8 max-w-md mx-auto leading-relaxed">
              Crie sua conta gratuita e comece a conhecer pessoas incríveis agora mesmo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth" className="btn-primary btn-lg">Criar Conta Grátis</Link>
              <Link to="/roulette" className="btn-secondary btn-lg flex items-center gap-2">
                <Shuffle className="w-4 h-4" /> Testar a Roleta
              </Link>
              <Link to="/pricing" className="btn-ghost btn-lg text-amber-400">Ver Planos</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
