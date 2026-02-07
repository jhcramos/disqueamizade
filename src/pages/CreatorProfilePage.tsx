import { useParams, Link } from 'react-router-dom'
import { Star, MapPin, CheckCircle2, Users, Eye, Calendar, MessageCircle, Heart, ArrowLeft, Clock, Zap } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { getCreatorById } from '@/data/mockCreators'

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  palestra: { label: 'Palestra', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  curso: { label: 'Curso', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  show: { label: 'Show', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  consulta: { label: 'Consulta', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  show_erotico: { label: 'Show +18', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  live: { label: 'Live', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
}

const MOCK_REVIEWS = [
  { id: 'r1', name: 'Maria S.', avatar: 'https://i.pravatar.cc/100?img=20', rating: 5, comment: 'Incrível! Super recomendo, profissional demais.', date: '2026-02-05' },
  { id: 'r2', name: 'Carlos M.', avatar: 'https://i.pravatar.cc/100?img=14', rating: 5, comment: 'Mudou minha vida. Muito obrigado pela sessão!', date: '2026-02-03' },
  { id: 'r3', name: 'Ana P.', avatar: 'https://i.pravatar.cc/100?img=23', rating: 4, comment: 'Muito bom, voltarei com certeza. Atendimento nota 10.', date: '2026-01-28' },
]

export const CreatorProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const creator = getCreatorById(id || '')

  if (!creator) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold mb-2">Creator não encontrado</h2>
            <Link to="/marketplace" className="text-purple-400 hover:underline">Voltar ao Marketplace</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const eventType = creator.nextEvent ? EVENT_TYPE_LABELS[creator.nextEvent.type] : null

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-8">

        {/* ═══ Cover + Avatar Header ═══ */}
        <section className="relative">
          <div className="h-48 md:h-64 overflow-hidden">
            <img
              src={`https://picsum.photos/1400/400?random=${creator.id}`}
              alt="cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50" />
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-16 z-10">
            <Link to="/marketplace" className="absolute -top-28 left-4 sm:left-6 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Marketplace
            </Link>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="relative">
                <img src={creator.avatar} alt={creator.name} className="w-28 h-28 rounded-2xl object-cover border-4 border-dark-950 shadow-xl" />
                {creator.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-3 border-dark-950" />
                )}
                {creator.isLive && (
                  <div className="absolute -top-2 -left-2 px-2 py-0.5 rounded bg-red-500 text-xs font-bold text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{creator.name}</h1>
                  {creator.isVerified && <CheckCircle2 className="w-6 h-6 text-purple-400" />}
                  {creator.isLive && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">
                      <Eye className="w-3 h-3" /> {creator.liveViewers} assistindo
                    </span>
                  )}
                </div>
                <p className="text-dark-400 mt-1">@{creator.username} · {creator.serviceEmoji} {creator.service}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-dark-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {creator.city}</span>
                  <span className="flex items-center gap-1 text-amber-400"><Star className="w-3.5 h-3.5 fill-amber-400" /> {creator.rating} ({creator.reviewCount})</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Stats ═══ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Sessões', value: creator.sessionsCompleted.toLocaleString(), color: 'text-white' },
              { label: 'Rating', value: `${creator.rating}/5`, color: 'text-amber-400' },
              { label: 'Satisfação', value: `${creator.satisfactionRate}%`, color: 'text-emerald-400' },
              { label: 'Fichas Ganhas', value: creator.totalEarnings.toLocaleString(), color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-dark-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Action Buttons ═══ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
          <div className="flex flex-wrap gap-3">
            {creator.camaroteIsOpen && (
              <button className="flex-1 min-w-[160px] py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 font-medium flex items-center justify-center gap-2 hover:from-emerald-500/30 hover:to-teal-500/30 transition-all">
                <Users className="w-4 h-4" /> Visitar Camarote
              </button>
            )}
            <button className="flex-1 min-w-[160px] py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 font-medium flex items-center justify-center gap-2 hover:from-purple-500/30 hover:to-pink-500/30 transition-all">
              <Calendar className="w-4 h-4" /> Agendar Sessão — {creator.priceInFichas} ⭐
            </button>
            <button className="py-3 px-5 rounded-xl bg-white/[0.04] border border-white/10 text-dark-300 hover:text-white hover:bg-white/[0.08] transition-all">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button className="py-3 px-5 rounded-xl bg-white/[0.04] border border-white/10 text-dark-300 hover:text-pink-400 hover:bg-pink-500/10 transition-all">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ═══ Left Column ═══ */}
          <div className="lg:col-span-2 space-y-6">

            {/* Sobre */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-3">Sobre</h2>
              <p className="text-dark-300 text-sm leading-relaxed">{creator.bio}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {creator.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/15 text-xs text-purple-400">{tag}</span>
                ))}
              </div>
            </div>

            {/* Galeria */}
            {creator.gallery.length > 0 && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Galeria</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {creator.gallery.map((img, i) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden border border-white/5">
                      <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avaliações */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Avaliações ({creator.reviewCount})</h2>
              <div className="space-y-4">
                {MOCK_REVIEWS.map(r => (
                  <div key={r.id} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <img src={r.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{r.name}</span>
                        <span className="text-xs text-dark-500">{r.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 my-1">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-dark-300">{r.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ Right Column ═══ */}
          <div className="space-y-6">

            {/* Camarote */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" /> Camarote
              </h2>
              {creator.camaroteTheme && (
                <p className="text-xs text-purple-300 mb-2">🎨 {creator.camaroteTheme}</p>
              )}
              {creator.camaroteDescription && (
                <p className="text-sm text-dark-400 mb-4">{creator.camaroteDescription}</p>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm font-medium ${creator.camaroteIsOpen ? 'text-emerald-400' : 'text-dark-500'}`}>
                  {creator.camaroteIsOpen ? '🟢 Aberto agora' : '⚫ Fechado'}
                </span>
                <span className="text-xs text-dark-500">{creator.camaroteViewers}/{creator.camaroteCapacity} pessoas</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-white/5 mb-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{ width: `${(creator.camaroteViewers / creator.camaroteCapacity) * 100}%` }}
                />
              </div>
              {creator.camaroteIsOpen && (
                <button className="w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-sm font-medium hover:bg-emerald-500/25 transition-all">
                  Entrar no Camarote
                </button>
              )}
            </div>

            {/* Próximo Evento */}
            {creator.nextEvent && eventType && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" /> Próximo Evento
                </h2>
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${eventType.color} mb-2`}>
                    {eventType.label}
                  </span>
                  <h3 className="font-bold text-white text-sm mb-2">{creator.nextEvent.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-dark-400 mb-3">
                    <Clock className="w-3 h-3" />
                    {new Date(creator.nextEvent.date).toLocaleDateString('pt-BR', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold text-sm">{creator.nextEvent.price} ⭐</span>
                    <button className="px-4 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/25 transition-all">
                      Reservar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Disponibilidade */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" /> Disponibilidade
              </h2>
              <div className="space-y-2">
                {creator.schedule.map(slot => (
                  <div key={slot} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-dark-300">
                    {slot}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
