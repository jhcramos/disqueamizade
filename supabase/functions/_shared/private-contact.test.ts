import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_CONTACT_PREFERENCES,
  parsePrivateContactInput,
  privateRoomId,
  privateRoomMembers,
  acceptedModeForPair,
  validateAcceptedCall,
} from './private-contact.ts'

const a = '00000000-0000-4000-8000-000000000001'
const b = '00000000-0000-4000-8000-000000000002'

test('private contact defaults to message only and validates each action', () => {
  assert.deepEqual(DEFAULT_CONTACT_PREFERENCES, { message: true, audio: false, video: false })
  assert.deepEqual(parsePrivateContactInput({ action: 'set_preferences', roomSlug: 'geral-brasil', preferences: { message: true, audio: true, video: false } }), {
    action: 'set_preferences', roomSlug: 'geral-brasil', preferences: { message: true, audio: true, video: false },
  })
  assert.deepEqual(parsePrivateContactInput({ action: 'invite', roomSlug: 'geral-brasil', toUser: b, mode: 'video' }), {
    action: 'invite', roomSlug: 'geral-brasil', toUser: b, mode: 'video',
  })
  assert.deepEqual(parsePrivateContactInput({ action: 'respond', inviteId: a, response: 'accept' }), {
    action: 'respond', inviteId: a, response: 'accept',
  })
  assert.deepEqual(parsePrivateContactInput({ action: 'end', inviteId: a }), { action: 'end', inviteId: a })
  assert.throws(() => parsePrivateContactInput({ action: 'invite', roomSlug: 'geral-brasil', toUser: b, mode: 'screen' }))
  assert.throws(() => parsePrivateContactInput({ action: 'invite', roomSlug: 'geral-brasil', toUser: b, mode: 'audio', fromUser: a }))
})

test('private rooms use a stable ordered pair', () => {
  assert.equal(privateRoomId(a, b), `${a}-${b}`)
  assert.equal(privateRoomId(b, a), `${a}-${b}`)
  assert.deepEqual(privateRoomMembers(`${a}-${b}`), [a, b])
  assert.equal(privateRoomMembers(`${b}-${a}`), null)
  assert.equal(privateRoomMembers('geral-brasil'), null)
  assert.throws(() => privateRoomId(a, a))
})

test('accepted mode is limited to the current pair and requested media', () => {
  const invites = [
    { from_user: a, to_user: b, mode: 'message', status: 'accepted', expires_at: '2026-09-07T00:30:00Z' },
    { from_user: b, to_user: a, mode: 'audio', status: 'accepted', expires_at: '2026-09-07T00:30:00Z' },
  ]
  const now = new Date('2026-09-07T00:00:00Z')
  assert.equal(acceptedModeForPair(invites, [a, b], ['audio', 'video'], now), 'audio')
  assert.equal(acceptedModeForPair(invites, [a, b], ['message'], now), 'message')
  assert.equal(acceptedModeForPair(invites.map(invite => ({ ...invite, status: 'ended' })), [a, b], ['audio'], now), null)
})

test('private call authorization requires a current accepted audio or video invite', () => {
  const now = new Date('2026-09-07T00:00:00Z')
  const invite = { from_user: a, to_user: b, mode: 'video', status: 'accepted', expires_at: '2026-09-07T00:30:00Z' }
  assert.equal(validateAcceptedCall(invite, a, `${a}-${b}`, now), true)
  assert.equal(validateAcceptedCall({ ...invite, mode: 'message' }, a, `${a}-${b}`, now), false)
  assert.equal(validateAcceptedCall({ ...invite, status: 'pending' }, b, `${a}-${b}`, now), false)
  assert.equal(validateAcceptedCall({ ...invite, expires_at: '2026-09-06T23:59:59Z' }, b, `${a}-${b}`, now), false)
  assert.equal(validateAcceptedCall(invite, '00000000-0000-4000-8000-000000000003', `${a}-${b}`, now), false)
})
