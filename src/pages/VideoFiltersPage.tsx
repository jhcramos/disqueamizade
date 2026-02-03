import { useState } from 'react'
import { Lock, Star, Sparkles, Camera } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
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
  // PREMIUM filters
  { id: 'mask3d-tron', name: 'Capacete Tron', description: 'Máscara 3D futurista', type: 'mask_3d', requiredTier: 'premium', emoji: '🎭', category: 'Máscaras 3D' },
  { id: 'mask3d-robot', name: 'Robot Cyborg', description: 'Transformação robótica', type: 'mask_3d', requiredTier: 'premium', emoji: '🤖', category: 'Máscaras 3D' },
  { id: 'mask3d-alien', name: 'Alien', description: 'Máscara alienígena', type: 'mask_3d', requiredTier: 'premium', emoji: '👽', category: 'Máscaras 3D' },
  { id: 'bg-matrix', name: 'Matrix Code', description: 'Código Matrix animado', type: 'background', requiredTier: 'premium', emoji: '🟢', category: 'Fundos Animados' },
  { id: 'bg-cybercity', name: 'Cyber City Animated', description: 'Cidade com parallax', type: 'background', requiredTier: 'premium', emoji: '🌃', category: 'Fundos Animados' },
  { id: 'fx-glitch', name: 'Glitch Digital', description: 'Efeito de falha digital', type: 'ar_effect', requiredTier: 'premium', emoji: '⚡', category: 'Efeitos Especiais' },
  { id: 'fx-holo', name: 'Holograma', description: 'Projeção holográfica', type: 'ar_effect', requiredTier: 'premium', emoji: '✨', category: 'Efeitos Especiais' },
  { id: 'fx-particles', name: 'Partículas Neon', description: 'Partículas flutuantes', type: 'ar_effect', requiredTier: 'premium', emoji: '💫', category: 'Efeitos Especiais' },
]

const categories = ['Todos', 'Fundos', 'Máscaras 2D', 'Máscaras 3D', 'Filtros de Cor', 'Efeitos Especiais', 'Anonimato', 'Fundos Animados']

// Demo user tier
const USER_TIER = 'basic' as string

export const VideoFiltersPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [previewFilter, setPreviewFilter] = useState<string | null>(null)

  const filteredFilters = selectedCategory === 'Todos'
    ? filters
    : filters.filter(f => f.category === selectedCategory)

  const canUse = (tier: string) => {
    if (USER_TIER === 'premium') return true
    if (USER_TIER === 'basic' && tier !== 'premium') return true
    return tier === 'free'
  }

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
            18 filtros disponíveis usando MediaPipe — máscaras, fundos e efeitos em tempo real!
          </p>
        </div>

        {/* Demo Area */}
        <div className="card p-6 mb-8 border border-primary-500/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary-400" />
                Área de Preview
              </h3>
              <div className="aspect-video bg-dark-900 rounded-xl border border-white/5 flex items-center justify-center">
                {previewFilter ? (
                  <div className="text-center">
                    <div className="text-6xl mb-3">{filters.find(f => f.id === previewFilter)?.emoji}</div>
                    <p className="text-sm text-white font-medium">{filters.find(f => f.id === previewFilter)?.name}</p>
                    <p className="text-xs text-dark-500 mt-1">Preview do filtro (MediaPipe em breve)</p>
                  </div>
                ) : (
                  <div className="text-center text-dark-500">
                    <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Clique em um filtro para visualizar</p>
                  </div>
                )}
              </div>
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
                  {USER_TIER === 'basic' && '10 filtros disponíveis. Upgrade para 18!'}
                  {USER_TIER === 'premium' && 'Todos os 18 filtros desbloqueados!'}
                </p>
              </div>
              <div className="space-y-2 text-xs text-dark-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Disponível no seu plano</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400">Requer upgrade</span>
                </div>
              </div>
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
            return (
              <button
                key={filter.id}
                onClick={() => available ? setPreviewFilter(filter.id) : undefined}
                className={`card p-4 text-center transition-all group relative ${
                  available
                    ? 'hover:border-primary-500/30 hover:shadow-glow-primary cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                } ${previewFilter === filter.id ? 'border-primary-500/40 bg-primary-500/5' : ''}`}
              >
                {/* Lock for unavailable */}
                {!available && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                )}

                {/* Tier badge */}
                <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  filter.requiredTier === 'premium'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-primary-500/15 text-primary-400'
                }`}>
                  {filter.requiredTier === 'premium' ? 'PRO' : 'BASIC'}
                </div>

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
