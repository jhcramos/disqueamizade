import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

// Execute the actual migration against PostgreSQL, with only legacy dependencies
// stubbed. This does not contact a Supabase project or write production data.
test('community room access, moderation, privacy and limits', async (t) => {
  const db = new PGlite()
  t.after(() => db.close())
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, is_anonymous boolean, email_confirmed_at timestamptz);
    CREATE TABLE public.user_bans(user_id uuid, expires_at timestamptz);
    GRANT USAGE ON SCHEMA auth,public TO service_role;
  `)
  await db.exec(
    await readFile(
      new URL(
        '../supabase/migrations/20260920124107_community_rooms.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  )
  const [owner, host2, guest, member, outsider, unverified] = Array.from(
    { length: 6 },
    (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  )
  for (const id of [owner, host2, guest, member, outsider, unverified]) {
    await db.query('INSERT INTO auth.users VALUES($1,$2,$3)', [
      id,
      id === guest,
      id === unverified || id === guest ? null : new Date(),
    ])
  }
  async function act(actor, action, input = {}) {
    await db.exec('SET ROLE service_role')
    try {
      return (
        await db.query(
          'SELECT public.community_action($1,$2,$3::jsonb) AS result',
          [actor, action, JSON.stringify(input)],
        )
      ).rows[0].result
    } finally {
      await db.exec('RESET ROLE')
    }
  }
  const create = {
    name: 'Clube de conversa',
    theme: 'amizade',
    access: 'public',
  }
  await t.test(
    'only verified accounts create; owner limit enforced in database',
    async () => {
      await assert.rejects(
        act(guest, 'create', create),
        /verified_account_required/,
      )
      await assert.rejects(
        act(unverified, 'create', create),
        /verified_account_required/,
      )
      await assert.rejects(act(null, 'list'), /unauthorized/)
    },
  )
  const room = (await act(owner, 'create', create)).room
  const slug = room.slug
  await t.test(
    'public discovery has no invite secrets and guest participation works',
    async () => {
      await assert.rejects(act(owner, 'create', create), /room_limit/)
      assert.equal('invite_token' in room, false)
      const catalog = await act(guest, 'list')
      assert.equal(catalog.rooms.length, 1)
      assert.equal(JSON.stringify(catalog).includes('invite_token'), false)
      await assert.rejects(act(guest, 'state', { slug }), /forbidden/)
      const state = await act(guest, 'join', { slug, nickname: 'Visitante' })
      assert.equal(state.role, 'member')
      assert.deepEqual(state.reports, [])
      await assert.rejects(act(guest, 'invite', { slug }), /forbidden/)
    },
  )
  const sent = (await act(guest, 'send', { slug, text: 'Olá, pessoal!' }))
    .message
  await t.test(
    'messages require membership, limits apply and reports reach managers only',
    async () => {
      await assert.rejects(
        act(outsider, 'send', { slug, text: 'Oi' }),
        /forbidden/,
      )
      await assert.rejects(
        act(guest, 'send', { slug, text: 'Mais uma' }),
        /rate_limited/,
      )
      await assert.rejects(
        act(guest, 'send', { slug, text: 'x'.repeat(501) }),
        /invalid_request/,
      )
      await act(member, 'join', { slug, nickname: 'Amigo' })
      await act(member, 'report', { slug, messageId: sent.id })
      await assert.rejects(
        act(member, 'report', { slug, messageId: sent.id }),
        /rate_limited/,
      )
      const state = await act(owner, 'state', { slug })
      assert.equal(state.reports.length, 1)
      assert.equal(state.reports[0].body, 'Olá, pessoal!')
      assert.equal('reporter_id' in state.reports[0], false)
      assert.deepEqual((await act(guest, 'state', { slug })).reports, [])
      await assert.rejects(
        act(member, 'resolve-report', { slug, reportId: state.reports[0].id }),
        /forbidden/,
      )
      await act(owner, 'resolve-report', {
        slug,
        reportId: state.reports[0].id,
      })
      assert.deepEqual((await act(owner, 'state', { slug })).reports, [])
    },
  )
  await t.test(
    'moderator privileges, owner protection and ban across all entry paths',
    async () => {
      await assert.rejects(
        act(member, 'moderate', { slug, target: guest, operation: 'ban' }),
        /forbidden/,
      )
      await act(owner, 'moderate', {
        slug,
        target: member,
        operation: 'promote',
      })
      await assert.rejects(
        act(member, 'moderate', { slug, target: owner, operation: 'ban' }),
        /forbidden/,
      )
      await assert.rejects(
        act(member, 'moderate', { slug, target: guest, operation: 'promote' }),
        /forbidden/,
      )
      await act(member, 'moderate', { slug, target: guest, operation: 'ban' })
      for (const action of ['preview', 'join', 'state', 'send'])
        await assert.rejects(
          act(guest, action, { slug, nickname: 'Novo nome', text: 'oi' }),
          /banned/,
        )
      await act(owner, 'moderate', { slug, target: guest, operation: 'unban' })
      await act(guest, 'join', { slug, nickname: 'Visitante' })
      await act(owner, 'moderate', {
        slug,
        target: member,
        operation: 'demote',
      })
      await assert.rejects(act(member, 'invite', { slug }), /forbidden/)
    },
  )
  let privateRoom
  await t.test(
    'adult acknowledgement and invitation are both required',
    async () => {
      const input = { ...create, access: 'invite', theme: 'adulto' }
      await assert.rejects(
        act(host2, 'create', input),
        /adult_confirmation_required/,
      )
      privateRoom = (
        await act(host2, 'create', { ...input, adultAcknowledged: true })
      ).room
      const slug = privateRoom.slug
      assert.equal(
        (await act(outsider, 'list')).rooms.some((r) => r.slug === slug),
        false,
      )
      await assert.rejects(
        act(outsider, 'preview', { slug }),
        /invite_required/,
      )
      await assert.rejects(
        act(outsider, 'join', {
          slug,
          nickname: 'Visitante',
          adultAcknowledged: true,
        }),
        /invite_required/,
      )
      const { invite } = await act(host2, 'invite', { slug })
      await assert.rejects(
        act(outsider, 'join', { slug, invite, nickname: 'Visitante' }),
        /adult_confirmation_required/,
      )
      await act(outsider, 'join', {
        slug,
        invite,
        nickname: 'Visitante',
        adultAcknowledged: true,
      })
      const rotated = await act(host2, 'invite', { slug, rotate: true })
      assert.notEqual(rotated.invite, invite)
      await assert.rejects(
        act(guest, 'join', {
          slug,
          invite,
          nickname: 'Visitante',
          adultAcknowledged: true,
        }),
        /invite_required/,
      )
      await act(outsider, 'state', { slug }) // Rotation revokes links, not accepted members.
      assert.equal(
        (await act(outsider, 'list')).rooms.some((r) => r.slug === slug),
        true,
      )
    },
  )
  await t.test(
    'presence expires; global bans apply even to room owners',
    async () => {
      await act(guest, 'leave', { slug })
      assert.equal(
        (await act(owner, 'state', { slug })).members.some(
          (m) => m.user_id === guest,
        ),
        false,
      )
      await db.query('INSERT INTO user_bans VALUES($1,NULL)', [owner])
      await assert.rejects(act(owner, 'state', { slug }), /banned/)
      await assert.rejects(act(owner, 'list'), /banned/)
    },
  )
  await t.test(
    'browser roles cannot bypass the Edge API or impersonate another user',
    async () => {
      for (const role of ['anon', 'authenticated']) {
        await db.exec(`SET ROLE ${role}`)
        try {
          await assert.rejects(
            db.query('SELECT community_action($1,$2,$3)', [
              host2,
              'invite',
              JSON.stringify({ slug: privateRoom.slug }),
            ]),
            /permission denied/,
          )
          for (const table of [
            'community_rooms',
            'community_messages',
            'community_members',
            'community_reports',
          ]) {
            await assert.rejects(
              db.query(`SELECT * FROM ${table}`),
              /permission denied/,
            )
          }
          await assert.rejects(
            db.query("UPDATE community_members SET role='owner'"),
            /permission denied/,
          )
        } finally {
          await db.exec('RESET ROLE')
        }
      }
    },
  )
})
