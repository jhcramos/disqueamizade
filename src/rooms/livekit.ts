import { supabase } from '@/services/supabase/client'
// ═══════════════════════════════════════════════════════════════════════════
// LiveKit — helpers de configuração e token (Plano V4, Fase 1)
// ═══════════════════════════════════════════════════════════════════════════

/** LiveKit está configurado no ambiente? */
export function isLiveKitConfigured(): boolean {
  const url = import.meta.env.VITE_LIVEKIT_URL as string | undefined
  return !!(url && url !== 'wss://your-project.livekit.cloud' && url.startsWith('wss://'))
}

export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL as string

/** Número máximo de câmeras publicando ao mesmo tempo (modelo palco). */
export const MAX_STAGE = 8

/**
 * Busca um token LiveKit na edge function do Supabase.
 * `identity` deve ser único por participante (id do usuário ou do convidado).
 */
export async function fetchRoomToken(roomId: string, identity: string): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
    throw new Error('Supabase não configurado — não é possível obter token LiveKit')
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || session.user.id !== identity) throw new Error('Sua sessão expirou. Entre novamente.')
  const res = await fetch(`${supabaseUrl}/functions/v1/livekit-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ roomId, participantName: identity }),
  })
  if (!res.ok) throw new Error(`Falha ao obter token LiveKit: ${res.statusText}`)
  const data = await res.json()
  return data.token as string
}
