import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('room exposes Chat and Na sala with explicit contact preferences', async () => {
  const room = await readFile(new URL('../src/rooms/RoomPage.tsx', import.meta.url), 'utf8')
  const people = await readFile(new URL('../src/rooms/PeoplePanel.tsx', import.meta.url), 'utf8')
  assert.match(room, />Chat</)
  assert.match(room, />Na sala\s/)
  assert.match(people, /Como podem falar comigo hoje\?/)
  assert.match(people, /Mensagem/)
  assert.match(people, /Áudio/)
  assert.match(people, /Vídeo/)
  assert.match(people, /cameraLiveIds\.has/)
  assert.match(people, /disabled=.*busy/)
})

test('incoming invite requires an explicit accept or decline action', async () => {
  const prompt = await readFile(new URL('../src/rooms/PrivateInvitePrompt.tsx', import.meta.url), 'utf8')
  assert.match(prompt, /Aceitar/)
  assert.match(prompt, /Agora não/)
  assert.match(prompt, /onAccept/)
  assert.match(prompt, /onDecline/)
})
