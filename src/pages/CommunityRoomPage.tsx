import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Camera,
  Copy,
  Heart,
  MessageCircle,
  Send,
  Shield,
  Users,
  X,
} from 'lucide-react'
import { AgeGate } from '@/components/common/AgeVerificationModal'
import { useAuthStore } from '@/store/authStore'
import { track } from '@/services/analytics'
import {
  communityAction,
  CommunityError,
  type CommunityRoom,
  type CommunityState,
  type CommunityMessage,
  type CommunityMember,
  type CommunityThread,
} from '@/services/supabase/communityRooms'
import '@/components/rooms/community.css'
const CommunityVideo = lazy(() => import('@/components/rooms/CommunityVideo'))
const initials = (name: string) => name.slice(0, 2).toLocaleUpperCase('pt-BR')
const kindLabel = (kind: CommunityThread['kind']) =>
  kind === 'video'
    ? 'Vídeo reservado'
    : kind === 'reserved'
      ? 'Sala reservada'
      : 'Conversa reservada'

export function CommunityRoomPage() {
  const { slug: routeSlug, roomId } = useParams(),
    slug = routeSlug || roomId || '',
    userId = useAuthStore((s) => s.user?.id)
  return (
    <AgeGate>
      <CommunityRoomView key={`${slug}:${userId}`} slug={slug} />
    </AgeGate>
  )
}
function CommunityRoomView({ slug }: { slug: string }) {
  const { user, profile, initialized, signInAsGuest } = useAuthStore()
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
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false)
  const [active, setActive] = useState(''),
    [privateMessages, setPrivateMessages] = useState<CommunityMessage[]>([]),
    [reply, setReply] = useState<CommunityMessage | null>(null)
  const [person, setPerson] = useState<CommunityMember | null>(null),
    [inbox, setInbox] = useState(false),
    [drawer, setDrawer] = useState(false),
    [inviteLink, setInviteLink] = useState('')
  const dialog = useRef<HTMLDialogElement>(null),
    end = useRef<HTMLDivElement>(null),
    firstSent = useRef(false),
    activeRef = useRef(active)
  activeRef.current = active
  const current = state?.threads?.find(
    (t) => t.id === active && t.status === 'accepted',
  )
  const pending = state?.threads?.filter((t) => t.status === 'pending') || []
  const received = pending.filter((t) => t.recipient === user?.id)
  const conversations =
    state?.threads?.filter((t) => t.status === 'accepted') || []
  const manager = state?.role === 'owner' || state?.role === 'moderator'
  const messages = active ? privateMessages : state?.messages || []
  const joined = !!state
  useEffect(() => {
    let cancelled = false
    if (!initialized) return
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
    }
  }, [slug, invite, initialized, user?.id, signInAsGuest])
  useEffect(() => {
    if (!joined) return
    let cancelled = false,
      timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const data = await communityAction<CommunityState>('state', { slug })
        if (cancelled) return
        setState(data)
        const id = activeRef.current
        if (id) {
          if (
            data.threads.some((t) => t.id === id && t.status === 'accepted')
          ) {
            const result = await communityAction<{
              messages: CommunityMessage[]
            }>('private-state', { slug, threadId: id })
            if (!cancelled && activeRef.current === id)
              setPrivateMessages(result.messages)
          } else {
            setActive('')
            setPrivateMessages([])
            setNotice('A conversa reservada foi encerrada.')
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message)
          if (
            e instanceof CommunityError &&
            ['banned', 'unauthorized', 'not_found'].includes(e.code)
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
  useEffect(() => {
    if (person || inbox) dialog.current?.showModal()
    else dialog.current?.close()
  }, [person, inbox])
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [messages[messages.length - 1]?.id, active])
  async function refresh() {
    setState(await communityAction<CommunityState>('state', { slug }))
  }
  async function run(fn: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function action(name: string, input: Record<string, unknown> = {}) {
    await communityAction(name, { slug, ...input })
    await refresh()
  }
  function close() {
    setPerson(null)
    setInbox(false)
  }
  async function openThread(t: CommunityThread) {
    setText('')
    setReply(null)
    setPrivateMessages([])
    setActive(t.id)
    close()
    const result = await communityAction<{ messages: CommunityMessage[] }>(
      'private-state',
      { slug, threadId: t.id },
    )
    if (activeRef.current === t.id) setPrivateMessages(result.messages)
  }
  async function contact(target: string, kind: CommunityThread['kind']) {
    const result = await communityAction<{ thread: CommunityThread }>(
      'contact',
      { slug, target, kind },
    )
    await refresh()
    close()
    if (result.thread.status === 'accepted') await openThread(result.thread)
    else {
      setInbox(true)
      setNotice('Convite enviado. Aguarde a outra pessoa aceitar.')
    }
  }
  async function respond(t: CommunityThread, response: string) {
    await action('respond', { threadId: t.id, response })
    if (response === 'accept') await openThread(t)
    if (response === 'end' && active === t.id) {
      setActive('')
      setPrivateMessages([])
    }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault()
    const draft = text.trim()
    if (!draft) return
    await run(async () => {
      const target = active
      await communityAction(target ? 'private-send' : 'send', {
        slug,
        text: draft,
        threadId: target || undefined,
        replyTo: !target ? reply?.id : undefined,
      })
      setText('')
      setReply(null)
      if (!firstSent.current) {
        firstSent.current = true
        track('community_first_message')
      }
      if (target) {
        const result = await communityAction<{ messages: CommunityMessage[] }>(
          'private-state',
          { slug, threadId: target },
        )
        if (activeRef.current === target) setPrivateMessages(result.messages)
      } else await refresh()
    })
  }
  async function getInvite(rotate = false) {
    const data = await communityAction<{ invite: string }>('invite', {
      slug,
      rotate,
    })
    setInviteLink(
      `${location.origin}/comunidade/${slug}#convite=${data.invite}`,
    )
  }
  function publicTab() {
    setActive('')
    setPrivateMessages([])
    setText('')
    setReply(null)
  }
  const memberName =
    state?.members.find((m) => m.user_id === user?.id)?.nickname || nickname
  return (
    <div id="salon">
      <div className="s-shell">
        <nav className="s-left" aria-label="Navegação do bate-papo">
          <Link to="/rooms" className="s-brand">
            <img src="/brand/mark.svg" alt="" />
            <span>
              disque
              <br />
              amizade<small>BATE-PAPO</small>
            </span>
          </Link>
          <Link to="/rooms" className="s-back">
            ← Encontrar outras salas
          </Link>
          <p className="s-label">SUA SALA</p>
          <button
            className={'s-room ' + (!active ? 'active' : '')}
            onClick={publicTab}
          >
            <i>
              <MessageCircle size={17} />
            </i>
            <span>
              {room?.name || 'Carregando…'}
              <small>Conversa pública</small>
            </span>
          </button>
          <div className="s-private-list">
            <p className="s-label">SÓ ENTRE VOCÊS</p>
            {conversations.length === 0 && (
              <p className="community-subtle">
                Escolha alguém na lista para falar reservadamente.
              </p>
            )}
            {conversations.map((t) => (
              <button
                key={t.id}
                className={'s-room ' + (active === t.id ? 'active' : '')}
                onClick={() => void run(() => openThread(t))}
              >
                <span className="s-avatar">{initials(t.nickname)}</span>
                <span>
                  {t.nickname}
                  <small>{kindLabel(t.kind)}</small>
                </span>
              </button>
            ))}
          </div>
          <button className="s-inbox" onClick={() => setInbox(true)}>
            Convites <span className="s-count">{pending.length}</span>
          </button>
          <div className="s-own">
            <span className="s-avatar lime">
              {initials(memberName || 'Eu')}
            </span>
            <span>
              {memberName || 'Você'}
              <small>
                <Link to="/garagem">Explorar a Casa ↗</Link>
              </small>
            </span>
          </div>
        </nav>
        <main className="s-center">
          <header className="s-head">
            <div className="s-title">
              <Link to="/rooms" aria-label="Voltar às salas">
                <ArrowLeft size={19} />
              </Link>
              <div className="s-room-symbol">#</div>
              <div>
                <h1>{room?.name || 'Sua próxima conversa'}</h1>
                <p>
                  {room?.theme === 'adulto' ? 'ÁREA ADULTA 18+ · ' : ''}
                  {state
                    ? `${state.members.filter((m) => !m.banned).length} na sala`
                    : 'Entre com seu apelido'}{' '}
                  · {room?.access === 'invite' ? 'Por convite' : 'Pública'}
                </p>
              </div>
            </div>
            <div className="s-head-actions">
              {state && (
                <>
                  <button
                    className="s-iconbtn"
                    aria-label="Favoritar sala"
                    aria-pressed={state.favorite}
                    onClick={() =>
                      void run(() =>
                        action('favorite', { enabled: !state.favorite }),
                      )
                    }
                  >
                    <Heart
                      size={18}
                      fill={state.favorite ? 'currentColor' : 'none'}
                    />
                  </button>
                  <button
                    className="s-iconbtn"
                    aria-label={`Convites: ${received.length}`}
                    onClick={() => setInbox(true)}
                  >
                    <Bell size={18} />
                    {received.length > 0 && <sup>{received.length}</sup>}
                  </button>
                  <button
                    className="s-iconbtn"
                    aria-label="Participantes e regras"
                    onClick={() => setDrawer(true)}
                  >
                    <Users size={18} />
                  </button>
                </>
              )}
            </div>
          </header>
          {error && (
            <div className="community-error" role="alert">
              {error}
              <button aria-label="Fechar aviso" onClick={() => setError('')}>
                <X size={14} />
              </button>
            </div>
          )}
          {notice && (
            <div className="community-notice" role="status">
              {notice}
              <button aria-label="Fechar aviso" onClick={() => setNotice('')}>
                <X size={14} />
              </button>
            </div>
          )}
          {!state ? (
            <div className="community-entry">
              <p className="community-eyebrow">TEM GENTE PARA CONHECER.</p>
              <h2>
                O próximo oi
                <br />
                pode mudar seu dia.
              </h2>
              <p>{room?.description}</p>
              {room && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void run(async () => {
                      setState(
                        await communityAction<CommunityState>('join', {
                          slug,
                          invite,
                          nickname,
                          adultAcknowledged: adult,
                        }),
                      )
                      track('room_joined', { experience: 'community' })
                      history.replaceState(history.state, '', location.pathname)
                    })
                  }}
                >
                  <label>
                    Como quer ser chamado?
                    <input
                      required
                      minLength={2}
                      maxLength={24}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Seu apelido"
                    />
                  </label>
                  <p>
                    {room.rules ||
                      'Respeite as pessoas, o tema e os limites de cada um.'}
                  </p>
                  {room.theme === 'adulto' && (
                    <label className="community-check">
                      <input
                        type="checkbox"
                        required
                        checked={adult}
                        onChange={(e) => setAdult(e.target.checked)}
                      />
                      Sou maior de 18 anos e quero entrar nesta sala adulta.
                    </label>
                  )}
                  <button className="primary" disabled={busy}>
                    {busy ? 'Entrando…' : 'Entrar na conversa →'}
                  </button>
                  <small>Câmera e microfone desligados na entrada.</small>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="s-tabs" role="tablist" aria-label="Conversas">
                <button
                  role="tab"
                  aria-selected={!active}
                  className={!active ? 'active' : ''}
                  onClick={publicTab}
                >
                  # Todos
                </button>
                {conversations.map((t) => (
                  <button
                    role="tab"
                    aria-selected={active === t.id}
                    className={active === t.id ? 'active' : ''}
                    key={t.id}
                    onClick={() => void run(() => openThread(t))}
                  >
                    {t.kind === 'video' ? (
                      <Camera size={14} />
                    ) : (
                      <Shield size={14} />
                    )}{' '}
                    {t.nickname}
                  </button>
                ))}
              </div>
              {(!active || current?.kind === 'video') && (
                <Suspense fallback={<p>Carregando câmeras…</p>}>
                  <CommunityVideo
                    key={active || 'public'}
                    slug={slug}
                    threadId={active || undefined}
                    blocked={state.blocked || []}
                  />
                </Suspense>
              )}
              {received.length > 0 && (
                <div className="s-incoming">
                  <span className="s-avatar coral">
                    <Camera size={18} />
                  </span>
                  <div>
                    <strong>{received[0].nickname} convidou você</strong>
                    <p>
                      {kindLabel(received[0].kind)} · Sua câmera só liga quando
                      você decidir.
                    </p>
                  </div>
                  <div className="s-invite-actions">
                    <button
                      disabled={busy}
                      onClick={() =>
                        void run(() => respond(received[0], 'decline'))
                      }
                    >
                      Agora não
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void run(() => respond(received[0], 'accept'))
                      }
                    >
                      Aceitar
                    </button>
                  </div>
                </div>
              )}
              {current && (
                <div className="community-private-label">
                  <Shield size={14} /> {kindLabel(current.kind)} · só vocês dois
                  <button
                    disabled={busy}
                    onClick={() => void run(() => respond(current, 'end'))}
                  >
                    Encerrar
                  </button>
                </div>
              )}
              <div
                className="s-stream"
                role="log"
                aria-label={
                  active ? 'Mensagens reservadas' : 'Mensagens públicas'
                }
                aria-live="polite"
                aria-relevant="additions"
              >
                {messages.length === 0 && (
                  <div className="s-empty">
                    <span className="s-avatar lime">
                      <MessageCircle />
                    </span>
                    <strong>
                      {active
                        ? 'Um papo só de vocês.'
                        : 'Toda amizade começa com um oi.'}
                    </strong>
                    <p>
                      {active
                        ? 'As mensagens desta conversa não aparecem na sala pública.'
                        : 'Puxe um assunto ou convide sua turma para chegar junto.'}
                    </p>
                  </div>
                )}
                {messages.map((m) => (
                  <article
                    className={
                      's-message ' + (m.user_id === user?.id ? 'own' : '')
                    }
                    key={m.id}
                  >
                    <span
                      className={
                        's-avatar ' + (m.user_id === user?.id ? 'lime' : '')
                      }
                    >
                      {initials(m.nickname)}
                    </span>
                    <div className="s-message-content">
                      <div className="community-message-meta">
                        <strong>{m.nickname}</strong>
                        <time>
                          {new Date(m.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </div>
                      <div className="s-bubble">
                        {m.reply && (
                          <blockquote>
                            {m.reply.nickname}: {m.reply.body}
                          </blockquote>
                        )}
                        <p>{m.body}</p>
                      </div>
                      <div className="community-message-actions">
                        {!active && (
                          <button onClick={() => setReply(m)}>Responder</button>
                        )}
                        {m.user_id !== user?.id && (
                          <>
                            <button
                              onClick={() => {
                                const member = state.members.find(
                                  (p) => p.user_id === m.user_id,
                                )
                                setPerson(
                                  member || {
                                    user_id: m.user_id,
                                    nickname: m.nickname,
                                    role: 'member',
                                    banned: false,
                                    last_seen: m.created_at,
                                  },
                                )
                              }}
                            >
                              Opções
                            </button>
                            {
                              <button
                                onClick={() =>
                                  void run(async () => {
                                    await communityAction('report', {
                                      slug,
                                      messageId: m.id,
                                      threadId: active || undefined,
                                    })
                                    setNotice('Mensagem enviada à moderação.')
                                    await refresh()
                                  })
                                }
                              >
                                {active
                                  ? 'Denunciar esta mensagem à moderação'
                                  : 'Denunciar'}
                              </button>
                            }
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
                <div ref={end} />
              </div>
              <form className="s-composer" onSubmit={send}>
                {reply && !active && (
                  <div id="s-reply">
                    <span>
                      Respondendo a {reply.nickname}: {reply.body.slice(0, 90)}
                    </span>
                    <button
                      type="button"
                      aria-label="Cancelar resposta"
                      onClick={() => setReply(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <label
                  className="community-compose-label"
                  htmlFor="community-message"
                >
                  {current
                    ? `Reservadamente para ${current.nickname}`
                    : 'Falando com todos na sala'}
                </label>
                <div className="s-composebox">
                  <textarea
                    id="community-message"
                    rows={2}
                    maxLength={500}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                      active ? 'Escreva só para esta pessoa…' : 'Entre no papo…'
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void send(e)
                      }
                    }}
                  />
                  <div className="s-compose-bottom">
                    <button
                      type="button"
                      aria-label="Adicionar sorriso"
                      onClick={() => setText((t) => (t + ' 🙂').slice(0, 500))}
                    >
                      ☺
                    </button>
                    {current && current.kind !== 'video' && (
                      <button
                        type="button"
                        aria-label="Convidar para vídeo"
                        onClick={() =>
                          void run(() =>
                            contact(
                              current.sender === user?.id
                                ? current.recipient
                                : current.sender,
                              'video',
                            ),
                          )
                        }
                      >
                        <Camera size={18} />
                      </button>
                    )}
                    <span>{text.length}/500 · Enter envia</span>
                    <button
                      className="s-send"
                      disabled={busy || !text.trim() || (!!active && !current)}
                    >
                      Enviar <Send size={14} />
                    </button>
                  </div>
                </div>
                <div className="s-suggestions">
                  {[
                    'Oi, tudo bem?',
                    'Qual é o assunto de hoje?',
                    'Primeira vez por aqui!',
                  ].map((s) => (
                    <button type="button" key={s} onClick={() => setText(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </form>
            </>
          )}
        </main>
        {drawer && (
          <button
            className="community-shade"
            aria-label="Fechar participantes"
            onClick={() => setDrawer(false)}
          />
        )}
        <aside
          className={'s-right ' + (drawer ? 'drawer' : '')}
          aria-label="Participantes"
        >
          <button
            className="s-drawer-close"
            aria-label="Fechar participantes"
            onClick={() => setDrawer(false)}
          >
            <X size={16} />
          </button>
          <div className="s-cover">
            <small>CENTRAL DE BOAS CONVERSAS</small>
            <strong>{room?.name || 'SEU PRÓXIMO PAPO.'}</strong>
          </div>
          <div className="s-people-title">
            <span>Gente deste papo</span>
            <small>
              {state?.members.filter((m) => !m.banned).length || 0} presentes
            </small>
          </div>
          {state?.members.map((m) => (
            <button
              className="s-person"
              key={m.user_id}
              onClick={() => setPerson(m)}
            >
              <span className="s-avatar">{initials(m.nickname)}</span>
              <span>
                <strong>
                  {m.nickname}
                  {m.user_id === user?.id ? ' (você)' : ''}
                </strong>
                <small>
                  {m.banned
                    ? 'Banido'
                    : m.role === 'owner'
                      ? 'Anfitrião'
                      : m.role === 'moderator'
                        ? 'Moderação'
                        : state.blocked?.includes(m.user_id)
                          ? 'Bloqueado por você'
                          : 'Na conversa'}
                </small>
              </span>
            </button>
          ))}
          <div className="s-rule-box">
            <strong>Conversa boa tem espaço e respeito.</strong>
            <p>
              {room?.rules ||
                'Sem ataques, spam ou exposição de dados pessoais. Respeite os limites de cada pessoa.'}
            </p>
            <Link to="/diretrizes">Regras da plataforma ↗</Link>
          </div>
          {manager && (
            <div className="community-manage">
              <h2>Administrar sala</h2>
              <button onClick={() => void run(() => getInvite())}>
                Obter convite
              </button>
              <button onClick={() => void run(() => getInvite(true))}>
                Renovar convite
              </button>
              {inviteLink && (
                <>
                  <input
                    aria-label="Link de convite"
                    value={inviteLink}
                    readOnly
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={() =>
                      void run(async () => {
                        await navigator.clipboard.writeText(inviteLink)
                        setNotice('Convite copiado.')
                      })
                    }
                  >
                    <Copy size={14} /> Copiar
                  </button>
                </>
              )}
              {state?.reports.map((r) => (
                <article key={r.id}>
                  <strong>Denúncia · {r.nickname}</strong>
                  <p>{r.body}</p>
                  <button
                    onClick={() =>
                      void run(() =>
                        action('moderate', {
                          target: r.user_id,
                          operation: 'ban',
                        }),
                      )
                    }
                  >
                    Banir autor
                  </button>
                  <button
                    onClick={() =>
                      void run(() =>
                        action('resolve-report', { reportId: r.id }),
                      )
                    }
                  >
                    Revisada
                  </button>
                </article>
              ))}
            </div>
          )}
          <Link
            className="community-leave"
            to="/rooms"
            onClick={() => {
              if (state) void communityAction('leave', { slug }).catch(() => {})
            }}
          >
            Sair da sala →
          </Link>
        </aside>
      </div>
      <dialog
        ref={dialog}
        id="s-modal"
        aria-label={person ? `Perfil de ${person.nickname}` : 'Seus convites'}
        onCancel={close}
        onClose={close}
      >
        <div className="m-inner">
          <div className="m-top">
            <h2>{person?.nickname || 'Seus convites'}</h2>
            <button className="m-close" aria-label="Fechar" onClick={close}>
              ×
            </button>
          </div>
          {person ? (
            <>
              <p>
                {person.role === 'owner'
                  ? 'Anfitrião desta sala'
                  : person.role === 'moderator'
                    ? 'Moderador desta sala'
                    : 'Participante desta sala'}
              </p>
              {person.user_id !== user?.id && (
                <>
                  <button
                    className="m-action"
                    disabled={busy}
                    onClick={() =>
                      void run(() => contact(person.user_id, 'direct'))
                    }
                  >
                    <MessageCircle size={20} /> Falar reservadamente
                  </button>
                  <button
                    className="m-action"
                    disabled={busy}
                    onClick={() =>
                      void run(() => contact(person.user_id, 'reserved'))
                    }
                  >
                    <Shield size={20} /> Convidar para sala reservada
                  </button>
                  <button
                    className="m-action"
                    disabled={busy}
                    onClick={() =>
                      void run(() => contact(person.user_id, 'video'))
                    }
                  >
                    <Camera size={20} /> Convidar para vídeo
                  </button>
                  <button
                    className="m-action"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await action('block', {
                          target: person.user_id,
                          enabled: !state?.blocked?.includes(person.user_id),
                        })
                        close()
                      })
                    }
                  >
                    {state?.blocked?.includes(person.user_id)
                      ? 'Desbloquear'
                      : 'Bloquear mensagens e convites'}
                  </button>
                  {manager &&
                    person.role !== 'owner' &&
                    (state?.role === 'owner' || person.role === 'member') && (
                      <button
                        className="m-action"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await action('moderate', {
                              target: person.user_id,
                              operation: person.banned ? 'unban' : 'ban',
                            })
                            close()
                          })
                        }
                      >
                        {person.banned
                          ? 'Permitir entrada novamente'
                          : 'Banir da sala'}
                      </button>
                    )}
                  {state?.role === 'owner' &&
                    person.role !== 'owner' &&
                    !person.banned && (
                      <button
                        className="m-action"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await action('moderate', {
                              target: person.user_id,
                              operation:
                                person.role === 'moderator'
                                  ? 'demote'
                                  : 'promote',
                            })
                            close()
                          })
                        }
                      >
                        {person.role === 'moderator'
                          ? 'Remover moderação'
                          : 'Tornar moderador'}
                      </button>
                    )}
                </>
              )}
            </>
          ) : (
            <>
              {pending.length === 0 && (
                <p>
                  Nenhum convite pendente. Escolha alguém na lista de
                  participantes para convidar.
                </p>
              )}
              {pending.map((t) => (
                <article className="m-entry" key={t.id}>
                  <strong>{t.nickname}</strong>
                  <small>
                    {kindLabel(t.kind)} ·{' '}
                    {t.sender === user?.id
                      ? 'Enviado, aguardando resposta'
                      : 'Recebido'}{' '}
                    · expira às{' '}
                    {new Date(t.expires_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                  {t.recipient === user?.id ? (
                    <div className="m-row">
                      <button
                        className="m-primary"
                        disabled={busy}
                        onClick={() => void run(() => respond(t, 'accept'))}
                      >
                        Aceitar
                      </button>
                      <button
                        className="m-secondary"
                        disabled={busy}
                        onClick={() => void run(() => respond(t, 'decline'))}
                      >
                        Recusar
                      </button>
                    </div>
                  ) : (
                    <button
                      className="m-secondary"
                      disabled={busy}
                      onClick={() => void run(() => respond(t, 'end'))}
                    >
                      Cancelar convite
                    </button>
                  )}
                </article>
              ))}
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
      </dialog>
    </div>
  )
}
