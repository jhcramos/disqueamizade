import { Link } from 'react-router-dom'
import { Sparkles, BookOpen, Calendar, Users, ArrowRight } from 'lucide-react'
import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import { mockHobbies, upcomingEvents, getTotalActiveRooms } from '../data/mockHobbies'

export const HobbiesPage = () => {
  const totalRooms = getTotalActiveRooms()

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-primary-light" />
              <span className="text-sm text-gray-400">Encontre sua tribo</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Explore por <span className="text-primary-light">Hobbies</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-xl mx-auto">
              {mockHobbies.length} categorias, {totalRooms} salas ativas. Conecte-se com quem compartilha suas paixões.
            </p>
          </div>
        </section>

        {/* Hobby Grid */}
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mockHobbies.map((hobby) => (
              <Link key={hobby.id} to="/rooms">
                <div className="card rounded-2xl p-5 text-center hover:border-primary/20 hover:shadow-card-hover transition-all group relative overflow-hidden h-full">
                  {/* Popular badge */}
                  {hobby.isPopular && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent/20 border border-accent/30 text-accent text-[10px] font-bold">
                      Popular
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${hobby.color}15`, border: `1px solid ${hobby.color}40` }}
                  >
                    {hobby.emoji}
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-white text-sm mb-1 group-hover:text-primary-light transition-colors">
                    {hobby.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{hobby.description}</p>

                  {/* Active rooms */}
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{hobby.activeRooms} sala{hobby.activeRooms !== 1 ? 's' : ''} ativa{hobby.activeRooms !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Mini-cursos ao vivo */}
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-light" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Mini-Cursos ao Vivo</h2>
                <p className="text-sm text-gray-500">Aprenda com especialistas em tempo real</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="card rounded-2xl p-5 hover:border-primary/20 hover:shadow-card-hover transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-2xl border border-white/5">
                    {event.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm group-hover:text-primary-light transition-colors truncate">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-500">{event.hobby}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">
                      {event.spots}/{event.maxSpots} vagas
                    </span>
                    {event.spots >= event.maxSpots * 0.8 && (
                      <span className="text-xs text-red-400 font-bold">Últimas vagas!</span>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Instrutor: </span>
                    <span className="text-white">{event.instructor}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(event.spots / event.maxSpots) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-accent font-bold">{event.priceInFichas}</span>
                    <span className="text-xs text-gray-500">fichas</span>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary-light hover:bg-primary hover:text-white transition-all text-sm font-bold">
                    Inscrever-se
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seja um Instrutor CTA */}
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <div className="card rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <span className="text-sm text-primary-light font-bold">🎓 Para Instrutores</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Seja um <span className="text-primary-light">Instrutor</span>
                </h2>
                <p className="text-gray-400 mb-6 max-w-lg">
                  Compartilhe seu conhecimento e ganhe fichas! Crie mini-cursos ao vivo sobre seus hobbies favoritos. 
                  Defina seus horários, preços e capacidade. A plataforma cuida do resto.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">✓</div>
                    Defina seus próprios horários e preços
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">✓</div>
                    Ferramentas de vídeo profissionais incluídas
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">✓</div>
                    Suporte dedicado para creators
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">✓</div>
                    Ganhe até 85% do valor das fichas
                  </li>
                </ul>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark hover:shadow-card-hover transition-all"
                >
                  Começar como Instrutor
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Visual */}
              <div className="w-full md:w-80 shrink-0">
                <div className="card rounded-2xl p-6 border-primary/20">
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-2">🎓</div>
                    <h3 className="font-bold text-primary-light">Exemplo de Ganhos</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">5 alunos × 30 fichas</span>
                      <span className="text-accent font-bold">150 fichas</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">4 cursos por semana</span>
                      <span className="text-accent font-bold">600 fichas</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Potencial mensal</span>
                      <span className="text-accent font-bold text-lg">~2400 fichas</span>
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">≈ Valor em R$</span>
                        <span className="text-emerald-400 font-bold">~R$480,00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
