import { supabase } from './client'
import type { Profile, Room, UserService, PaidSession } from '@/types'

export const databaseService = {
  // ============================================================================
  // PROFILES
  // ============================================================================

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data as Profile
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as Profile
  },

  async getOnlineUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_online', true)
      .order('last_seen_at', { ascending: false })

    if (error) throw error
    return data as Profile[]
  },

  // ============================================================================
  // ROOMS
  // ============================================================================

  async getRooms(filters?: { theme?: string; sub_theme?: string }) {
    let query = supabase
      .from('rooms')
      .select('*, owner:profiles(username, avatar_url)')
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
      .select('*, owner:profiles(username, avatar_url)')
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
      query = query.lte('price_stars', filters.maxPrice)
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
