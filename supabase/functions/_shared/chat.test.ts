import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ChatError, configuredWords, moderateText, parseChatInput, readChatBody, safeUsername } from './chat.ts'

test('preserves benign Portuguese; masks accents and invisible-character profanity', () => {
  assert.equal(moderateText('Olá, São Paulo!'), 'Olá, São Paulo!')
  for (const text of ['pórra', 'po\u200brra', 'ＰＯＲＲＡ']) assert.match(moderateText(text), /^.\*+$/)
  assert.throws(() => moderateText(''))
})
test('links do not pass normalization', () => {
  for (const text of ['https://example.com', 'www.example.net', 'example.technology', 'exámple.com', 'example\u200b.com', 'ｅｘａｍｐｌｅ．ｃｏｍ']) {
    assert.throws(() => moderateText(text), (e: unknown) => e instanceof ChatError && e.code === 'blocked_content')
  }
})
test('request shape and sizes fail closed', () => {
  for (const text of ['', ' ', 'x'.repeat(501)]) assert.throws(() => parseChatInput({ roomSlug: 'geral', text }))
  for (const type of ['system', null, 1]) assert.throws(() => parseChatInput({ roomSlug: 'geral', text: 'oi', type }))
  assert.throws(() => parseChatInput({ roomSlug: 'geral', text: 'oi', userId: 'forged' }))
  assert.deepEqual(parseChatInput({ roomSlug: 'geral', text: 'oi' }), { roomSlug: 'geral', text: 'oi', type: 'text' })
})
test('malformed config fails closed and cannot disable defaults', () => {
  assert.throws(() => configuredWords('invalid'))
  assert.throws(() => configuredWords([42]))
  assert.match(moderateText('porra', configuredWords([])), /\*/)
  assert.throws(() => moderateText('proibido aqui', configuredWords(['proibido aqui'])))
  assert.equal(safeUsername('https://bad.com'), 'Convidado')
})
test('stream byte limit and invalid JSON are enforced', async () => {
  const request = (body: string) => new Request('http://localhost', { method: 'POST', headers: { 'content-type': 'application/json' }, body })
  await assert.rejects(readChatBody(request('x'.repeat(4097))))
  await assert.rejects(readChatBody(request('{')))
  assert.deepEqual(await readChatBody(request('{"text":"olá"}')), { text: 'olá' })
})

test('server display names use configured words as well as defaults', () => {
  const words = configuredWords(['apelidoproibido', 'frase proibida'])
  assert.equal(safeUsername('ApelidoProibido', words), 'A**************')
  assert.equal(safeUsername('Frase Proibida', words), 'Convidado')
  assert.equal(safeUsername('porra', words), 'p****')
  assert.equal(safeUsername('João', words), 'João')
})
