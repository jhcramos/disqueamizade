import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { ChatError, configuredWords, moderateText, parseChatInput, readChatBody, safeUsername } from '../_shared/chat.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'invalid_request' }, 405)
  try {
    const authorization = req.headers.get('authorization') || ''
    const jwt = authorization.match(/^Bearer ([^\s]+)$/i)?.[1]
    if (!jwt) throw new ChatError('unauthorized', 401)
    const url = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) throw new ChatError('unavailable', 503)
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: auth, error: authError } = await admin.auth.getUser(jwt)
    if (authError || !auth.user) throw new ChatError('unauthorized', 401)
    const input = parseChatInput(await readChatBody(req))
    const [profile, settings] = await Promise.all([
      admin.from('profiles').select('username, display_name').eq('id', auth.user.id).maybeSingle(),
      admin.from('admin_settings').select('value').eq('key', 'moderation').maybeSingle(),
    ])
    if (profile.error || settings.error) throw new ChatError('unavailable', 503)
    const words = configuredWords(settings.data?.value?.banned_words)
    const content = moderateText(input.text, words)
    const username = safeUsername(profile.data?.username || profile.data?.display_name || auth.user.user_metadata?.username, words)
    const { data, error } = await admin.rpc('send_chat_message', {
      p_sender: auth.user.id, p_room_slug: input.roomSlug, p_text: content, p_username: username, p_type: input.type,
    })
    if (error) {
      const codes: Record<string, number> = { invalid_request: 400, forbidden: 403, banned: 403, rate_limited: 429 }
      if (Object.hasOwn(codes, error.message)) throw new ChatError(error.message, codes[error.message])
      throw new ChatError('unavailable', 503)
    }
    const message = Array.isArray(data) ? data[0] : data
    if (!message?.id) throw new ChatError('unavailable', 503)
    return json({ message }, 200)
  } catch (error) {
    return error instanceof ChatError ? json({ error: error.code }, error.status) : json({ error: 'unavailable' }, 503)
  }
})
