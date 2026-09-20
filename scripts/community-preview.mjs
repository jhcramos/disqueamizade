// Isolated browser verification: real SQL in PGlite, local auth/media stand-ins.
// Never connects to Supabase or publishes fixture records to production.
import { createServer as httpServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { createServer as viteServer } from 'vite'
import { AccessToken } from 'livekit-server-sdk'
const videoEnabled = process.argv.includes('--video')
const db = new PGlite()
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean,email_confirmed_at timestamptz);CREATE TABLE public.user_bans(user_id uuid,expires_at timestamptz);GRANT USAGE ON SCHEMA auth,public TO service_role;`)
for (const name of [
  '20260920124107_community_rooms.sql',
  '20260920141803_community_social.sql',
])
  await db.exec(
    await readFile(
      new URL('../supabase/migrations/' + name, import.meta.url),
      'utf8',
    ),
  )
const id = (i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  me = id(1),
  ana = id(2),
  rafa = id(3)
for (let i = 1; i <= 35; i++)
  await db.query('INSERT INTO auth.users VALUES($1,false,now())', [id(i)])
async function act(actor, action, input = {}) {
  return (
    await db.query('SELECT community_action($1,$2,$3) AS result', [
      actor,
      action,
      input,
    ])
  ).rows[0].result
}
const room = (
  await act(ana, 'create', {
    name: 'Café entre amigos · teste local',
    description:
      'Ambiente isolado de verificação. Nenhuma pessoa ou mensagem real.',
    theme: 'amizade',
    access: 'public',
  })
).room
await db.query("UPDATE community_rooms SET slug='teste-local' WHERE id=$1", [
  room.id,
])
for (let i = 4; i <= 34; i++)
  await act(id(i), 'create', {
    name: (i % 3 === 0 ? 'Encontros 18+' : 'Papo de música') + ' · teste ' + i,
    theme: i % 3 === 0 ? 'adulto' : 'musica',
    access: 'public',
    adultAcknowledged: true,
  })
await act(ana, 'join', { slug: 'teste-local', nickname: 'Ana · teste' })
await act(rafa, 'join', { slug: 'teste-local', nickname: 'Rafa · teste' })
await act(ana, 'send', {
  slug: 'teste-local',
  text: 'Esta é uma conversa de teste local. Bem-vindo ao novo bate-papo!',
})
const user = {
  id: me,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'local@example.invalid',
  email_confirmed_at: new Date().toISOString(),
  is_anonymous: false,
  user_metadata: { username: 'Você · teste' },
  app_metadata: { provider: 'email', providers: ['email'] },
  created_at: new Date().toISOString(),
}
const access =
  [
    { alg: 'HS256', typ: 'JWT' },
    {
      sub: me,
      exp: Math.floor(Date.now() / 1000) + 86400,
      aud: 'authenticated',
    },
  ]
    .map((x) => Buffer.from(JSON.stringify(x)).toString('base64url'))
    .join('.') + '.local-test-signature'
let invited = false
const api = httpServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5176')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'authorization,apikey,content-type,x-client-info,x-supabase-api-version',
  )
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  res.setHeader('Content-Type', 'application/json')
  if (req.method === 'OPTIONS') {
    res.end('{}')
    return
  }
  try {
    let raw = ''
    for await (const c of req) raw += c
    const body = raw ? JSON.parse(raw) : {}
    if (
      req.url.startsWith('/auth/v1/signup') ||
      req.url.startsWith('/auth/v1/token')
    ) {
      res.end(
        JSON.stringify({
          access_token: access,
          refresh_token: 'local-test-refresh',
          expires_in: 86400,
          token_type: 'bearer',
          user,
        }),
      )
      return
    }
    if (req.url === '/qa/camera-tokens' && videoEnabled) {
      const tokens = await Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const t = new AccessToken('devkey', 'secret', {
            identity: 'synthetic-' + i,
            name: 'Câmera teste ' + (i + 1),
            ttl: 3600,
          })
          t.addGrant({
            roomJoin: true,
            room: 'community-public-' + room.id,
            canPublish: true,
            canSubscribe: false,
          })
          return { token: await t.toJwt(), label: 'Câmera teste ' + (i + 1) }
        }),
      )
      res.end(JSON.stringify(tokens))
      return
    }
    if (req.url.startsWith('/auth/v1/user')) {
      res.end(JSON.stringify(user))
      return
    }
    if (req.url.startsWith('/rest/v1/profiles')) {
      res.end(
        JSON.stringify({
          id: me,
          username: 'Você · teste',
          subscription_tier: 'free',
        }),
      )
      return
    }
    if (req.url.startsWith('/functions/v1/community-rooms')) {
      if (body.action === 'video-token') {
        if (videoEnabled) {
          const grant = await act(me, 'video-authorize', body)
          const t = new AccessToken('devkey', 'secret', {
            identity: me,
            name: 'Você · teste',
            ttl: 3600,
          })
          t.addGrant({
            roomJoin: true,
            room: grant.room,
            canPublish: true,
            canSubscribe: true,
          })
          res.end(
            JSON.stringify({
              token: await t.toJwt(),
              url: 'ws://127.0.0.1:7880',
            }),
          )
          return
        }
        res.statusCode = 503
        res.end(JSON.stringify({ error: 'video_unavailable' }))
        return
      }
      const result = await act(me, body.action, body)
      if (body.action === 'join' && !invited) {
        invited = true
        await act(ana, 'contact', {
          slug: 'teste-local',
          target: me,
          kind: 'video',
        })
      }
      res.end(JSON.stringify(result))
      return
    }
    res.end('[]')
  } catch (e) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: e.message }))
  }
})
await new Promise((resolve) => api.listen(54329, '127.0.0.1', resolve))
process.env.VITE_SUPABASE_URL = 'http://127.0.0.1:54329'
process.env.VITE_SUPABASE_ANON_KEY = 'local-test-public-key'
const vite = await viteServer({
  server: { host: '127.0.0.1', port: 5176, strictPort: true, open: false },
})
await vite.listen()
setInterval(() => {
  void act(ana, 'state', { slug: 'teste-local' })
  void act(rafa, 'state', { slug: 'teste-local' })
}, 20000)
console.log(
  'LOCAL TEST ONLY: http://127.0.0.1:5176/rooms | /comunidade/teste-local',
)
