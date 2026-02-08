import { supabase } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type ChatMessage = {
  id: string
  userId: string
  username: string
  content: string
  timestamp: Date
  type: 'text' | 'emoji' | 'system'
}

type PresenceState = {
  userId: string
  username: string
  joinedAt: number
}

let channel: RealtimeChannel | null = null

export const roomChat = {
  /**
   * Join a room's realtime channel for chat + presence
   */
  join(
    roomSlug: string,
    userId: string,
    username: string,
    onMessage: (msg: ChatMessage) => void,
    onPresenceChange: (users: PresenceState[]) => void,
  ) {
    this.leave()

    channel = supabase.channel(`room:${roomSlug}`, {
      config: { presence: { key: userId } },
    })

    channel
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        onMessage({
          id: payload.id || Date.now().toString(),
          userId: payload.userId,
          username: payload.username,
          content: payload.content,
          timestamp: new Date(payload.timestamp),
          type: payload.type || 'text',
        })
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel!.presenceState()
        const users: PresenceState[] = []
        for (const [, presences] of Object.entries(state)) {
          for (const p of presences as any[]) {
            users.push({
              userId: p.userId || p.user_id,
              username: p.username,
              joinedAt: p.joinedAt || p.joined_at,
            })
          }
        }
        onPresenceChange(users)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        for (const p of newPresences as any[]) {
          onMessage({
            id: `join-${Date.now()}`,
            userId: 'system',
            username: 'Sistema',
            content: `${p.username || 'Alguém'} entrou na sala 👋`,
            timestamp: new Date(),
            type: 'system',
          })
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const p of leftPresences as any[]) {
          onMessage({
            id: `leave-${Date.now()}`,
            userId: 'system',
            username: 'Sistema',
            content: `${p.username || 'Alguém'} saiu da sala`,
            timestamp: new Date(),
            type: 'system',
          })
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel!.track({
            userId,
            username,
            joinedAt: Date.now(),
          })
        }
      })
  },

  /**
   * Send a chat message to the room
   */
  sendMessage(userId: string, username: string, content: string, type: 'text' | 'emoji' = 'text') {
    if (!channel) return
    channel.send({
      type: 'broadcast',
      event: 'chat',
      payload: {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        username,
        content,
        timestamp: new Date().toISOString(),
        type,
      },
    })
  },

  leave() {
    if (channel) {
      channel.untrack()
      supabase.removeChannel(channel)
      channel = null
    }
  },
}
