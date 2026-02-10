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
let currentRoomSlug: string | null = null

// Rate limiting: max 5 messages per 3 seconds
const messageTimestamps: number[] = []
const RATE_LIMIT_COUNT = 5
const RATE_LIMIT_WINDOW_MS = 3000

export const roomChat = {
  /**
   * Join a room's realtime channel for chat + presence
   */
  async join(
    roomSlug: string,
    userId: string,
    username: string,
    onMessage: (msg: ChatMessage) => void,
    onPresenceChange: (users: PresenceState[]) => void,
  ) {
    this.leave()
    currentRoomSlug = roomSlug

    // Load persisted messages (last 50)
    try {
      const { data: rows } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomSlug)
        .order('created_at', { ascending: false })
        .limit(50)

      if (rows && rows.length > 0) {
        // Deliver oldest first
        for (const row of rows.reverse()) {
          onMessage({
            id: row.id,
            userId: row.user_id,
            username: row.username,
            content: row.content,
            timestamp: new Date(row.created_at),
            type: (row.type as ChatMessage['type']) || 'text',
          })
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e)
    }

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
  sendMessage(userId: string, username: string, content: string, type: 'text' | 'emoji' = 'text'): boolean {
    if (!channel) return false

    // Rate limiting
    const now = Date.now()
    // Remove timestamps outside the window
    while (messageTimestamps.length > 0 && messageTimestamps[0] <= now - RATE_LIMIT_WINDOW_MS) {
      messageTimestamps.shift()
    }
    if (messageTimestamps.length >= RATE_LIMIT_COUNT) {
      return false // silently drop
    }
    messageTimestamps.push(now)

    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const timestamp = new Date().toISOString()

    // Broadcast for real-time delivery
    channel.send({
      type: 'broadcast',
      event: 'chat',
      payload: { id: msgId, userId, username, content, timestamp, type },
    })

    // Persist to DB (fire and forget)
    if (currentRoomSlug) {
      supabase.from('chat_messages').insert({
        id: msgId,
        room_id: currentRoomSlug,
        user_id: userId,
        username,
        content,
        type,
        created_at: timestamp,
      }).then(({ error }) => {
        if (error) console.warn('Failed to persist chat message:', error)
      })
    }

    return true
  },

  leave() {
    if (channel) {
      channel.untrack()
      supabase.removeChannel(channel)
      channel = null
    }
    currentRoomSlug = null
    messageTimestamps.length = 0
  },
}
