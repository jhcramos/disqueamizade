import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateVideoRoom } from './livekit.ts'
const a = '00000000-0000-0000-0000-000000000001'
const b = '00000000-0000-0000-0000-000000000002'
const c = '00000000-0000-0000-0000-000000000003'
test('video identity must match JWT owner and private pair membership', () => {
  assert.deepEqual(validateVideoRoom({ roomId: 'geral-brasil', participantName: a }, a), { roomId: 'geral-brasil', privateRoom: false })
  assert.throws(() => validateVideoRoom({ roomId: 'geral-brasil', participantName: b }, a), /forbidden/)
  assert.equal(validateVideoRoom({ roomId: `${a}-${b}`, participantName: a }, a).privateRoom, true)
  assert.throws(() => validateVideoRoom({ roomId: `${a}-${b}`, participantName: c }, c), /forbidden/)
  assert.throws(() => validateVideoRoom({ roomId: `${b}-${a}`, participantName: a }, a), /forbidden/)
})
