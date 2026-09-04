// Requires a disposable, isolated PostgreSQL container; never point this at a real project.
// CHAT_POSTGRES_CONTAINER=<test-container> node supabase/tests/chat-concurrency.mjs
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile } from 'node:fs/promises'
const run = promisify(execFile)
const container = process.env.CHAT_POSTGRES_CONTAINER
if (!container?.startsWith('disque-chat-test-')) throw new Error('A disposable disque-chat-test-* container is required')
const query = async text => (await run('docker', ['exec', container, 'psql', '-h', '/tmp', '-U', 'postgres', '-d', 'postgres', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-c', text])).stdout.trim()
const a = '11111111-1111-4111-8111-111111111111'
const b = '22222222-2222-4222-8222-222222222222'
await query(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
  CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
  CREATE TABLE rooms(slug text PRIMARY KEY,is_active boolean,type text,ficha_cost integer);
  CREATE TABLE user_bans(user_id uuid,expires_at timestamptz);
  GRANT SELECT ON rooms TO authenticated;
  INSERT INTO auth.users VALUES ('${a}'), ('${b}');
  INSERT INTO rooms VALUES ('geral',true,'publica',0);
`)
await query(await readFile(new URL('../migrations/20260904054854_moderated_chat.sql', import.meta.url), 'utf8'))
const send = () => query(`SET ROLE service_role; SELECT id FROM send_chat_message('${a}','geral','Olá','Convidado','text')`)
// An independent transaction holds the same sender lock so all workers contend.
const blocker = query(`BEGIN; SELECT pg_advisory_xact_lock(hashtextextended('${a}',61057)); SELECT pg_sleep(1); COMMIT;`)
const results = await Promise.allSettled(Array.from({ length: 6 }, send))
await blocker
assert.equal(results.filter(r => r.status === 'fulfilled').length, 5)
assert.equal(results.filter(r => r.status === 'rejected' && /rate_limited/.test(r.reason.stderr)).length, 1)
assert.equal(await query(`SELECT count(*) FROM chat_messages WHERE user_id='${a}'`), '5')
await query(`UPDATE chat_messages SET created_at=clock_timestamp()-interval '3.01 seconds' WHERE user_id='${a}'`)
await send()
assert.equal(await query(`SELECT count(*) FROM chat_messages WHERE user_id='${a}'`), '6')
console.log('PASS: six independent PostgreSQL connections contending for one sender admit exactly five; elapsed sliding-window boundary permits the next message.')
