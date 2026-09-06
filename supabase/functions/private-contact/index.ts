import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { ChatError, readChatBody } from '../_shared/chat.ts'
import { parsePrivateContactInput } from '../_shared/private-contact.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})
const isoAfter = (milliseconds: number) => new Date(Date.now() + milliseconds).toISOString()

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'invalid_request' }, 405)
  try {
    const jwt = req.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1]
    if (!jwt) throw new ChatError('unauthorized', 401)
    const url = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) throw new ChatError('unavailable', 503)
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: auth, error: authError } = await admin.auth.getUser(jwt)
    if (authError || !auth.user) throw new ChatError('unauthorized', 401)
    const userId = auth.user.id
    const input = parsePrivateContactInput(await readChatBody(req))
    const bans = await admin.from('user_bans').select('id').eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).limit(1)
    if (bans.error) throw new ChatError('unavailable', 503)
    if (bans.data?.length) throw new ChatError('banned', 403)

    if (input.action === 'set_preferences' || input.action === 'invite') {
      const room = await admin.from('rooms').select('slug').eq('slug', input.roomSlug)
        .eq('is_active', true).eq('type', 'publica').eq('ficha_cost', 0).maybeSingle()
      if (room.error) throw new ChatError('unavailable', 503)
      if (!room.data) throw new ChatError('forbidden', 403)
    }

    if (input.action === 'set_preferences') {
      const row = {
        room_slug: input.roomSlug,
        user_id: userId,
        accepts_message: input.preferences.message,
        accepts_audio: input.preferences.audio,
        accepts_video: input.preferences.video,
        expires_at: isoAfter(4 * 60 * 60 * 1000),
        updated_at: new Date().toISOString(),
      }
      const { error } = await admin.from('room_contact_preferences').upsert(row, { onConflict: 'room_slug,user_id' })
      if (error) throw new ChatError('unavailable', 503)
      return json({ preferences: input.preferences }, 200)
    }

    if (input.action === 'invite') {
      if (input.toUser === userId) throw new ChatError('invalid_request', 400)
      const preferenceColumn = `accepts_${input.mode}`
      const now = new Date().toISOString()
      const preference = await admin.from('room_contact_preferences').select(preferenceColumn)
        .eq('room_slug', input.roomSlug).eq('user_id', input.toUser).gt('expires_at', now).maybeSingle()
      if (preference.error) throw new ChatError('unavailable', 503)
      if (!preference.data?.[preferenceColumn]) throw new ChatError('not_available', 409)

      const recent = await admin.from('private_invites').select('id', { count: 'exact', head: true })
        .eq('from_user', userId).gt('created_at', new Date(Date.now() - 30_000).toISOString())
      if (recent.error) throw new ChatError('unavailable', 503)
      if ((recent.count || 0) >= 3) throw new ChatError('rate_limited', 429)

      await admin.from('private_invites').update({ status: 'expired', updated_at: now })
        .eq('from_user', userId).eq('to_user', input.toUser).eq('mode', input.mode).eq('status', 'pending')

      const { data: invite, error } = await admin.from('private_invites').insert({
        room_slug: input.roomSlug,
        from_user: userId,
        to_user: input.toUser,
        mode: input.mode,
        status: 'pending',
        expires_at: isoAfter(30_000),
      }).select('*').single()
      if (error || !invite) throw new ChatError('unavailable', 503)
      return json({ invite }, 201)
    }

    const selected = await admin.from('private_invites').select('*').eq('id', input.inviteId).maybeSingle()
    if (selected.error) throw new ChatError('unavailable', 503)
    const invite = selected.data
    if (!invite || (invite.from_user !== userId && invite.to_user !== userId)) throw new ChatError('forbidden', 403)

    if (input.action === 'respond') {
      if (invite.to_user !== userId) throw new ChatError('forbidden', 403)
      if (invite.status !== 'pending') throw new ChatError('invite_closed', 409)
      if (Date.parse(invite.expires_at) <= Date.now()) {
        await admin.from('private_invites').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', invite.id)
        throw new ChatError('invite_expired', 410)
      }
      const status = input.response === 'accept' ? 'accepted' : 'declined'
      const update = {
        status,
        updated_at: new Date().toISOString(),
        expires_at: input.response === 'accept' ? isoAfter(45 * 60 * 1000) : invite.expires_at,
      }
      const { data, error } = await admin.from('private_invites').update(update)
        .eq('id', invite.id).eq('status', 'pending').select('*').single()
      if (error || !data) throw new ChatError('invite_closed', 409)
      return json({ invite: data }, 200)
    }

    if (invite.status !== 'accepted') throw new ChatError('invite_closed', 409)
    const { data, error } = await admin.from('private_invites').update({
      status: 'ended', updated_at: new Date().toISOString(),
    }).eq('id', invite.id).eq('status', 'accepted').select('*').single()
    if (error || !data) throw new ChatError('invite_closed', 409)
    return json({ invite: data }, 200)
  } catch (error) {
    return error instanceof ChatError ? json({ error: error.code }, error.status) : json({ error: 'unavailable' }, 503)
  }
})
