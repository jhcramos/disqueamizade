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

type Room = {
  id: string
  name: string
  slug: string
  description: string
  type: string
  max_participants: number
  current_participants: number
  ficha_cost: number
  is_active: boolean
  created_at: string
}

// ─── Tabs ───
type Tab = 'cold_start' | 'rooms' | 'moderation' | 'metrics' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'cold_start', label: 'Cold Start', icon: '🎛️' },
  { id: 'rooms', label: 'Salas', icon: '🏠' },
  { id: 'moderation', label: 'Moderação', icon: '🛡️' },
  { id: 'metrics', label: 'Métricas', icon: '📊' },
  { id: 'settings', label: 'Configurações', icon: '⚙️' },
]

function classifyRoom(slug: string): string {
  if (slug.startsWith('adult-')) return 'Adulto/Sexual'
  if (slug.startsWith('idioma-') || slug === 'english-practice' || slug === 'espanol') return 'Idiomas'
  if (['boteco-virtual','sexta-feira-nois','whisky-conversa','vinho-fofoca','happy-hour-papo','drinks-risadas','cervejeiros-anonimos','madrugadao-alcoolico','role-sabado','brindando-vida'].includes(slug)) return 'Bebida'
  if (['lounge-vip','diamond-club'].includes(slug)) return 'VIP'
  if (['18-25-anos','26-35-anos','36-45-anos','46-plus'].includes(slug)) return 'Faixa Etária'
  if (['geral-brasil','papo-livre'].includes(slug)) return 'Geral'
  if (['tecnologia-ia','futebol','musica','games','series-filmes','fitness-saude','karaoke','dj-room','danca'].includes(slug)) return 'Interesses'
  return 'Cidades'
}

// ─── Toggle Component ───
function Toggle({ label, description, enabled, onChange, loading }: {
  label: string; description: string; enabled: boolean; onChange: (v: boolean) => void; loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-noite-800/50 rounded-xl border border-white/5">
      <div className="flex-1 mr-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${enabled ? 'bg-conquista-500/20 text-conquista-400' : 'bg-energia-500/20 text-energia-400'}`}>
            {enabled ? '🟢 Ativo' : '🔴 Off'}
          </span>
        </div>
        <p className="text-sm text-noite-400 mt-1">{description}</p>
      </div>
      <button onClick={() => onChange(!enabled)} disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-conquista-500' : 'bg-noite-600'} ${loading ? 'opacity-50' : ''}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="p-5 bg-noite-800/50 rounded-xl border border-white/5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-noite-400 mt-1">{label}</div>
    </div>
  )
}

// ─── Room Editor Modal ───
function RoomEditorModal({ room, onSave, onClose }: {
  room: Partial<Room> | null; onSave: (data: Partial<Room>) => void; onClose: () => void
}) {
  const isNew = !room?.id
  const [form, setForm] = useState({
    name: room?.name || '',
    slug: room?.slug || '',
    description: room?.description || '',
    type: room?.type || 'publica',
    max_participants: room?.max_participants || 25,
    ficha_cost: room?.ficha_cost || 0,
    is_active: room?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const autoSlug = (name: string) => name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, ...(isNew ? { slug: autoSlug(name) } : {}) }))
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) return
    setSaving(true)
    await onSave({ ...room, ...form })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-noite-900 border border-white/10 rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">{isNew ? '➕ Nova Sala' : '✏️ Editar Sala'}</h2>
          <button onClick={onClose} className="text-noite-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-noite-400 font-medium uppercase tracking-wider mb-1 block">Nome</label>
            <input value={form.name} onChange={e => handleNameChange(e.target.value)}
              placeholder="🔥 Nome da Sala" className="w-full bg-noite-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-balada-500/50" />
          </div>

          {/* Slug */}
          <div>
            <label className="text-xs text-noite-400 font-medium uppercase tracking-wider mb-1 block">Slug (URL)</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="nome-da-sala" className="w-full bg-noite-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-balada-500/50" />
            <p className="text-[10px] text-noite-600 mt-1">Dica: use prefixo adult- para salas adultas, idioma- para idiomas</p>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-noite-400 font-medium uppercase tracking-wider mb-1 block">Descrição</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrição da sala..." rows={3}
              className="w-full bg-noite-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-balada-500/50" />
          </div>

          {/* Row: Max participants + Ficha cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-noite-400 font-medium uppercase tracking-wider mb-1 block">Max Participantes</label>
              <input type="number" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: parseInt(e.target.value) || 0 }))}
                className="w-full bg-noite-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-balada-500/50" />
            </div>
            <div>
              <label className="text-xs text-noite-400 font-medium uppercase tracking-wider mb-1 block">Custo (fichas)</label>
              <input type="number" value={form.ficha_cost} onChange={e => setForm(f => ({ ...f, ficha_cost: parseInt(e.target.value) || 0 }))}
                className="w-full bg-noite-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-balada-500/50" />
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-noite-800/50 rounded-xl border border-white/5">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 rounded border-noite-600 bg-noite-800 text-conquista-500" />
            <div>
              <span className="text-sm text-white font-medium">Sala Ativa</span>
              <p className="text-[11px] text-noite-500">Desmarque para ocultar a sala sem deletar</p>
            </div>
          </label>
        </div>

        <div className="p-5 border-t border-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-noite-400 hover:text-white hover:bg-white/5">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.slug.trim()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-balada-500 text-white hover:bg-balada-600 disabled:opacity-50 transition-colors">
            {saving ? 'Salvando...' : isNew ? 'Criar Sala' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───
export function AdminPage() {
  const navigate = useNavigate()
  const { profile, loading: authLoading, initialized } = useAuth()
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

  // Rooms state
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomFilter, setRoomFilter] = useState('Todas')
  const [roomSearch, setRoomSearch] = useState('')
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null)
  const [showRoomEditor, setShowRoomEditor] = useState(false)
  const [roomsLoading, setRoomsLoading] = useState(false)

  // Data state
  const [reports, setReports] = useState<Report[]>([])
  const [bans, setBans] = useState<UserBan[]>([])
  const [metrics, setMetrics] = useState({
    totalUsers: 0, onlineReal: 0, onlineSimulated: 0, totalRooms: 0, revenue: 0, pendingReports: 0,
  })

  // ─── Auth Guard ───
  useEffect(() => {
    // Wait until auth is fully initialized
    if (!initialized || authLoading) return
    
    if (!profile) {
      navigate('/')
      return
    }
    if (!profile.is_admin) {
      // Double-check from DB in case profile was cached without is_admin
      supabase.from('profiles').select('is_admin').eq('id', profile.id).single()
        .then(({ data }) => { if (!data?.is_admin) navigate('/') })
    }
  }, [profile, authLoading, initialized, navigate])

  // ─── Fetch Rooms (via admin API to bypass RLS) ───
  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true)
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      const res = await fetch('/api/admin-rooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRooms(data as Room[])
      } else {
        // Fallback to direct query
        const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: true })
        if (data) setRooms(data as Room[])
      }
    } catch {
      const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: true })
      if (data) setRooms(data as Room[])
    }
    setRoomsLoading(false)
  }, [])

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

  const fetchReports = useCallback(async () => {
    const { data } = await supabase.from('reports')
      .select('*, reporter:profiles!reporter_id(username), reported_user:profiles!reported_user_id(username)')
      .order('created_at', { ascending: false }).limit(50)
    if (data) setReports(data as any)
  }, [])

  const fetchBans = useCallback(async () => {
    const { data } = await supabase.from('user_bans').select('*, user:profiles!user_id(username)').order('created_at', { ascending: false })
    if (data) setBans(data as any)
  }, [])

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
      totalUsers: usersRes.count || 0, onlineReal: participantsRes.count || 0,
      onlineSimulated: simBase + Math.round(Math.random() * 30), totalRooms: roomsRes.count || 0,
      revenue: 0, pendingReports: reportsRes.count || 0,
    })
  }, [])

  useEffect(() => {
    fetchSettings(); fetchReports(); fetchBans(); fetchMetrics(); fetchRooms()
  }, [fetchSettings, fetchReports, fetchBans, fetchMetrics, fetchRooms])

  // ─── Room CRUD ───
  const handleSaveRoom = async (roomData: Partial<Room>) => {
    if (roomData.id) {
      // Update
      const { id, created_at, current_participants, ...updates } = roomData as any
      await supabase.from('rooms').update(updates).eq('id', id)
    } else {
      // Create
      const { id, created_at, current_participants, ...insert } = roomData as any
      await supabase.from('rooms').insert(insert)
    }
    setShowRoomEditor(false)
    setEditingRoom(null)
    fetchRooms()
  }

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Deletar sala "${roomName}"? Esta ação não pode ser desfeita.`)) return
    await supabase.from('rooms').delete().eq('id', roomId)
    fetchRooms()
  }

  const handleToggleRoom = async (roomId: string, isActive: boolean) => {
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      await fetch('/api/admin-rooms', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, is_active: !isActive })
      })
    } catch {
      await supabase.from('rooms').update({ is_active: !isActive }).eq('id', roomId)
    }
    fetchRooms()
  }

  // Filter rooms
  const filteredRooms = rooms.filter(r => {
    const cat = classifyRoom(r.slug)
    const matchCat = roomFilter === 'Todas' || cat === roomFilter
    const matchSearch = !roomSearch || r.name.toLowerCase().includes(roomSearch.toLowerCase()) || r.slug.includes(roomSearch.toLowerCase())
    return matchCat && matchSearch
  })

  // Group by category for display
  const roomsByCategory: Record<string, Room[]> = {}
  filteredRooms.forEach(r => {
    const cat = classifyRoom(r.slug)
    if (!roomsByCategory[cat]) roomsByCategory[cat] = []
    roomsByCategory[cat].push(r)
  })

  // Save settings
  const saveSetting = async (key: string, value: any) => {
    setSaving(true)
    await supabase.from('admin_settings').upsert({ key, value, updated_at: new Date().toISOString() })
    setSaving(false)
  }

  const updateColdStart = (field: keyof ColdStartSettings, val: boolean) => {
    const updated = { ...coldStart, [field]: val }; setColdStart(updated); saveSetting('cold_start', updated)
  }
  const updateGeneral = (field: keyof GeneralSettings, val: any) => {
    const updated = { ...general, [field]: val }; setGeneral(updated); saveSetting('general', updated)
  }
  const addBannedWord = () => {
    if (!newWord.trim()) return
    const updated = { ...moderation, banned_words: [...moderation.banned_words, newWord.trim().toLowerCase()] }
    setModeration(updated); saveSetting('moderation', updated); setNewWord('')
  }
  const removeBannedWord = (word: string) => {
    const updated = { ...moderation, banned_words: moderation.banned_words.filter(w => w !== word) }
    setModeration(updated); saveSetting('moderation', updated)
  }
  const resolveReport = async (id: string, status: string) => {
    await supabase.from('reports').update({ status, resolved_at: new Date().toISOString(), resolved_by: profile?.id }).eq('id', id)
    fetchReports()
  }
  const unbanUser = async (banId: string) => {
    await supabase.from('user_bans').delete().eq('id', banId); fetchBans()
  }

  if (authLoading) {
    return <div className="min-h-screen bg-noite-950 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-balada-500 border-t-transparent rounded-full" />
    </div>
  }

  return (
    <div className="min-h-screen bg-noite-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-noite-900 border-r border-white/5 p-4 flex flex-col shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-balada rounded-xl flex items-center justify-center text-xl">⚡</div>
          <div><h1 className="font-bold text-white text-lg">Admin</h1><p className="text-xs text-noite-400">Disque Amizade</p></div>
        </div>
        <nav className="flex-1 space-y-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${
                activeTab === tab.id ? 'bg-balada-500/15 text-balada-400 border border-balada-500/20' : 'text-noite-400 hover:text-white hover:bg-white/5'
              }`}>
              <span className="text-lg">{tab.icon}</span><span className="font-medium">{tab.label}</span>
              {tab.id === 'rooms' && <span className="ml-auto text-xs bg-noite-700 px-2 py-0.5 rounded-full text-noite-300">{rooms.length}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => navigate('/')} className="mt-4 w-full text-left px-4 py-3 rounded-xl text-noite-400 hover:text-white hover:bg-white/5 flex items-center gap-3">
          <span>←</span><span>Voltar ao site</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {saving && <div className="fixed top-4 right-4 bg-conquista-500/20 text-conquista-400 px-4 py-2 rounded-lg text-sm z-50">Salvando...</div>}

        {/* ─── COLD START ─── */}
        {activeTab === 'cold_start' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">🎛️ Cold Start</h2>
            <p className="text-noite-400 mb-6">Controles para fase inicial — simular atividade até ter massa crítica.</p>
            <div className="space-y-3 max-w-2xl">
              <Toggle label="Bots de Presença" description="Simular usuários online nas salas" enabled={coldStart.bots_presence} onChange={v => updateColdStart('bots_presence', v)} loading={saving} />
              <Toggle label="Contadores Inflados" description="Adicionar offset aos contadores" enabled={coldStart.inflated_counters} onChange={v => updateColdStart('inflated_counters', v)} loading={saving} />
              <Toggle label="Chat Automático" description="Gerar mensagens automáticas" enabled={coldStart.auto_chat} onChange={v => updateColdStart('auto_chat', v)} loading={saving} />
              <Toggle label="Modo Lobby" description="Mensagem amigável em salas vazias" enabled={coldStart.lobby_mode} onChange={v => updateColdStart('lobby_mode', v)} loading={saving} />
            </div>
          </div>
        )}

        {/* ─── ROOMS ─── */}
        {activeTab === 'rooms' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">🏠 Gerenciar Salas</h2>
                <p className="text-noite-400 text-sm mt-1">{rooms.length} salas total • {rooms.filter(r => r.is_active).length} ativas</p>
              </div>
              <button onClick={() => { setEditingRoom({}); setShowRoomEditor(true) }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-balada-500 text-white hover:bg-balada-600 transition-colors flex items-center gap-2">
                ➕ Nova Sala
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['Todas','Adulto/Sexual','Cidades','Idiomas','Bebida','Interesses','Faixa Etária','VIP','Geral'].map(cat => {
                const count = cat === 'Todas' ? rooms.length : rooms.filter(r => classifyRoom(r.slug) === cat).length
                return (
                  <button key={cat} onClick={() => setRoomFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      roomFilter === cat ? 'bg-balada-500/20 text-balada-400 border border-balada-500/30' : 'bg-noite-800 text-noite-400 border border-white/5 hover:text-white'
                    }`}>
                    {cat} <span className="ml-1 opacity-60">{count}</span>
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <div className="mb-4">
              <input value={roomSearch} onChange={e => setRoomSearch(e.target.value)} placeholder="🔍 Buscar por nome ou slug..."
                className="w-full max-w-md bg-noite-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-noite-500 focus:outline-none focus:border-balada-500/50" />
            </div>

            {roomsLoading ? (
              <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-balada-500 border-t-transparent rounded-full" /></div>
            ) : (
              <div className="space-y-6">
                {Object.entries(roomsByCategory).sort(([a],[b]) => a.localeCompare(b)).map(([category, catRooms]) => (
                  <div key={category}>
                    <h3 className="text-sm font-bold text-noite-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                      {category} <span className="text-noite-600 font-normal">({catRooms.length})</span>
                    </h3>
                    <div className="bg-noite-800/30 rounded-xl border border-white/5 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5 text-noite-500 text-xs uppercase tracking-wider">
                            <th className="text-left p-3">Nome</th>
                            <th className="text-left p-3 hidden md:table-cell">Slug</th>
                            <th className="text-center p-3">Max</th>
                            <th className="text-center p-3">Fichas</th>
                            <th className="text-center p-3">Status</th>
                            <th className="text-right p-3">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catRooms.map(room => (
                            <tr key={room.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="p-3">
                                <span className="text-white font-medium">{room.name}</span>
                                <p className="text-[11px] text-noite-500 mt-0.5 truncate max-w-xs">{room.description}</p>
                              </td>
                              <td className="p-3 hidden md:table-cell">
                                <code className="text-[11px] text-noite-500 bg-noite-800 px-1.5 py-0.5 rounded">{room.slug}</code>
                              </td>
                              <td className="p-3 text-center text-noite-300">{room.max_participants}</td>
                              <td className="p-3 text-center">
                                {room.ficha_cost > 0
                                  ? <span className="text-festa-400 font-medium">{room.ficha_cost} 🪙</span>
                                  : <span className="text-conquista-500 text-xs">Grátis</span>}
                              </td>
                              <td className="p-3 text-center">
                                <button onClick={() => handleToggleRoom(room.id, room.is_active)}
                                  className={`text-xs px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                                    room.is_active ? 'bg-conquista-500/20 text-conquista-400 hover:bg-conquista-500/30' : 'bg-energia-500/20 text-energia-400 hover:bg-energia-500/30'
                                  }`}>
                                  {room.is_active ? '🟢 Ativa' : '🔴 Off'}
                                </button>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => { setEditingRoom(room); setShowRoomEditor(true) }}
                                    className="px-2.5 py-1 rounded-lg text-xs text-balada-400 hover:bg-balada-500/10 transition-colors" title="Editar">
                                    ✏️
                                  </button>
                                  <button onClick={() => handleDeleteRoom(room.id, room.name)}
                                    className="px-2.5 py-1 rounded-lg text-xs text-energia-400 hover:bg-energia-500/10 transition-colors" title="Deletar">
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {filteredRooms.length === 0 && (
                  <div className="text-center py-12 text-noite-500">
                    <p className="text-4xl mb-3">🔍</p>
                    <p>Nenhuma sala encontrada.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── MODERATION ─── */}
        {activeTab === 'moderation' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">🛡️ Moderação</h2>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Denúncias Pendentes</h3>
              {reports.length === 0 ? <p className="text-noite-400 text-sm">Nenhuma denúncia.</p> : (
                <div className="bg-noite-800/50 rounded-xl border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/5 text-noite-400">
                      <th className="text-left p-3">De</th><th className="text-left p-3">Contra</th>
                      <th className="text-left p-3">Motivo</th><th className="text-left p-3">Data</th>
                      <th className="text-left p-3">Status</th><th className="text-left p-3">Ações</th>
                    </tr></thead>
                    <tbody>{reports.map(r => (
                      <tr key={r.id} className="border-b border-white/5">
                        <td className="p-3 text-white">{(r.reporter as any)?.username || '—'}</td>
                        <td className="p-3 text-white">{(r.reported_user as any)?.username || '—'}</td>
                        <td className="p-3 text-noite-300">{r.reason}</td>
                        <td className="p-3 text-noite-400">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'pending' ? 'bg-festa-400/20 text-festa-400' : 'bg-conquista-500/20 text-conquista-400'}`}>{r.status}</span></td>
                        <td className="p-3">{r.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => resolveReport(r.id, 'resolved')} className="text-conquista-400 hover:underline text-xs">Resolver</button>
                            <button onClick={() => resolveReport(r.id, 'dismissed')} className="text-noite-400 hover:underline text-xs">Dispensar</button>
                          </div>
                        )}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Banidos</h3>
              {bans.length === 0 ? <p className="text-noite-400 text-sm">Nenhum ban ativo.</p> : (
                <div className="space-y-2">{bans.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-noite-800/50 rounded-xl border border-white/5">
                    <div>
                      <span className="text-white font-medium">{(b.user as any)?.username || b.user_id}</span>
                      <span className="text-noite-400 text-sm ml-2">— {b.reason || 'Sem motivo'}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${b.ban_type === 'permanent' ? 'bg-energia-500/20 text-energia-400' : 'bg-festa-400/20 text-festa-400'}`}>{b.ban_type}</span>
                    </div>
                    <button onClick={() => unbanUser(b.id)} className="text-sm text-conquista-400 hover:underline">Desbanir</button>
                  </div>
                ))}</div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Palavras Proibidas</h3>
              <div className="flex gap-2 mb-3">
                <input value={newWord} onChange={e => setNewWord(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBannedWord()}
                  placeholder="Adicionar palavra..." className="flex-1 bg-noite-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-noite-500 focus:outline-none focus:border-balada-500/50" />
                <button onClick={addBannedWord} className="px-4 py-2 bg-balada-500 text-white rounded-lg text-sm hover:bg-balada-600">Adicionar</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {moderation.banned_words.map(word => (
                  <span key={word} className="flex items-center gap-1 px-3 py-1 bg-energia-500/10 text-energia-400 rounded-full text-sm">
                    {word}<button onClick={() => removeBannedWord(word)} className="ml-1 hover:text-white">×</button>
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
              <MetricCard icon="🟢" label="Online (real)" value={metrics.onlineReal} />
              <MetricCard icon="🤖" label="Online (simulado)" value={metrics.onlineSimulated} />
              <MetricCard icon="🏠" label="Salas ativas" value={metrics.totalRooms} />
              <MetricCard icon="💰" label="Revenue (fichas)" value={metrics.revenue} />
              <MetricCard icon="🚨" label="Denúncias" value={metrics.pendingReports} />
            </div>
          </div>
        )}

        {/* ─── SETTINGS ─── */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">⚙️ Configurações</h2>
            <div className="space-y-3 max-w-2xl">
              <Toggle label="Modo Manutenção" description="Desativa o site para não-admins" enabled={general.maintenance_mode} onChange={v => updateGeneral('maintenance_mode', v)} loading={saving} />
              <Toggle label="Registro Aberto" description="Permite novos cadastros" enabled={general.registration_open} onChange={v => updateGeneral('registration_open', v)} loading={saving} />
              <div className="p-4 bg-noite-800/50 rounded-xl border border-white/5">
                <label className="block font-semibold text-white mb-2">Máximo de Salas</label>
                <p className="text-sm text-noite-400 mb-3">Limite de salas ativas</p>
                <input type="number" value={general.max_rooms} onChange={e => updateGeneral('max_rooms', parseInt(e.target.value) || 0)}
                  className="bg-noite-800 border border-white/10 rounded-lg px-3 py-2 text-white w-32 focus:outline-none focus:border-balada-500/50" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Room Editor Modal */}
      {showRoomEditor && (
        <RoomEditorModal room={editingRoom} onSave={handleSaveRoom} onClose={() => { setShowRoomEditor(false); setEditingRoom(null) }} />
      )}
    </div>
  )
}
