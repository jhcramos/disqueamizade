import { supabase } from './client'
import type { Profile, DBProfile, Room, UserService, PaidSession } from '@/types'

/** Convert DB profile row to UI Profile type */
function mapProfile(db: DBProfile): Profile {
  const tier = db.is_elite ? 'premium' : db.is_vip ? 'basic' : 'free'
  return {
    ...db,
    city: db.cidade,
    subscription_tier: tier as any,
    is_online: false,
    is_featured: false,
    fichas_balance: db.saldo_fichas ?? 0,
    is_ostentacao: (db.saldo_fichas ?? 0) >= 1000,
    creator_verified: false,
    is_service_provider: false,
    total_earnings_fichas: db.total_earned ?? 0,
    total_spent_fichas: 0,
    total_services_completed: 0,
    rooms_visited: 0,
    messages_sent: 0,
    games_played: 0,
    time_online_minutes: 0,
    badges: [],
    stars_balance: db.saldo_fichas ?? 0,
    total_earnings_stars: db.total_earned ?? 0,
  } as Profile
}

export const databaseService = {
  // ============================================================================
  // PROFILES
  // ============================================================================

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Profile not found')
    return mapProfile(data as DBProfile)
  },

  async upsertProfile(userId: string, data: Partial<DBProfile>) {
    // Try upsert without expecting a return (RLS may block SELECT after INSERT)
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...data }, { onConflict: 'id' })

    if (upsertError) {
      console.warn('Upsert failed, trying API route:', upsertError.message)
      // Fallback: use API route with service role
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (token) {
        const res = await fetch('/api/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const profile = await res.json()
          return mapProfile(profile as DBProfile)
        }
      }
      throw upsertError
    }

    // Now fetch the profile separately
    try {
      return await this.getProfile(userId)
    } catch {
      // Return a constructed profile if we can't read it back
      return mapProfile({ id: userId, ...data } as DBProfile)
    }
  },

  async updateProfile(userId: string, updates: Partial<DBProfile>) {
    // Try direct update first
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (!error) return mapProfile(data as DBProfile)

    // Fallback: use API route with service role (bypasses RLS)
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token
    if (!token) throw error

    const res = await fetch('/api/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || 'Failed to update profile')
    }

    const profile = await res.json()
    return mapProfile(profile as DBProfile)
  },

  async getOnlineProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return (data as DBProfile[]).map(mapProfile)
  },

  // ============================================================================
  // ROOMS
  // ============================================================================

  async getRooms(filters?: { theme?: string; sub_theme?: string }) {
    let query = supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)

    if (filters?.theme) {
      query = query.eq('theme', filters.theme)
    }

    if (filters?.sub_theme) {
      query = query.eq('sub_theme', filters.sub_theme)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data as Room[]
  },

  async getRoom(roomId: string) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error) throw error
    return data as Room
  },

  async createRoom(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('rooms')
      .insert(room)
      .select()
      .single()

    if (error) throw error
    return data as Room
  },

  async getRoomParticipants(roomId: string) {
    const { data, error } = await supabase
      .from('room_participants')
      .select('*, user:profiles(*)')
      .eq('room_id', roomId)

    if (error) throw error
    return data
  },

  async joinRoom(roomId: string, userId: string) {
    const { data, error } = await supabase
      .from('room_participants')
      .insert({
        room_id: roomId,
        user_id: userId,
        role: 'participant',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async leaveRoom(roomId: string, userId: string) {
    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)

    if (error) throw error
  },

  // ============================================================================
  // FICHA PACKAGES
  // ============================================================================

  async getFichaPackages() {
    const { data, error } = await supabase
      .from('ficha_packages')
      .select('*')
      .eq('active', true)
      .order('amount', { ascending: true })

    if (error) throw error
    return data
  },

  // ============================================================================
  // CHAT MESSAGES
  // ============================================================================

  async getChatMessages(roomId: string, limit = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, user:profiles(username, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  async sendMessage(roomId: string, userId: string, content: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        content,
        message_type: 'text',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ============================================================================
  // USER SERVICES (Marketplace)
  // ============================================================================

  async getUserServices(providerId: string) {
    const { data, error } = await supabase
      .from('user_services')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) throw error
    return data as UserService[]
  },

  async getAllServices(filters?: { category?: string; maxPrice?: number }) {
    let query = supabase
      .from('user_services')
      .select('*, provider:profiles(*)')
      .eq('is_active', true)

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.maxPrice) {
      query = query.lte('price_fichas', filters.maxPrice)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data as UserService[]
  },

  async createService(service: Omit<UserService, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('user_services')
      .insert(service)
      .select()
      .single()

    if (error) throw error
    return data as UserService
  },

  async updateService(serviceId: string, updates: Partial<UserService>) {
    const { data, error } = await supabase
      .from('user_services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single()

    if (error) throw error
    return data as UserService
  },

  // ============================================================================
  // PAID SESSIONS
  // ============================================================================

  async getPaidSessions(userId: string, role: 'buyer' | 'provider') {
    const field = role === 'buyer' ? 'buyer_id' : 'provider_id'

    const { data, error } = await supabase
      .from('paid_sessions')
      .select('*, service:user_services(*), buyer:profiles(*), provider:profiles(*)')
      .eq(field, userId)
      .order('requested_at', { ascending: false })

    if (error) throw error
    return data as PaidSession[]
  },

  async getActivePaidSession(userId: string) {
    const { data, error } = await supabase
      .from('paid_sessions')
      .select('*, service:user_services(*), buyer:profiles(*), provider:profiles(*)')
      .or(`buyer_id.eq.${userId},provider_id.eq.${userId}`)
      .eq('status', 'in_progress')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as PaidSession | null
  },

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data
  },

  async markNotificationAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error
  },

  async markAllNotificationsAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
  },
}
