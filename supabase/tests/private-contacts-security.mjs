// Run with CHAT_PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node supabase/tests/private-contacts-security.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const modulePath = process.env.CHAT_PGLITE_MODULE
if (!modulePath) throw new Error('Set CHAT_PGLITE_MODULE to an isolated @electric-sql/pglite install')
const { PGlite } = await import(modulePath)
const db = new PGlite()
const a = '11111111-1111-4111-8111-111111111111'
const b = '22222222-2222-4222-8222-222222222222'
const outsider = '33333333-3333-4333-8333-333333333333'
const migration = await readFile(new URL('../migrations/20260906230111_private_contacts.sql', import.meta.url), 'utf8')

try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
    CREATE TABLE public.rooms(slug text PRIMARY KEY, is_active boolean, type text, ficha_cost integer);
    CREATE PUBLICATION supabase_realtime;
    INSERT INTO auth.users VALUES ('${a}'), ('${b}'), ('${outsider}');
    INSERT INTO rooms VALUES ('geral', true, 'publica', 0);
  `)
  await db.exec(migration)
  const role = async (name, uid = a) => { await db.exec(`RESET ROLE; SET ROLE ${name}; SET request.jwt.claim.sub = '${uid}';`) }
  await role('authenticated', a)
  await assert.rejects(db.exec(`INSERT INTO room_contact_preferences(room_slug,user_id) VALUES ('geral','${a}')`), /permission denied/)
  await assert.rejects(db.exec(`INSERT INTO private_invites(room_slug,from_user,to_user,mode) VALUES ('geral','${a}','${b}','video')`), /permission denied/)
  await role('service_role')
  await db.exec(`INSERT INTO room_contact_preferences(room_slug,user_id,accepts_message) VALUES ('geral','${a}',true),('geral','${b}',true)`)
  const inserted = await db.query(`INSERT INTO private_invites(room_slug,from_user,to_user,mode) VALUES ('geral','${a}','${b}','video') RETURNING id`)
  assert.equal(inserted.rows.length, 1)
  await role('authenticated', outsider)
  assert.equal((await db.query('SELECT id FROM private_invites')).rows.length, 0)
  await role('authenticated', b)
  assert.equal((await db.query('SELECT id FROM private_invites')).rows.length, 1)
  await assert.rejects(db.exec(`UPDATE private_invites SET status='accepted'`), /permission denied/)
  await role('anon')
  await assert.rejects(db.query('SELECT id FROM private_invites'), /permission denied/)
  console.log('PASS: private preferences and invites deny direct writes and restrict reads to both participants')
} finally { await db.close() }
