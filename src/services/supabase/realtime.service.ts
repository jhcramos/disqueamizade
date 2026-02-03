import { supabase } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const realtimeService = {
  /**
   * Subscribe to chat messages in a room
   */
  subscribeToChatMessages(
    roomId: string,
    onMessage: (message: any) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`room:${roomId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch user data for the message
          const { data: user } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single()

          onMessage({
            ...payload.new,
            user,
          })
        }
      )
      .subscribe()

    return channel
  },

  /**
   * Subscribe to room participants changes
   */
  subscribeToRoomParticipants(
    roomId: string,
    onJoin: (participant: any) => void,
    onLeave: (participant: any) => void,
    onUpdate: (participant: any) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`room:${roomId}:participants`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data: user } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.user_id)
            .single()

          onJoin({
            ...payload.new,
            user,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          onLeave(payload.old)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data: user } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.user_id)
            .single()

          onUpdate({
            ...payload.new,
            user,
          })
        }
      )
      .subscribe()

    return channel
  },

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: any) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`user:${userId}:notifications`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNotification(payload.new)
        }
      )
      .subscribe()

    return channel
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: RealtimeChannel) {
    supabase.removeChannel(channel)
  },
}
