import { useState, useEffect, useCallback } from 'react'
import {
  X, ChevronLeft, ChevronRight, Heart, Flame, Send, Plus,
  Eye, Play, BadgeCheck, Crown, Coins, Image, Camera,
  Sparkles, MessageCircle, Share2, Bookmark
} from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { useFichaStore } from '@/store/fichaStore'
import { mockUserStories, mockReels } from '@/data/mockStories'
import type { UserStory, ReelItem } from '@/data/mockStories'

// ═══════════════════════════════════════════════════════════════════════════
// Story Viewer Component (Fullscreen)
// ═══════════════════════════════════════════════════════════════════════════

const StoryViewer = ({
  stories,
  initialIndex,
  onClose,
}: {
  stories: UserStory[]
  initialIndex: number
  onClose: () => void
}) => {
  const [currentUserIdx, setCurrentUserIdx] = useState(initialIndex)
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [sentReaction, setSentReaction] = useState<string | null>(null)
  const { removeFichas, balance } = useFichaStore()

  const currentUser = stories[currentUserIdx]
  const currentStory = currentUser?.stories[currentStoryIdx]

  const goNext = useCallback(() => {
    if (currentStoryIdx < currentUser.stories.length - 1) {
      setCurrentStoryIdx(prev => prev + 1)
      setProgress(0)
    } else if (currentUserIdx < stories.length - 1) {
      setCurrentUserIdx(prev => prev + 1)
      setCurrentStoryIdx(0)
      setProgress(0)
    } else {
      onClose()
    }
  }, [currentStoryIdx, currentUser?.stories.length, currentUserIdx, stories.length, onClose])

  const goPrev = useCallback(() => {
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx(prev => prev - 1)
      setProgress(0)
    } else if (currentUserIdx > 0) {
      setCurrentUserIdx(prev => prev - 1)
      setCurrentStoryIdx(stories[currentUserIdx - 1].stories.length - 1)
      setProgress(0)
    }
  }, [currentStoryIdx, currentUserIdx, stories])

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || !currentStory) return
    const duration = currentStory.duration * 1000
    const interval = 50 // update every 50ms
    const step = (interval / duration) * 100

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goNext()
          return 0
        }
        return prev + step
      })
    }, interval)

    return () => clearInterval(timer)
  }, [currentStory, isPaused, goNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onClose])

  const sendFichaReaction = (emoji: string, cost: number) => {
    if (removeFichas(cost)) {
      setSentReaction(emoji)
      setTimeout(() => setSentReaction(null), 1500)
    }
    setShowReactions(false)
  }

  if (!currentUser || !currentStory) return null

  const timeAgo = (dateStr: string) => {
    const hours = Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'agora'
    if (hours === 1) return '1h atrás'
    return `${hours}h atrás`
  }

  const fichaReactions = [
    { emoji: '❤️', cost: 1, label: 'Coração' },
    { emoji: '🔥', cost: 2, label: 'Fogo' },
    { emoji: '💎', cost: 5, label: 'Diamante' },
    { emoji: '⭐', cost: 3, label: 'Estrela' },
    { emoji: '👏', cost: 1, label: 'Palmas' },
    { emoji: '🚀', cost: 10, label: 'Foguete' },
  ]

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Previous button */}
      {(currentUserIdx > 0 || currentStoryIdx > 0) && (
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all hidden md:block"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next button */}
      {(currentUserIdx < stories.length - 1 || currentStoryIdx < currentUser.stories.length - 1) && (
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all hidden md:block"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Story container */}
      <div
        className="relative w-full max-w-md h-full max-h-[100dvh] md:max-h-[90vh] md:rounded-2xl overflow-hidden"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Story image */}
        <img
          src={currentStory.url}
          alt=""
          className="w-full h-full object-cover"
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {currentUser.stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{
                  width: idx < currentStoryIdx ? '100%' :
                    idx === currentStoryIdx ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="absolute top-8 left-3 right-3 flex items-center gap-3 z-10">
          <div className={`w-10 h-10 rounded-full overflow-hidden ring-2 ${currentUser.isOstentacao ? 'ring-amber-400' : 'ring-primary-400'}`}>
            <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-semibold text-sm">{currentUser.username}</span>
              {currentUser.isVerified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
              {currentUser.isOstentacao && <Crown className="w-4 h-4 text-amber-400" />}
            </div>
            <span className="text-white/60 text-xs">{timeAgo(currentStory.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1 text-white/60 text-xs">
            <Eye className="w-3.5 h-3.5" />
            <span>{currentStory.views.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Tap zones */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/3 h-full" onClick={goPrev} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" onClick={goNext} />
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-24 left-4 right-4 z-20">
            <p className="text-white text-base font-medium drop-shadow-lg">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Reactions bar */}
        <div className="absolute bottom-6 left-4 right-4 z-20">
          <div className="flex items-center gap-2">
            {/* Fichas reaction button */}
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all flex-1"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm">Enviar fichas</span>
            </button>
            <button className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all">
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Fichas reactions popup */}
          {showReactions && (
            <div className="absolute bottom-14 left-0 right-0 animate-slide-up">
              <div className="bg-dark-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/60">Reagir com fichas</span>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm text-amber-400 font-bold">{balance}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {fichaReactions.map(r => (
                    <button
                      key={r.emoji}
                      onClick={() => sendFichaReaction(r.emoji, r.cost)}
                      disabled={balance < r.cost}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="text-2xl">{r.emoji}</span>
                      <span className="text-xs text-amber-400 font-medium">{r.cost} ƒ</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sent reaction animation */}
        {sentReaction && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <span className="text-8xl animate-bounce">{sentReaction}</span>
          </div>
        )}

        {/* Reactions display */}
        <div className="absolute bottom-20 right-4 z-20 flex flex-col gap-1 items-end">
          {currentStory.reactions.map((r, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
              <span className="text-sm">{r.emoji}</span>
              <span className="text-xs text-white/80 font-medium">{r.count}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 backdrop-blur-sm">
            <Coins className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-400 font-bold">{currentStory.fichasReactions}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Create Story Modal
// ═══════════════════════════════════════════════════════════════════════════

const CreateStoryModal = ({ onClose }: { onClose: () => void }) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')

  const handleMockUpload = () => {
    const randomId = Math.floor(Math.random() * 100) + 200
    setPreview(`https://picsum.photos/1080/1920?random=${randomId}`)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 rounded-2xl border border-white/10 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Criar Story</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {preview ? (
            <div className="relative aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden mx-auto">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 right-3">
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Adicionar legenda..."
                  className="w-full px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:border-primary-400"
                />
              </div>
            </div>
          ) : (
            <div className="aspect-[9/16] max-h-[400px] rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary-400" />
              </div>
              <p className="text-dark-400 text-sm text-center">
                Escolha uma foto ou vídeo<br />para seu story
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleMockUpload}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-all"
                >
                  <Image className="w-4 h-4" />
                  Galeria
                </button>
                <button
                  onClick={handleMockUpload}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/15 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  Câmera
                </button>
              </div>
            </div>
          )}

          {preview && (
            <div className="flex gap-2">
              <button
                onClick={() => { setPreview(null); setCaption('') }}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition-all"
              >
                Trocar Foto
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm hover:shadow-glow-primary transition-all"
              >
                Publicar Story
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Reel Card
// ═══════════════════════════════════════════════════════════════════════════

const ReelCard = ({ reel }: { reel: ReelItem }) => {
  const formatViews = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-dark-800 border border-white/5 hover:border-primary-500/30 transition-all hover:shadow-card-hover cursor-pointer">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16]">
        <img
          src={reel.thumbnail}
          alt={reel.description}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          </div>
        </div>

        {/* Duration */}
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-medium">
          {reel.duration}
        </div>

        {/* Views */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs">
          <Eye className="w-3 h-3" />
          {formatViews(reel.views)}
        </div>

        {/* Fichas earned */}
        {reel.fichasEarned > 0 && (
          <div className="absolute bottom-16 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 backdrop-blur-sm">
            <Coins className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-400 font-bold">{reel.fichasEarned}</span>
          </div>
        )}

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* User */}
          <div className="flex items-center gap-2 mb-2">
            <img
              src={reel.avatar}
              alt=""
              className={`w-6 h-6 rounded-full ring-1 ${reel.isOstentacao ? 'ring-amber-400' : 'ring-white/30'}`}
            />
            <span className="text-white text-xs font-semibold">{reel.username}</span>
            {reel.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
          </div>

          {/* Description */}
          <p className="text-white/80 text-xs line-clamp-2">{reel.description}</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-dark-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-dark-400 text-xs">
            <Heart className="w-3.5 h-3.5" />
            <span>{formatViews(reel.likes)}</span>
          </div>
          <div className="flex items-center gap-1 text-dark-400 text-xs">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{reel.comments}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Share2 className="w-3.5 h-3.5 text-dark-400" />
          <Bookmark className="w-3.5 h-3.5 text-dark-400" />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Stories Page Main Component
// ═══════════════════════════════════════════════════════════════════════════

export const StoriesPage = () => {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [activeTag, setActiveTag] = useState<string>('todos')

  const openStory = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const tags = ['todos', 'carreira', 'fitness', 'arte', 'música', 'gaming', 'gastronomia', 'dança']

  const filteredReels = activeTag === 'todos'
    ? mockReels
    : mockReels.filter(r => r.tags.some(t => t.toLowerCase().includes(activeTag)))

  return (
    <div className="min-h-screen bg-dark-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-primary-400" />
              Stories & Reels
            </h1>
            <p className="text-dark-400 text-sm mt-1">Descubra o que está acontecendo agora</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-sm hover:shadow-glow-primary transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Criar Story</span>
          </button>
        </div>

        {/* ═══ Stories Carousel ═══ */}
        <div className="mb-8">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            {/* Create Story button */}
            <button
              onClick={() => setCreateOpen(true)}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <div className="w-[72px] h-[72px] md:w-20 md:h-20 rounded-full border-2 border-dashed border-primary-400/40 flex items-center justify-center bg-primary-500/10 hover:bg-primary-500/20 transition-all">
                <Plus className="w-7 h-7 text-primary-400" />
              </div>
              <span className="text-xs text-dark-400 font-medium">Criar</span>
            </button>

            {/* User stories */}
            {mockUserStories.map((userStory, idx) => (
              <button
                key={userStory.id}
                onClick={() => openStory(idx)}
                className="flex-shrink-0 flex flex-col items-center gap-2 group"
              >
                <div className={`p-0.5 rounded-full ${
                  userStory.allViewed
                    ? 'bg-dark-600'
                    : userStory.isOstentacao
                      ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600'
                      : 'bg-gradient-to-br from-primary-400 via-pink-500 to-purple-600'
                }`}>
                  <div className="p-0.5 bg-dark-950 rounded-full">
                    <div className="w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-full overflow-hidden relative">
                      <img
                        src={userStory.avatar}
                        alt={userStory.username}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      {userStory.isLive && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider">
                          Live
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium max-w-[72px] truncate ${
                  userStory.allViewed ? 'text-dark-500' : 'text-white'
                }`}>
                  {userStory.username.length > 10 ? userStory.username.slice(0, 9) + '…' : userStory.username}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Reels Section ═══ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-primary-400" />
              Reels em Destaque
            </h2>
          </div>

          {/* Filter tags */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 mb-4">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTag === tag
                    ? 'bg-primary-500 text-white shadow-glow-primary'
                    : 'bg-white/5 text-dark-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </button>
            ))}
          </div>

          {/* Reels grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredReels.map(reel => (
              <ReelCard key={reel.id} reel={reel} />
            ))}
          </div>

          {filteredReels.length === 0 && (
            <div className="text-center py-16">
              <Play className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-500 text-sm">Nenhum reel encontrado para esta categoria</p>
            </div>
          )}
        </div>

        {/* ═══ Trending Section ═══ */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            Trending Agora
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockReels.filter(r => r.views > 100000).map(reel => (
              <div
                key={`trending-${reel.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary-500/20 transition-all cursor-pointer group"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={reel.thumbnail}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <img src={reel.avatar} alt="" className="w-5 h-5 rounded-full" />
                    <span className="text-xs text-white/60">{reel.username}</span>
                    {reel.isVerified && <BadgeCheck className="w-3 h-3 text-blue-400" />}
                  </div>
                  <p className="text-white text-sm font-medium line-clamp-2 mb-1">
                    {reel.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-dark-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {(reel.views / 1000).toFixed(0)}K
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {(reel.likes / 1000).toFixed(1)}K
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" />
                      {reel.fichasEarned}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {/* Story Viewer */}
      {viewerOpen && (
        <StoryViewer
          stories={mockUserStories}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Create Story Modal */}
      {createOpen && (
        <CreateStoryModal onClose={() => setCreateOpen(false)} />
      )}
    </div>
  )
}
