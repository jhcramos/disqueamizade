// ═══════════════════════════════════════════════════════════════════════════
// Moderação no cliente (Plano V4, Fase 3)
//
// - filterMessage: barra links e mascara palavrões ANTES de enviar no chat.
//   É a defesa imediata que sempre funciona; a edge function send-chat é o
//   endurecimento no servidor (deploy pelo Juliano).
// - reportUser: grava a denúncia via edge function report-user (conta até de
//   convidado); cai para insert direto se a função não estiver publicada.
// - blocos: persistidos em localStorage (sempre) + Supabase best-effort.
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/services/supabase/client'

// Lista base — o servidor pode ter uma lista maior em admin_settings.moderation.
const BAD_WORDS = ['puta', 'merda', 'caralho', 'porra', 'buceta', 'viado', 'arrombado', 'fdp', 'piroca']
const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|br|xyz|link|gg|io)\b)/i

export interface FilterResult { ok: boolean; cleaned: string; reason?: 'link' | 'empty' }

/** Verifica e limpa uma mensagem. Bloqueia links; mascara palavrões. */
export function filterMessage(text: string): FilterResult {
  const t = text.trim()
  if (!t) return { ok: false, cleaned: '', reason: 'empty' }
  if (LINK_RE.test(t)) return { ok: false, cleaned: t, reason: 'link' }
  let cleaned = t
  for (const w of BAD_WORDS) {
    cleaned = cleaned.replace(new RegExp(`\\b${w}\\w*`, 'gi'), (m) => m[0] + '*'.repeat(Math.max(1, m.length - 1)))
  }
  return { ok: true, cleaned }
}

/** Grava uma denúncia. Nunca lança. */
export async function reportUser(input: {
  reportedIdentity: string
  reporterIdentity?: string
  reason: string
  roomSlug?: string
  context?: string
}): Promise<void> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
  try {
    if (url && url !== 'your_supabase_url') {
      const res = await fetch(`${url}/functions/v1/report-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anon}`, apikey: anon },
        body: JSON.stringify(input),
      })
      if (res.ok) return
    }
  } catch { /* tenta o fallback */ }
  // Fallback: insert direto (funciona para usuários reais autenticados).
  try {
    const isUuid = (s?: string) => !!s && /^[0-9a-f-]{36}$/i.test(s)
    await supabase.from('reports').insert({
      reporter_id: isUuid(input.reporterIdentity) ? input.reporterIdentity : null,
      reported_user_id: isUuid(input.reportedIdentity) ? input.reportedIdentity : null,
      reason: input.reason.slice(0, 50),
      description: [input.roomSlug && `sala: ${input.roomSlug}`, `denunciado: ${input.reportedIdentity}`, input.context].filter(Boolean).join(' | '),
      status: 'pending',
    })
  } catch { /* silencioso: a UI já agradeceu ao usuário */ }
}

const BLOCK_KEY = 'blocked-users'

export function loadBlocks(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(BLOCK_KEY) || '[]')) } catch { return new Set() }
}

/** Bloqueia uma identidade: localStorage sempre; Supabase best-effort. */
export function blockUser(blockedIdentity: string): Set<string> {
  const set = loadBlocks()
  set.add(blockedIdentity)
  try { localStorage.setItem(BLOCK_KEY, JSON.stringify([...set])) } catch { /* ignore */ }
  ;(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('blocked_users').insert({ blocker_id: user.id, blocked_id: blockedIdentity })
    } catch { /* best-effort */ }
  })()
  return set
}
