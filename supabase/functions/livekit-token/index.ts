// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: LiveKit Token Generator
// 
// Generates LiveKit access tokens for room participants.
// Deploy: supabase functions deploy livekit-token
// 
// Required env vars (set in Supabase dashboard):
//   LIVEKIT_API_KEY    — from livekit.io dashboard
//   LIVEKIT_API_SECRET — from livekit.io dashboard
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { ChatError, readChatBody } from '../_shared/chat.ts'
import { validateVideoRoom } from '../_shared/livekit.ts'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple JWT creation for LiveKit (no external deps)
function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function textToUint8Array(text: string) {
  return new TextEncoder().encode(text)
}

async function createLiveKitToken(
  apiKey: string,
  apiSecret: string,
  roomName: string,
  participantName: string,
  isGuest: boolean
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const ttl = isGuest ? 1800 : 3600

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const payload = {
    iss: apiKey,
    sub: participantName,
    nbf: now,
    exp: now + ttl,
    iat: now,
    jti: `${participantName}-${roomName}-${now}`,
    metadata: JSON.stringify({ guest: isGuest }),
    video: {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
    },
  }

  const headerB64 = base64url(textToUint8Array(JSON.stringify(header)))
  const payloadB64 = base64url(textToUint8Array(JSON.stringify(payload)))
  const message = `${headerB64}.${payloadB64}`

  // Sign with HMAC-SHA256
  const key = await crypto.subtle.importKey(
    'raw',
    textToUint8Array(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, textToUint8Array(message))
  const signatureB64 = base64url(new Uint8Array(signature))

  return `${message}.${signatureB64}`
}

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'invalid_request' }, 405)
  try {
    const jwt = req.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1]
    if (!jwt) throw new ChatError('unauthorized', 401)
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const apiKey = Deno.env.get('LIVEKIT_API_KEY')
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET')
    if (!url || !serviceKey || !apiKey || !apiSecret) throw new ChatError('unavailable', 503)
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: auth, error } = await admin.auth.getUser(jwt)
    if (error || !auth.user) throw new ChatError('unauthorized', 401)
    const { roomId, privateRoom } = validateVideoRoom(await readChatBody(req), auth.user.id)
    const bans = await admin.from('user_bans').select('id').eq('user_id', auth.user.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).limit(1)
    if (bans.error) throw new ChatError('unavailable', 503)
    if (bans.data?.length) throw new ChatError('banned', 403)
    if (!privateRoom) {
      const room = await admin.from('rooms').select('id').eq('slug', roomId)
        .eq('is_active', true).eq('type', 'publica').eq('ficha_cost', 0).maybeSingle()
      if (room.error) throw new ChatError('unavailable', 503)
      if (!room.data) throw new ChatError('forbidden', 403)
    }
    const token = await createLiveKitToken(apiKey, apiSecret, roomId, auth.user.id, !!auth.user.is_anonymous)
    return json({ token }, 200)
  } catch (error) {
    return error instanceof ChatError ? json({ error: error.code }, error.status) : json({ error: 'unavailable' }, 503)
  }
})
