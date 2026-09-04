// Isolated fixtures only. Install PGlite outside the repository and set CHAT_PGLITE_MODULE.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
if (!process.env.CHAT_PGLITE_MODULE) throw new Error('Set CHAT_PGLITE_MODULE to an isolated PGlite install')
const { PGlite } = await import(process.env.CHAT_PGLITE_MODULE)
const db = new PGlite()
const a = '11111111-1111-4111-8111-111111111111'
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.sub', true)::uuid $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
    CREATE TABLE profiles(id uuid PRIMARY KEY, username text NOT NULL, display_name text NOT NULL,
      avatar_url text, cidade text, estado text, bio text, is_creator boolean DEFAULT false,
      is_vip boolean DEFAULT false, is_elite boolean DEFAULT false, saldo_fichas integer DEFAULT 0,
      total_earned integer DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
      is_admin boolean DEFAULT false, hidden_until timestamptz);
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    GRANT ALL ON profiles TO anon, authenticated, service_role;
    CREATE POLICY read_profiles ON profiles FOR SELECT USING (true);
    CREATE POLICY insert_profile ON profiles FOR INSERT WITH CHECK (auth.uid()=id);
    CREATE POLICY update_profile ON profiles FOR UPDATE USING (auth.uid()=id);
    SET request.jwt.claim.sub='${a}';
  `)
  await db.exec(await readFile(new URL('../migrations/20260904063330_guard_privileged_profile_fields.sql', import.meta.url), 'utf8'))
  for (const role of ['authenticated', 'anon']) {
    await db.exec(`RESET ROLE; SET ROLE ${role};`)
    await assert.rejects(db.exec(`INSERT INTO profiles(id,username,display_name,is_admin) VALUES ('${a}','test','test',true)`), /privileged_profile_fields/)
  }
  await db.exec(`RESET ROLE; SET ROLE service_role;
    INSERT INTO profiles(id,username,display_name,is_admin,saldo_fichas) VALUES ('22222222-2222-4222-8222-222222222222','trusted','trusted',true,800);`);
  await db.exec(`RESET ROLE; SET ROLE authenticated;
    INSERT INTO profiles(id,username,display_name,is_vip,is_elite,saldo_fichas,total_earned) VALUES ('${a}','test','test',false,false,50,0);
    UPDATE profiles SET username='New name',cidade='Cidade',avatar_url='avatar.webp',bio='hello' WHERE id='${a}';`)
  for (const assignment of ['is_admin=true', 'is_vip=true', 'is_elite=true', 'saldo_fichas=999', 'total_earned=9', "hidden_until=now()+interval '1 day'"]) {
    await assert.rejects(db.exec(`UPDATE profiles SET ${assignment} WHERE id='${a}'`), /privileged_profile_fields/)
  }
  await db.exec(`RESET ROLE; SET ROLE service_role;
    UPDATE profiles SET is_admin=true,is_vip=true,saldo_fichas=500,hidden_until=now()+interval '1 day' WHERE id='${a}';`)
  assert.equal((await db.query(`SELECT is_admin,saldo_fichas FROM profiles WHERE id='${a}'`)).rows[0].is_admin, true)
  await db.exec(`RESET ROLE; SET ROLE authenticated; UPDATE profiles SET bio='normal edit' WHERE id='${a}';`)
  await assert.rejects(db.exec(`UPDATE profiles SET hidden_until=null WHERE id='${a}'`), /privileged_profile_fields/)
  await assert.rejects(db.exec(`UPDATE profiles SET is_admin=false WHERE id='${a}'`), /privileged_profile_fields/)
  console.log('PASS: own admin INSERT/UPDATE denied, paid/balance/moderation updates denied, legacy defaults and ordinary edits accepted, service_role trusted writes accepted')
} finally { await db.close() }
