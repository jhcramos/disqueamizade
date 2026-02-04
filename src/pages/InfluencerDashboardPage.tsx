import { useState } from 'react'
import { TrendingUp, DollarSign, Users, Star, Calendar, ArrowUp, Coins, Play, BarChart3, Clock } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'

// Mock dashboard data
const stats = {
  totalEarnings: 12450,
  weeklyEarnings: 890,
  monthlyEarnings: 3420,
  totalViewers: 8930,
  liveViewers: 0,
  totalSessions: 523,
  averageRating: 4.9,
  totalReviews: 247,
  fichasAvailable: 4820,
  fichasPendingWithdrawal: 0,
}

const weeklyData = [
  { day: 'Seg', earnings: 120, viewers: 45 },
  { day: 'Ter', earnings: 180, viewers: 67 },
  { day: 'Qua', earnings: 95, viewers: 38 },
  { day: 'Qui', earnings: 210, viewers: 82 },
  { day: 'Sex', earnings: 155, viewers: 54 },
  { day: 'Sáb', earnings: 85, viewers: 31 },
  { day: 'Dom', earnings: 45, viewers: 19 },
]

const upcomingSessions = [
  { id: '1', title: 'Coaching de Carreira — Ana P.', type: 'session', date: 'Hoje', time: '14:00', duration: 60, price: 80, enrolled: 1, max: 1 },
  { id: '2', title: 'Live: Dicas de LinkedIn', type: 'live', date: 'Hoje', time: '19:00', duration: 45, price: 0, enrolled: 28, max: 100 },
  { id: '3', title: 'Mini-curso: Transição de Carreira', type: 'course', date: 'Amanhã', time: '10:00', duration: 120, price: 150, enrolled: 12, max: 20 },
  { id: '4', title: 'Sessão Privada — Marcos R.', type: 'session', date: 'Amanhã', time: '15:00', duration: 60, price: 80, enrolled: 1, max: 1 },
  { id: '5', title: 'Workshop: Entrevistas de Emprego', type: 'course', date: 'Sex', time: '20:00', duration: 90, price: 120, enrolled: 8, max: 15 },
]

const topGifters = [
  { username: 'Carlos_VIP', avatar: 'https://i.pravatar.cc/40?img=3', total: 520 },
  { username: 'Ana_Premium', avatar: 'https://i.pravatar.cc/40?img=9', total: 340 },
  { username: 'Marcos_SP', avatar: 'https://i.pravatar.cc/40?img=7', total: 280 },
  { username: 'Julia_RJ', avatar: 'https://i.pravatar.cc/40?img=5', total: 195 },
  { username: 'Pedro_BH', avatar: 'https://i.pravatar.cc/40?img=11', total: 150 },
]

const recentReviews = [
  { reviewer: 'Ana Paula', avatar: 'https://i.pravatar.cc/40?img=9', rating: 5, comment: 'Excelente sessão! Mudou minha perspectiva de carreira.', date: 'há 2h' },
  { reviewer: 'Marcos Silva', avatar: 'https://i.pravatar.cc/40?img=7', rating: 5, comment: 'Super profissional e atenciosa. Recomendo!', date: 'há 1 dia' },
  { reviewer: 'Julia Santos', avatar: 'https://i.pravatar.cc/40?img=5', rating: 4, comment: 'Ótimas dicas para o LinkedIn. Valeu cada ficha!', date: 'há 2 dias' },
]

type TabId = 'overview' | 'schedule' | 'earnings' | 'reviews'

export const InfluencerDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const tabs: { id: TabId; label: string; icon: typeof TrendingUp }[] = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'schedule', label: 'Agenda', icon: Calendar },
    { id: 'earnings', label: 'Ganhos', icon: DollarSign },
    { id: 'reviews', label: 'Avaliações', icon: Star },
  ]

  const maxWeeklyEarning = Math.max(...weeklyData.map(d => d.earnings))

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard Creator</h1>
            <p className="text-dark-500 text-sm mt-1">Gerencie seus ganhos, sessões e avaliações</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Play className="w-4 h-4" />
            Iniciar Live
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                  : 'text-dark-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Coins className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs text-dark-500">Saldo</span>
                </div>
                <div className="text-2xl font-bold text-amber-400">{stats.fichasAvailable.toLocaleString()}</div>
                <div className="text-[10px] text-dark-500">fichas disponíveis</div>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-xs text-dark-500">Semana</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{stats.weeklyEarnings}</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <ArrowUp className="w-3 h-3" /> +12% vs semana anterior
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary-400" />
                  </div>
                  <span className="text-xs text-dark-500">Sessões</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
                <div className="text-[10px] text-dark-500">completadas</div>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-yellow-400" />
                  </div>
                  <span className="text-xs text-dark-500">Rating</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.averageRating}</div>
                <div className="text-[10px] text-dark-500">{stats.totalReviews} avaliações</div>
              </div>
            </div>

            {/* Weekly earnings chart */}
            <div className="card p-5">
              <h3 className="text-sm font-bold text-white mb-4">Ganhos da Semana</h3>
              <div className="flex items-end gap-2 h-32">
                {weeklyData.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-dark-400">{d.earnings}</span>
                    <div
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-md transition-all"
                      style={{ height: `${(d.earnings / maxWeeklyEarning) * 100}%`, minHeight: 4 }}
                    />
                    <span className="text-[10px] text-dark-500">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Gifters */}
              <div className="card p-5">
                <h3 className="text-sm font-bold text-white mb-4">🎁 Top Gifters</h3>
                <div className="space-y-2.5">
                  {topGifters.map((g, i) => (
                    <div key={g.username} className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-5 text-center ${
                        i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-dark-500'
                      }`}>{i + 1}</span>
                      <img src={g.avatar} alt="" className="w-8 h-8 rounded-full" />
                      <span className="text-sm text-white flex-1">{g.username}</span>
                      <span className="text-sm font-bold text-amber-400">{g.total} 💰</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming sessions */}
              <div className="card p-5">
                <h3 className="text-sm font-bold text-white mb-4">📅 Próximas Sessões</h3>
                <div className="space-y-2.5">
                  {upcomingSessions.slice(0, 4).map((s) => {
                    const typeEmoji = s.type === 'live' ? '🔴' : s.type === 'course' ? '📚' : '💬'
                    return (
                      <div key={s.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-lg mt-0.5">{typeEmoji}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{s.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-dark-400">{s.date} · {s.time}</span>
                            <span className="text-[10px] text-dark-500">{s.duration}min</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {s.price > 0 && (
                            <span className="text-xs font-bold text-amber-400">{s.price} 💰</span>
                          )}
                          <div className="text-[10px] text-dark-500">{s.enrolled}/{s.max}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Suas Sessões</h3>
              <button className="btn-secondary text-sm">+ Nova Sessão</button>
            </div>
            {upcomingSessions.map((s) => {
              const typeColors: Record<string, string> = {
                live: 'border-red-500/20 bg-red-500/5',
                course: 'border-primary-500/20 bg-primary-500/5',
                session: 'border-emerald-500/20 bg-emerald-500/5',
                event: 'border-amber-500/20 bg-amber-500/5',
              }
              const typeLabels: Record<string, string> = {
                live: '🔴 Live',
                course: '📚 Curso',
                session: '💬 Sessão',
                event: '🎉 Evento',
              }
              return (
                <div key={s.id} className={`card p-5 border ${typeColors[s.type]}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5">{typeLabels[s.type]}</span>
                        <h4 className="font-semibold text-white text-sm">{s.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-dark-400 mt-1.5">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {s.date} · {s.time}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duration}min</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {s.enrolled}/{s.max}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {s.price > 0 ? (
                        <span className="text-lg font-bold text-amber-400">{s.price} 💰</span>
                      ) : (
                        <span className="text-sm text-dark-500">Grátis</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-6 text-center">
                <p className="text-xs text-dark-500 mb-2">Total Ganho</p>
                <p className="text-3xl font-bold text-amber-400">{stats.totalEarnings.toLocaleString()}</p>
                <p className="text-xs text-dark-500">fichas</p>
              </div>
              <div className="card p-6 text-center">
                <p className="text-xs text-dark-500 mb-2">Este Mês</p>
                <p className="text-3xl font-bold text-emerald-400">{stats.monthlyEarnings.toLocaleString()}</p>
                <p className="text-xs text-dark-500 flex items-center justify-center gap-1"><ArrowUp className="w-3 h-3" /> +18%</p>
              </div>
              <div className="card p-6 text-center">
                <p className="text-xs text-dark-500 mb-2">Disponível p/ Saque</p>
                <p className="text-3xl font-bold text-white">{stats.fichasAvailable.toLocaleString()}</p>
                <button className="btn-amber text-xs mt-2 py-1.5 px-4">Sacar</button>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-bold text-white mb-1">Comissão da Plataforma</h3>
              <p className="text-xs text-dark-400 mb-4">20% sobre todas as transações de fichas recebidas.</p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <span className="text-2xl">💡</span>
                <p className="text-xs text-dark-300">
                  Exemplo: se você receber 100 fichas em presentes, ficam 80 fichas para você e 20 fichas para a plataforma.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="card p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-6 h-6 ${i < Math.floor(stats.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-dark-600'}`} />
                ))}
              </div>
              <p className="text-3xl font-bold text-white">{stats.averageRating}</p>
              <p className="text-xs text-dark-500">{stats.totalReviews} avaliações</p>
            </div>

            {recentReviews.map((r, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <img src={r.avatar} alt="" className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="text-sm font-semibold text-white">{r.reviewer}</p>
                    <p className="text-[10px] text-dark-500">{r.date}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-dark-300">"{r.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
