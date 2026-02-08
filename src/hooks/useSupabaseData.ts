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
  bots_presence: boolean
  inflated_counters: boolean
  auto_chat: boolean
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
    return data
  } catch { return null }
}

export function useColdStartSettings() {
  const [settings, setSettings] = useState<ColdStartConfig>({
    bots_presence: true, inflated_counters: true, auto_chat: true, lobby_mode: true,
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
          const val = data.value as ColdStartConfig
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

/**
 * Simulated presence for cold-start phase.
 * Generates a deterministic but time-varying "base" participant count per room.
 * Uses room slug as seed + current hour to create natural-looking fluctuation.
 * Popular rooms (Geral, SP, Rio) get higher base counts.
 * Gradually decrease as real users join (pass realCount to reduce offset).
 */
function getSimulatedPresence(roomSlug: string, roomName: string, realCount: number): number {
  // Hash the slug to get a stable seed
  let hash = 0
  for (let i = 0; i < roomSlug.length; i++) {
    hash = ((hash << 5) - hash) + roomSlug.charCodeAt(i)
    hash |= 0
  }
  
  // Time-based variation (changes every 10 min for natural feel)
  const now = new Date()
  const timeSeed = Math.floor(now.getTime() / 600000) // 10-min blocks
  const hourBR = (now.getUTCHours() - 3 + 24) % 24 // Brazil time (UTC-3)
  
  // Time-of-day multiplier (peak: 19-23h BR, low: 3-8h BR)
  let timeMultiplier = 0.4
  if (hourBR >= 19 && hourBR <= 23) timeMultiplier = 1.0
  else if (hourBR >= 14 && hourBR < 19) timeMultiplier = 0.7
  else if (hourBR >= 9 && hourBR < 14) timeMultiplier = 0.5
  else if (hourBR >= 0 && hourBR < 3) timeMultiplier = 0.8
  
  // Room popularity tiers
  const name = roomName.toLowerCase()
  let basePop = 5
  if (name.includes('geral') || name.includes('são paulo') || name.includes('rio de janeiro')) basePop = 18
  else if (name.includes('belo horizonte') || name.includes('salvador') || name.includes('brasília') || name.includes('curitiba') || name.includes('fortaleza')) basePop = 12
  else if (name.includes('game') || name.includes('music') || name.includes('música')) basePop = 10
  else if (name.includes('20') || name.includes('30')) basePop = 8
  
  // Pseudo-random variation using hash + timeSeed
  const variation = Math.abs((hash * 2654435761 + timeSeed * 40503) % 100) / 100 // 0-1
  const simulated = Math.round(basePop * timeMultiplier * (0.6 + variation * 0.8))
  
  // Reduce simulated count as real users join (fade out bots)
  const fadeOut = Math.max(0, simulated - realCount * 3)
  
  return Math.max(1, fadeOut) // Always show at least 1
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
            current_participants: (room.current_participants || 0) + 
              getSimulatedPresence(room.slug || room.id, room.name || '', room.current_participants || 0)
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

/** Fetch ficha packages from Supabase */
export function useFichaPackages() {
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    databaseService.getFichaPackages()
      .then((data) => {
        if (data && data.length > 0) setPackages(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { packages, loading }
}

/** Fetch creator profiles from Supabase */
export function useCreators() {
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    const fetchCreators = async () => {
      try {
        const { data, error: err } = await supabase
          .from('creator_profiles')
          .select('*, profile:profiles(*)')
        if (err) {
          setError(err.message)
        } else if (data) {
          setCreators(data)
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetchCreators()
  }, [])

  return { creators, loading, error }
}

/** Fetch aggregate stats from Supabase */
export function useStats() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalOnline: 0,
    totalCreators: 0,
    totalLive: 0,
  })

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const fetchStats = async () => {
      try {
        const [roomsRes, participantsRes, creatorsRes] = await Promise.all([
          supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('room_participants').select('id', { count: 'exact', head: true }),
          supabase.from('creator_profiles').select('id', { count: 'exact', head: true }),
        ])
        const realOnline = participantsRes.count || 0
        // Simulated total online = sum of base presence across rooms
        const hourBR = (new Date().getUTCHours() - 3 + 24) % 24
        let simOnline = 85 // base
        if (hourBR >= 19 && hourBR <= 23) simOnline = 180
        else if (hourBR >= 14 && hourBR < 19) simOnline = 120
        else if (hourBR >= 0 && hourBR < 3) simOnline = 140
        else if (hourBR >= 9 && hourBR < 14) simOnline = 95

        // Add time variation
        const variation = Math.abs(Math.sin(Date.now() / 600000)) * 30
        
        setStats({
          totalRooms: roomsRes.count || 0,
          totalOnline: realOnline + Math.round(simOnline + variation),
          totalCreators: (creatorsRes.count || 0) + 3, // show at least a few
          totalLive: Math.round(2 + variation / 10),
        })
      } catch { /* ignore */ }
    }
    fetchStats()
  }, [])

  return stats
}
