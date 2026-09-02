import { supabase } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type MatchCallback = (peerId: string, roomId: string) => void
type StatusCallback = (status: 'searching' | 'matched' | 'no-match') => void

export interface QueueOptions {
  /**
   * Chave do "balde" de pareamento. Só pareiam pessoas com a mesma chave —
   * é assim que os filtros (cidade/idade) entram no match. Sem filtro, use
   * 'any' (ou deixe indefinido) para cair no balde geral.
   */
  bucketKey?: string
  /** Ids que NÃO devem ser pareados agora (ex.: já conversou nas últimas 24h). */
  avoid?: Set<string>
  timeoutMs?: number
}

let channel: RealtimeChannel | null = null
let matchTimeout: ReturnType<typeof setTimeout> | null = null

export const matchmaking = {
  /**
   * Entra na fila da roleta usando Supabase Realtime Presence.
   * Pareia duas pessoas do mesmo balde (bucketKey), pulando as da lista `avoid`.
   * O de menor id inicia o match para evitar pareamento duplo.
   */
  async joinQueue(
    userId: string,
    onMatch: MatchCallback,
    onStatus: StatusCallback,
    options: QueueOptions = {},
  ) {
    this.leaveQueue()

    const { bucketKey = 'any', avoid, timeoutMs = 30000 } = options
    onStatus('searching')

    const channelName = `roulette-queue:${bucketKey}`
    channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    })

    const tryMatch = () => {
      if (!channel) return
      const state = channel.presenceState()
      const candidates = Object.keys(state).filter(
        (id) => id !== userId && !(avoid && avoid.has(id)),
      )
      if (candidates.length === 0) return

      // Escolhe de forma determinística (menor id disponível) para os dois
      // lados convergirem no mesmo par.
      const peerId = candidates.sort()[0]
      const roomId = [userId, peerId].sort().join('-')

      // Só o de menor id anuncia, para não parear em dobro.
      if (userId < peerId) {
        channel.send({
          type: 'broadcast',
          event: 'match',
          payload: { initiator: userId, peer: peerId, roomId },
        })
        if (matchTimeout) clearTimeout(matchTimeout)
        onStatus('matched')
        onMatch(peerId, roomId)
        channel.untrack()
      }
    }

    channel
      .on('presence', { event: 'sync' }, tryMatch)
      .on('presence', { event: 'join' }, tryMatch)
      .on('broadcast', { event: 'match' }, ({ payload }) => {
        const { initiator, peer, roomId } = payload
        if (initiator === userId || peer === userId) {
          const myPeer = initiator === userId ? peer : initiator
          if (avoid && avoid.has(myPeer)) return // ignora par indesejado
          if (matchTimeout) clearTimeout(matchTimeout)
          onStatus('matched')
          onMatch(myPeer, roomId)
          channel?.untrack()
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel!.track({ user_id: userId, joined_at: Date.now() })
        }
      })

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
