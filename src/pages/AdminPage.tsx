import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/services/supabase/client'

// ─── Types ───
type ColdStartSettings = {
  bots_presence: boolean
  inflated_counters: boolean
  auto_chat: boolean
  lobby_mode: boolean
}

type GeneralSettings = {
  maintenance_mode: boolean
  registration_open: boolean
  max_rooms: number
}

type ModerationSettings = {
  profanity_filter: boolean
  auto_ban_threshold: number
  banned_words: string[]
}

type Report = {
  id: string
  reporter_id: string
  reported_user_id: string
  room_id: string | null
  reason: string
  description: string | null
  status: string
  created_at: string
  reporter?: { username: string }
  reported_user?: { username: string }
}

type UserBan = {
  id: string
  user_id: string
  banned_by: string | null
  reason: string | null
  ban_type: string
  expires_at: string | null
  created_at: string
  user?: { username: string }
}

// ─── Tabs ───
type Tab = 'cold_start' | 'moderation' | 'metrics' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'cold_start', label: 'Cold Start', icon: '🎛️' },
  { id: 'moderation', label: 'Moderação', icon: '🛡️' },
  { id: 'metrics', label: 'Métricas', icon: '📊' },
  { id: 'settings', label: 'Configurações', icon: '⚙️' },
]

// ─── Toggle Component ───
function Toggle({
  label,
  description,
  enabled,
  onChange,
  loading,
}: {
  label: string
  description: string
  enabled: boolean
  onChange: (v: boolean) => void
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-noite-800/50 rounded-xl border border-white/5">
      <div className="flex-1 mr-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${enabled ? 'bg-conquista-500/20 text-conquista-400' : 'bg-energia-500/20 text-energia-400'}`}>
            {enabled ? '🟢 Ativo' : '🔴 Desativado'}
          </span>
        </div>
        <p className="text-sm text-noite-400 mt-1">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
          enabled ? 'bg-conquista-500' : 'bg-noite-600'
        } ${loading ? 'opacity-50' : ''}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
            enabled ? 'translate-x-6' : ''
          }`}
        />
      </button>
    </div>
  )
}

// ─── Metric Card ───
function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="p-5 bg-noite-800/50 rounded-xl border border-white/5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-noite-400 mt-1">{label}</div>
    </div>
  )
}

// ─── Main Component ───
export function AdminPage() {
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('cold_start')
  const [saving, setSaving] = useState(false)

  // Settings state
  const [coldStart, setColdStart] = useState<ColdStartSettings>({
    bots_presence: true, inflated_counters: true, auto_chat: true, lobby_mode: true,
  })
  const [general, setGeneral] = useState<GeneralSettings>({
    maintenance_mode: false, registration_open: true, max_rooms: 100,
  })
  const [moderation, setModeration] = useState<ModerationSettings>({
    profanity_filter: true, auto_ban_threshold: 5, banned_words: [],
  })
  const [newWord, setNewWord] = useState('')

  // Data state
  const [reports, setReports] = useState<Report[]>([])
  const [bans, setBans] = useState<UserBan[]>([])
  const [metrics, setMetrics] = useState({
    totalUsers: 0, onlineReal: 0, onlineSimulated: 0, totalRooms: 0, revenue: 0, pendingReports: 0,
  })

  // ─── Auth Guard ───
  useEffect(() => {
    if (!authLoading && (!profile || !(profile as any).is_admin)) {
      // For dev: allow if profile exists (we'll check is_admin from DB)
      if (profile) {
        supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', profile.id)
          .single()
          .then(({ data }) => {
            if (!data?.is_admin) navigate('/')
          })
      } else {
        navigate('/')
      }
    }
  }, [profile, authLoading, navigate])

  // ─── Fetch Settings ───
  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('admin_settings').select('*')
    if (data) {
      for (const row of data) {
        if (row.key === 'cold_start') setColdStart(row.value as ColdStartSettings)
        if (row.key === 'general') setGeneral(row.value as GeneralSettings)
        if (row.key === 'moderation') setModeration(row.value as ModerationSettings)
      }
    }
  }, [])

  // ─── Fetch Reports ───
  const fetchReports = useCallback(async () => {
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:profiles!reporter_id(username), reported_user:profiles!reported_user_id(username)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setReports(data as any)
  }, [])

  // ─── Fetch Bans ───
  const fetchBans = useCallback(async () => {
    const { data } = await supabase
      .from('user_bans')
      .select('*, user:profiles!user_id(username)')
      .order('created_at', { ascending: false })
    if (data) setBans(data as any)
  }, [])

  // ─── Fetch Metrics ───
  const fetchMetrics = useCallback(async () => {
    const [usersRes, roomsRes, reportsRes, participantsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('room_participants').select('id', { count: 'exact', head: true }),
    ])

    const hourBR = (new Date().getUTCHours() - 3 + 24) % 24
    let simBase = 85
    if (hourBR >= 19 && hourBR <= 23) simBase = 180
    else if (hourBR >= 14 && hourBR < 19) simBase = 120

    setMetrics({
      totalUsers: usersRes.count || 0,
      onlineReal: participantsRes.count || 0,
      onlineSimulated: simBase + Math.round(Math.random() * 30),
      totalRooms: roomsRes.count || 0,
      revenue: 0,
      pendingReports: reportsRes.count || 0,
    })
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchReports()
    fetchBans()
    fetchMetrics()
  }, [fetchSettings, fetchReports, fetchBans, fetchMetrics])

  // ─── Save Setting ───
  const saveSetting = async (key: string, value: any) => {
    setSaving(true)
    await supabase.from('admin_settings').upsert({ key, value, updated_at: new Date().toISOString() })
    setSaving(false)
  }

  const updateColdStart = (field: keyof ColdStartSettings, val: boolean) => {
    const updated = { ...coldStart, [field]: val }
    setColdStart(updated)
    saveSetting('cold_start', updated)
  }

  const updateGeneral = (field: keyof GeneralSettings, val: any) => {
    const updated = { ...general, [field]: val }
    setGeneral(updated)
    saveSetting('general', updated)
  }

  const addBannedWord = () => {
    if (!newWord.trim()) return
    const updated = { ...moderation, banned_words: [...moderation.banned_words, newWord.trim().toLowerCase()] }
    setModeration(updated)
    saveSetting('moderation', updated)
    setNewWord('')
  }

  const removeBannedWord = (word: string) => {
    const updated = { ...moderation, banned_words: moderation.banned_words.filter((w) => w !== word) }
    setModeration(updated)
    saveSetting('moderation', updated)
  }

  const resolveReport = async (id: string, status: string) => {
    await supabase.from('reports').update({ status, resolved_at: new Date().toISOString(), resolved_by: profile?.id }).eq('id', id)
    fetchReports()
  }

  const unbanUser = async (banId: string) => {
    await supabase.from('user_bans').delete().eq('id', banId)
    fetchBans()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-noite-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-balada-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-noite-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-noite-900 border-r border-white/5 p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-balada rounded-xl flex items-center justify-center text-xl">⚡</div>
          <div>
            <h1 className="font-bold text-white text-lg">Admin</h1>
            <p className="text-xs text-noite-400">Disque Amizade</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${
                activeTab === tab.id
                  ? 'bg-balada-500/15 text-balada-400 border border-balada-500/20'
                  : 'text-noite-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={() => navigate('/')}
          className="mt-4 w-full text-left px-4 py-3 rounded-xl text-noite-400 hover:text-white hover:bg-white/5 flex items-center gap-3"
        >
          <span>←</span>
          <span>Voltar ao site</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {saving && (
          <div className="fixed top-4 right-4 bg-conquista-500/20 text-conquista-400 px-4 py-2 rounded-lg text-sm animate-fade-in z-50">
            Salvando...
          </div>
        )}

        {/* ─── COLD START ─── */}
        {activeTab === 'cold_start' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">🎛️ Cold Start</h2>
            <p className="text-noite-400 mb-6">Controles para fase inicial — simular atividade até ter massa crítica de usuários reais.</p>
            <div className="space-y-3 max-w-2xl">
              <Toggle
                label="Bots de Presença"
                description="Simular usuários online nas salas"
                enabled={coldStart.bots_presence}
                onChange={(v) => updateColdStart('bots_presence', v)}
                loading={saving}
              />
              <Toggle
                label="Contadores Inflados"
                description="Adicionar offset aos contadores de participantes"
                enabled={coldStart.inflated_counters}
                onChange={(v) => updateColdStart('inflated_counters', v)}
                loading={saving}
              />
              <Toggle
                label="Chat Automático"
                description="Gerar mensagens automáticas nas salas"
                enabled={coldStart.auto_chat}
                onChange={(v) => updateColdStart('auto_chat', v)}
                loading={saving}
              />
              <Toggle
                label="Modo Lobby"
                description="Mostrar mensagem amigável em salas vazias em vez de '0 pessoas'"
                enabled={coldStart.lobby_mode}
                onChange={(v) => updateColdStart('lobby_mode', v)}
                loading={saving}
              />
            </div>
          </div>
        )}

        {/* ─── MODERATION ─── */}
        {activeTab === 'moderation' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">🛡️ Moderação</h2>

            {/* Reports */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Denúncias Pendentes</h3>
              {reports.length === 0 ? (
                <p className="text-noite-400 text-sm">Nenhuma denúncia encontrada.</p>
              ) : (
                <div className="bg-noite-800/50 rounded-xl border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-noite-400">
                        <th className="text-left p-3">Denunciante</th>
                        <th className="text-left p-3">Denunciado</th>
                        <th className="text-left p-3">Motivo</th>
                        <th className="text-left p-3">Data</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r.id} className="border-b border-white/5">
                          <td className="p-3 text-white">{(r.reporter as any)?.username || '—'}</td>
                          <td className="p-3 text-white">{(r.reported_user as any)?.username || '—'}</td>
                          <td className="p-3 text-noite-300">{r.reason}</td>
                          <td className="p-3 text-noite-400">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              r.status === 'pending' ? 'bg-festa-400/20 text-festa-400' :
                              r.status === 'resolved' ? 'bg-conquista-500/20 text-conquista-400' :
                              'bg-noite-600 text-noite-300'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {r.status === 'pending' && (
                              <div className="flex gap-2">
                                <button onClick={() => resolveReport(r.id, 'resolved')} className="text-conquista-400 hover:underline text-xs">Resolver</button>
                                <button onClick={() => resolveReport(r.id, 'dismissed')} className="text-noite-400 hover:underline text-xs">Dispensar</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bans */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Usuários Banidos</h3>
              {bans.length === 0 ? (
                <p className="text-noite-400 text-sm">Nenhum ban ativo.</p>
              ) : (
                <div className="space-y-2">
                  {bans.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-noite-800/50 rounded-xl border border-white/5">
                      <div>
                        <span className="text-white font-medium">{(b.user as any)?.username || b.user_id}</span>
                        <span className="text-noite-400 text-sm ml-2">— {b.reason || 'Sem motivo'}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${b.ban_type === 'permanent' ? 'bg-energia-500/20 text-energia-400' : 'bg-festa-400/20 text-festa-400'}`}>
                          {b.ban_type}
                        </span>
                      </div>
                      <button onClick={() => unbanUser(b.id)} className="text-sm text-conquista-400 hover:underline">Desbanir</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Banned Words */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Palavras Proibidas</h3>
              <div className="flex gap-2 mb-3">
                <input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addBannedWord()}
                  placeholder="Adicionar palavra..."
                  className="flex-1 bg-noite-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-noite-500 focus:outline-none focus:border-balada-500/50"
                />
                <button onClick={addBannedWord} className="px-4 py-2 bg-balada-500 text-white rounded-lg text-sm hover:bg-balada-600 transition-colors">
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {moderation.banned_words.map((word) => (
                  <span key={word} className="flex items-center gap-1 px-3 py-1 bg-energia-500/10 text-energia-400 rounded-full text-sm">
                    {word}
                    <button onClick={() => removeBannedWord(word)} className="ml-1 hover:text-white">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── METRICS ─── */}
        {activeTab === 'metrics' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">📊 Métricas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
              <MetricCard icon="👥" label="Usuários (real)" value={metrics.totalUsers} />
              <MetricCard icon="🟢" label="Online agora (real)" value={metrics.onlineReal} />
              <MetricCard icon="🤖" label="Online (simulado)" value={metrics.onlineSimulated} />
              <MetricCard icon="🏠" label="Salas ativas" value={metrics.totalRooms} />
              <MetricCard icon="💰" label="Revenue (fichas)" value={metrics.revenue} />
              <MetricCard icon="🚨" label="Denúncias pendentes" value={metrics.pendingReports} />
            </div>
          </div>
        )}

        {/* ─── SETTINGS ─── */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">⚙️ Configurações</h2>
            <div className="space-y-3 max-w-2xl">
              <Toggle
                label="Modo Manutenção"
                description="Desativa o site para todos os usuários não-admin"
                enabled={general.maintenance_mode}
                onChange={(v) => updateGeneral('maintenance_mode', v)}
                loading={saving}
              />
              <Toggle
                label="Registro Aberto"
                description="Permite novos cadastros no site"
                enabled={general.registration_open}
                onChange={(v) => updateGeneral('registration_open', v)}
                loading={saving}
              />
              <div className="p-4 bg-noite-800/50 rounded-xl border border-white/5">
                <label className="block font-semibold text-white mb-2">Máximo de Salas</label>
                <p className="text-sm text-noite-400 mb-3">Limite de salas ativas simultâneas</p>
                <input
                  type="number"
                  value={general.max_rooms}
                  onChange={(e) => updateGeneral('max_rooms', parseInt(e.target.value) || 0)}
                  className="bg-noite-800 border border-white/10 rounded-lg px-3 py-2 text-white w-32 focus:outline-none focus:border-balada-500/50"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
