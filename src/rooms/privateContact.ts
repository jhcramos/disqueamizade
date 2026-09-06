import { supabase } from '@/services/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ContactPreferences } from '@/services/supabase/roomChat'

export type ContactMode = 'message' | 'audio' | 'video'
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'ended' | 'expired'
export type PrivateInvite = {
  id: string
  roomSlug: string
  fromUser: string
  toUser: string
  mode: ContactMode
  status: InviteStatus
  expiresAt: string
  createdAt: string
  updatedAt: string
}

const messages: Record<string, string> = {
  unauthorized: 'Sua sessão expirou. Entre novamente.',
  forbidden: 'Este convite não está disponível para você.',
  banned: 'Convites estão suspensos para esta conta.',
  not_available: 'Essa pessoa não aceita esse tipo de contato agora.',
  invite_closed: 'Esse convite já foi encerrado.',
  invite_expired: 'O convite expirou. Envie outro se quiser.',
  rate_limited: 'Você enviou muitos convites. Aguarde alguns segundos.',
  unavailable: 'Não foi possível completar o convite. Tente novamente.',
}

function normalize(row: any): PrivateInvite {
  return {
    id: String(row.id), roomSlug: String(row.room_slug), fromUser: String(row.from_user),
    toUser: String(row.to_user), mode: row.mode as ContactMode, status: row.status as InviteStatus,
    expiresAt: String(row.expires_at), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }
}

export function privateContactError(error: unknown): string {
  return error instanceof Error && Object.values(messages).includes(error.message) ? error.message : messages.unavailable
}

export class PrivateContactClient {
  private channel: RealtimeChannel | null = null
  private generation = 0

  private async invoke(body: Record<string, unknown>): Promise<any> {
    const { data, error } = await supabase.functions.invoke('private-contact', { body })
    if (error) {
      let code = 'unavailable'
      try { code = (await error.context?.json())?.error || code } catch { /* network response unavailable */ }
      throw new Error(messages[code] || messages.unavailable)
    }
    return data
  }

  async setPreferences(roomSlug: string, preferences: ContactPreferences): Promise<ContactPreferences> {
    const data = await this.invoke({ action: 'set_preferences', roomSlug, preferences })
    return data.preferences as ContactPreferences
  }

  async invite(roomSlug: string, toUser: string, mode: ContactMode): Promise<PrivateInvite> {
    const data = await this.invoke({ action: 'invite', roomSlug, toUser, mode })
    return normalize(data.invite)
  }

  async respond(inviteId: string, response: 'accept' | 'decline'): Promise<PrivateInvite> {
    const data = await this.invoke({ action: 'respond', inviteId, response })
    return normalize(data.invite)
  }

  async end(inviteId: string): Promise<PrivateInvite> {
    const data = await this.invoke({ action: 'end', inviteId })
    return normalize(data.invite)
  }

  async subscribe(userId: string, onInvite: (invite: PrivateInvite) => void, onError: () => void = () => {}): Promise<void> {
    this.leave()
    const generation = this.generation
    const deliver = (row: any) => {
      if (generation !== this.generation || !row?.id) return
      onInvite(normalize(row))
    }
    const channel = supabase.channel(`private-invites:${userId}`)
    this.channel = channel
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_invites', filter: `to_user=eq.${userId}` }, payload => deliver(payload.new))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_invites', filter: `from_user=eq.${userId}` }, payload => deliver(payload.new))
      .subscribe(status => {
        if (generation !== this.generation) return
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onError()
      })
    const { data, error } = await supabase.from('private_invites').select('*')
      .or(`from_user.eq.${userId},to_user.eq.${userId}`)
      .in('status', ['pending', 'accepted']).gt('expires_at', new Date().toISOString()).limit(50)
    if (generation !== this.generation) return
    if (error) throw new Error(messages.unavailable)
    const now = Date.now()
    for (const row of data || []) {
      if ((row.status === 'pending' || row.status === 'accepted') && Date.parse(row.expires_at) > now) deliver(row)
    }
  }

  leave() {
    ++this.generation
    if (this.channel) void supabase.removeChannel(this.channel)
    this.channel = null
  }
}

export const privateContacts = new PrivateContactClient()
