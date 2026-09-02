// ═══════════════════════════════════════════════════════════════════════════
// DM privada — canal exclusivo por par de usuários (Plano V4, item 0.7)
//
// A implementação antiga enviava DMs no canal público da sala com o prefixo
// [DM:id] e filtrava no cliente, o que permitia a qualquer um ler tudo pelo
// console. Aqui cada conversa usa um canal próprio `dm:<idA>-<idB>` (ids
// ordenados), então a mensagem só trafega entre os dois participantes.
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/services/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface DMMessage {
  id: string
  fromId: string
  fromName: string
  content: string
  timestamp: Date
}

function pairChannel(a: string, b: string): string {
  return `dm:${[a, b].sort().join('-')}`
}

export class DMConversation {
  private channel: RealtimeChannel | null = null

  constructor(
    private myId: string,
    private myName: string,
    private peerId: string,
  ) {}

  join(onMessage: (m: DMMessage) => void) {
    this.leave()
    this.channel = supabase.channel(pairChannel(this.myId, this.peerId))
    this.channel
      .on('broadcast', { event: 'dm' }, ({ payload }) => {
        onMessage({
          id: payload.id,
          fromId: payload.fromId,
          fromName: payload.fromName,
          content: payload.content,
          timestamp: new Date(payload.timestamp),
        })
      })
      .subscribe()
  }

  send(content: string): DMMessage | null {
    if (!this.channel || !content.trim()) return null
    const msg: DMMessage = {
      id: `dm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromId: this.myId,
      fromName: this.myName,
      content: content.trim(),
      timestamp: new Date(),
    }
    this.channel.send({
      type: 'broadcast',
      event: 'dm',
      payload: { ...msg, timestamp: msg.timestamp.toISOString() },
    })
    return msg
  }

  leave() {
    if (this.channel) {
      supabase.removeChannel(this.channel)
      this.channel = null
    }
  }
}
