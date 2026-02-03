// Database Types
export type SubscriptionTier = 'free' | 'basic' | 'premium'

export type Profile = {
  id: string
  username: string
  avatar_url?: string
  bio?: string
  age?: number
  city?: string
  languages?: string[]
  subscription_tier: SubscriptionTier
  subscription_expires_at?: string
  is_online: boolean
  last_seen_at?: string
  is_featured: boolean
  featured_until?: string
  stars_balance: number
  is_service_provider: boolean
  total_earnings_stars: number
  rating_average?: number
  total_services_completed: number
  created_at: string
  updated_at: string
}

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
  created_at: string
  updated_at: string
}

export type MockRoom = {
  id: string
  name: string
  description: string
  category: 'cidade' | 'idade' | 'idioma' | 'hobby' | 'gamer' | 'adulta'
  theme: string
  participants: number
  max_users: number
  is_private: boolean
  owner: { username: string; avatar: string }
  has_video: boolean
  online_count: number
  badge_color: string
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
  sessionsCompleted: number
  satisfactionRate: number
  city: string
  tags: string[]
  gallery: string[]
  schedule: string[]
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
  role: 'participant' | 'moderator' | 'owner'
  is_broadcasting: boolean
  video_enabled: boolean
  audio_enabled: boolean
  joined_at: string
}

export type ChatMessage = {
  id: string
  room_id: string
  user_id: string
  content: string
  message_type: 'text' | 'image' | 'emoji' | 'system'
  created_at: string
}

export type UserService = {
  id: string
  provider_id: string
  title: string
  description: string
  price_stars: number
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
  price_stars: number
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

export type StarTransaction = {
  id: string
  from_user_id: string
  to_user_id: string
  amount_stars: number
  transaction_type: 'service_payment' | 'withdrawal' | 'bonus' | 'refund'
  related_service_id?: string
  related_session_id?: string
  platform_fee_stars: number
  status: 'pending' | 'completed' | 'refunded'
  created_at: string
}

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
  type: 'background' | 'mask_2d' | 'mask_3d' | 'color' | 'anonymity' | 'ar_effect'
  requiredTier: SubscriptionTier
  thumbnail?: string
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
  type: 'room_invite' | 'new_message' | 'subscription_expiring' | 'service_request' | 'session_accepted'
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}
