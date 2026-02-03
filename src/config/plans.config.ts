import { SubscriptionTier } from '@/types'

export type PlanFeatures = {
  name: string
  price: number
  features: string[]
  canCreateRooms: boolean
  maxRoomsCreated: number
  hasVideoFilters: boolean
  filterTypes: ('background' | 'mask_2d' | 'mask_3d' | 'color' | 'anonymity' | 'ar_effect')[]
  hasSecretCabins: boolean
  hasGames: boolean
  hasAds: boolean
  hasBadge: boolean
  hasAnalytics: boolean
  canRecordBroadcasts: boolean
}

export const PLANS: Record<SubscriptionTier, PlanFeatures> = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Acesso a salas públicas',
      'Chat de texto ilimitado',
      'Transmitir vídeo (broadcast)',
      'Visualizar até 30 vídeos simultâneos',
      'Ver quem está com câmera ligada',
      'Perfil básico',
    ],
    canCreateRooms: false,
    maxRoomsCreated: 0,
    hasVideoFilters: false,
    filterTypes: [],
    hasSecretCabins: false,
    hasGames: false,
    hasAds: true,
    hasBadge: false,
    hasAnalytics: false,
    canRecordBroadcasts: false,
  },
  basic: {
    name: 'Basic',
    price: 19.90,
    features: [
      'Tudo do plano gratuito',
      'Máscaras virtuais de vídeo',
      'Criar até 3 salas temáticas',
      'Sem anúncios',
      'Badge exclusivo',
      'Backgrounds virtuais personalizados',
      'Modo anonimato',
    ],
    canCreateRooms: true,
    maxRoomsCreated: 3,
    hasVideoFilters: true,
    filterTypes: ['background', 'mask_2d', 'color', 'anonymity'],
    hasSecretCabins: false,
    hasGames: false,
    hasAds: false,
    hasBadge: true,
    hasAnalytics: false,
    canRecordBroadcasts: false,
  },
  premium: {
    name: 'Premium',
    price: 39.90,
    features: [
      'Tudo do plano básico',
      'Máscaras 3D avançadas',
      'Salas ilimitadas',
      'Acesso a cabines secretas',
      'Jogos exclusivos',
      'Prioridade no suporte',
      'Analytics de transmissão',
      'Gravação de broadcasts',
      'AR effects e efeitos especiais',
    ],
    canCreateRooms: true,
    maxRoomsCreated: Infinity,
    hasVideoFilters: true,
    filterTypes: ['background', 'mask_2d', 'mask_3d', 'color', 'anonymity', 'ar_effect'],
    hasSecretCabins: true,
    hasGames: true,
    hasAds: false,
    hasBadge: true,
    hasAnalytics: true,
    canRecordBroadcasts: true,
  },
}

export const STAR_PACKAGES = [
  {
    stars: 50,
    price: 5.00,
    bonus: 0,
    popular: false,
  },
  {
    stars: 120,
    price: 10.00,
    bonus: 20,
    popular: true,
  },
  {
    stars: 300,
    price: 25.00,
    bonus: 20,
    popular: false,
  },
  {
    stars: 650,
    price: 50.00,
    bonus: 30,
    popular: false,
  },
  {
    stars: 1500,
    price: 100.00,
    bonus: 50,
    popular: false,
  },
]

export const STARS_TO_BRL = 0.10 // 1 star = R$ 0.10
export const PLATFORM_FEE_PERCENTAGE = 20 // 20% commission
export const WITHDRAWAL_FEE_PERCENTAGE = 5 // 5% withdrawal fee
export const MIN_WITHDRAWAL_STARS = 100 // R$ 10.00
