// ═══════════════════════════════════════════════════════════════════════════
// RoulettePage — roleta 1:1 em LiveKit (Plano V4, item 1.7)
//
// Idle/busca ficam nesta página; ao dar match, monta <RouletteCall> (LiveKit).
// Filtros de cidade/idade viram "bucket" de pareamento. Convidado é permitido.
// Não repete a mesma pessoa nas últimas 24h.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'
import { Shuffle, X, Settings, Sparkles } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { useAuthStore } from '@/store/authStore'
import { matchmaking } from '@/services/supabase/matchmaking'
import { roomChat } from '@/services/supabase/roomChat'
import { useToastStore } from '@/components/common/ToastContainer'
import { isLiveKitConfigured, fetchRoomToken } from '@/rooms/livekit'
import { RouletteCall } from '@/rooms/RouletteCall'

type Status = 'idle' | 'searching' | 'matched' | 'no-match'

const AGE_RANGES = [
  { label: 'Qualquer', value: '' },
  { label: '18-25', value: '18-25' },
  { label: '26-35', value: '26-35' },
  { label: '36-45', value: '36-45' },
  { label: '46+', value: '46+' },
]
const CITIES = ['Qualquer', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Salvador', 'Porto Alegre', 'Recife', 'Fortaleza', 'Brasília']

const RECENT_KEY = 'roulette-recent-peers'
const RECENT_TTL = 24 * 60 * 60 * 1000 // 24h

/** Lê os pares recentes (não expirados) do localStorage. */
function loadRecent(): Map<string, number> {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '{}') as Record<string, number>
    const now = Date.now()
    return new Map(Object.entries(raw).filter(([, ts]) => now - ts < RECENT_TTL))
  } catch { return new Map() }
}
function saveRecent(map: Map<string, number>) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(Object.fromEntries(map))) } catch { /* ignore */ }
}
function slug(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export const RoulettePage = () => {
  const { user, isGuest, signInAsGuest } = useAuthStore()
  const { addToast } = useToastStore()

  const [status, setStatus] = useState<Status>('idle')
  const [showFilters, setShowFilters] = useState(false)
  const [city, setCity] = useState('')
  const [age, setAge] = useState('')
  const [searchTime, setSearchTime] = useState(0)
  const [noMatchMessage, setNoMatchMessage] = useState('')

  const [match, setMatch] = useState<{ peerId: string; roomId: string; token: string } | null>(null)
  const recentRef = useRef<Map<string, number>>(loadRecent())

  // Convidado automático: roleta é aberta a quem não tem conta.
  useEffect(() => {
    if (!user && !isGuest) signInAsGuest()
  }, [user, isGuest, signInAsGuest])

  const identity = user?.id || ''
  const displayName = useAuthStore.getState().profile?.username || (user?.user_metadata?.username as string) || 'Convidado'

  // Timer de busca
  useEffect(() => {
    if (status !== 'searching') return
    const t = setInterval(() => setSearchTime((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [status])

  useEffect(() => () => { matchmaking.leaveQueue(); roomChat.leave() }, [])

  const bucketKey = `${slug(city) || 'any'}:${age || 'any'}`

  const startSearch = useCallback(async () => {
    if (!identity) return // ainda criando convidado
    if (!isLiveKitConfigured()) {
      setStatus('no-match')
      setNoMatchMessage('O vídeo ainda não está configurado neste ambiente.')
      return
    }
    setStatus('searching')
    setSearchTime(0)
    setNoMatchMessage('')
    setMatch(null)

    matchmaking.joinQueue(
      identity,
      async (peerId, roomId) => {
        // registra par recente (evita repetir por 24h)
        recentRef.current.set(peerId, Date.now())
        saveRecent(recentRef.current)
        try {
          const token = await fetchRoomToken(roomId, identity)
          setMatch({ peerId, roomId, token })
          setStatus('matched')
        } catch {
          setStatus('no-match')
          setNoMatchMessage('Não foi possível conectar o vídeo. Tente de novo.')
        }
      },
      (s) => {
        setStatus(s)
        if (s === 'no-match') setNoMatchMessage('Ninguém disponível agora. Tente novamente!')
      },
      { bucketKey, avoid: new Set(recentRef.current.keys()), timeoutMs: 30000 },
    )
  }, [identity, bucketKey])

  const endSession = useCallback(() => {
    matchmaking.leaveQueue()
    roomChat.leave()
    setMatch(null)
    setStatus('idle')
    setSearchTime(0)
    setNoMatchMessage('')
  }, [])

  const nextPerson = useCallback(() => {
    roomChat.leave()
    setMatch(null)
    startSearch()
  }, [startSearch])

  const handleReport = useCallback((_peerId: string) => {
    addToast({ type: 'success', title: 'Denúncia enviada', message: 'Obrigado. Vamos revisar e já pulamos para a próxima pessoa.' })
    nextPerson()
  }, [addToast, nextPerson])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // ─── Match ativo: chamada LiveKit ───
  if (status === 'matched' && match) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full" style={{ height: 'calc(100vh - 140px)' }}>
          <RouletteCall
            roomId={match.roomId}
            token={match.token}
            identity={identity}
            displayName={displayName}
            peerId={match.peerId}
            isGuest={isGuest}
            onNext={nextPerson}
            onEnd={endSession}
            onReport={handleReport}
          />
        </main>
      </div>
    )
  }

  // ─── Idle / busca / sem match ───
  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-6 w-full pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <Shuffle className="w-5 h-5 text-white" />
              </div>
              Roleta 1:1
            </h1>
            <p className="text-dark-500 text-sm mt-1">Conheça alguém aleatório — entra convidado, sem cadastro.</p>
          </div>
          <button onClick={() => setShowFilters((v) => !v)} className={`p-2.5 rounded-xl border ${showFilters ? 'bg-primary-500/15 border-primary-500/30 text-primary-400' : 'border-white/10 text-dark-400 hover:text-white hover:bg-white/5'}`}>
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="card p-5 mb-6">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary-400" /> Filtros de match</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block">Faixa etária</label>
                <select value={age} onChange={(e) => setAge(e.target.value)} className="input w-full">
                  {AGE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block">Cidade</label>
                <select value={city} onChange={(e) => setCity(e.target.value === 'Qualquer' ? '' : e.target.value)} className="input w-full">
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-dark-500 mt-3">
              Com filtro, você só encontra quem escolheu o mesmo. Deixe em "Qualquer" para conhecer mais gente.
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-dark-900 border border-white/10 min-h-[360px] flex items-center justify-center p-6">
          {status === 'idle' && (
            <div className="text-center max-w-xs">
              <div className="text-6xl mb-4">🎰</div>
              <h3 className="text-xl font-bold mb-2">Pronto para conhecer alguém?</h3>
              <p className="text-sm text-dark-400 mb-6">A câmera liga ao conectar. Você pode usar máscaras.</p>
              <button onClick={startSearch} disabled={!identity} className="btn-primary flex items-center gap-2 mx-auto disabled:opacity-50">
                <Shuffle className="w-5 h-5" /> Buscar
              </button>
            </div>
          )}
          {status === 'searching' && (
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-primary-500/30 border-t-primary-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🔍</div>
              </div>
              <h3 className="text-lg font-bold mb-1">Procurando…</h3>
              <p className="text-base text-dark-400">{formatTime(searchTime)}</p>
              <button onClick={endSession} className="mt-5 px-6 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm flex items-center gap-2 mx-auto">
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          )}
          {status === 'no-match' && (
            <div className="text-center max-w-xs">
              <div className="text-5xl mb-3">😔</div>
              <h3 className="text-lg font-bold mb-2">Ninguém encontrado</h3>
              <p className="text-sm text-dark-400 mb-4">{noMatchMessage}</p>
              <button onClick={startSearch} className="btn-primary flex items-center gap-2 mx-auto">
                <Shuffle className="w-5 h-5" /> Tentar novamente
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default RoulettePage
