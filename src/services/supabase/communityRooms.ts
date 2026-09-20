import { supabase } from './client'
export type CommunityRoom = {
  id: string
  slug: string
  name: string
  description: string
  rules: string
  theme: string
  access: 'public' | 'invite'
  owner_id: string
  online?: number
}
export type CommunityMessage = {
  id: string
  user_id: string
  nickname: string
  body: string
  created_at: string
}
export type CommunityMember = {
  user_id: string
  nickname: string
  role: 'owner' | 'moderator' | 'member'
  banned: boolean
  last_seen: string
}
export type CommunityState = {
  room: CommunityRoom
  role: CommunityMember['role']
  members: CommunityMember[]
  messages: CommunityMessage[]
  reports: { id: string; user_id: string; nickname: string; body: string }[]
}
const messages: Record<string, string> = {
  unauthorized: 'Entre novamente para continuar.',
  forbidden: 'Você não tem permissão para esta ação.',
  banned: 'Seu acesso a esta sala está bloqueado.',
  invite_required: 'Esta sala precisa de um link de convite válido.',
  verified_account_required:
    'Confirme o e-mail da sua conta para criar uma sala.',
  room_limit: 'Você já tem sua sala gratuita. Acesse Minha sala no catálogo.',
  adult_confirmation_required:
    'Confirme que deseja entrar em uma sala adulta 18+.',
  not_found: 'Sala não encontrada.',
  invalid_request: 'Confira os campos e tente novamente.',
  rate_limited: 'Aguarde um pouco. Evite repetir a mesma mensagem.',
  blocked_content: 'Links não são permitidos nas mensagens.',
  unavailable:
    'As salas da comunidade estão indisponíveis no momento. Tente novamente mais tarde.',
}
export class CommunityError extends Error {
  constructor(public code: string) {
    super(messages[code] || messages.unavailable)
  }
}
export async function communityAction<T>(
  action: string,
  input: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke('community-rooms', {
    body: { ...input, action },
  })
  if (error || data?.error) {
    let code = data?.error || 'unavailable'
    try {
      code = (await error?.context?.json())?.error || code
    } catch {
      /* network failure */
    }
    throw new CommunityError(code)
  }
  return data as T
}
