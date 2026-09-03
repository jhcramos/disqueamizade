// ═══════════════════════════════════════════════════════════════════════════
// Edge Function: moderate-user (Plano V4, Fase 3, item 3.1)
//
// Expulsa e bane um participante NO SERVIDOR (não por broadcast do cliente,
// que qualquer um poderia forjar). Só admins podem chamar. Grava o ban em
// user_bans e remove o participante da sala LiveKit. O livekit-token nega
// novo token a quem está banido, então o ban impede o retorno.
//
// Deploy: supabase functions deploy moderate-user
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LIVEKIT_URL(https),
//      LIVEKIT_API_KEY, LIVEKIT_API_SECRET
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// JWT HS256 mínimo para a API de servidor do LiveKit (roomAdmin).
async function livekitAdminToken(apiKey: string, apiSecret: string, room: string): Promise<string> {
  const enc = (o: unknown) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const now = Math.floor(Date.now() / 1000)
  const header = enc({ alg: 'HS256', typ: 'JWT' })
  const payload = enc({ iss: apiKey, nbf: now, exp: now + 60, video: { roomAdmin: true, room } })
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${header}.${payload}.${sigB64}`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Só admin autenticado pode moderar.
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors })
    const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
    if (!prof?.is_admin) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: cors })

    const { targetIdentity, roomSlug, reason, banType = 'temporary', hours = 24 } = await req.json()
    if (!targetIdentity) return new Response(JSON.stringify({ error: 'targetIdentity obrigatório' }), { status: 400, headers: cors })

    // 1) Grava o ban (impede o retorno via token).
    const isUuid = /^[0-9a-f-]{36}$/i.test(targetIdentity)
    if (isUuid) {
      await supabase.from('user_bans').insert({
        user_id: targetIdentity, banned_by: user.id, reason: reason || null,
        ban_type: banType, expires_at: banType === 'permanent' ? null : new Date(Date.now() + hours * 3600e3).toISOString(),
      })
    }

    // 2) Remove da sala LiveKit agora (best-effort).
    const lkUrl = Deno.env.get('LIVEKIT_URL'); const key = Deno.env.get('LIVEKIT_API_KEY'); const secret = Deno.env.get('LIVEKIT_API_SECRET')
    if (lkUrl && key && secret && roomSlug) {
      try {
        const admin = await livekitAdminToken(key, secret, roomSlug)
        await fetch(`${lkUrl.replace(/^wss/, 'https')}/twirp/livekit.RoomService/RemoveParticipant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` },
          body: JSON.stringify({ room: roomSlug, identity: targetIdentity }),
        })
      } catch (e) { console.warn('livekit remove falhou (ban ainda vale):', e) }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('moderate-user error', e)
    return new Response(JSON.stringify({ error: 'internal' }), { status: 500, headers: cors })
  }
})
