import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { track } from '@/services/analytics'
import { X, Plus, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import {
  communityAction,
  type CommunityRoom,
} from '@/services/supabase/communityRooms'
export const CreateRoomModal = ({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean
  onClose: () => void
  userTier?: string
  onCreated?: () => void
}) => {
  const user = useAuthStore((s) => s.user),
    isGuest = useAuthStore((s) => s.isGuest)
  const navigate = useNavigate(),
    dialog = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState(''),
    [description, setDescription] = useState(''),
    [rules, setRules] = useState('')
  const [theme, setTheme] = useState('amizade'),
    [access, setAccess] = useState('public')
  const [adult, setAdult] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  useEffect(() => {
    if (isOpen) dialog.current?.showModal()
    else dialog.current?.close()
  }, [isOpen])
  const verified =
    !!user && !isGuest && !user.is_anonymous && !!user.email_confirmed_at
  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await communityAction<{ room: CommunityRoom }>('create', {
        name: name.trim(),
        description: description.trim(),
        rules: rules.trim(),
        theme,
        access,
        adultAcknowledged: adult,
      })
      track('community_room_created')
      onCreated?.()
      onClose()
      navigate('/comunidade/' + result.room.slug)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="create-room-title"
      onCancel={(e) => {
        if (busy) e.preventDefault()
        else onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-white/10 bg-dark-950 p-6 text-white backdrop:bg-black/70"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 id="create-room-title" className="text-xl font-bold">
            Criar minha sala grátis
          </h2>
          <p className="mt-1 text-sm text-gray-300">
            Uma sala por conta. Sua turma, seu espaço.
          </p>
        </div>
        <button aria-label="Fechar" disabled={busy} onClick={onClose}>
          <X />
        </button>
      </div>
      {!verified ? (
        <div className="space-y-4">
          <p>
            Para criar e administrar sua sala, entre com uma conta e confirme
            seu e-mail.
          </p>
          <Link
            className="btn-balada inline-block"
            onClick={onClose}
            to="/auth"
            state={{ from: '/rooms' }}
          >
            Entrar ou criar conta
          </Link>
        </div>
      ) : (
        <form onSubmit={create} className="space-y-4">
          <label className="block text-sm">
            Nome da sala
            <input
              autoFocus
              className="input mt-1 w-full"
              required
              minLength={3}
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Descrição
            <textarea
              className="input mt-1 w-full"
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o que vocês vão conversar?"
            />
          </label>
          <label className="block text-sm">
            Tema
            <select
              className="input mt-1 w-full"
              value={theme}
              onChange={(e) => {
                setTheme(e.target.value)
                setAdult(false)
              }}
            >
              {[
                ['amizade', 'Amizade'],
                ['musica', 'Música'],
                ['games', 'Games'],
                ['idiomas', 'Idiomas'],
                ['paquera', 'Paquera'],
                ['adulto', 'Adulta 18+'],
                ['outros', 'Outros interesses'],
              ].map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Quem pode entrar?
            <select
              className="input mt-1 w-full"
              value={access}
              onChange={(e) => setAccess(e.target.value)}
            >
              <option value="public">Pública — aparece no catálogo</option>
              <option value="invite">
                Por convite — somente quem receber o link
              </option>
            </select>
          </label>
          <p className="text-xs text-gray-300">
            {access === 'invite'
              ? 'Qualquer pessoa com o convite pode entrar. Você pode renovar o link e bloquear participantes.'
              : 'A sala pode ser encontrada na busca, mesmo quando estiver vazia.'}
          </p>
          <label className="block text-sm">
            Regras da sala
            <textarea
              className="input mt-1 w-full"
              maxLength={1000}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Respeite as pessoas e o tema. As regras da plataforma também se aplicam."
            />
          </label>
          {theme === 'adulto' && (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                required
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
              />
              Confirmo que sou maior de 18 anos e que esta sala ficará na área
              adulta.
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            disabled={busy || name.trim().length < 3}
            className="btn-balada flex w-full items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 className="animate-spin" /> : <Plus size={18} />}{' '}
            {busy ? 'Criando…' : 'Criar sala grátis'}
          </button>
          <p className="text-xs text-gray-400">
            A criação básica é gratuita. Todas as salas seguem as{' '}
            <Link className="underline" to="/diretrizes">
              regras de convivência
            </Link>
            .
          </p>
        </form>
      )}
    </dialog>
  )
}
