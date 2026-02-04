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

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

function textToUint8Array(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

async function createLiveKitToken(
  apiKey: string,
  apiSecret: string,
  roomName: string,
  participantName: string,
  ttlSeconds: number = 3600
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const payload = {
    iss: apiKey,
    sub: participantName,
    nbf: now,
    exp: now + ttlSeconds,
    iat: now,
    jti: `${participantName}-${roomName}-${now}`,
    video: {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
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

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { roomId, participantName } = await req.json()

    if (!roomId || !participantName) {
      return new Response(
        JSON.stringify({ error: 'roomId and participantName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('LIVEKIT_API_KEY')
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET')

    if (!apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ error: 'LiveKit credentials not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = await createLiveKitToken(apiKey, apiSecret, roomId, participantName)

    return new Response(
      JSON.stringify({ token }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error generating token:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
