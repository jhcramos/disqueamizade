import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common'
import { useAuth } from '@/hooks/useAuth'
import { PLANS } from '@/config/plans.config'
import type { SubscriptionTier } from '@/types'
import {
  ArrowLeft,
  Camera,
  Sparkles,
  Crown,
  Check,
  X,
  Lock,
  Palette,
  User,
  Layers,
  Shield,
  Wand2,
  Zap,
  Eye,
  Cpu,
} from 'lucide-react'

const FILTER_CATEGORIES = [
  {
    type: 'background' as const,
    name: 'Backgrounds Virtuais',
    icon: Layers,
    description: 'Substitua seu fundo por cenários virtuais',
    requiredTier: 'basic' as SubscriptionTier,
    filters: [
      { id: 'bg1', name: 'Escritório Moderno', preview: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' },
      { id: 'bg2', name: 'Praia Tropical', preview: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' },
      { id: 'bg3', name: 'Espaço Sideral', preview: 'bg-gradient-to-br from-violet-500/20 to-indigo-500/20' },
      { id: 'bg4', name: 'Floresta', preview: 'bg-gradient-to-br from-emerald-500/20 to-green-500/20' },
    ],
  },
  {
    type: 'mask_2d' as const,
    name: 'Máscaras 2D',
    icon: User,
    description: 'Máscaras animadas que seguem seu rosto',
    requiredTier: 'basic' as SubscriptionTier,
    filters: [
      { id: 'm1', name: 'Gato', preview: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20' },
      { id: 'm2', name: 'Robô', preview: 'bg-gradient-to-br from-zinc-500/20 to-slate-500/20' },
      { id: 'm3', name: 'Astronauta', preview: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20' },
    ],
  },
  {
    type: 'mask_3d' as const,
    name: 'Máscaras 3D',
    icon: Wand2,
    description: 'Avatares 3D realistas com tracking facial',
    requiredTier: 'premium' as SubscriptionTier,
    filters: [
      { id: '3d1', name: 'Avatar Realista', preview: 'bg-gradient-to-br from-rose-500/20 to-pink-500/20' },
      { id: '3d2', name: 'Cartoon 3D', preview: 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20' },
    ],
  },
  {
    type: 'color' as const,
    name: 'Filtros de Cor',
    icon: Palette,
    description: 'Ajustes de cor e efeitos visuais no vídeo',
    requiredTier: 'basic' as SubscriptionTier,
    filters: [
      { id: 'c1', name: 'Warm', preview: 'bg-gradient-to-br from-orange-500/20 to-amber-500/20' },
      { id: 'c2', name: 'Cool', preview: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' },
      { id: 'c3', name: 'Vintage', preview: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20' },
      { id: 'c4', name: 'B&W', preview: 'bg-gradient-to-br from-zinc-400/20 to-zinc-600/20' },
    ],
  },
  {
    type: 'anonymity' as const,
    name: 'Modo Anonimato',
    icon: Shield,
    description: 'Oculte sua identidade com blur ou silhueta',
    requiredTier: 'basic' as SubscriptionTier,
    filters: [
      { id: 'a1', name: 'Blur Facial', preview: 'bg-gradient-to-br from-zinc-500/20 to-zinc-700/20' },
      { id: 'a2', name: 'Silhueta', preview: 'bg-gradient-to-br from-zinc-600/20 to-zinc-800/20' },
    ],
  },
  {
    type: 'ar_effect' as const,
    name: 'Efeitos AR',
    icon: Sparkles,
    description: 'Efeitos de realidade aumentada e partículas',
    requiredTier: 'premium' as SubscriptionTier,
    filters: [
      { id: 'ar1', name: 'Partículas Brilho', preview: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20' },
      { id: 'ar2', name: 'Glow Suave', preview: 'bg-gradient-to-br from-violet-500/20 to-indigo-500/20' },
      { id: 'ar3', name: 'Fogo', preview: 'bg-gradient-to-br from-red-500/20 to-orange-500/20' },
    ],
  },
]

const COMPARISON_ROWS = [
  { feature: 'Backgrounds Virtuais', basic: true, premium: true },
  { feature: 'Máscaras 2D', basic: true, premium: true },
  { feature: 'Filtros de Cor', basic: true, premium: true },
  { feature: 'Modo Anonimato', basic: true, premium: true },
  { feature: 'Backgrounds Custom (upload)', basic: true, premium: true },
  { feature: 'Máscaras 3D Avançadas', basic: false, premium: true },
  { feature: 'Efeitos AR', basic: false, premium: true },
  { feature: 'Recording com Filtros', basic: false, premium: true },
]

export const VideoFiltersPage = () => {
  const { profile } = useAuth()
  const userTier = profile?.subscription_tier || 'free'
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  const canUseFilter = (requiredTier: SubscriptionTier) => {
    const tierOrder: SubscriptionTier[] = ['free', 'basic', 'premium']
    return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier)
  }

  const filteredCategories = selectedCategory === 'all'
    ? FILTER_CATEGORIES
    : FILTER_CATEGORIES.filter((c) => c.type === selectedCategory)

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100">
      {/* Header */}
      <header className="border-b border-white/5 bg-surface/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/rooms" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary-light" />
                  Filtros de Vídeo
                </h1>
                <p className="text-xs text-gray-500">
                  Plano atual: <span className="text-primary-light font-semibold">{userTier.charAt(0).toUpperCase() + userTier.slice(1)}</span>
                </p>
              </div>
            </div>
            <Link to="/pricing">
              <Button variant="outline" size="sm">
                <Crown className="w-3.5 h-3.5 mr-1.5 inline" />
                Upgrade
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Technology cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-light" />
              </div>
              <h3 className="font-semibold text-gray-200">Tempo Real</h3>
            </div>
            <p className="text-sm text-gray-500">Processamento de filtros em tempo real com baixa latência.</p>
          </div>
          <div className="card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="font-semibold text-gray-200">Detecção Precisa</h3>
            </div>
            <p className="text-sm text-gray-500">Tracking facial avançado para máscaras e efeitos perfeitos.</p>
          </div>
          <div className="card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-gray-200">Performance</h3>
            </div>
            <p className="text-sm text-gray-500">Otimizado para funcionar em qualquer dispositivo sem lag.</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-card-hover'
                : 'bg-surface text-gray-400 hover:text-white hover:bg-surface-light'
            }`}
          >
            Todos
          </button>
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat.type}
              onClick={() => setSelectedCategory(cat.type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.type
                  ? 'bg-primary text-white shadow-card-hover'
                  : 'bg-surface text-gray-400 hover:text-white hover:bg-surface-light'
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Filter Categories */}
        <div className="space-y-8 mb-12">
          {filteredCategories.map((category) => {
            const unlocked = canUseFilter(category.requiredTier)
            return (
              <div key={category.type}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    unlocked ? 'bg-primary/10' : 'bg-surface'
                  }`}>
                    <category.icon className={`w-4 h-4 ${unlocked ? 'text-primary-light' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                      {category.name}
                      {!unlocked && (
                        <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full font-medium">
                          {category.requiredTier === 'premium' ? 'Premium' : 'Basic'}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {category.filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => unlocked && setSelectedFilter(filter.id === selectedFilter ? null : filter.id)}
                      className={`relative rounded-2xl border p-4 text-center transition-all ${
                        !unlocked
                          ? 'border-white/5 opacity-50 cursor-not-allowed'
                          : selectedFilter === filter.id
                          ? 'border-primary bg-primary/10 shadow-card-hover'
                          : 'border-white/5 hover:border-white/10 bg-surface/50'
                      }`}
                    >
                      <div className={`w-full aspect-square rounded-xl mb-2 ${filter.preview}`} />
                      <span className="text-xs text-gray-300">{filter.name}</span>
                      {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-dark-bg/60">
                          <Lock className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      {selectedFilter === filter.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Comparison Table */}
        <div className="card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-xl font-bold text-white">Comparativo de Planos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-400">Recurso</th>
                  <th className="text-center py-3 px-4 bg-primary/5">
                    <div className="text-primary-light font-bold text-sm">BASIC</div>
                    <div className="text-xs text-gray-500">R$ {PLANS.basic.price}/mês</div>
                  </th>
                  <th className="text-center py-3 px-4 bg-accent/5">
                    <div className="text-accent font-bold text-sm">PREMIUM</div>
                    <div className="text-xs text-gray-500">R$ {PLANS.premium.price}/mês</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 px-6 text-sm text-gray-300">{row.feature}</td>
                    <td className="text-center py-3 px-4 bg-primary/5">
                      {row.basic
                        ? <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        : <X className="w-4 h-4 text-gray-600 mx-auto" />
                      }
                    </td>
                    <td className="text-center py-3 px-4 bg-accent/5">
                      {row.premium
                        ? <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        : <X className="w-4 h-4 text-gray-600 mx-auto" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 text-center">
            <Link to="/pricing">
              <Button variant="primary">
                Fazer Upgrade Agora
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
