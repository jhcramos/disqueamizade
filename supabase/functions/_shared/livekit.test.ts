import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateVideoRoom } from './livekit.ts'
const a = '00000000-0000-4000-8000-000000000001'
const b = '00000000-0000-4000-8000-000000000002'
const c = '00000000-0000-4000-8000-000000000003'
const inviteId = '00000000-0000-4000-8000-000000000004'
test('video identity must match JWT owner and private pair membership', () => {
  assert.deepEqual(validateVideoRoom({ roomId: 'geral-brasil', participantName: a }, a), { roomId: 'geral-brasil', privateRoom: false, inviteId: null })
  assert.throws(() => validateVideoRoom({ roomId: 'geral-brasil', participantName: b }, a), /forbidden/)
  assert.deepEqual(validateVideoRoom({ roomId: `${a}-${b}`, participantName: a, inviteId }, a), { roomId: `${a}-${b}`, privateRoom: true, inviteId })
  assert.throws(() => validateVideoRoom({ roomId: `${a}-${b}`, participantName: a }, a), /invalid_request/)
  assert.throws(() => validateVideoRoom({ roomId: `${a}-${b}`, participantName: c }, c), /forbidden/)
  assert.throws(() => validateVideoRoom({ roomId: `${b}-${a}`, participantName: a }, a), /forbidden/)
})
