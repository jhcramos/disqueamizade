import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search, Users, Video, Heart, Plus } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import {
  communityAction,
  type CommunityRoom,
} from '@/services/supabase/communityRooms'
import { CreateRoomModal } from './CreateRoomModal'
import './catalog.css'
const themes: Record<string, string> = {
  all: 'Todos os assuntos',
  amizade: 'Amizade',
  paquera: 'Paquera',
  musica: 'Música',
  games: 'Games',
  idiomas: 'Idiomas',
  cidades: 'Cidades',
  outros: 'Outros papos',
}
type Entry = {
  id: string
  name: string
  description: string
  theme: string
  adult: boolean
  online: number
  url: string
  access: string
  community: boolean
}
export function CommunityCatalog({ refresh }: { refresh: number }) {
  const { user, initialized, signInAsGuest } = useAuthStore()
  const [rooms, setRooms] = useState<CommunityRoom[]>([]),
    [favorites, setFavorites] = useState<string[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('')
  const [query, setQuery] = useState(''),
    [adult, setAdult] = useState(false),
    [theme, setTheme] = useState('all'),
    [sort, setSort] = useState('online'),
    [page, setPage] = useState(1),
    [onlyFavorites, setOnlyFavorites] = useState(false),
    [create, setCreate] = useState(false)
  useEffect(() => {
    if (!initialized) return
    let cancelled = false
    void (async () => {
      try {
        setLoading(true)
        if (!user?.id) await signInAsGuest()
        const data = await communityAction<{
          rooms: CommunityRoom[]
          favorites?: string[]
        }>('list')
        if (!cancelled) {
          setRooms(data.rooms)
          setFavorites(data.favorites || [])
          setError('')
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, initialized, refresh, signInAsGuest])
  const entries = useMemo<Entry[]>(
    () => [
      ...rooms.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        theme: r.theme,
        adult: r.theme === 'adulto',
        online: r.online || 0,
        url: '/comunidade/' + r.slug,
        access: r.access,
        community: !!r.owner_id,
      })),
    ],
    [rooms],
  )
  const filtered = entries
    .filter(
      (r) =>
        r.adult === adult &&
        (theme === 'all' || r.theme === theme) &&
        (!onlyFavorites || favorites.includes(r.id)) &&
        `${r.name} ${r.description}`
          .toLocaleLowerCase('pt-BR')
          .includes(query.toLocaleLowerCase('pt-BR')),
    )
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name, 'pt-BR')
        : b.online - a.online || a.name.localeCompare(b.name, 'pt-BR'),
    )
  const pages = Math.max(1, Math.ceil(filtered.length / 12)),
    currentPage = Math.min(page, pages),
    visible = filtered.slice((currentPage - 1) * 12, currentPage * 12)
  const mine = rooms.find((r) => r.owner_id === user?.id)
  useEffect(() => {
    setPage(1)
  }, [query, adult, theme, sort, onlyFavorites])
  return (
    <div className="community-catalog">
      <header className="catalog-header">
        <Link className="catalog-brand" to="/">
          <img src="/brand/mark.svg" alt="" />
          <span>
            disque
            <br />
            amizade
          </span>
        </Link>
        <nav>
          <Link to="/garagem">Conhecer a Casa ↗</Link>
          {mine && <Link to={'/comunidade/' + mine.slug}>Minha sala</Link>}
          <button className="catalog-create" onClick={() => setCreate(true)}>
            <Plus size={16} /> Criar sala
          </button>
        </nav>
      </header>
      <main>
        <section className="catalog-hero">
          <div>
            <p className="catalog-kicker">DESLIGUE A PRESSA. LIGUE O PAPO.</p>
            <h1>
              Tem alguém
              <br />
              na sua <em>sintonia.</em>
            </h1>
            <p>
              Escolha um assunto, entre numa sala e deixe a conversa acontecer.
            </p>
          </div>
          <div className="catalog-poster">
            <span>
              ALÔ,
              <br />
              GENTE
              <br />
              NOVA.
            </span>
            <div>
              <MessageMark />
              <small>
                Uma sala.
                <br />
                Mil possibilidades.
              </small>
            </div>
          </div>
        </section>
        <div className="catalog-experiences">
          <button
            aria-pressed={!adult}
            onClick={() => {
              setAdult(false)
              setTheme('all')
            }}
          >
            <span>01 / ENCONTRE SUA TURMA</span>
            <strong>
              Boas conversas <ArrowUpRight />
            </strong>
            <small>Amizade, interesses e gente de todo lugar</small>
          </button>
          <button
            className="catalog-adult"
            aria-pressed={adult}
            onClick={() => {
              setAdult(true)
              setTheme('all')
            }}
          >
            <span>02 / SÓ PARA MAIORES</span>
            <strong>
              Área adulta <b>18+</b>
              <ArrowUpRight />
            </strong>
            <small>Outro clima. Respeito e consentimento sempre.</small>
          </button>
        </div>
        <section className="catalog-directory" aria-label="Encontre uma sala">
          <aside>
            <h2>Qual é o seu papo?</h2>
            {Object.entries(themes).map(([key, label]) => (
              <button
                key={key}
                aria-pressed={theme === key}
                onClick={() => setTheme(key)}
              >
                {label}
                <span>
                  {
                    entries.filter(
                      (r) =>
                        r.adult === adult && (key === 'all' || r.theme === key),
                    ).length
                  }
                </span>
              </button>
            ))}
            <button
              className="catalog-favorites"
              aria-pressed={onlyFavorites}
              onClick={() => setOnlyFavorites(!onlyFavorites)}
            >
              <Heart size={16} /> Minhas favoritas
            </button>
            <div className="catalog-house">
              <span>UMA OUTRA EXPERIÊNCIA</span>
              <strong>Entre na Casa.</strong>
              <p>
                Explore ambientes com seu avatar e encontre pessoas pelo
                caminho.
              </p>
              <Link to="/garagem">
                Abrir a Casa <ArrowUpRight size={16} />
              </Link>
            </div>
          </aside>
          <div className="catalog-results">
            <div className="catalog-toolbar">
              <label>
                <Search size={18} />
                <input
                  aria-label="Buscar salas"
                  placeholder="Busque uma sala ou assunto…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <select
                aria-label="Ordenar salas"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="online">Mais gente agora</option>
                <option value="name">Nome: A–Z</option>
              </select>
            </div>
            <div className="catalog-count">
              <h2>
                {adult
                  ? 'Encontros 18+'
                  : theme === 'all'
                    ? 'Entre, o papo é seu.'
                    : themes[theme]}
              </h2>
              <span>{filtered.length} salas encontradas</span>
            </div>
            {adult && (
              <p className="catalog-adult-note">
                Entrada exclusiva para maiores de 18 anos, com confirmação antes
                de participar.
              </p>
            )}
            {error && <p role="alert">{error}</p>}
            {loading && <p role="status">Encontrando salas…</p>}
            {!loading && visible.length === 0 && (
              <div className="catalog-empty">
                <h3>
                  {onlyFavorites
                    ? 'Seu próximo lugar favorito está por aqui.'
                    : 'Ainda não tem um papo por aqui.'}
                </h3>
                <p>
                  {query
                    ? 'Experimente outro nome ou assunto.'
                    : 'Crie uma sala e convide quem você quer por perto.'}
                </p>
                <button onClick={() => setCreate(true)}>
                  Criar minha sala →
                </button>
              </div>
            )}
            <div className="catalog-grid">
              {visible.map((r, i) => (
                <Link
                  className={'catalog-card tone-' + (i % 4)}
                  key={r.id}
                  to={r.url}
                >
                  <div className="catalog-card-top">
                    <span>
                      {r.adult ? '18+' : themes[r.theme] || 'Comunidade'}
                    </span>
                    <ArrowUpRight size={19} />
                  </div>
                  <h3>{r.name}</h3>
                  <p>
                    {r.description ||
                      'Entre, puxe um assunto e conheça gente nova.'}
                  </p>
                  <footer>
                    <span>
                      <Users size={14} />
                      {r.online} online
                    </span>
                    <small>
                      {r.access === 'invite'
                        ? 'Por convite'
                        : r.access === 'vip'
                          ? 'VIP'
                          : r.community
                            ? 'Da comunidade'
                            : 'Sala oficial'}{' '}
                      <Video size={14} />
                    </small>
                  </footer>
                </Link>
              ))}
            </div>
            {pages > 1 && (
              <nav className="catalog-pages" aria-label="Páginas de salas">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  ← Anterior
                </button>
                <span>
                  {currentPage} de {pages}
                </span>
                <button
                  disabled={currentPage === pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Próxima →
                </button>
              </nav>
            )}
          </div>
        </section>
      </main>
      <footer className="catalog-footer">
        <span>Disque Amizade · um bom papo muda o dia.</span>
        <Link to="/diretrizes">Regras da comunidade</Link>
        <Link to="/privacidade">Privacidade</Link>
      </footer>
      <CreateRoomModal isOpen={create} onClose={() => setCreate(false)} />
    </div>
  )
}
function MessageMark() {
  return (
    <span aria-hidden="true" className="catalog-asterisk">
      ✳
    </span>
  )
}
