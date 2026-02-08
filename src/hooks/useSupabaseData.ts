import { useState, useEffect } from 'react'
import { supabase } from '@/services/supabase/client'
import { databaseService } from '@/services/supabase/database.service'

// Check if Supabase is properly configured (not placeholder)
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || ''
  return url.startsWith('https://') && !url.includes('placeholder')
}

/** Fetch rooms from Supabase with participant counts */
export function useRooms() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      setError('not-configured')
      return
    }

    databaseService.getRooms()
      .then((data) => {
        if (data && data.length > 0) {
          setRooms(data)
        } else {
          setError('empty')
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { rooms, loading, error }
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
        setStats({
          totalRooms: roomsRes.count || 0,
          totalOnline: participantsRes.count || 0,
          totalCreators: creatorsRes.count || 0,
          totalLive: 0,
        })
      } catch { /* ignore */ }
    }
    fetchStats()
  }, [])

  return stats
}
