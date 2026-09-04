// Run with CHAT_PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node supabase/tests/chat-security.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const modulePath = process.env.CHAT_PGLITE_MODULE
if (!modulePath) throw new Error('Set CHAT_PGLITE_MODULE to an isolated @electric-sql/pglite install')
const { PGlite } = await import(modulePath)
const db = new PGlite()
const a = '11111111-1111-4111-8111-111111111111'
const b = '22222222-2222-4222-8222-222222222222'
const outsider = '33333333-3333-4333-8333-333333333333'
const sql = await readFile(new URL('../migrations/20260904054854_moderated_chat.sql', import.meta.url), 'utf8')
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
    CREATE TABLE public.rooms(slug text PRIMARY KEY, is_active boolean, type text, ficha_cost integer);
    CREATE TABLE public.user_bans(user_id uuid, expires_at timestamptz);
    GRANT SELECT ON public.rooms TO authenticated;
    INSERT INTO auth.users VALUES ('${a}'), ('${b}'), ('${outsider}');
    INSERT INTO rooms VALUES ('geral', true, 'publica', 0), ('paid', true, 'publica', 10), ('closed', false, 'publica', 0), ('adult', true, 'camarote_vip', 0);
  `)
  await db.exec(sql)
  const send = (sender, room, text = 'Olá') => db.query('SELECT * FROM public.send_chat_message($1,$2,$3,$4,$5)', [sender, room, text, 'Convidado', 'text'])
  const role = async (name, uid = a) => { await db.exec(`RESET ROLE; SET ROLE ${name}; SET request.jwt.claim.sub = '${uid}';`) }
  await role('authenticated')
  await assert.rejects(send(a, 'geral'), /permission denied/)
  await assert.rejects(db.exec(`INSERT INTO chat_messages(room_slug,user_id,username,content) VALUES ('geral','${a}','fake','fake')`), /permission denied/)
  await assert.rejects(db.exec('UPDATE chat_messages SET content=\'fake\''), /permission denied/)
  await assert.rejects(db.exec('DELETE FROM chat_messages'), /permission denied/)
  await role('anon')
  await assert.rejects(db.query('SELECT * FROM chat_messages'), /permission denied/)
  await role('service_role')
  for (const room of ['missing', 'paid', 'closed', 'adult', `dm-${b}-${a}`, `roulette-${a}-${a}`, `dm-${a}-forged`]) await assert.rejects(send(a, room), /forbidden/)
  await assert.rejects(send(outsider, `dm-${a}-${b}`), /forbidden/)
  const publicRow = (await send(a, 'geral')).rows[0]
  const privateRow = (await send(a, `dm-${a}-${b}`)).rows[0]
  assert.equal(publicRow.participant_ids, null)
  assert.deepEqual(privateRow.participant_ids, [a, b])
  await role('authenticated', outsider)
  assert.deepEqual((await db.query('SELECT id FROM chat_messages')).rows.map(r => r.id), [publicRow.id])
  await role('authenticated', b)
  assert.equal((await db.query('SELECT id FROM chat_messages')).rows.length, 2)
  await role('service_role')
  await send(a, `roulette-${a}-${b}`)
  await send(a, 'geral')
  await send(a, 'geral')
  await assert.rejects(send(a, 'geral'), /rate_limited/)
  // Requests queued simultaneously still share the sender's durable budget.
  const exhausted = await Promise.allSettled(Array.from({ length: 6 }, () => send(a, 'geral')))
  assert.equal(exhausted.filter(r => r.status === 'fulfilled').length, 0)
  await db.exec(`UPDATE chat_messages SET created_at = clock_timestamp() - interval '3.01 seconds' WHERE user_id = '${a}'`)
  const burst = await Promise.allSettled(Array.from({ length: 6 }, () => send(a, 'geral')))
  assert.equal(burst.filter(r => r.status === 'fulfilled').length, 5)
  assert.equal(burst.filter(r => r.status === 'rejected' && /rate_limited/.test(r.reason.message)).length, 1)
  await db.exec(`RESET ROLE; INSERT INTO user_bans VALUES ('${b}', null); SET ROLE service_role;`)
  await assert.rejects(send(b, 'geral'), /banned/)
  await db.exec(`RESET ROLE; UPDATE rooms SET is_active=false WHERE slug='geral';`)
  await role('authenticated', outsider)
  assert.equal((await db.query('SELECT id FROM chat_messages')).rows.length, 0)
  await db.exec('RESET ROLE')
  await assert.rejects(db.exec(sql), /requires schema review/)
  console.log('PASS: migration, grants, direct writes, RPC access, room validation, private RLS, bans, shared 5/3s window, queued burst, elapsed boundary, existing-schema guard')
  console.log('PGlite serializes requests: this does not replace a multi-connection PostgreSQL advisory-lock deployment check.')
} finally { await db.close() }
