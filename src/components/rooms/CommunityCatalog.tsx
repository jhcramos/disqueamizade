import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  communityAction,
  type CommunityRoom,
} from '@/services/supabase/communityRooms'
export function CommunityCatalog({ refresh }: { refresh: number }) {
  const { user, initialized, signInAsGuest } = useAuthStore()
  const [rooms, setRooms] = useState<CommunityRoom[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(''),
    [adult, setAdult] = useState(false)
  useEffect(() => {
    if (!initialized) return
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError('')
        if (!user?.id) await signInAsGuest()
        const data = await communityAction<{ rooms: CommunityRoom[] }>('list')
        if (!cancelled) setRooms(data.rooms)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user?.id, initialized, refresh, signInAsGuest])
  const visible = rooms.filter(
    (r) =>
      (adult ? r.theme === 'adulto' : r.theme !== 'adulto') &&
      (r.name + ' ' + r.description)
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR')),
  )
  const mine = rooms.find((r) => r.owner_id === user?.id)
  return (
    <section
      className="mb-10 border-b border-white/10 pb-8"
      aria-labelledby="community-title"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="community-title" className="text-xl font-bold">
            Salas da comunidade
          </h2>
          <p className="mt-1 text-sm text-gray-300">
            Crie um lugar para sua turma. Convide amigos e volte para conversar.
          </p>
        </div>
        {mine && (
          <Link className="btn-balada" to={'/comunidade/' + mine.slug}>
            Minha sala
          </Link>
        )}
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          aria-label="Buscar salas da comunidade"
          className="input flex-1 min-w-48"
          placeholder="Buscar pelo nome ou assunto"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          aria-pressed={!adult}
          className="rounded-lg border border-white/20 px-4 py-2 aria-pressed:bg-white/10"
          onClick={() => setAdult(false)}
        >
          Comunidade
        </button>
        <button
          aria-pressed={adult}
          className="rounded-lg border border-pink-400/40 px-4 py-2 aria-pressed:bg-pink-500/20"
          onClick={() => setAdult(true)}
        >
          Área adulta 18+
        </button>
      </div>
      {adult && (
        <p className="mb-4 text-sm text-pink-200">
          Salas para maiores de 18 anos. A entrada exige uma confirmação
          explícita. Respeito e consentimento continuam obrigatórios.
        </p>
      )}
      {loading ? (
        <p role="status">Carregando salas da comunidade…</p>
      ) : error ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-500/30 p-4 text-sm text-amber-200"
        >
          {error}
        </p>
      ) : visible.length === 0 ? (
        <p className="py-5 text-gray-300">
          {query
            ? 'Nenhuma sala corresponde à busca.'
            : 'Ainda não há salas nesta seção. Crie a primeira e convide sua turma.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <Link
              className="card-interactive p-5"
              key={r.id}
              to={'/comunidade/' + r.slug}
            >
              <div className="mb-2 text-xs text-gray-300">
                {r.online || 0} online
              </div>
              <h3 className="font-bold">{r.name}</h3>
              <p className="mt-2 text-sm text-gray-300 line-clamp-2">
                {r.description || 'Um espaço para conversar e fazer amizades.'}
              </p>
              <div className="mt-4 text-xs text-gray-300">
                {r.theme === 'adulto' ? 'Adulta 18+' : r.theme} ·{' '}
                {r.access === 'invite' ? 'Por convite' : 'Pública'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
