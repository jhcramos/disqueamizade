// ═══════════════════════════════════════════════════════════════════════════
// Database & Core Types — V2
// ═══════════════════════════════════════════════════════════════════════════

export type SubscriptionTier = 'free' | 'basic' | 'premium'

export type OstentacaoStatus = {
  isOstentacao: boolean
  fichasBalance: number
  badgeLevel: 'none' | 'bronze' | 'silver' | 'gold' | 'diamond'
}

// DB profile (matches Supabase schema)
export type LookingFor = 'amizade' | 'namoro' | 'bate-papo' | 'networking' | 'games'
export type InterestedIn = 'homens' | 'mulheres' | 'todos'

export type DBProfile = {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  cidade?: string
  estado?: string
  bio?: string
  is_admin?: boolean
  is_creator: boolean
  is_vip: boolean
  is_elite: boolean
  saldo_fichas: number
  total_earned: number
  looking_for?: LookingFor[]
  interested_in?: InterestedIn
  created_at: string
  updated_at: string
}

// Extended profile for UI (backwards compat)
export type Profile = {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  age?: number
  city?: string
  cidade?: string
  estado?: string
  languages?: string[]
  hobbies?: string[]
  subscription_tier: SubscriptionTier
  subscription_expires_at?: string
  is_online: boolean
  last_seen_at?: string
  is_featured: boolean
  featured_until?: string
  fichas_balance: number
  saldo_fichas: number
  is_ostentacao: boolean
  is_admin?: boolean
  is_creator: boolean
  is_vip: boolean
  is_elite: boolean
  creator_verified: boolean
  is_service_provider: boolean
  total_earnings_fichas: number
  total_earned: number
  total_spent_fichas: number
  rating_average?: number
  total_services_completed: number
  rooms_visited: number
  messages_sent: number
  games_played: number
  time_online_minutes: number
  badges: string[]
  looking_for?: LookingFor[]
  interested_in?: InterestedIn
  created_at: string
  updated_at: string
  // Legacy alias
  stars_balance: number
  total_earnings_stars: number
}

export type RoomType = 'official' | 'community' | 'vip' | 'speed_dating' | 'karaoke' | 'dj' | 'roleta'

export type Room = {
  id: string
  name: string
  description?: string
  theme?: string
  sub_theme?: string
  max_users: number
  is_private: boolean
  password_hash?: string
  requires_subscription?: SubscriptionTier
  owner_id: string
  is_active: boolean
  room_type: RoomType
  entry_cost_fichas: number
  category?: string
  is_fixed: boolean
  created_at: string
  updated_at: string
}

export type MockRoom = {
  id: string
  name: string
  description: string
  category: 'cidade' | 'idade' | 'idioma' | 'hobby' | 'gamer' | 'adulta' | 'especial'
  theme: string
  participants: number
  max_users: number
  is_private: boolean
  owner: { username: string; avatar: string }
  has_video: boolean
  online_count: number
  badge_color: string
  is_official?: boolean
  instance_number?: number
  room_type?: RoomType
  entry_cost_fichas?: number
  is_fixed?: boolean
  enabled?: boolean
}

export type MockCreator = {
  id: string
  name: string
  username: string
  avatar: string
  bio: string
  service: string
  serviceEmoji: string
  serviceCategory: string
  rating: number
  reviewCount: number
  priceInFichas: number
  isOnline: boolean
  isFeatured: boolean
  isLive: boolean
  liveViewers: number
  sessionsCompleted: number
  satisfactionRate: number
  city: string
  tags: string[]
  gallery?: string[]
  schedule: string[]
  totalEarnings: number
  weeklyEarnings: number
  isVerified: boolean
  // Camarote fields
  camaroteId?: string
  camaroteCapacity: number
  camaroteTheme?: string
  camaroteDescription?: string
  camaroteIsOpen: boolean
  camaroteViewers: number
  canInvite: boolean
  nextEvent?: {
    title: string
    date: string
    price: number
    type: 'palestra' | 'curso' | 'show' | 'consulta' | 'show_erotico' | 'live'
  }
}

export type MockHobby = {
  id: string
  name: string
  icon: string
  emoji: string
  activeRooms: number
  isPopular: boolean
  description: string
  color: string
}

export type FichaPackage = {
  id: string
  amount: number
  price: string
  priceValue: number
  popular?: boolean
  bonus?: string
  bonusPercent?: number
  emoji?: string
  perFicha?: string
}

export type Plan = {
  id: string
  name: string
  price: string
  priceValue: number
  features: string[]
  highlighted?: boolean
  badge?: string
}

export type RoomParticipant = {
  id: string
  room_id: string
  user_id: string
  username: string
  avatar_url: string
  role: 'participant' | 'moderator' | 'owner'
  is_broadcasting: boolean
  video_enabled: boolean
  audio_enabled: boolean
  subscription_tier: SubscriptionTier
  is_ostentacao: boolean
  joined_at: string
}

export type ChatMessage = {
  id: string
  room_id: string
  user_id: string
  username: string
  avatar_url: string
  content: string
  message_type: 'text' | 'image' | 'emoji' | 'system' | 'gift'
  is_ostentacao: boolean
  created_at: string
}

export type UserService = {
  id: string
  provider_id: string
  title: string
  description: string
  price_fichas: number
  duration_minutes: number
  category: string
  tags: string[]
  is_active: boolean
  position: number
  created_at: string
  updated_at: string
}

export type PaidSession = {
  id: string
  service_id: string
  buyer_id: string
  provider_id: string
  price_fichas: number
  duration_minutes: number
  status: 'requested' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'canceled'
  room_id?: string
  started_at?: string
  ended_at?: string
  actual_duration_minutes?: number
  requested_at: string
  accepted_at?: string
  expires_at: string
}

export type FichaTransaction = {
  id: string
  from_user_id: string
  to_user_id: string
  amount: number
  transaction_type: 'gift' | 'purchase' | 'service' | 'vip_entry' | 'game' | 'withdrawal' | 'bonus' | 'refund'
  related_id?: string
  platform_fee: number
  status: 'pending' | 'completed' | 'refunded'
  created_at: string
}

// Legacy alias
export type StarTransaction = FichaTransaction

export type ServiceReview = {
  id: string
  session_id: string
  reviewer_id: string
  reviewed_user_id: string
  rating: number
  comment?: string
  created_at: string
}

export type VideoFilter = {
  id: string
  name: string
  description: string
  type: 'background' | 'mask_2d' | 'mask_3d' | 'color' | 'anonymity' | 'ar_effect'
  requiredTier: SubscriptionTier
  thumbnail?: string
  emoji: string
  category: string
}

export type PresenceState = {
  user_id: string
  username: string
  avatar_url?: string
  room_id?: string
  video_enabled: boolean
  audio_enabled: boolean
  online_at: number
}

export type Notification = {
  id: string
  user_id: string
  type: 'room_invite' | 'new_message' | 'subscription_expiring' | 'service_request' | 'session_accepted' | 'game_invite' | 'gift_received' | 'roulette_match' | 'ranking_update' | 'system'
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Roulette Types — V2
// ═══════════════════════════════════════════════════════════════════════════

export type RouletteStatus = 'idle' | 'searching' | 'connecting' | 'connected' | 'ended' | 'no-match' | 'matched'

export interface RouletteFilters {
  ageRange?: [number, number]
  city?: string
  hobby?: string
  language?: string
}

export interface RouletteMatch {
  id: string
  partner: {
    id: string
    username: string
    avatar_url: string
    age?: number
    city?: string
    hobbies?: string[]
    is_ostentacao: boolean
  }
  started_at: string
  ended_at?: string
}

export interface RouletteSession {
  id: string
  user_id: string
  status: RouletteStatus
  filters: RouletteFilters
  current_match?: RouletteMatch
  matches_count: number
  created_at: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Live Gifts Types — V2
// ═══════════════════════════════════════════════════════════════════════════

export interface LiveGift {
  id: string
  name: string
  emoji: string
  fichas_cost: number
  animation: 'float' | 'bloom' | 'sparkle' | 'fireworks' | 'rain' | 'launch' | 'crown' | 'parade' | 'shower'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface SentGift {
  id: string
  gift: LiveGift
  sender: {
    id: string
    username: string
    avatar_url: string
    is_ostentacao: boolean
  }
  receiver_id: string
  room_id: string
  created_at: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Marriage Game Types
// ═══════════════════════════════════════════════════════════════════════════

export type GameStatus = 'waiting' | 'matching' | 'revealing' | 'completed'

export interface GameParticipant {
  user_id: string
  username: string
  avatar_url: string
  age?: number
  city?: string
  bio?: string
  joined_at: string
}

export interface MarriagePair {
  id: string
  participant1: GameParticipant
  participant2: GameParticipant
  matched_at: string
  chat_room_id?: string
  accepted_by_both: boolean
  accepted_by_p1: boolean
  accepted_by_p2: boolean
}

export interface MarriageGameSession {
  id: string
  room_id: string
  status: GameStatus
  participants: GameParticipant[]
  pairs: MarriagePair[]
  created_at: string
  started_at?: string
  completed_at?: string
  min_participants: number
  max_participants: number
}

// ═══════════════════════════════════════════════════════════════════════════
// Speed Dating Types — V2
// ═══════════════════════════════════════════════════════════════════════════

export type SpeedDatingStatus = 'waiting' | 'in_round' | 'between_rounds' | 'voting' | 'results'

export interface SpeedDatingParticipant {
  user_id: string
  username: string
  avatar_url: string
  age?: number
  city?: string
  is_ostentacao: boolean
}

export interface SpeedDatingRound {
  round_number: number
  pairs: { user1: SpeedDatingParticipant; user2: SpeedDatingParticipant }[]
  duration_seconds: number
  started_at?: string
}

export interface SpeedDatingSession {
  id: string
  room_id: string
  status: SpeedDatingStatus
  participants: SpeedDatingParticipant[]
  rounds: SpeedDatingRound[]
  current_round: number
  max_rounds: number
  round_duration_seconds: number
  created_at: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Ranking Types — V2
// ═══════════════════════════════════════════════════════════════════════════

export interface RankingEntry {
  position: number
  user_id: string
  username: string
  avatar_url: string
  is_ostentacao: boolean
  amount: number
  change: number // +2 = subiu 2 posições, -1 = caiu 1
}

export interface WeeklyRanking {
  week_start: string
  week_end: string
  top_spenders: RankingEntry[]
  top_earners: RankingEntry[]
}

// ═══════════════════════════════════════════════════════════════════════════
// Influencer Dashboard Types — V2
// ═══════════════════════════════════════════════════════════════════════════

export interface CreatorDashboardStats {
  total_earnings: number
  weekly_earnings: number
  monthly_earnings: number
  total_viewers: number
  live_viewers: number
  total_sessions: number
  average_rating: number
  total_reviews: number
  fichas_available: number
  fichas_pending_withdrawal: number
}

export interface CreatorScheduleItem {
  id: string
  title: string
  type: 'live' | 'session' | 'course' | 'event'
  date: string
  time: string
  duration_minutes: number
  price_fichas: number
  max_participants: number
  enrolled: number
}

// ═══════════════════════════════════════════════════════════════════════════
// Secret Cabin Types
// ═══════════════════════════════════════════════════════════════════════════

export type CabinStatus = 'available' | 'occupied' | 'reserved'

export interface CabinOccupant {
  user_id: string
  username: string
  avatar_url: string
  joined_at: string
  is_broadcasting: boolean
}

export interface SecretCabin {
  id: string
  number: number
  name: string
  description: string
  capacity: number
  status: CabinStatus
  occupants: CabinOccupant[]
  room_id?: string
  reserved_by?: string
  reserved_until?: string
  occupied_since?: string
  icon: string
  color: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Marketplace Types
// ═══════════════════════════════════════════════════════════════════════════

export type ServiceCategory = {
  id: string
  name: string
  emoji: string
  description: string
  color: string
}

export type MarketplaceProvider = MockCreator & {
  services: ProviderService[]
  availability: string[]
  reviews: ProviderReview[]
}

export type ProviderService = {
  id: string
  title: string
  description: string
  price_fichas: number
  duration_minutes: number
  category: string
}

export type ProviderReview = {
  id: string
  reviewer_name: string
  reviewer_avatar: string
  rating: number
  comment: string
  created_at: string
}
