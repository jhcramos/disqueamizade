import { supabase } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { PresenceState } from '@/types'

export const presenceService = {
  /**
   * Track user presence globally
   */
  trackGlobalPresence(
    userId: string,
    userData: Partial<PresenceState>
  ): RealtimeChannel {
    const channel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        console.log('Global presence synced:', state)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: Date.now(),
            ...userData,
          })
        }
      })

    return channel
  },

  /**
   * Track user presence in a specific room
   */
  trackRoomPresence(
    roomId: string,
    userId: string,
    userData: Partial<PresenceState>,
    onSync?: (presences: any) => void
  ): RealtimeChannel {
    const channel = supabase.channel(`room:${roomId}:presence`, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        if (onSync) {
          onSync(state)
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined room:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left room:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            room_id: roomId,
            online_at: Date.now(),
            ...userData,
          })
        }
      })

    return channel
  },

  /**
   * Update presence state (e.g., video/audio enabled)
   */
  async updatePresence(
    channel: RealtimeChannel,
    updates: Partial<PresenceState>
  ) {
    const currentState = channel.presenceState()
    const myKey = Object.keys(currentState)[0]

    if (myKey) {
      const current = currentState[myKey][0]
      await channel.track({
        ...current,
        ...updates,
      })
    }
  },

  /**
   * Get current presence state
   */
  getPresenceState(channel: RealtimeChannel) {
    return channel.presenceState()
  },

  /**
   * Stop tracking presence
   */
  async stopTracking(channel: RealtimeChannel) {
    await channel.untrack()
    supabase.removeChannel(channel)
  },

  /**
   * Update user online status in database
   */
  async setOnlineStatus(_userId: string, _isOnline: boolean) {
    // Online status tracked via Supabase Presence channels, not DB columns
    // No-op for now
  },
}
