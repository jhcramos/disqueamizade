import { useState } from 'react'
import {
  Lock, Unlock, Coins, Star, BadgeCheck, Eye, Heart,
  Clock, Play, Image, Music, BookOpen, Search,
  Sparkles, TrendingUp, Award, X, Check, Crown
} from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { useFichaStore } from '@/store/fichaStore'
import { mockExclusiveContent, contentCategories } from '@/data/mockExclusiveContent'
import type { ExclusiveContent, ContentCategory } from '@/data/mockExclusiveContent'

// ═══════════════════════════════════════════════════════════════════════════
// Unlock Modal
// ═══════════════════════════════════════════════════════════════════════════

const UnlockModal = ({
  content,
  onClose,
  onUnlock,
  balance,
}: {
  content: ExclusiveContent
  onClose: () => void
  onUnlock: () => void
  balance: number
}) => {
  const canAfford = balance >= content.fichasCost
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  const handleUnlock = async () => {
    if (!canAfford) return
    setIsUnlocking(true)
    await new Promise(r => setTimeout(r, 1500))
    setUnlocked(true)
    onUnlock()
    setTimeout(() => onClose(), 2000)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 rounded-2xl border border-white/10 w-full max-w-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={content.thumbnail}
            alt=""
            className="w-full h-full object-cover blur-md scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-dark-900" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <img src={content.creatorAvatar} alt="" className="w-8 h-8 rounded-full ring-1 ring-white/20" />
              <span className="text-white text-sm font-medium">{content.creatorName}</span>
              {content.creatorVerified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
            </div>
            <h3 className="text-white font-bold text-lg leading-tight">{content.title}</h3>
          </div>
        </div>

        <div className="p-5">
          {unlocked ? (
            // Success state
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Desbloqueado! 🎉</h3>
              <p className="text-dark-400 text-sm">Aproveite o conteúdo exclusivo</p>
            </div>
          ) : isUnlocking ? (
            // Loading state
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <div className="w-12 h-12 rounded-full border-3 border-primary-400/30 border-t-primary-400 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Desbloqueando...</h3>
              <p className="text-dark-400 text-sm">Processando sua compra</p>
            </div>
          ) : (
            <>
              <p className="text-dark-400 text-sm mb-4">{content.description}</p>

              {/* Content info */}
              <div className="flex flex-wrap gap-2 mb-4">
                {content.duration && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-dark-300">
                    <Clock className="w-3 h-3" />
                    {content.duration}
                  </span>
                )}
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-dark-300">
                  <Eye className="w-3 h-3" />
                  {content.unlocks} desbloqueios
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-dark-300">
                  <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                  {content.rating} ({content.ratingCount})
                </span>
              </div>

              {/* Price section */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-dark-400 text-xs">Preço</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Coins className="w-5 h-5 text-amber-400" />
                      <span className="text-2xl font-bold text-amber-400">{content.fichasCost}</span>
                      <span className="text-dark-400 text-sm">fichas</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-dark-400 text-xs">Seu saldo</span>
                    <div className={`text-lg font-bold mt-0.5 ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                      {balance} ƒ
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <button
                onClick={handleUnlock}
                disabled={!canAfford}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-dark-900 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-[0.98]'
                    : 'bg-dark-700 text-dark-500 cursor-not-allowed'
                }`}
              >
                {canAfford ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    Desbloquear por {content.fichasCost} fichas
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Fichas insuficientes (precisa {content.fichasCost - balance} mais)
                  </>
                )}
              </button>

              {!canAfford && (
                <a
                  href="/pricing"
                  className="block text-center text-primary-400 text-sm font-medium mt-3 hover:text-primary-300 transition-colors"
                >
                  Comprar mais fichas →
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Content Card
// ═══════════════════════════════════════════════════════════════════════════

const ContentCard = ({
  content,
  isUnlocked,
  onUnlockClick,
}: {
  content: ExclusiveContent
  isUnlocked: boolean
  onUnlockClick: () => void
}) => {
  const typeIcons: Record<string, typeof Play> = {
    video: Play,
    live_replay: Play,
    course: BookOpen,
    gallery: Image,
    audio: Music,
  }
  const TypeIcon = typeIcons[content.type] || Play

  const categoryInfo = contentCategories.find(c => c.id === content.category)

  return (
    <div className="group rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 hover:border-primary-500/20 transition-all hover:shadow-card-hover">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={content.thumbnail}
          alt={content.title}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isUnlocked ? 'group-hover:scale-105' : 'blur-lg scale-110'
          }`}
        />

        {!isUnlocked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <button
                onClick={onUnlockClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-dark-900 font-bold text-sm hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all active:scale-95"
              >
                <Coins className="w-4 h-4" />
                {content.fichasCost} fichas
              </button>
            </div>
          </div>
        )}

        {isUnlocked && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <TypeIcon className="w-7 h-7 text-white" />
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {content.isNew && (
            <span className="px-2 py-0.5 rounded-md bg-green-500/90 text-white text-[10px] font-bold uppercase">
              Novo
            </span>
          )}
          {content.isTrending && (
            <span className="px-2 py-0.5 rounded-md bg-orange-500/90 text-white text-[10px] font-bold uppercase flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Hot
            </span>
          )}
        </div>

        {/* Category badge */}
        {categoryInfo && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-xs">
            <span>{categoryInfo.emoji} {categoryInfo.name}</span>
          </div>
        )}

        {/* Duration */}
        {content.duration && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs">
            <Clock className="w-3 h-3" />
            {content.duration}
          </div>
        )}

        {/* Unlocked indicator */}
        {isUnlocked && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/20 backdrop-blur-sm">
            <Unlock className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400 font-medium">Desbloqueado</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Creator */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src={content.creatorAvatar}
            alt=""
            className="w-6 h-6 rounded-full ring-1 ring-white/10"
          />
          <span className="text-xs text-dark-400">{content.creatorUsername}</span>
          {content.creatorVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
        </div>

        {/* Title */}
        <h3 className="text-white font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary-300 transition-colors">
          {content.title}
        </h3>

        {/* Description */}
        <p className="text-dark-400 text-xs line-clamp-2 mb-3">{content.description}</p>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-dark-500">
              <Heart className="w-3 h-3" />
              {content.likes}
            </span>
            <span className="flex items-center gap-1 text-xs text-dark-500">
              <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
              {content.rating}
            </span>
          </div>
          {!isUnlocked && (
            <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
              <Coins className="w-3.5 h-3.5" />
              {content.fichasCost}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {content.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-dark-400">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Exclusive Page Main Component
// ═══════════════════════════════════════════════════════════════════════════

export const ExclusivePage = () => {
  const { balance, removeFichas } = useFichaStore()
  const [activeCategory, setActiveCategory] = useState<ContentCategory | 'all'>('all')
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set(['exc-5'])) // One already unlocked for demo
  const [unlockModal, setUnlockModal] = useState<ExclusiveContent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'price'>('popular')

  const handleUnlock = (content: ExclusiveContent) => {
    if (removeFichas(content.fichasCost)) {
      setUnlockedIds(prev => new Set([...prev, content.id]))
    }
  }

  const filteredContent = mockExclusiveContent
    .filter(c => activeCategory === 'all' || c.category === activeCategory)
    .filter(c => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.creatorName.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'popular') return b.unlocks - a.unlocks
      return a.fichasCost - b.fichasCost
    })

  const trendingContent = mockExclusiveContent
    .filter(c => c.isTrending)
    .sort((a, b) => b.unlocks - a.unlocks)
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-dark-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-pink-600/20 border border-white/5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M0%200h20v20H0zM20%2020h20v20H20z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3 mb-2">
                <Sparkles className="w-7 h-7 text-violet-400" />
                Conteúdo Exclusivo
              </h1>
              <p className="text-dark-300 text-sm md:text-base max-w-xl">
                Desbloqueie aulas, shows, bastidores e conteúdo premium dos melhores criadores com fichas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/20">
                <Coins className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="text-xs text-dark-400 block leading-none">Saldo</span>
                  <span className="text-amber-400 font-bold text-lg leading-none">{balance}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Category Cards ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {contentCategories.map(cat => {
            const count = mockExclusiveContent.filter(c => c.category === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                className={`p-4 rounded-xl border transition-all text-left ${
                  activeCategory === cat.id
                    ? 'bg-primary-500/15 border-primary-500/30 shadow-glow-primary'
                    : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <h3 className={`font-bold text-sm mt-2 ${activeCategory === cat.id ? 'text-primary-300' : 'text-white'}`}>
                  {cat.name}
                </h3>
                <p className="text-dark-500 text-xs mt-0.5">{count} conteúdos</p>
              </button>
            )
          })}
        </div>

        {/* ═══ Trending Carousel ═══ */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Em Alta
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            {trendingContent.map(content => (
              <div
                key={`trending-${content.id}`}
                className="flex-shrink-0 w-72 rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 hover:border-primary-500/20 transition-all group cursor-pointer"
                onClick={() => !unlockedIds.has(content.id) && setUnlockModal(content)}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={content.thumbnail}
                    alt=""
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                      !unlockedIds.has(content.id) ? 'blur-sm' : ''
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-orange-500/90 text-white text-[10px] font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> Trending
                  </div>
                  {!unlockedIds.has(content.id) && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/90 text-dark-900 text-xs font-bold">
                      <Coins className="w-3 h-3" />
                      {content.fichasCost}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={content.creatorAvatar} alt="" className="w-5 h-5 rounded-full" />
                    <span className="text-xs text-dark-400">{content.creatorUsername}</span>
                  </div>
                  <h3 className="text-white text-sm font-bold line-clamp-1">{content.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-dark-500 text-xs">
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{content.unlocks}</span>
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400" fill="currentColor" />{content.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Search & Sort ═══ */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar conteúdo, criador ou tag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-primary-500/30 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'popular' as const, label: 'Popular' },
              { value: 'recent' as const, label: 'Recente' },
              { value: 'price' as const, label: 'Preço' },
            ].map(s => (
              <button
                key={s.value}
                onClick={() => setSortBy(s.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  sortBy === s.value
                    ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30'
                    : 'bg-white/5 text-dark-400 border border-white/5 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Content Grid ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredContent.map(content => (
            <ContentCard
              key={content.id}
              content={content}
              isUnlocked={unlockedIds.has(content.id)}
              onUnlockClick={() => setUnlockModal(content)}
            />
          ))}
        </div>

        {filteredContent.length === 0 && (
          <div className="text-center py-16">
            <Lock className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-500 text-lg font-medium mb-1">Nenhum conteúdo encontrado</p>
            <p className="text-dark-600 text-sm">Tente uma busca diferente ou outra categoria</p>
          </div>
        )}

        {/* ═══ How it works ═══ */}
        <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-400" />
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Coins,
                title: 'Compre Fichas',
                desc: 'Adquira fichas para desbloquear conteúdos exclusivos dos seus criadores favoritos',
                color: 'text-amber-400',
              },
              {
                icon: Unlock,
                title: 'Desbloqueie',
                desc: 'Use fichas para acessar aulas, shows, bastidores e conteúdos premium',
                color: 'text-green-400',
              },
              {
                icon: Crown,
                title: 'Aproveite',
                desc: 'Acesso permanente ao conteúdo desbloqueado. Assista quantas vezes quiser!',
                color: 'text-purple-400',
              },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03]">
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 ${step.color}`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-dark-400 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {/* Unlock Modal */}
      {unlockModal && (
        <UnlockModal
          content={unlockModal}
          balance={balance}
          onClose={() => setUnlockModal(null)}
          onUnlock={() => handleUnlock(unlockModal)}
        />
      )}
    </div>
  )
}
