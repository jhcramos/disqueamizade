import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function load(file, imports, globals = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    .replaceAll('import.meta.env', 'testEnv')
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  runInNewContext(code, { exports, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import ${name}`)
    return imports[name]
  }, setTimeout, clearTimeout, console, ...globals })
  return exports
}
const pause = () => new Promise(resolve => setTimeout(resolve, 0))
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
const row = { id: 'msg-1', room_slug: 'geral-brasil', user_id: 'server-id', username: 'Servidor', content: 'p****', type: 'text', created_at: '2026-09-04T00:00:00Z' }

function chatHarness() {
  const channels = [], calls = [], messages = []
  let result = { data: { message: row }, error: null }
  let removal = Promise.resolve('ok')
  const supabase = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'user-id' } } } }) },
    channel: (name, config) => {
      const channel = { name, config, handlers: [],
        on(event, filter, callback) { this.handlers.push({ event, filter, callback }); return this },
        subscribe(callback) { this.status = callback; return this },
        track: async () => {}, presenceState: () => ({}),
      }
      channels.push(channel); return channel
    },
    removeChannel: () => removal,
    functions: { invoke: async (name, options) => { calls.push({ name, options }); return result } },
    from: () => { const query = { select: () => query, eq: () => query, order: () => query, limit: async () => ({ data: [row] }) }; return query },
  }
  const { ChatConversation } = load('src/services/supabase/roomChat.ts', {
    './client': { supabase }, '@/services/moderation': { filterMessage: () => ({ ok: true }) },
  })
  const conversation = new ChatConversation()
  return { channels, calls, messages, conversation, create: () => new ChatConversation(),
    setResult: r => { result = r }, setRemoval: p => { removal = p },
    join: () => conversation.join('geral-brasil', 'user-id', 'Cliente', m => messages.push(m)),
  }
}

test('server result alone is displayed; realtime/history echoes are deduplicated', async () => {
  const h = chatHarness(); await h.join()
  assert.equal(h.channels[0].config.config.postgres_changes_options.wait, true)
  assert.equal(h.channels[0].handlers.some(x => x.event === 'broadcast'), false)
  await h.conversation.sendMessage('user-id', 'Nome adulterado', 'porra')
  assert.equal(h.messages.length, 1)
  assert.equal(h.messages[0].content, 'p****')
  assert.equal(h.messages[0].username, 'Servidor')
  assert.equal(JSON.stringify(h.calls[0].options.body), JSON.stringify({ roomSlug: 'geral-brasil', text: 'porra', type: 'text' }))
  h.channels[0].handlers[0].callback({ new: row }); h.channels[0].status('SUBSCRIBED'); await pause()
  assert.equal(h.messages.length, 1)
})
test('server denial has no optimistic message or direct/broadcast fallback', async () => {
  const h = chatHarness(); await h.join()
  h.setResult({ error: { context: { json: async () => ({ error: 'rate_limited' }) } } })
  await assert.rejects(h.conversation.sendMessage('user-id', 'Cliente', 'Olá'), /Aguarde/)
  assert.equal(h.messages.length, 0); assert.equal(h.calls.length, 1)
})
test('new conversation waits for old instance to leave shared topic; late rows ignored', async () => {
  const h = chatHarness(); await h.join()
  const closing = deferred(); h.setRemoval(closing.promise)
  h.conversation.leave()
  const second = h.create()
  const joining = second.join('geral-brasil', 'user-id', 'Novo apelido', () => {})
  await pause(); assert.equal(h.channels.length, 1)
  h.channels[0].handlers[0].callback({ new: row }); assert.equal(h.messages.length, 0)
  closing.resolve('ok'); await joining; assert.equal(h.channels.length, 2)
})
test('leave during pending join cannot recreate a channel', async () => {
  const h = chatHarness(); const joining = h.join(); h.conversation.leave(); await joining
  assert.equal(h.channels.length, 0)
})

function authHarness({ session = null, cached = null } = {}) {
  let state, authCallback, creates = 0, signouts = 0
  const storage = new Map(cached ? [['guest_session', JSON.stringify(cached)]] : [])
  const guest = { id: 'authenticated-uuid', is_anonymous: true, user_metadata: { username: cached?.profile?.username || 'Novo' } }
  const api = {
    getSession: async () => session,
    onAuthStateChange: callback => { authCallback = callback },
    signOut: async () => { ++signouts; session = null; authCallback?.('SIGNED_OUT', null) },
  }
  const { useAuthStore } = load('src/store/authStore.ts', {
    zustand: { create: initialize => { const get = () => state; const set = patch => { state = { ...state, ...patch } }; state = initialize(set, get); return { getState: get } } },
    '@/services/supabase/client': { supabase: { auth: {
      signInAnonymously: async () => { ++creates; await pause(); session = { user: guest }; authCallback?.('SIGNED_IN', session); return { data: { user: guest }, error: null } },
      updateUser: async ({ data }) => ({ data: { user: { ...guest, user_metadata: data } }, error: null }),
    } } },
    '@/services/supabase/auth.service': { authService: api },
    '@/services/supabase/database.service': { databaseService: { getProfile: async id => ({ id, username: 'Conta' }) } },
    '@/services/supabase/presence.service': { presenceService: { setOnlineStatus: async () => {} } },
  }, {
    testEnv: { VITE_SUPABASE_URL: 'https://example.invalid', VITE_SUPABASE_ANON_KEY: 'test-only' },
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    sessionStorage: { getItem: () => null, removeItem: () => {} },
  })
  return { store: useAuthStore, storage, counts: () => ({ creates, signouts }) }
}
test('legacy guest nickname migrates without trusting fabricated ID; simultaneous clicks create once', async () => {
  const h = authHarness({ cached: { user: { id: 'guest-forged' }, profile: { username: 'Apelido' }, ts: Date.now() } })
  await h.store.getState().initialize()
  assert.equal(h.store.getState().user, null)
  await Promise.all([h.store.getState().signInAsGuest(), h.store.getState().signInAsGuest()]); await pause()
  assert.equal(h.counts().creates, 1); assert.equal(h.store.getState().user.id, 'authenticated-uuid')
  assert.equal(h.store.getState().profile.username, 'Apelido')
  assert.equal(h.storage.get('guest_session').includes('guest-forged'), false)
  await h.store.getState().signOut(); await pause()
  assert.equal(h.counts().signouts, 1); assert.equal(h.store.getState().user, null)
})
test('real anonymous session restores as guest; registered account is not replaced by guest CTA', async () => {
  const h = authHarness({ session: { user: { id: 'existing', is_anonymous: true, user_metadata: { username: 'Persistente' } } } })
  await h.store.getState().initialize(); await h.store.getState().signInAsGuest()
  assert.equal(h.store.getState().isGuest, true); assert.equal(h.store.getState().user.id, 'existing'); assert.equal(h.counts().creates, 0)
  const registered = authHarness({ session: { user: { id: 'account', is_anonymous: false } } })
  await registered.store.getState().initialize(); await registered.store.getState().signInAsGuest()
  assert.equal(registered.store.getState().isGuest, false); assert.equal(registered.store.getState().user.id, 'account'); assert.equal(registered.counts().creates, 0)
})
