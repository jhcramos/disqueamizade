import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { PGlite } = await import(
  process.env.PGLITE_MODULE || "@electric-sql/pglite"
);
const db = new PGlite();
const a = "00000000-0000-4000-8000-000000000001",
  b = "00000000-0000-4000-8000-000000000002",
  c = "00000000-0000-4000-8000-000000000003";
await db.exec(
  `CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid primary key); INSERT INTO auth.users VALUES ('${a}'),('${b}'),('${c}'); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.uid', true), '')::uuid $$; CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT jsonb_build_object('is_anonymous', current_setting('request.anonymous',true)::boolean) $$; GRANT USAGE ON SCHEMA auth TO authenticated, anon;`,
);
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/20260907105556_garage_social_identity.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
async function as(id, guest = false) {
  await db.exec(
    `RESET ROLE; SET ROLE authenticated; SET request.uid='${id}'; SET request.anonymous='${guest}';`,
  );
}
async function rejected(sql) {
  await assert.rejects(db.exec(sql));
}
await as(a, true);
await rejected(
  `INSERT INTO public.garage_profiles(id,handle,display_name) VALUES('${a}','ana','Ana')`,
);
for (const [id, name] of [
  [a, "ana"],
  [b, "bruno"],
  [c, "cris"],
]) {
  await as(id);
  await db.exec(
    `INSERT INTO public.garage_profiles(id,handle,display_name) VALUES('${id}','${name}','${name}'); INSERT INTO public.garage_avatars VALUES('${id}',0,'{}');`,
  );
}
await as(a);
assert.equal(
  (await db.query("SELECT * FROM public.garage_avatars")).rows.length,
  1,
);
await rejected(
  `UPDATE public.garage_avatars SET user_id='${b}' WHERE user_id='${a}'`,
);
await db.exec(`UPDATE public.garage_avatars SET avatar=5 WHERE user_id='${b}'`);
await as(b);
assert.equal(
  (await db.query("SELECT avatar FROM public.garage_avatars")).rows[0].avatar,
  0,
);
await as(a);
await rejected(
  `INSERT INTO public.garage_friendships(requester,recipient) VALUES('${b}','${c}')`,
);
await db.exec(
  `INSERT INTO public.garage_friendships(requester,recipient) VALUES('${a}','${b}')`,
);
await db.exec(`UPDATE public.garage_friendships SET status='accepted'`);
assert.equal(
  (await db.query("SELECT status FROM public.garage_friendships")).rows[0]
    .status,
  "pending",
);
await as(c);
assert.equal(
  (await db.query("SELECT * FROM public.garage_friendships")).rows.length,
  0,
);
await as(b);
await rejected(
  `INSERT INTO public.garage_friendships(requester,recipient) VALUES('${b}','${a}')`,
);
await rejected(`UPDATE public.garage_friendships SET requester='${c}'`);
await db.exec(`UPDATE public.garage_friendships SET status='accepted'`);
assert.equal(
  (await db.query("SELECT status FROM public.garage_friendships")).rows[0]
    .status,
  "accepted",
);
await db.exec(
  `INSERT INTO public.garage_blocks(owner,target) VALUES('${b}','${a}')`,
);
assert.equal(
  (await db.query("SELECT * FROM public.garage_friendships")).rows.length,
  0,
);
await as(a);
assert.equal(
  (await db.query(`SELECT * FROM public.garage_profiles WHERE id='${b}'`)).rows
    .length,
  0,
);
await rejected(
  `INSERT INTO public.garage_friendships(requester,recipient) VALUES('${a}','${b}')`,
);
assert.equal(
  (await db.query("SELECT * FROM public.garage_blocks")).rows.length,
  0,
);
await as(b);
await db.exec(
  `DELETE FROM public.garage_blocks; UPDATE public.garage_profiles SET accepts_requests=false WHERE id='${b}'`,
);
assert.equal(
  (await db.query("SELECT * FROM public.garage_friendships")).rows.length,
  0,
);
await as(a);
await rejected(
  `INSERT INTO public.garage_friendships(requester,recipient) VALUES('${a}','${b}')`,
);
await rejected(
  `UPDATE public.garage_profiles SET handle='bruno' WHERE id='${a}'`,
);
await as(a, true);
assert.equal(
  (await db.query("SELECT * FROM public.garage_profiles")).rows.length,
  0,
);
assert.equal(
  (await db.query("SELECT * FROM public.garage_avatars")).rows.length,
  0,
);
await db.exec("RESET ROLE");
for (let i = 100; i <= 120; i++) {
  const uid = "00000000-0000-4000-8000-" + String(i).padStart(12, "0");
  await db.exec(
    `INSERT INTO auth.users VALUES ('${uid}'); INSERT INTO public.garage_profiles(id,handle,display_name) VALUES ('${uid}','test_${i}','Test');`,
  );
}
await as(a);
for (let i = 100; i < 120; i++) {
  const uid = "00000000-0000-4000-8000-" + String(i).padStart(12, "0");
  await db.exec(
    `INSERT INTO public.garage_friendships(requester,recipient) VALUES ('${a}','${uid}')`,
  );
}
await rejected(
  `INSERT INTO public.garage_friendships(requester,recipient) VALUES ('${a}','00000000-0000-4000-8000-000000000120')`,
);
await db.close();
console.log(
  "PASS real PostgreSQL RLS: guest denial, owner-only avatars, private relationships, recipient-only acceptance, immutable participants, duplicate prevention, blocking cleanup, request preferences and unique handles",
);
