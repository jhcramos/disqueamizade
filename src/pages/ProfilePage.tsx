import { useParams, Link } from 'react-router-dom'
import { Star, MapPin, Clock, Award, Users, Shield, ArrowLeft, Calendar, Lock, Heart } from 'lucide-react'
import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import { getCreatorById, mockCreators } from '../data/mockCreators'

export const ProfilePage = () => {
  const { userId } = useParams()
  const creator = getCreatorById(userId || '') || mockCreators[0]

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Back */}
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary-light transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Profile Card */}
          <div className="lg:col-span-1">
            <div className="card rounded-2xl overflow-hidden sticky top-24">
              {/* Avatar */}
              <div className="relative">
                <div className="aspect-square bg-surface">
                  <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                </div>
                {creator.isOnline && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-bg/80 backdrop-blur-sm border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm text-emerald-400 font-bold">Online agora</span>
                  </div>
                )}
                {creator.isFeatured && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-bold">
                    ⭐ Creator Destaque
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-1">{creator.name}</h1>
                <p className="text-sm text-gray-500 mb-3">@{creator.username}</p>

                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">{creator.city}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(creator.rating) ? 'text-accent fill-accent' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-accent">{creator.rating}</span>
                  <span className="text-sm text-gray-500">({creator.reviewCount} avaliações)</span>
                </div>

                {/* Service */}
                <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-2xl">{creator.serviceEmoji}</span>
                  <span className="text-primary-light font-bold">{creator.service}</span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Preço por sessão</p>
                    <p className="text-2xl font-bold text-accent">{creator.priceInFichas} fichas</p>
                  </div>
                  <div className="text-3xl">🪙</div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark hover:shadow-card-hover transition-all text-lg">
                    Contratar Sessão
                  </button>
                  <button className="w-full py-3.5 rounded-xl border border-primary/30 text-primary-light font-bold hover:bg-primary/10 transition-all flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5" />
                    Assinar Creator
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-6">
                  {creator.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 text-xs rounded-full bg-surface text-gray-400 border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            <div className="card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Sobre</h2>
              <p className="text-gray-300 leading-relaxed">{creator.bio}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card rounded-2xl p-5 text-center">
                <Award className="w-8 h-8 text-primary-light mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{creator.sessionsCompleted}</div>
                <div className="text-xs text-gray-500 font-medium">Sessões</div>
              </div>
              <div className="card rounded-2xl p-5 text-center">
                <Star className="w-8 h-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{creator.satisfactionRate}%</div>
                <div className="text-xs text-gray-500 font-medium">Satisfação</div>
              </div>
              <div className="card rounded-2xl p-5 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{creator.reviewCount}</div>
                <div className="text-xs text-gray-500 font-medium">Avaliações</div>
              </div>
              <div className="card rounded-2xl p-5 text-center">
                <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">Verificado</div>
                <div className="text-xs text-gray-500 font-medium">Status</div>
              </div>
            </div>

            {/* Schedule */}
            <div className="card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Disponibilidade
              </h2>
              <div className="space-y-3">
                {creator.schedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface/50 border border-white/5">
                    <Clock className="w-5 h-5 text-primary-light" />
                    <span className="text-gray-300">{s}</span>
                  </div>
                ))}
              </div>
              {creator.isOnline ? (
                <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Disponível agora para sessão!
                </div>
              ) : (
                <div className="mt-4 text-sm text-gray-500">
                  Creator offline no momento. Você pode agendar uma sessão.
                </div>
              )}
            </div>

            {/* Gallery */}
            <div className="card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Galeria</h2>
              {creator.gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {creator.gallery.map((img, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-white/5 group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-dark-bg/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Lock className="w-6 h-6 text-primary-light" />
                      </div>
                    </div>
                  ))}
                  {/* Blurred locked items */}
                  {[1, 2, 3].map((i) => (
                    <div key={`locked-${i}`} className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-surface">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl flex flex-col items-center justify-center">
                        <Lock className="w-6 h-6 text-gray-500 mb-1" />
                        <span className="text-xs text-gray-500">Assinar para ver</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-surface">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent flex flex-col items-center justify-center">
                        <Lock className="w-6 h-6 text-gray-500 mb-1" />
                        <span className="text-xs text-gray-500">Assinar para ver</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-4 text-center">
                🔒 Assine este creator para desbloquear todo o conteúdo exclusivo
              </p>
            </div>

            {/* Reviews preview */}
            <div className="card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Avaliações Recentes</h2>
              <div className="space-y-4">
                {[
                  { name: 'Juliana M.', rating: 5, text: 'Excelente profissional! Super recomendo. Sessão incrível.', date: 'há 2 dias' },
                  { name: 'Carlos R.', rating: 5, text: 'Muito atencioso(a) e dedicado(a). Voltarei com certeza!', date: 'há 5 dias' },
                  { name: 'Ana Paula S.', rating: 4, text: 'Boa experiência, aprendi bastante. Preço justo.', date: 'há 1 semana' },
                ].map((review, i) => (
                  <div key={i} className="p-4 rounded-xl bg-surface/50 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-xs font-bold text-white">
                          {review.name[0]}
                        </div>
                        <span className="font-bold text-white text-sm">{review.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: review.rating }).map((_, j) => (
                        <Star key={j} className="w-3 h-3 text-accent fill-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">{review.text}</p>
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
