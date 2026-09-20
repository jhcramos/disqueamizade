import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { track } from '@/services/analytics'
import { Send, Users, Shield, Copy } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { AgeGate } from '@/components/common/AgeVerificationModal'
import { useAuthStore } from '@/store/authStore'
import {
  communityAction,
  CommunityError,
  type CommunityRoom,
  type CommunityState,
} from '@/services/supabase/communityRooms'

export function CommunityRoomPage() {
  const { slug } = useParams(),
    userId = useAuthStore((s) => s.user?.id)
  return (
    <AgeGate>
      <CommunityRoom key={`${slug}:${userId}`} slug={slug || ''} />
    </AgeGate>
  )
}
function CommunityRoom({ slug }: { slug: string }) {
  const { user, profile, initialized, signInAsGuest } = useAuthStore()
  // Fragment stays out of HTTP requests, referrers and server access logs.
  const [invite] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get('convite') || '',
  )
  const [room, setRoom] = useState<CommunityRoom | null>(null),
    [state, setState] = useState<CommunityState | null>(null)
  const [nickname, setNickname] = useState(
      profile?.username?.slice(0, 24) || '',
    ),
    [adult, setAdult] = useState(false)
  const [text, setText] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('')
  const [link, setLink] = useState(''),
    [hidden, setHidden] = useState<string[]>([])
  const firstSent = useRef(false)
  const end = useRef<HTMLDivElement>(null),
    generation = useRef(0)
  useEffect(() => {
    if (!initialized) return
    let cancelled = false
    void (async () => {
      try {
        if (!user?.id) await signInAsGuest()
        const data = await communityAction<{ room: CommunityRoom }>('preview', {
          slug,
          invite,
        })
        if (!cancelled) setRoom(data.room)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      }
    })()
    return () => {
      cancelled = true
      ++generation.current
    }
  }, [slug, user?.id, initialized, signInAsGuest, invite])
  const joined = !!state
  useEffect(() => {
    if (!joined) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const data = await communityAction<CommunityState>('state', { slug })
        if (!cancelled) {
          setState(data)
          setError('')
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message)
          if (
            e instanceof CommunityError &&
            ['banned', 'forbidden', 'unauthorized', 'not_found'].includes(
              e.code,
            )
          )
            setState(null)
        }
      } finally {
        if (!cancelled) timer = setTimeout(poll, 3000)
      }
    }
    timer = setTimeout(poll, 3000)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [joined, slug])
  const lastMessage = state?.messages[state.messages.length - 1]?.id
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [lastMessage])
  async function join(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const version = generation.current
    try {
      const data = await communityAction<CommunityState>('join', {
        slug,
        invite,
        nickname,
        adultAcknowledged: adult,
      })
      if (version === generation.current) {
        track('room_joined', { experience: 'community' })
        setState(data)
        history.replaceState(history.state, '', location.pathname)
      }
    } catch (e) {
      if (version === generation.current) setError((e as Error).message)
    } finally {
      if (version === generation.current) setBusy(false)
    }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    setError('')
    const draft = text
    try {
      await communityAction('send', { slug, text: draft })
      if (!firstSent.current) {
        firstSent.current = true
        track('community_first_message')
      }
      setText((current) => (current === draft ? '' : current))
      setState(await communityAction<CommunityState>('state', { slug }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function action(name: string, input: Record<string, unknown> = {}) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (name === 'invite') {
        const data = await communityAction<{ invite: string }>('invite', {
          slug,
          ...input,
        })
        setLink(`${location.origin}/comunidade/${slug}#convite=${data.invite}`)
        setNotice(
          input.rotate
            ? 'Novo convite criado. O link anterior não permite novas entradas.'
            : 'Convite pronto. Qualquer pessoa com este link pode entrar.',
        )
      } else {
        await communityAction(name, { slug, ...input })
        setState(await communityAction<CommunityState>('state', { slug }))
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const manager = state?.role === 'owner' || state?.role === 'moderator'
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Header />
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <Link
          className="text-sm text-gray-300 underline"
          to="/rooms"
          onClick={() => {
            if (state) void communityAction('leave', { slug }).catch(() => {})
          }}
        >
          Voltar ao bate-papo
        </Link>
        {!room && !error && (
          <p role="status" className="py-10">
            Carregando sala…
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="my-4 rounded-lg bg-red-500/10 p-3 text-red-200"
          >
            {error}
          </p>
        )}
        {room && (
          <>
            <header className="my-5">
              <div className="text-xs uppercase tracking-wider text-primary-300">
                Sala da comunidade ·{' '}
                {room.access === 'invite' ? 'Por convite' : 'Pública'}
                {room.theme === 'adulto' ? ' · Adulta 18+' : ''}
              </div>
              <h1 className="mt-2 text-3xl font-bold">{room.name}</h1>
              <p className="mt-2 text-gray-300">{room.description}</p>
            </header>
            {!state ? (
              <form
                onSubmit={join}
                className="max-w-lg space-y-4 rounded-2xl border border-white/10 p-6"
              >
                <h2 className="text-xl font-bold">Entre na conversa</h2>
                <p className="whitespace-pre-wrap text-sm text-gray-300">
                  {room.rules || 'Respeite as pessoas e o tema da sala.'}
                </p>
                <label className="block">
                  Seu apelido
                  <input
                    className="input mt-2 w-full"
                    required
                    minLength={2}
                    maxLength={24}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </label>
                {room.theme === 'adulto' && (
                  <label className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={adult}
                      required
                      onChange={(e) => setAdult(e.target.checked)}
                    />
                    Sou maior de 18 anos e quero entrar nesta sala adulta.
                  </label>
                )}
                <button disabled={busy} className="btn-balada">
                  {busy ? 'Entrando…' : 'Entrar na sala'}
                </button>
                <p className="text-xs text-gray-400">
                  Nesta primeira versão, as salas da comunidade têm conversa por
                  texto.
                </p>
              </form>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <section
                  className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.02]"
                  aria-label="Conversa pública da sala"
                >
                  <div className="border-b border-white/10 p-4 text-sm font-semibold">
                    Conversa da sala · visível para todos os participantes
                  </div>
                  <div
                    className="h-[45vh] min-h-64 overflow-y-auto p-4"
                    role="log"
                    aria-live="polite"
                    aria-relevant="additions"
                  >
                    {state.messages.length === 0 && (
                      <p className="py-8 text-gray-300">
                        A conversa começa com um oi. Convide sua turma!
                      </p>
                    )}
                    {state.messages
                      .filter((m) => !hidden.includes(m.user_id))
                      .map((m) => (
                        <article key={m.id} className="mb-4">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm text-primary-300">
                              {m.nickname}
                            </strong>
                            <time className="text-xs text-gray-400">
                              {new Date(m.created_at).toLocaleTimeString(
                                'pt-BR',
                                { hour: '2-digit', minute: '2-digit' },
                              )}
                            </time>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                            {m.body}
                          </p>
                          {m.user_id !== user?.id && (
                            <button
                              className="mt-1 text-xs text-gray-400 underline"
                              onClick={async () => {
                                try {
                                  await communityAction('report', {
                                    slug,
                                    messageId: m.id,
                                  })
                                  setNotice('Denúncia enviada.')
                                } catch {
                                  setError(
                                    'Não foi possível enviar a denúncia.',
                                  )
                                }
                              }}
                            >
                              Denunciar à moderação da sala
                            </button>
                          )}
                        </article>
                      ))}
                    <div ref={end} />
                  </div>
                  <form
                    onSubmit={send}
                    className="border-t border-white/10 p-4"
                  >
                    <div className="mb-3 flex flex-wrap gap-2">
                      {[
                        'Oi, pessoal!',
                        'Qual é o assunto de hoje?',
                        'Primeira vez por aqui!',
                      ].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setText(s)}
                          className="rounded-full border border-white/20 px-3 py-2 text-xs"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <label className="sr-only" htmlFor="community-message">
                      Mensagem para a sala
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="community-message"
                        className="input min-w-0 flex-1"
                        maxLength={500}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Escreva para a sala…"
                      />
                      <button
                        aria-label="Enviar mensagem"
                        className="btn-balada"
                        disabled={busy || !text.trim()}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      {text.length}/500 · Os atalhos preenchem o texto; você
                      decide quando enviar.
                    </p>
                  </form>
                </section>
                <aside className="space-y-4">
                  {manager && state.reports.length > 0 && (
                    <section className="space-y-3 rounded-2xl border border-amber-400/30 p-4">
                      <h2 className="font-bold">Denúncias pendentes</h2>
                      {state.reports.map((r) => (
                        <div key={r.id} className="space-y-2 text-sm">
                          <strong>{r.nickname}</strong>
                          <p className="break-words">{r.body}</p>
                          <button
                            disabled={busy}
                            className="mr-3 text-red-300 underline"
                            onClick={() =>
                              void action('moderate', {
                                target: r.user_id,
                                operation: 'ban',
                              })
                            }
                          >
                            Bloquear autor
                          </button>
                          <button
                            disabled={busy}
                            className="underline"
                            onClick={() =>
                              void action('resolve-report', { reportId: r.id })
                            }
                          >
                            Marcar como revisada
                          </button>
                        </div>
                      ))}
                    </section>
                  )}
                  <section className="rounded-2xl border border-white/10 p-4">
                    <h2 className="mb-3 flex items-center gap-2 font-bold">
                      <Users size={18} />
                      Participantes
                    </h2>
                    {state.members.map((m) => (
                      <div
                        key={m.user_id}
                        className="border-b border-white/5 py-3"
                      >
                        <div className="text-sm">
                          {m.nickname}{' '}
                          {m.role !== 'member' && (
                            <span className="text-xs text-primary-300">
                              · {m.role === 'owner' ? 'dono' : 'moderador'}
                            </span>
                          )}
                          {m.banned && ' · bloqueado'}
                        </div>
                        {m.user_id !== user?.id && (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <button
                              className="underline"
                              onClick={() =>
                                setHidden((current) =>
                                  current.includes(m.user_id)
                                    ? current.filter((id) => id !== m.user_id)
                                    : [...current, m.user_id],
                                )
                              }
                            >
                              {hidden.includes(m.user_id)
                                ? 'Mostrar mensagens'
                                : 'Silenciar para mim'}
                            </button>
                            {manager &&
                              m.role !== 'owner' &&
                              (state.role === 'owner' ||
                                m.role === 'member') && (
                                <button
                                  disabled={busy}
                                  className="text-red-300 underline"
                                  onClick={() =>
                                    void action('moderate', {
                                      target: m.user_id,
                                      operation: m.banned ? 'unban' : 'ban',
                                    })
                                  }
                                >
                                  {m.banned
                                    ? 'Desbloquear'
                                    : 'Bloquear da sala'}
                                </button>
                              )}
                            {state.role === 'owner' &&
                              m.role !== 'owner' &&
                              !m.banned && (
                                <button
                                  disabled={busy}
                                  className="underline"
                                  onClick={() =>
                                    void action('moderate', {
                                      target: m.user_id,
                                      operation:
                                        m.role === 'moderator'
                                          ? 'demote'
                                          : 'promote',
                                    })
                                  }
                                >
                                  {m.role === 'moderator'
                                    ? 'Remover função'
                                    : 'Tornar moderador'}
                                </button>
                              )}
                          </div>
                        )}
                      </div>
                    ))}
                  </section>
                  <details className="rounded-2xl border border-white/10 p-4">
                    <summary className="cursor-pointer font-semibold">
                      Regras da sala
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-gray-300">
                      {room.rules || 'Respeite as pessoas e o tema.'}
                    </p>
                    <Link
                      className="mt-3 block text-xs underline"
                      to="/diretrizes"
                    >
                      Regras da plataforma
                    </Link>
                  </details>
                  {manager && (
                    <section className="space-y-3 rounded-2xl border border-white/10 p-4">
                      <h2 className="flex gap-2 font-semibold">
                        <Shield size={18} />
                        Administrar sala
                      </h2>
                      <button
                        disabled={busy}
                        className="btn-balada w-full"
                        onClick={() => void action('invite')}
                      >
                        Obter link de convite
                      </button>
                      <button
                        disabled={busy}
                        className="text-xs underline"
                        onClick={() => void action('invite', { rotate: true })}
                      >
                        Renovar link de convite
                      </button>
                      {link && (
                        <>
                          <input
                            aria-label="Link de convite"
                            className="input w-full text-xs"
                            value={link}
                            readOnly
                            onFocus={(e) => e.target.select()}
                          />
                          <button
                            className="flex gap-2 text-sm"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(link)
                                setNotice('Link copiado.')
                              } catch {
                                setNotice('Selecione e copie o link acima.')
                              }
                            }}
                          >
                            <Copy size={16} />
                            Copiar convite
                          </button>
                        </>
                      )}
                    </section>
                  )}
                </aside>
              </div>
            )}
          </>
        )}
        {notice && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-primary-500/10 p-3 text-sm"
          >
            {notice}
          </p>
        )}
      </main>
    </div>
  )
}
