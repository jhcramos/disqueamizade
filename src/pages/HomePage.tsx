import { Link } from 'react-router-dom'
import { MessageCircle, Video, ShoppingBag, Sparkles, Users, ArrowRight, Star, ChevronRight, Phone } from 'lucide-react'
import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import { FeaturedCarousel } from '../components/featured/FeaturedCarousel'
import { mockRooms } from '../data/mockRooms'
import { spotlightProfiles } from '../data/mockCreators'
import { getPopularHobbies } from '../data/mockHobbies'

const popularRooms = mockRooms.filter((r) => r.online_count > 10).slice(0, 6)
const popularHobbies = getPopularHobbies()

const features = [
  {
    icon: MessageCircle,
    title: 'Salas de Chat',
    description: 'Entre em salas temáticas por cidade, idade, hobby ou idioma. Conheça pessoas com os mesmos interesses.',
  },
  {
    icon: Video,
    title: 'Vídeo em Grupo',
    description: 'Até 30 pessoas com vídeo em alta qualidade. Filtros, efeitos e backgrounds personalizados.',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Ofereça ou contrate serviços: aulas, coaching, terapia, entretenimento e muito mais.',
  },
  {
    icon: Sparkles,
    title: 'Filtros de Vídeo',
    description: 'Máscaras AR, backgrounds virtuais, filtros de cor e anonimidade. Sua webcam, suas regras.',
  },
]

const testimonials = [
  {
    name: 'Mariana S.',
    city: 'São Paulo, SP',
    text: 'Incrível! Encontrei um grupo de vinhos que se reúne toda semana. Fiz amizades reais pela plataforma.',
    avatar: 'https://i.pravatar.cc/100?img=1',
    rating: 5,
  },
  {
    name: 'Carlos R.',
    city: 'Rio de Janeiro, RJ',
    text: 'As aulas de guitarra pelo marketplace são excelentes. O professor é ótimo e o vídeo não trava.',
    avatar: 'https://i.pravatar.cc/100?img=3',
    rating: 5,
  },
  {
    name: 'Ana Paula M.',
    city: 'Curitiba, PR',
    text: 'Adoro as salas por idade. Converso com pessoas da minha faixa etária e sempre rola um papo legal.',
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
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary-400/[0.04] rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36 text-center">
          {/* Nostalgia badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] mb-8 animate-fade-in">
            <Phone className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-sm text-dark-400">O clássico 145 reinventado para 2025</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up">
            <span className="text-white">Conecte-se com</span>
            <br />
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              o futuro da conversa
            </span>
          </h1>

          <p className="text-lg md:text-xl text-dark-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Salas de vídeo temáticas, marketplace de serviços e uma comunidade vibrante. 
            A evolução do bate-papo brasileiro.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link to="/rooms" className="btn-primary btn-lg flex items-center gap-2">
              Entrar nas Salas
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/marketplace" className="btn-secondary btn-lg">
              Marketplace
            </Link>
            <Link to="/pricing" className="btn-ghost btn-lg text-amber-400 hover:text-amber-300">
              Ver Planos
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
                {mockRooms.reduce((a, r) => a + r.online_count, 0)}+
              </div>
              <div className="text-xs text-dark-500 mt-1">Online Agora</div>
            </div>
            <div className="w-px h-10 bg-white/[0.08]" />
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">15+</div>
              <div className="text-xs text-dark-500 mt-1">Creators</div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

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
            return (
              <Link key={room.id} to={`/room/${room.id}`}>
                <div className="card-interactive p-4 group">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-white group-hover:text-primary-400 transition-colors">{room.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-dark-500" />
                      <span className={`text-xs font-semibold ${isFull ? 'text-danger' : 'text-dark-300'}`}>
                        {room.participants}/{room.max_users}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-dark-500 mb-3">{room.description}</p>
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
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/[0.06] to-transparent" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para começar?
            </h2>
            <p className="text-dark-400 mb-8 max-w-md mx-auto leading-relaxed">
              Crie sua conta gratuita e comece a conhecer pessoas incríveis agora mesmo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth" className="btn-primary btn-lg">Criar Conta Grátis</Link>
              <Link to="/pricing" className="btn-secondary btn-lg">Ver Planos</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
