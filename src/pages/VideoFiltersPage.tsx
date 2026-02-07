import { useState, useRef, useEffect, useCallback } from 'react'
import { Lock, Star, Sparkles, Camera, Video, VideoOff } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { useVideoFilter } from '@/hooks/useVideoFilter'
import type { VideoFilter } from '@/types'

const filters: VideoFilter[] = [
  // BASIC filters
  { id: 'blur-bg', name: 'Desfocar Fundo', description: 'Blur suave no fundo', type: 'background', requiredTier: 'basic', emoji: '🌫️', category: 'Fundos' },
  { id: 'bg-tron', name: 'Grid Tron', description: 'Background futurista neon', type: 'background', requiredTier: 'basic', emoji: '🌐', category: 'Fundos' },
  { id: 'bg-cyber', name: 'Cidade Cyberpunk', description: 'Fundo de cidade neon', type: 'background', requiredTier: 'basic', emoji: '🏙️', category: 'Fundos' },
  { id: 'bg-space', name: 'Espaço Sideral', description: 'Estrelas e nebulosas', type: 'background', requiredTier: 'basic', emoji: '🌌', category: 'Fundos' },
  { id: 'mask-glasses', name: 'Óculos Neon', description: 'Óculos futuristas brilhantes', type: 'mask_2d', requiredTier: 'basic', emoji: '🕶️', category: 'Máscaras 2D' },
  { id: 'mask-hat', name: 'Chapéu Digital', description: 'Chapéu holográfico', type: 'mask_2d', requiredTier: 'basic', emoji: '🎩', category: 'Máscaras 2D' },
  { id: 'color-bw', name: 'Preto e Branco', description: 'Clássico monocromático', type: 'color', requiredTier: 'basic', emoji: '⚫', category: 'Filtros de Cor' },
  { id: 'color-sepia', name: 'Sépia', description: 'Efeito vintage', type: 'color', requiredTier: 'basic', emoji: '🟤', category: 'Filtros de Cor' },
  { id: 'color-neon', name: 'Neon Boost', description: 'Cores vibrantes cyber', type: 'color', requiredTier: 'basic', emoji: '💠', category: 'Filtros de Cor' },
  { id: 'anon', name: 'Modo Anônimo', description: 'Pixelização do rosto', type: 'anonymity', requiredTier: 'basic', emoji: '🔒', category: 'Anonimato' },
  // PREMIUM masks (face mesh based)
  { id: 'neon_wireframe', name: 'Neon Wireframe', description: 'Malha neon sobre o rosto', type: 'mask_3d', requiredTier: 'premium', emoji: '🕸️', category: 'Máscaras 3D' },
  { id: 'pixel_face', name: 'Pixel Face', description: 'Rosto pixelado estilo retro', type: 'mask_3d', requiredTier: 'premium', emoji: '👾', category: 'Máscaras 3D' },
  { id: 'emoji_tracker', name: 'Emoji Tracker', description: 'Emojis seguindo seu rosto', type: 'mask_3d', requiredTier: 'premium', emoji: '😎', category: 'Máscaras 3D' },
  { id: 'cat_morph', name: 'Animal Morph', description: 'Transformação animal', type: 'mask_3d', requiredTier: 'premium', emoji: '🐱', category: 'Máscaras 3D' },
  { id: 'anime_style', name: 'Anime Style', description: 'Estilo anime/mangá', type: 'mask_3d', requiredTier: 'premium', emoji: '🎌', category: 'Máscaras 3D' },
  // Static-only filters (no face mesh renderer)
  { id: 'mask3d-tron', name: 'Capacete Tron', description: 'Máscara 3D futurista', type: 'mask_3d', requiredTier: 'premium', emoji: '🎭', category: 'Máscaras 3D' },
  { id: 'bg-matrix', name: 'Matrix Code', description: 'Código Matrix animado', type: 'background', requiredTier: 'premium', emoji: '🟢', category: 'Fundos Animados' },
  // 🔥 80s Legends Collection 🔥
  { id: 'he_man', name: 'He-Man', description: 'Coroa dourada, mandíbula forte, aura de poder', type: 'mask_3d', requiredTier: 'premium', emoji: '🗡️', category: '80s Legends' },
  { id: 'optimus_prime', name: 'Optimus Prime', description: 'Placa facial metálica, olhos azuis brilhantes', type: 'mask_3d', requiredTier: 'premium', emoji: '🤖', category: '80s Legends' },
  { id: 'freddie_mercury', name: 'Freddie Mercury', description: 'Bigode icônico, coroa, microfone, aura roxa', type: 'mask_3d', requiredTier: 'premium', emoji: '🎤', category: '80s Legends' },
  { id: 'knight_rider', name: 'Knight Rider', description: 'Cabelo dos 80s, jaqueta de couro, scanner KITT', type: 'mask_3d', requiredTier: 'premium', emoji: '🚗', category: '80s Legends' },
  { id: 'jaspion', name: 'Jaspion', description: 'Capacete espacial prata/vermelho, visor brilhante', type: 'mask_3d', requiredTier: 'premium', emoji: '🦸', category: '80s Legends' },
  { id: 'she_ra', name: 'She-Ra', description: 'Tiara dourada, cabelos fluidos, efeitos cintilantes', type: 'mask_3d', requiredTier: 'premium', emoji: '⚔️', category: '80s Legends' },
  { id: 'jem', name: 'Jem', description: 'Brincos estrela rosa, cabelo holográfico, glitter', type: 'mask_3d', requiredTier: 'premium', emoji: '💎', category: '80s Legends' },
  { id: 'wonder_woman', name: 'Mulher Maravilha', description: 'Tiara dourada com estrela, laço dourado brilhante', type: 'mask_3d', requiredTier: 'premium', emoji: '🌟', category: '80s Legends' },
  { id: 'madonna', name: 'Madonna', description: 'Laço rendado, brincos cruz, marca de beleza, neon 80s', type: 'mask_3d', requiredTier: 'premium', emoji: '💋', category: '80s Legends' },
  { id: 'cheetara', name: 'Cheetara', description: 'Padrão manchado, olhos felinos, listras laranja', type: 'mask_3d', requiredTier: 'premium', emoji: '🐆', category: '80s Legends' },
]

// Filters that have actual face mesh renderers
const LIVE_MASK_IDS = new Set([
  'neon_wireframe', 'pixel_face', 'emoji_tracker', 'cat_morph', 'anime_style',
  'he_man', 'optimus_prime', 'freddie_mercury', 'knight_rider', 'jaspion',
  'she_ra', 'jem', 'wonder_woman', 'madonna', 'cheetara'
])

const categories = ['Todos', 'Fundos', 'Máscaras 2D', 'Máscaras 3D', 'Filtros de Cor', 'Efeitos Especiais', 'Anonimato', 'Fundos Animados', '80s Legends']

// Demo: all unlocked for testing
const USER_TIER = 'premium' as string

export const VideoFiltersPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [previewFilter, setPreviewFilter] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraLoading, setCameraLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const {
    canvasRef,
    isProcessing,
    enableFilter,
    disableFilter,
    currentFilter,
    detectionResults
  } = useVideoFilter({ stream: cameraStream, videoRef })

  const filteredFilters = selectedCategory === 'Todos'
    ? filters
    : filters.filter(f => f.category === selectedCategory)

  const canUse = (_tier: string) => {
    // All unlocked for demo
    return true
  }

  const startCamera = useCallback(async () => {
    setCameraLoading(true)
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setCameraError(`Não foi possível acessar a câmera: ${msg}`)
      console.error('Camera error:', err)
    } finally {
      setCameraLoading(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop())
      setCameraStream(null)
    }
    disableFilter()
    setPreviewFilter(null)
  }, [cameraStream, disableFilter])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop())
      }
    }
  }, [cameraStream])

  const handleFilterSelect = (filterId: string) => {
    if (!LIVE_MASK_IDS.has(filterId)) {
      // Static filter — just show emoji preview
      setPreviewFilter(filterId)
      disableFilter()
      return
    }

    if (!cameraStream) {
      // Auto-start camera when selecting a live mask
      setPreviewFilter(filterId)
      startCamera().then(() => {
        enableFilter(filterId)
      })
      return
    }

    if (currentFilter === filterId) {
      disableFilter()
      setPreviewFilter(null)
    } else {
      setPreviewFilter(filterId)
      enableFilter(filterId)
    }
  }

  // When camera starts and a filter was pending, enable it
  useEffect(() => {
    if (cameraStream && previewFilter && LIVE_MASK_IDS.has(previewFilter) && !currentFilter) {
      enableFilter(previewFilter)
    }
  }, [cameraStream, previewFilter, currentFilter, enableFilter])

  const isLivePreview = cameraStream && currentFilter && LIVE_MASK_IDS.has(currentFilter)

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary-400" />
            Filtros de Vídeo
          </h1>
          <p className="text-dark-500 mt-2 text-sm">
            {filters.length} filtros disponíveis usando MediaPipe — máscaras, fundos e efeitos em tempo real! 🔥 Novo: 10 Lendas dos Anos 80!
          </p>
        </div>

        {/* Camera Preview Area */}
        <div className="card p-6 mb-8 border border-primary-500/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary-400" />
                Preview ao Vivo
              </h3>
              <div className="relative aspect-video bg-dark-900 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
                {/* Hidden video for raw camera feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="hidden"
                />

                {/* Canvas for filtered output */}
                {isLivePreview && (
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="w-full h-full object-contain rounded-xl"
                  />
                )}

                {/* Raw camera feed when no live filter */}
                {cameraStream && !isLivePreview && (
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={(el) => { if (el) el.srcObject = cameraStream }}
                    className="w-full h-full object-contain rounded-xl"
                  />
                )}

                {/* No camera state */}
                {!cameraStream && !cameraLoading && (
                  <div className="text-center text-dark-500 p-8">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm mb-4">Clique para ligar a câmera e testar os filtros</p>
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all flex items-center gap-2 mx-auto"
                    >
                      <Video className="w-5 h-5" />
                      Ligar Câmera
                    </button>
                  </div>
                )}

                {/* Loading camera */}
                {cameraLoading && (
                  <div className="text-center text-dark-400 p-8">
                    <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm">Acessando câmera...</p>
                  </div>
                )}

                {/* Camera error */}
                {cameraError && (
                  <div className="text-center text-red-400 p-8">
                    <VideoOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-all"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}

                {/* Static emoji preview for non-mask filters */}
                {cameraStream && previewFilter && !LIVE_MASK_IDS.has(previewFilter) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-6xl mb-3">{filters.find(f => f.id === previewFilter)?.emoji}</div>
                      <p className="text-sm text-white font-medium">{filters.find(f => f.id === previewFilter)?.name}</p>
                      <p className="text-xs text-dark-400 mt-1">Efeito aplicado na chamada de vídeo</p>
                    </div>
                  </div>
                )}

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-lg backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white font-medium">AI Face Tracking</span>
                  </div>
                )}

                {/* Face detected indicator */}
                {detectionResults && isLivePreview && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-lg backdrop-blur-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-xs text-white font-medium">Rosto Detectado</span>
                  </div>
                )}

                {/* Current filter badge */}
                {currentFilter && isLivePreview && (
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-purple-500/80 rounded-lg backdrop-blur-sm">
                    <span className="text-xs text-white font-medium">
                      {filters.find(f => f.id === currentFilter)?.emoji} {filters.find(f => f.id === currentFilter)?.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Camera controls */}
              {cameraStream && (
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={stopCamera}
                    className="flex-1 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <VideoOff className="w-4 h-4" />
                    Desligar Câmera
                  </button>
                  {currentFilter && (
                    <button
                      onClick={() => { disableFilter(); setPreviewFilter(null) }}
                      className="flex-1 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg text-sm font-medium transition-all"
                    >
                      Remover Filtro
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-2">Seu Plano</h3>
              <div className="card p-4 border border-primary-500/20 bg-primary-500/5 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-primary-400" />
                  <span className="font-bold text-white capitalize">{USER_TIER}</span>
                </div>
                <p className="text-xs text-dark-400">
                  {USER_TIER === 'free' && 'Sem acesso a filtros. Faça upgrade!'}
                  {USER_TIER === 'basic' && '10 filtros disponíveis. Upgrade para 28!'}
                  {USER_TIER === 'premium' && 'Todos os filtros desbloqueados! Inclui 10 Lendas dos 80s! 🔥'}
                </p>
              </div>
              <div className="space-y-2 text-xs text-dark-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Disponível no seu plano</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-purple-400">Máscara com face tracking ao vivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400">Requer upgrade</span>
                </div>
              </div>

              {/* Quick 80s filter buttons when camera is on */}
              {cameraStream && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-white mb-2">🔥 80s Legends - Teste Rápido</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {filters.filter(f => f.category === '80s Legends').map(f => (
                      <button
                        key={f.id}
                        onClick={() => handleFilterSelect(f.id)}
                        className={`p-2 rounded-lg text-center transition-all ${
                          currentFilter === f.id
                            ? 'bg-purple-500/30 border border-purple-500/50 scale-105'
                            : 'bg-dark-800 hover:bg-dark-700 border border-transparent'
                        }`}
                        title={f.name}
                      >
                        <div className="text-2xl">{f.emoji}</div>
                        <div className="text-[9px] text-dark-400 mt-1 truncate">{f.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                  : 'text-dark-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFilters.map((filter) => {
            const available = canUse(filter.requiredTier)
            const isLiveMask = LIVE_MASK_IDS.has(filter.id)
            const isActive = currentFilter === filter.id
            return (
              <button
                key={filter.id}
                onClick={() => available ? handleFilterSelect(filter.id) : undefined}
                className={`card p-4 text-center transition-all group relative ${
                  available
                    ? 'hover:border-primary-500/30 hover:shadow-glow-primary cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                } ${isActive ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10' : ''} ${
                  previewFilter === filter.id && !isActive ? 'border-primary-500/40 bg-primary-500/5' : ''
                }`}
              >
                {/* Lock for unavailable */}
                {!available && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                )}

                {/* Live mask indicator */}
                {isLiveMask && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-400">
                    LIVE
                  </div>
                )}

                {/* Tier badge for non-live */}
                {!isLiveMask && (
                  <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    filter.requiredTier === 'premium'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-primary-500/15 text-primary-400'
                  }`}>
                    {filter.requiredTier === 'premium' ? 'PRO' : 'BASIC'}
                  </div>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                )}

                <div className="text-4xl mb-3 mt-2 group-hover:scale-110 transition-transform">{filter.emoji}</div>
                <h4 className="text-sm font-semibold text-white mb-1">{filter.name}</h4>
                <p className="text-[11px] text-dark-500 leading-relaxed">{filter.description}</p>
                <div className="mt-2">
                  <span className="text-[10px] text-dark-600 bg-white/[0.03] px-2 py-0.5 rounded-full">{filter.category}</span>
                </div>
              </button>
            )
          })}
        </div>
      </main>
      <Footer />
    </div>
  )
}
