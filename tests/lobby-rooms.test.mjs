import test from 'node:test'
import assert from 'node:assert/strict'
import { lobbyRooms } from '../src/rooms/lobbyRooms.ts'

test('low occupancy exposes the general room and the designated adult lounge only', () => {
  const main = { _slug: 'geral-brasil', online_count: 0 }
  const adult = { _slug: 'adult-lounge', online_count: 0 }
  assert.deepEqual(lobbyRooms([{ _slug: 'adult-other', online_count: 20 }, adult, main, { _slug: 'musica' }]), [main, adult])
})
test('a missing general lobby never falls back to an unrelated adult room', () => {
  const general = { _slug: 'papo-livre', online_count: 1 }
  assert.deepEqual(lobbyRooms([{ _slug: 'adult-other', online_count: 20 }, general]), [general])
})
test('empty and adult-only lists do not duplicate rooms', () => {
  assert.deepEqual(lobbyRooms([]), [])
  const adult = { _slug: 'adult-lounge' }
  assert.deepEqual(lobbyRooms([adult]), [adult])
})
test('home page room objects can use their database slug', () => {
  const main = { slug: 'geral-brasil' }
  const adult = { slug: 'adult-lounge' }
  assert.deepEqual(lobbyRooms([{ slug: 'roleta-chat' }, main, { slug: 'paquera-hetero' }, adult]), [main, adult])
})
