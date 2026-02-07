import { Link } from 'react-router-dom'
import { MessageCircle, ShoppingBag, Users, Star, ChevronRight, Phone, Shuffle, Crown, Coins } from 'lucide-react'
import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import { mockRooms } from '../data/mockRooms'
import { getLiveCreators } from '../data/mockCreators'
import { getPopularHobbies } from '../data/mockHobbies'

const popularRooms = mockRooms.filter((r) => r.online_count > 10 && r.category !== 'adulta').slice(0, 6)
const adultRooms = mockRooms.filter((r) => r.category === 'adulta')
const popularHobbies = getPopularHobbies()
const liveCreators = getLiveCreators()

const features = [
  {
    icon: MessageCircle,
    title: 'Salas de Chat',
    description: 'Salas temáticas com vídeo e máscaras virtuais para chat anônimo. Converse por cidade, idade, hobby ou idioma com até 30 pessoas.',
    image: 'features/chat-rooms.png',
    accentColor: '#6366f1',
    link: '/rooms',
  },
  {
    icon: Shuffle,
    title: 'Roleta 1:1',
    description: 'Conheça alguém aleatório com filtros de vídeo e máscaras! Use óculos virtuais, emojis ou máscaras de carnaval. "Próximo" sempre disponível.',
    image: 'features/roulette.png',
    accentColor: '#ec4899',
    link: '/roulette',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Ofereça ou contrate: aulas, coaching, terapia, entretenimento e muito mais com fichas.',
    image: 'features/marketplace.png',
    accentColor: '#10b981',
    link: '/marketplace',
  },
  {
    icon: Crown,
    title: 'Ostentação',
    description: 'Com 300+ fichas, ganhe o badge dourado, efeitos especiais e prioridade em tudo!',
    image: 'features/ostentacao.png',
    accentColor: '#f59e0b',
    link: '/pricing',
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

// Alternância semanal de hero image
const getWeeklyHeroImage = () => {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return weekNumber % 2 === 0 ? 'hero-week-even.png' : 'hero-week-odd.png'
}

/* ── CSS-only keyframes injected once ── */
const styleTag = document.createElement('style')
styleTag.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(2deg); }
  }
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(-3deg); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  @keyframes border-spin {
    0% { --angle: 0deg; }
    100% { --angle: 360deg; }
  }
  @keyframes slide-up-fade {
    0% { opacity: 0; transform: translateY(30px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes disco-ball {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes live-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
  .animate-shimmer {
    background-size: 200% auto;
    animation: shimmer 3s linear infinite;
  }
  .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
  .animate-slide-up-fade { animation: slide-up-fade 0.8s ease-out both; }
  .animate-slide-up-fade-d1 { animation: slide-up-fade 0.8s ease-out 0.15s both; }
  .animate-slide-up-fade-d2 { animation: slide-up-fade 0.8s ease-out 0.3s both; }
  .animate-slide-up-fade-d3 { animation: slide-up-fade 0.8s ease-out 0.45s both; }
  .animate-disco { animation: disco-ball 20s linear infinite; }
  .animate-live-dot { animation: live-dot 1.5s ease-in-out infinite; }
  .glass {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .glass-strong {
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.12);
  }
  .gradient-border {
    position: relative;
  }
  .gradient-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, #6366f1, #ec4899, #6366f1);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
  .text-gradient-hero {
    background: linear-gradient(135deg, #818cf8, #f472b6, #c084fc, #818cf8);
    background-size: 300% 300%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s ease infinite;
  }
  .text-gradient-section {
    background: linear-gradient(90deg, #e0e7ff, #f9a8d4, #e0e7ff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`
if (!document.querySelector('#disque-home-styles')) {
  styleTag.id = 'disque-home-styles'
  document.head.appendChild(styleTag)
}

export const HomePage = () => {
  const heroImage = getWeeklyHeroImage()

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={import.meta.env.BASE_URL + heroImage}
            alt="Pessoas se divertindo"
            className="w-full h-full object-cover opacity-25 scale-105"
          />
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-950/70 to-dark-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 via-transparent to-pink-900/20" />
        </div>

        {/* Floating neon orbs */}
        <div className="absolute top-20 left-[15%] w-[600px] h-[600px] bg-primary-500/[0.07] rounded-full blur-[150px] animate-pulse-glow" />
        <div className="absolute bottom-10 right-[10%] w-[500px] h-[500px] bg-pink-500/[0.06] rounded-full blur-[130px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-violet-500/[0.04] rounded-full blur-[100px] animate-float" />

        {/* Decorative floating elements */}
        <div className="absolute top-32 right-[20%] w-3 h-3 bg-primary-400/60 rounded-full animate-float" />
        <div className="absolute top-48 left-[12%] w-2 h-2 bg-pink-400/50 rounded-full animate-float-delayed" />
        <div className="absolute bottom-40 right-[30%] w-2.5 h-2.5 bg-violet-400/40 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-60 right-[8%] w-1.5 h-1.5 bg-amber-400/50 rounded-full animate-float-delayed" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-60 left-[25%] w-2 h-2 bg-primary-300/30 rounded-full animate-float" style={{ animationDelay: '2s' }} />

        {/* Disco grid lines (subtle) */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 lg:py-40 text-center w-full">
          {/* Nostalgia badge */}
          <div className="animate-slide-up-fade inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass mb-10">
            <div className="relative">
              <Phone className="w-4 h-4 text-primary-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-live-dot" />
            </div>
            <span className="text-sm text-dark-200 font-medium">O clássico 145 reinventado · Agora com vídeo!</span>
          </div>

          <h1 className="animate-slide-up-fade-d1 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[0.95]">
            <span className="text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">Ligou, conectou.</span>
            <br />
            <span className="text-gradient-hero">
              Amizade de verdade.
            </span>
          </h1>

          <p className="animate-slide-up-fade-d2 text-lg md:text-xl lg:text-2xl text-dark-300 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Salas de vídeo com até 30 pessoas, chat 1:1 aleatório e máscaras virtuais
            para quem quer conversar de forma anônima — tudo ao vivo.
          </p>

          {/* CTAs */}
          <div className="animate-slide-up-fade-d3 flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
            <Link
              to="/rooms"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                minWidth: '230px',
                boxShadow: '0 0 30px rgba(99,102,241,0.3), 0 10px 40px rgba(99,102,241,0.2)'
              }}
              className="flex items-center gap-3 justify-center text-white font-bold text-lg py-5 px-10 rounded-2xl hover:scale-105 transition-all duration-300 no-underline relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
              <Users className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Entrar nas Salas</span>
            </Link>
            <Link
              to="/roulette"
              style={{
                background: 'linear-gradient(135deg, #ec4899, #d946ef)',
                minWidth: '230px',
                boxShadow: '0 0 30px rgba(236,72,153,0.3), 0 10px 40px rgba(236,72,153,0.2)'
              }}
              className="flex items-center gap-3 justify-center text-white font-bold text-lg py-5 px-10 rounded-2xl hover:scale-105 transition-all duration-300 no-underline relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
              <Shuffle className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Roleta 1 on 1</span>
            </Link>
          </div>

          <Link to="/pricing" className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-2 justify-center mb-16 transition-colors">
            <Coins className="w-4 h-4" />
            Ver Fichas & Planos Premium
          </Link>

          {/* Stats bar */}
          <div className="glass-strong rounded-2xl py-6 px-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-8 md:gap-14">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white">{mockRooms.length}+</div>
                <div className="text-xs text-dark-400 mt-1 uppercase tracking-wider font-medium">Salas Ativas</div>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white">
                  {mockRooms.reduce((a, r) => a + r.online_count, 0).toLocaleString()}+
                </div>
                <div className="text-xs text-dark-400 mt-1 uppercase tracking-wider font-medium">Online Agora</div>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-amber-400">20+</div>
                <div className="text-xs text-dark-400 mt-1 uppercase tracking-wider font-medium">Creators</div>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-pink-400">{liveCreators.length}</div>
                <div className="text-xs text-dark-400 mt-1 uppercase tracking-wider font-medium">Ao Vivo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-gradient-section mb-4">Tudo que Você Precisa</h2>
          <p className="text-dark-400 max-w-lg mx-auto text-base leading-relaxed">
            Chat com vídeo, máscaras virtuais para anonimato, filtros de câmera e uma comunidade que respeita sua privacidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link key={feature.title} to={feature.link} className="group block">
                <div
                  className="relative rounded-3xl overflow-hidden h-72 md:h-80 transition-all duration-500 hover:scale-[1.02]"
                  style={{
                    boxShadow: `0 0 0px ${feature.accentColor}00`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 60px ${feature.accentColor}30, 0 20px 60px rgba(0,0,0,0.5)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 0px ${feature.accentColor}00`
                  }}
                >
                  {/* Full-bleed image */}
                  <img
                    src={import.meta.env.BASE_URL + feature.image}
                    alt={feature.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(135deg, ${feature.accentColor}15, transparent)` }}
                  />

                  {/* Glassmorphism content at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="glass-strong rounded-2xl p-5 md:p-6 group-hover:bg-white/[0.08] transition-colors duration-300">
                      <div className="flex items-start gap-4">
                        <div
                          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: `${feature.accentColor}20` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: feature.accentColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white mb-1">{feature.title}</h3>
                          <p className="text-sm text-dark-300 leading-relaxed">{feature.description}</p>
                          <div className="mt-3 flex items-center gap-1.5 text-sm font-bold group-hover:gap-3 transition-all duration-300" style={{ color: feature.accentColor }}>
                            Explorar <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════ POPULAR ROOMS ═══════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-gradient-section mb-3">Salas Populares Agora</h2>
            <p className="text-dark-400 text-base">As salas mais movimentadas neste momento</p>
          </div>
          <Link to="/rooms" className="hidden sm:flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors text-sm font-semibold glass px-4 py-2 rounded-full hover:bg-white/[0.06]">
            Todas as Salas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularRooms.map((room) => {
            const percentage = (room.participants / room.max_users) * 100
            const isFull = room.participants >= room.max_users
            const isVIP = room.room_type === 'vip'
            return (
              <Link key={room.id} to={`/room/${room.id}`} className="group block">
                <div className="glass rounded-2xl p-5 hover:bg-white/[0.06] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                  {/* Room header with avatars */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Stacked mini-avatars */}
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-pink-500 border-2 border-dark-950 flex items-center justify-center">
                            <span className="text-[10px] font-bold">👤</span>
                          </div>
                        ))}
                        {room.participants > 3 && (
                          <div className="w-8 h-8 rounded-full bg-dark-800 border-2 border-dark-950 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-dark-300">+{room.participants - 3}</span>
                          </div>
                        )}
                      </div>
                      {/* Live indicator */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-live-dot" />
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Ao vivo</span>
                      </div>
                    </div>
                    {isVIP && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> VIP
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-primary-400 transition-colors mb-1.5">{room.name}</h3>
                  <p className="text-xs text-dark-400 mb-4 line-clamp-2">{room.description}</p>

                  {room.entry_cost_fichas && room.entry_cost_fichas > 0 && (
                    <div className="flex items-center gap-1.5 mb-3 text-amber-400 text-xs font-semibold">
                      <Coins className="w-3.5 h-3.5" /> {room.entry_cost_fichas} fichas
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-primary-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${isFull ? 'text-red-400' : 'text-dark-300'}`}>
                      {room.participants}/{room.max_users}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════ OSTENTAÇÃO PROMO ═══════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="relative rounded-3xl overflow-hidden p-10 md:p-14" style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(245,158,11,0.02) 50%, rgba(251,191,36,0.05) 100%)'
        }}>
          {/* Animated glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/[0.08] rounded-full blur-[80px] animate-pulse-glow" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/[0.05] rounded-full blur-[60px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

          <div className="relative flex flex-col md:flex-row items-center gap-10">
            <div className="flex-shrink-0 text-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_50px_rgba(251,191,36,0.4)] animate-float">
                <Crown className="w-14 h-14 text-dark-950" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black text-amber-300 mb-3">Status Ostentação 🏆</h2>
              <p className="text-dark-300 text-base mb-6 leading-relaxed max-w-xl">
                Tenha <span className="text-amber-400 font-bold">300+ fichas</span> e ganhe o badge dourado exclusivo,
                nome brilhante no chat, prioridade em filas e efeitos visuais especiais!
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                {['Badge dourado', 'Nome destacado', 'Prioridade', 'Efeitos especiais'].map((perk) => (
                  <div key={perk} className="flex items-center gap-2 text-sm text-dark-200 glass px-3 py-1.5 rounded-full">
                    <span className="text-amber-400">✦</span> {perk}
                  </div>
                ))}
              </div>
              <Link
                to="/pricing"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 0 30px rgba(245,158,11,0.3)'
                }}
                className="inline-flex items-center gap-2 text-dark-950 font-bold text-base py-4 px-8 rounded-2xl hover:scale-105 transition-transform duration-300 no-underline"
              >
                <Coins className="w-5 h-5" />
                Comprar Fichas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 🔞 SALAS ADULTAS ═══════════════════ */}
      <section className="relative w-full overflow-hidden">
        {/* Banner background */}
        <div className="absolute inset-0">
          <img 
            src={import.meta.env.BASE_URL + 'features/adult-banner.png'} 
            alt="" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-950/90 to-dark-950" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24">
          {/* 18+ Badge */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-red-500/30 bg-red-500/10 backdrop-blur-sm mb-6">
              <span className="text-3xl">🔞</span>
              <span className="text-red-400 font-bold text-lg">Área Adulta · Apenas +18</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Salas para{' '}
              <span className="bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Maiores de 18
              </span>
            </h2>
            <p className="text-dark-400 max-w-lg mx-auto text-sm">
              Paquera, encontros, conversas maduras e muito mais. Respeito é obrigatório.
            </p>
          </div>

          {/* Adult rooms grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {adultRooms.map((room) => {
              const percentage = (room.participants / room.max_users) * 100
              return (
                <Link key={room.id} to={`/room/${room.id}`}>
                  <div className="group rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4 hover:border-pink-500/30 hover:bg-pink-500/[0.05] transition-all duration-300 hover:-translate-y-1">
                    <div className="text-2xl mb-2">{room.name.split(' ')[0]}</div>
                    <h3 className="font-bold text-white text-sm group-hover:text-pink-400 transition-colors mb-1">
                      {room.name.split(' ').slice(1).join(' ')}
                    </h3>
                    <p className="text-[11px] text-dark-500 mb-3 line-clamp-2">{room.description}</p>
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1 text-dark-400">
                        <Users className="w-3 h-3" />
                        <span>{room.participants}/{room.max_users}</span>
                      </div>
                      {room.entry_cost_fichas ? (
                        <div className="flex items-center gap-1 text-amber-400">
                          <Coins className="w-3 h-3" />
                          <span>{room.entry_cost_fichas}</span>
                        </div>
                      ) : (
                        <span className="text-green-400">Grátis</span>
                      )}
                    </div>
                    <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${percentage > 80 ? 'bg-red-500' : 'bg-pink-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="text-center mt-8">
            <Link to="/rooms?category=adulta" className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-medium text-sm">
              Ver todas as salas adultas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOBBIES ═══════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-gradient-section mb-3">Explore por Hobbies</h2>
            <p className="text-dark-400 text-base">Encontre pessoas com os mesmos interesses</p>
          </div>
          <Link to="/hobbies" className="hidden sm:flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors text-sm font-semibold glass px-4 py-2 rounded-full hover:bg-white/[0.06]">
            Ver Todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularHobbies.map((hobby, i) => {
            const gradients = [
              'from-primary-600/20 to-violet-600/10',
              'from-pink-600/20 to-rose-600/10',
              'from-emerald-600/20 to-teal-600/10',
              'from-amber-600/20 to-orange-600/10',
              'from-cyan-600/20 to-blue-600/10',
              'from-fuchsia-600/20 to-purple-600/10',
            ]
            return (
              <Link key={hobby.id} to="/hobbies" className="group block">
                <div className={`glass rounded-2xl p-5 text-center hover:scale-105 transition-all duration-300 bg-gradient-to-br ${gradients[i % gradients.length]} hover:bg-white/[0.06]`}>
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{hobby.emoji}</div>
                  <h3 className="font-bold text-white text-sm mb-1">{hobby.name}</h3>
                  <p className="text-[11px] text-dark-400 font-medium">{hobby.activeRooms} salas</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full">
        <h2 className="text-3xl md:text-5xl font-black text-center text-gradient-section mb-14">
          O que Dizem Nossos Usuários
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="gradient-border rounded-2xl">
              <div className="glass-strong rounded-2xl p-7 h-full hover:bg-white/[0.06] transition-colors duration-300">
                <div className="flex items-center gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-5 h-5 ${j < t.rating ? 'text-amber-400 fill-amber-400' : 'text-dark-700'}`}
                    />
                  ))}
                </div>
                <p className="text-base text-dark-200 mb-6 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full ring-2 ring-primary-500/30"
                  />
                  <div>
                    <p className="text-base font-bold text-white">{t.name}</p>
                    <p className="text-xs text-dark-400 mt-0.5">{t.city}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="px-4 sm:px-6 py-24 w-full relative overflow-hidden">
        {/* Full-width gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-dark-950 to-pink-900/20" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-primary-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-pink-500/[0.05] rounded-full blur-[100px]" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="gradient-border rounded-3xl">
            <div className="glass-strong rounded-3xl p-12 md:p-20">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                Pronto para
                <span className="text-gradient-hero block">começar?</span>
              </h2>
              <p className="text-dark-300 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                Crie sua conta gratuita e comece a conhecer pessoas incríveis agora mesmo.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/auth"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                    boxShadow: '0 0 40px rgba(99,102,241,0.3)'
                  }}
                  className="text-white font-bold text-lg py-5 px-10 rounded-2xl hover:scale-105 transition-all duration-300 no-underline"
                >
                  Criar Conta Grátis
                </Link>
                <Link
                  to="/roulette"
                  className="glass-strong text-white font-bold text-base py-4 px-8 rounded-2xl hover:bg-white/[0.1] transition-all duration-300 no-underline flex items-center gap-2"
                >
                  <Shuffle className="w-5 h-5" /> Testar a Roleta
                </Link>
                <Link
                  to="/pricing"
                  className="text-amber-400 hover:text-amber-300 font-bold text-base py-4 px-6 transition-colors no-underline"
                >
                  Ver Planos →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
