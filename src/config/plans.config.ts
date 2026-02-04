import { SubscriptionTier } from '@/types'

export type PlanFeatures = {
  name: string
  price: number
  features: string[]
  canCreateRooms: boolean
  maxRoomsCreated: number
  canEnterFullRoom: boolean
  hasVideoFilters: boolean
  filterTypes: ('background' | 'mask_2d' | 'mask_3d' | 'color' | 'anonymity' | 'ar_effect')[]
  hasSecretCabins: boolean
  hasGames: boolean
  hasAds: boolean
  hasBadge: boolean
  hasAnalytics: boolean
  canRecordBroadcasts: boolean
  hasAdultContent: boolean
  hasRouletteFilters: boolean
  monthlyFichasBonus: number
  hasCreatorDashboard: boolean
}

export const PLANS: Record<SubscriptionTier, PlanFeatures> = {
  free: {
    name: 'Grátis',
    price: 0,
    features: [
      'Acesso a salas públicas',
      'Chat de texto ilimitado',
      'Transmitir vídeo (broadcast)',
      'Visualizar até 30 vídeos simultâneos',
      'Criar 1 sala',
      'Perfil básico',
      'Roleta 1:1 (com anúncios)',
      '50 fichas iniciais',
    ],
    canCreateRooms: true,
    maxRoomsCreated: 1,
    canEnterFullRoom: false,
    hasVideoFilters: false,
    filterTypes: [],
    hasSecretCabins: false,
    hasGames: false,
    hasAds: true,
    hasBadge: false,
    hasAnalytics: false,
    canRecordBroadcasts: false,
    hasAdultContent: false,
    hasRouletteFilters: false,
    monthlyFichasBonus: 0,
    hasCreatorDashboard: false,
  },
  basic: {
    name: 'Básico',
    price: 19.90,
    features: [
      'Tudo do plano gratuito',
      'Criar até 3 salas temáticas',
      'Entrar em salas cheias',
      'Filtros de vídeo (backgrounds, máscaras 2D)',
      'Sem anúncios',
      'Badge Básico exclusivo',
      'Roleta com filtros de idade e cidade',
      '200 fichas/mês bônus',
      'Backgrounds virtuais personalizados',
      'Modo anonimato',
    ],
    canCreateRooms: true,
    maxRoomsCreated: 3,
    canEnterFullRoom: true,
    hasVideoFilters: true,
    filterTypes: ['background', 'mask_2d', 'color', 'anonymity'],
    hasSecretCabins: false,
    hasGames: false,
    hasAds: false,
    hasBadge: true,
    hasAnalytics: false,
    canRecordBroadcasts: false,
    hasAdultContent: false,
    hasRouletteFilters: true,
    monthlyFichasBonus: 200,
    hasCreatorDashboard: false,
  },
  premium: {
    name: 'Premium',
    price: 39.90,
    features: [
      'Tudo do plano básico',
      'Salas ilimitadas',
      'Entrar em salas cheias (prioridade)',
      'Máscaras 3D e efeitos AR',
      'Acesso a cabines secretas',
      'Jogos exclusivos (speed dating, casamento)',
      'Badge Premium 👑',
      'Roleta com todos os filtros',
      '500 fichas/mês bônus',
      'Dashboard de Creator',
      'Analytics de transmissão',
      'Gravação de broadcasts',
      'Conteúdo adulto 🔞',
      'Prioridade no suporte',
    ],
    canCreateRooms: true,
    maxRoomsCreated: Infinity,
    canEnterFullRoom: true,
    hasVideoFilters: true,
    filterTypes: ['background', 'mask_2d', 'mask_3d', 'color', 'anonymity', 'ar_effect'],
    hasSecretCabins: true,
    hasGames: true,
    hasAds: false,
    hasBadge: true,
    hasAnalytics: true,
    canRecordBroadcasts: true,
    hasAdultContent: true,
    hasRouletteFilters: true,
    monthlyFichasBonus: 500,
    hasCreatorDashboard: true,
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// Fichas Configuration
// ═══════════════════════════════════════════════════════════════════════════

export const FICHA_PACKAGES = [
  { fichas: 50, price: 9.90, bonus: 0, popular: false, perFicha: 0.20 },
  { fichas: 150, price: 24.90, bonus: 0, popular: false, perFicha: 0.17 },
  { fichas: 500, price: 69.90, bonus: 50, popular: true, perFicha: 0.14 },
  { fichas: 1500, price: 179.90, bonus: 200, popular: false, perFicha: 0.12 },
  { fichas: 3000, price: 349.90, bonus: 500, popular: false, perFicha: 0.12 },
  { fichas: 5000, price: 499.90, bonus: 1000, popular: false, perFicha: 0.10 },
  { fichas: 10000, price: 899.90, bonus: 2500, popular: false, perFicha: 0.09 },
]

// ═══════════════════════════════════════════════════════════════════════════
// Ostentação Configuration
// ═══════════════════════════════════════════════════════════════════════════

export const OSTENTACAO_THRESHOLD = 300 // fichas para status Ostentação
export const FICHAS_TO_BRL = 0.10 // 1 ficha ≈ R$ 0.10
export const PLATFORM_FEE_PERCENTAGE = 20 // 20% commission
export const WITHDRAWAL_FEE_PERCENTAGE = 5 // 5% withdrawal fee
export const MIN_WITHDRAWAL_FICHAS = 100 // R$ 10.00

// Legacy aliases
export const STAR_PACKAGES = FICHA_PACKAGES
export const STARS_TO_BRL = FICHAS_TO_BRL
export const MIN_WITHDRAWAL_STARS = MIN_WITHDRAWAL_FICHAS
