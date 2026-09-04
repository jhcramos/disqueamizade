import { supabase } from './client'
import { filterMessage } from '@/services/moderation'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type ChatMessage = {
  id: string; userId: string; username: string; content: string
  timestamp: Date; type: 'text' | 'emoji' | 'system'
}
type PresenceState = { userId: string; username: string; joinedAt: number }
type MessageRow = {
  id: string; room_slug: string; user_id: string; username: string
  content: string; created_at: string; type: 'text' | 'emoji'
}
const errors: Record<string, string> = {
  unauthorized: 'Sua sessão expirou. Entre novamente.',
  forbidden: 'Você não tem acesso a esta conversa.',
  banned: 'O envio de mensagens está suspenso para esta conta.',
  blocked_content: 'Links não são permitidos no chat.',
  invalid_request: 'Escreva uma mensagem de até 500 caracteres.',
  rate_limited: 'Aguarde alguns segundos antes de enviar outra mensagem.',
  unavailable: 'O chat está indisponível. Tente novamente em instantes.',
}
export function chatError(error: unknown): string {
  return error instanceof Error && Object.values(errors).includes(error.message)
    ? error.message : errors.unavailable
}

const closingChannels = new Map<string, Promise<void>>()

/** Somente linhas autorizadas pelo servidor são entregues à interface. */
export class ChatConversation {
  private channel: RealtimeChannel | null = null
  private roomSlug: string | null = null
  private sender: string | null = null
  private generation = 0
  private seen = new Set<string>()
  private onMessage: ((message: ChatMessage) => void) | null = null

  private deliver(row: MessageRow, generation: number) {
    if (generation !== this.generation || row.room_slug !== this.roomSlug || this.seen.has(row.id)) return
    this.seen.add(row.id)
    this.onMessage?.({ id: row.id, userId: row.user_id, username: row.username,
      content: row.content, timestamp: new Date(row.created_at), type: row.type })
  }

  async join(roomSlug: string, userId: string, username: string,
    onMessage: (message: ChatMessage) => void,
    onPresenceChange: (users: PresenceState[]) => void = () => {},
    onError: (error: Error) => void = () => {},
  ): Promise<void> {
    this.leave()
    const generation = this.generation
    await closingChannels.get(roomSlug)
    if (generation !== this.generation) return
    const { data: { session }, error } = await supabase.auth.getSession()
    if (generation !== this.generation) return
    if (error || session?.user.id !== userId) throw new Error(errors.unauthorized)
    this.roomSlug = roomSlug
    this.sender = userId
    this.onMessage = onMessage
    const channel = supabase.channel(`moderated:${roomSlug}`, { config: { presence: { key: userId }, postgres_changes_options: { wait: true } } })
    this.channel = channel
    channel.on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_slug=eq.${roomSlug}`,
    }, ({ new: row }) => this.deliver(row as MessageRow, generation))
      .on('presence', { event: 'sync' }, () => {
        if (generation !== this.generation) return
        const users = Object.values(channel.presenceState()).flat().map((p: any) => ({
          userId: String(p.userId || ''), username: String(p.username || 'Convidado').slice(0, 24),
          joinedAt: Number(p.joinedAt) || 0,
        }))
        onPresenceChange(users)
      })
      .subscribe((status) => {
        if (generation !== this.generation) return
        if (status === 'SUBSCRIBED') {
          // Assina antes de ler o histórico; ids removem duplicatas durante reconexões.
          void channel.track({ userId, username, joinedAt: Date.now() })
          void (async () => {
            try {
              const { data, error } = await supabase.from('chat_messages')
                .select('id,room_slug,user_id,username,content,type,created_at')
                .eq('room_slug', roomSlug).order('created_at', { ascending: false }).limit(50)
              if (error) throw error
              for (const row of (data || []).reverse()) this.deliver(row as MessageRow, generation)
            } catch {
              if (generation === this.generation) onError(new Error(errors.unavailable))
            }
          })()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onError(new Error(errors.unavailable))
        }
      })
  }

  async sendMessage(userId: string, _username: string, content: string, type: 'text' | 'emoji' = 'text'): Promise<void> {
    const generation = this.generation
    if (!this.roomSlug || this.sender !== userId) throw new Error(errors.unauthorized)
    if (!content.trim() || content.length > 500) throw new Error(errors.invalid_request)
    if (!filterMessage(content).ok) throw new Error(errors.blocked_content)
    // O servidor recebe o original e aplica sua própria moderação, mesmo sem o filtro local.
    const { data, error } = await supabase.functions.invoke('send-chat', {
      body: { roomSlug: this.roomSlug, text: content, type },
    })
    if (error) {
      let code = 'unavailable'
      try { code = (await error.context?.json())?.error || code } catch { /* erro de rede */ }
      throw new Error(errors[code] || errors.unavailable)
    }
    if (!data?.message) throw new Error(errors.unavailable)
    this.deliver(data.message, generation)
  }

  leave() {
    ++this.generation
    if (this.channel && this.roomSlug) {
      const slug = this.roomSlug
      const closing = supabase.removeChannel(this.channel).then(() => {}, () => {})
      closingChannels.set(slug, closing)
      void closing.then(() => { if (closingChannels.get(slug) === closing) closingChannels.delete(slug) })
    }
    this.channel = null
    this.roomSlug = null
    this.sender = null
    this.onMessage = null
    this.seen.clear()
  }
}
export const roomChat = new ChatConversation()
