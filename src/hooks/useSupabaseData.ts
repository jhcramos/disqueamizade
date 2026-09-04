import { useState, useEffect } from 'react'
import { supabase } from '@/services/supabase/client'
import { databaseService } from '@/services/supabase/database.service'

// Check if Supabase is properly configured (not placeholder)
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || ''
  return url.startsWith('https://') && !url.includes('placeholder')
}

/**
 * Fetch cold-start settings from admin_settings table.
 * Caches in localStorage with 5-min TTL.
 */
type ColdStartConfig = {
  lobby_mode: boolean
}

const COLD_START_CACHE_KEY = 'disque_cold_start_settings'
const COLD_START_TTL = 5 * 60 * 1000 // 5 min

function getCachedColdStart(): ColdStartConfig | null {
  try {
    const raw = localStorage.getItem(COLD_START_CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > COLD_START_TTL) return null
    return { lobby_mode: data?.lobby_mode !== false }
  } catch { return null }
}

export function useColdStartSettings() {
  const [settings, setSettings] = useState<ColdStartConfig>({
    lobby_mode: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getCachedColdStart()
    if (cached) {
      setSettings(cached)
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured()) { setLoading(false); return }

    const fetchColdStart = async () => {
      try {
        const { data } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'cold_start')
          .single()
        if (data?.value) {
          const val: ColdStartConfig = { lobby_mode: data.value.lobby_mode !== false }
          setSettings(val)
          localStorage.setItem(COLD_START_CACHE_KEY, JSON.stringify({ data: val, ts: Date.now() }))
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetchColdStart()
  }, [])

  return { settings, loading }
}

/** Fetch rooms from Supabase with participant counts */
export function useRooms() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  const refetch = () => setTrigger(t => t + 1)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      setError('not-configured')
      return
    }

    setLoading(true)
    databaseService.getRooms()
      .then((data) => {
        if (data && data.length > 0) {
          const enriched = data.map((room: any) => ({
            ...room,
            current_participants: Math.max(0, Number(room.current_participants) || 0),
          }))
          setRooms(enriched)
        } else {
          setError('empty')
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [trigger])

  return { rooms, loading, error, refetch }
}

/** Fetch aggregate stats from Supabase */
export function useStats() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalOnline: 0,
  })
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const fetchStats = async () => {
      try {
        const [roomsRes, participantsRes] = await Promise.all([
          supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('room_participants').select('id', { count: 'exact', head: true }),
        ])
        const realOnline = participantsRes.count || 0
        
        // Plano V4 (0.5): somente números reais. Nada de contadores simulados.
        setStats({
          totalRooms: roomsRes.count || 0,
          totalOnline: realOnline,
        })
      } catch { /* ignore */ }
    }
    fetchStats()
  }, [])

  return stats
}
