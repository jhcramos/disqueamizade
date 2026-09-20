import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import {
  AccessToken,
  RoomServiceClient,
  TrackSource,
} from 'npm:livekit-server-sdk@2.15.0'
import {
  ChatError,
  readChatBody,
  moderateText,
  safeUsername,
} from '../_shared/chat.ts'
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers })
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return json({ error: 'invalid_request' }, 405)
  try {
    const jwt = req.headers
      .get('authorization')
      ?.match(/^Bearer ([^\s]+)$/i)?.[1]
    if (!jwt) throw new ChatError('unauthorized', 401)
    const url = Deno.env.get('SUPABASE_URL'),
      key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) throw new ChatError('unavailable', 503)
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await admin.auth.getUser(jwt)
    if (error || !data.user) throw new ChatError('unauthorized', 401)
    const body = (await readChatBody(req)) as Record<string, unknown>
    if (
      !body ||
      typeof body !== 'object' ||
      typeof body.action !== 'string' ||
      ![
        'list',
        'create',
        'preview',
        'join',
        'state',
        'send',
        'leave',
        'invite',
        'moderate',
        'report',
        'resolve-report',
        'contact',
        'respond',
        'private-state',
        'private-send',
        'block',
        'favorite',
        'video-token',
      ].includes(body.action)
    )
      throw new ChatError('invalid_request', 400)
    const input = { ...body }
    delete input.action
    if (body.action === 'send' || body.action === 'private-send') {
      if (typeof input.text !== 'string')
        throw new ChatError('invalid_request', 400)
      input.text = moderateText(input.text)
    }
    if (body.action === 'join') {
      if (
        typeof input.nickname !== 'string' ||
        input.nickname.trim().length < 2 ||
        input.nickname.trim().length > 24
      )
        throw new ChatError('invalid_request', 400)
      input.nickname = safeUsername(input.nickname)
    }
    const result = await admin.rpc('community_action', {
      p_actor: data.user.id,
      p_action: body.action === 'video-token' ? 'video-authorize' : body.action,
      p_input: input,
    })
    if (result.error) {
      const codes: Record<string, number> = {
        unauthorized: 401,
        forbidden: 403,
        banned: 403,
        invite_required: 403,
        verified_account_required: 403,
        adult_confirmation_required: 403,
        room_limit: 409,
        not_found: 404,
        invalid_request: 400,
        rate_limited: 429,
        expired: 410,
      }
      throw new ChatError(
        Object.hasOwn(codes, result.error.message)
          ? result.error.message
          : 'unavailable',
        codes[result.error.message] || 503,
      )
    }
    const liveUrl = Deno.env.get('LIVEKIT_URL')
    const liveKey = Deno.env.get('LIVEKIT_API_KEY')
    const liveSecret = Deno.env.get('LIVEKIT_API_SECRET')
    if (body.action === 'list')
      return json({
        ...result.data,
        mediaConfigured: !!(liveUrl && liveKey && liveSecret),
      })
    if (body.action === 'video-token') {
      if (!liveUrl || !liveKey || !liveSecret)
        return json({ error: 'video_unavailable' }, 503)
      const token = new AccessToken(liveKey, liveSecret, {
        identity: data.user.id,
        name: result.data.nickname,
        ttl: 60,
      })
      token.addGrant({
        roomJoin: true,
        room: result.data.room,
        canPublish: true,
        canSubscribe: true,
        canPublishData: false,
        canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE],
      })
      return json({ token: await token.toJwt(), url: liveUrl })
    }
    // Removing a participant invalidates existing LiveKit credentials as well as
    // stopping media. State polling retries cleanup if the media service was down.
    if (
      liveUrl &&
      liveKey &&
      liveSecret &&
      ['respond', 'block', 'moderate', 'state'].includes(body.action)
    ) {
      const service = new RoomServiceClient(
        liveUrl.replace(/^ws/, 'http'),
        liveKey,
        liveSecret,
        { requestTimeout: 3 },
      )
      const { data: revocations } = await admin
        .from('community_media_revocations')
        .select('room_name,identity,created_at')
        .order('created_at')
        .limit(20)
      await Promise.allSettled(
        (revocations || []).map(async (row) => {
          try {
            await service.removeParticipant(row.room_name, row.identity)
          } catch (e) {
            if (!(
              e &&
              typeof e === 'object' &&
              'code' in e &&
              e.code === 'not_found'
            ))
              throw e
          }
          await admin
            .from('community_media_revocations')
            .delete()
            .eq('room_name', row.room_name)
            .eq('identity', row.identity)
            .eq('created_at', row.created_at)
        }),
      )
    }
    return json(result.data)
  } catch (error) {
    return error instanceof ChatError
      ? json({ error: error.code }, error.status)
      : json({ error: 'unavailable' }, 503)
  }
})
