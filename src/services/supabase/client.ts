import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Use placeholder if env vars are missing or not valid URLs
const isValidUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
const supabaseUrl = isValidUrl ? rawUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = isValidUrl ? rawKey : 'placeholder-key'

// Custom fetch with longer timeout for mobile
const mobileFetch: typeof fetch = (input, init) => {
  // Skip AbortSignal timeout on mobile — Safari aborts too aggressively
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000) // 15s instead of default ~5s
  return fetch(input, {
    ...init,
    signal: init?.signal || controller.signal,
  }).finally(() => clearTimeout(timeout))
}

// Create client even with placeholder values for development
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: mobileFetch,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
