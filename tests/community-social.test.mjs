import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
test('community private conversations, invitations and media authorization', async (t) => {
  const db = new PGlite()
  t.after(() => db.close())
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean,email_confirmed_at timestamptz);
 CREATE TABLE public.user_bans(user_id uuid,expires_at timestamptz); GRANT USAGE ON SCHEMA auth,public TO service_role;`)
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
  const ids = Array.from(
      { length: 5 },
      (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    ),
    [owner, a, b, c, other] = ids
  for (const id of ids)
    await db.query('INSERT INTO auth.users VALUES($1,false,now())', [id])
  async function act(actor, action, input = {}) {
    await db.exec('SET ROLE service_role')
    try {
      return (
        await db.query('SELECT community_action($1,$2,$3::jsonb) AS result', [
          actor,
          action,
          JSON.stringify(input),
        ])
      ).rows[0].result
    } finally {
      await db.exec('RESET ROLE')
    }
  }
  const room = (
      await act(owner, 'create', {
        name: 'Teste de sala',
        theme: 'amizade',
        access: 'public',
      })
    ).room,
    slug = room.slug
  const second = (
    await act(other, 'create', {
      name: 'Outra sala',
      theme: 'adulto',
      adultAcknowledged: true,
      access: 'invite',
    })
  ).room
  for (const id of [a, b, c])
    await act(id, 'join', { slug, nickname: 'Pessoa ' + ids.indexOf(id) })
  let dm, video
  await t.test(
    'direct messages never enter public history or another participant inbox',
    async () => {
      dm = (await act(a, 'contact', { slug, target: b, kind: 'direct' })).thread
      await act(a, 'private-send', {
        slug,
        threadId: dm.id,
        text: 'Mensagem privada',
      })
      assert.equal(
        (await act(b, 'private-state', { slug, threadId: dm.id })).messages[0]
          .body,
        'Mensagem privada',
      )
      assert.deepEqual((await act(c, 'state', { slug })).threads, [])
      assert.equal(
        JSON.stringify(await act(owner, 'state', { slug })).includes(
          'Mensagem privada',
        ),
        false,
      )
      for (const id of [owner, c, other])
        await assert.rejects(
          act(id, 'private-state', { slug, threadId: dm.id }),
          /forbidden/,
        )
      await assert.rejects(
        act(b, 'private-send', {
          slug: second.slug,
          threadId: dm.id,
          text: 'Vazamento',
        }),
        /forbidden/,
      )
      await assert.rejects(
        act(a, 'private-send', { slug, threadId: dm.id, text: 'Spam' }),
        /rate_limited/,
      )
    },
  )
  await t.test(
    'only recipient can accept, and video tokens need accepted video invitation',
    async () => {
      video = (await act(a, 'contact', { slug, target: b, kind: 'video' }))
        .thread
      for (const id of [a, b, c])
        await assert.rejects(
          act(id, 'video-authorize', { slug, threadId: video.id }),
          /forbidden/,
        )
      await assert.rejects(
        act(a, 'respond', { slug, threadId: video.id, response: 'accept' }),
        /forbidden/,
      )
      await assert.rejects(
        act(c, 'respond', { slug, threadId: video.id, response: 'accept' }),
        /forbidden/,
      )
      await act(b, 'respond', { slug, threadId: video.id, response: 'accept' })
      const grant = await act(a, 'video-authorize', {
        slug,
        threadId: video.id,
      })
      assert.equal(grant.room, 'community-private-' + video.id)
      assert.equal(
        (await act(b, 'video-authorize', { slug, threadId: video.id })).room,
        grant.room,
      )
      await assert.rejects(
        act(c, 'video-authorize', { slug, threadId: video.id }),
        /forbidden/,
      )
      await assert.rejects(
        act(a, 'video-authorize', { slug, threadId: dm.id }),
        /forbidden/,
      )
      await assert.rejects(act(other, 'video-authorize', { slug }), /forbidden/)
    },
  )
  await t.test(
    'only a recipient can submit a private message for moderation',
    async () => {
      const message = (await act(b, 'private-state', { slug, threadId: dm.id }))
        .messages[0]
      await assert.rejects(
        act(c, 'report', { slug, threadId: dm.id, messageId: message.id }),
        /forbidden/,
      )
      await act(b, 'report', { slug, threadId: dm.id, messageId: message.id })
      const reports = (await act(owner, 'state', { slug })).reports
      assert.equal(reports.length, 1)
      assert.equal(reports[0].body, 'Mensagem privada')
      assert.deepEqual((await act(c, 'state', { slug })).reports, [])
      await act(owner, 'resolve-report', { slug, reportId: reports[0].id })
      assert.deepEqual((await act(owner, 'state', { slug })).reports, [])
    },
  )
  await t.test(
    'blocking cancels accepted calls and prevents either direction of contact',
    async () => {
      await act(b, 'block', { slug, target: a, enabled: true })
      for (const id of [a, b])
        for (const action of [
          'private-state',
          'private-send',
          'video-authorize',
        ])
          await assert.rejects(
            act(id, action, { slug, threadId: video.id, text: 'oi' }),
            /forbidden/,
          )
      for (const [actor, target] of [
        [a, b],
        [b, a],
      ])
        await assert.rejects(
          act(actor, 'contact', { slug, target, kind: 'direct' }),
          /forbidden/,
        )
      assert.equal((await act(a, 'state', { slug })).threads.length, 0)
      await act(b, 'block', { slug, target: a, enabled: false })
      await assert.rejects(
        act(a, 'video-authorize', { slug, threadId: video.id }),
        /forbidden/,
      )
    },
  )
  await t.test(
    'expired and declined invitations cannot be accepted or used',
    async () => {
      const expired = (
        await act(b, 'contact', { slug, target: c, kind: 'video' })
      ).thread
      await db.query(
        "UPDATE community_threads SET expires_at=now()-interval '1 second' WHERE id=$1",
        [expired.id],
      )
      await assert.rejects(
        act(c, 'respond', { slug, threadId: expired.id, response: 'accept' }),
        /expired/,
      )
      const declined = (
        await act(c, 'contact', { slug, target: a, kind: 'reserved' })
      ).thread
      await act(a, 'respond', {
        slug,
        threadId: declined.id,
        response: 'decline',
      })
      await assert.rejects(
        act(a, 'respond', { slug, threadId: declined.id, response: 'accept' }),
        /forbidden/,
      )
      await assert.rejects(
        act(c, 'private-send', { slug, threadId: declined.id, text: 'Oi' }),
        /forbidden/,
      )
    },
  )
  await t.test(
    'public replies stay within room; favorites are per person',
    async () => {
      const msg = (await act(a, 'send', { slug, text: 'Olá sala' })).message
      await act(b, 'send', { slug, text: 'Olá de volta', replyTo: msg.id })
      const state = await act(c, 'state', { slug })
      assert.equal(state.messages[1].reply.body, 'Olá sala')
      await assert.rejects(
        act(c, 'send', {
          slug,
          text: 'Fake reply',
          replyTo: '00000000-0000-4000-8000-999999999999',
        }),
        /invalid_request/,
      )
      await act(a, 'favorite', { slug, enabled: true })
      assert.equal((await act(a, 'state', { slug })).favorite, true)
      assert.equal((await act(b, 'state', { slug })).favorite, false)
      assert.deepEqual((await act(a, 'list')).favorites, [room.id])
    },
  )
  await t.test(
    'ban closes existing calls and removes future media authorization',
    async () => {
      const call = (await act(c, 'contact', { slug, target: b, kind: 'video' }))
        .thread
      await act(b, 'respond', { slug, threadId: call.id, response: 'accept' })
      await act(owner, 'moderate', { slug, target: b, operation: 'ban' })
      assert.equal(
        (
          await db.query('SELECT status FROM community_threads WHERE id=$1', [
            call.id,
          ])
        ).rows[0].status,
        'ended',
      )
      await assert.rejects(
        act(c, 'video-authorize', { slug, threadId: call.id }),
        /forbidden/,
      )
      await assert.rejects(act(b, 'video-authorize', { slug }), /banned/)
    },
  )
  await t.test(
    'official rooms reuse active free records and preserve identifiers',
    async () => {
      await db.exec(`CREATE TABLE rooms(id uuid PRIMARY KEY,slug text,name text,description text,type text,is_active boolean,ficha_cost integer,owner_id uuid);
      CREATE TABLE profiles(id uuid PRIMARY KEY,username text,is_admin boolean);`)
      await db.query('INSERT INTO profiles VALUES($1,$2,true)', [
        owner,
        'Moderação',
      ])
      const publicId = '00000000-0000-4000-8000-999999999999'
      await db.query(
        "INSERT INTO rooms VALUES($1,'geral-brasil','Geral Brasil','','publica',true,0,null)",
        [publicId],
      )
      await db.exec(
        await readFile(
          new URL(
            '../supabase/migrations/20260920141813_community_official_rooms.sql',
            import.meta.url,
          ),
          'utf8',
        ),
      )
      assert.equal(
        (await act(a, 'preview', { slug: publicId })).room.slug,
        'geral-brasil',
      )
      assert.equal(
        (
          await act(owner, 'join', {
            slug: 'geral-brasil',
            nickname: 'Moderação',
          })
        ).role,
        'moderator',
      )
      assert.equal(
        (await act(a, 'join', { slug: publicId, nickname: 'Visitante' })).role,
        'member',
      )
      assert.equal(
        (await db.query('SELECT count(*) FROM rooms')).rows[0].count,
        1,
      )
    },
  )
  await t.test(
    'browser roles cannot read private tables or impersonate actors through RPC',
    async () => {
      for (const role of ['anon', 'authenticated']) {
        await db.exec('SET ROLE ' + role)
        try {
          for (const table of [
            'community_threads',
            'community_private_messages',
            'community_blocks',
            'community_favorites',
          ])
            await assert.rejects(
              db.query('SELECT * FROM ' + table),
              /permission denied/,
            )
          for (const fn of ['community_action', 'community_base_action'])
            await assert.rejects(
              db.query('SELECT ' + fn + '($1,$2,$3)', [
                a,
                'state',
                JSON.stringify({ slug }),
              ]),
              /permission denied/,
            )
        } finally {
          await db.exec('RESET ROLE')
        }
      }
    },
  )
})
