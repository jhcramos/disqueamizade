import { supabase } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type MatchCallback = (peerId: string, roomId: string) => void
type StatusCallback = (status: 'searching' | 'matched' | 'no-match') => void

let channel: RealtimeChannel | null = null
let matchTimeout: ReturnType<typeof setTimeout> | null = null

export const matchmaking = {
  /**
   * Join the roulette queue. Uses Supabase Realtime Presence.
   * When 2+ users are present, the one who joined first initiates the match.
   */
  async joinQueue(
    userId: string,
    onMatch: MatchCallback,
    onStatus: StatusCallback,
    timeoutMs = 30000,
  ) {
    // Clean up any previous session
    this.leaveQueue()

    onStatus('searching')

    const channelName = 'roulette-queue'
    channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel!.presenceState()
        const users = Object.keys(state).filter(id => id !== userId)

        if (users.length > 0) {
          // Found someone! Create a room
          const peerId = users[0]
          const roomId = [userId, peerId].sort().join('-')

          // Both users will see the match via presence sync
          // The "lower" ID initiates to avoid double-matching
          if (userId < peerId) {
            // I'm the initiator — broadcast match via channel
            channel!.send({
              type: 'broadcast',
              event: 'match',
              payload: { initiator: userId, peer: peerId, roomId },
            })
          }
        }
      })
      .on('broadcast', { event: 'match' }, ({ payload }) => {
        const { initiator, peer, roomId } = payload
        if (initiator === userId || peer === userId) {
          const myPeer = initiator === userId ? peer : initiator
          if (matchTimeout) clearTimeout(matchTimeout)
          onStatus('matched')
          onMatch(myPeer, roomId)
          // Leave queue after match
          channel!.untrack()
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel!.track({
            user_id: userId,
            joined_at: Date.now(),
          })
        }
      })

    // Timeout
    matchTimeout = setTimeout(() => {
      onStatus('no-match')
      this.leaveQueue()
    }, timeoutMs)
  },

  leaveQueue() {
    if (matchTimeout) {
      clearTimeout(matchTimeout)
      matchTimeout = null
    }
    if (channel) {
      channel.untrack()
      supabase.removeChannel(channel)
      channel = null
    }
  },
}
