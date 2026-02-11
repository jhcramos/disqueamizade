import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Use placeholder if env vars are missing or not valid URLs
const isValidUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
const supabaseUrl = isValidUrl ? rawUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = isValidUrl ? rawKey : 'placeholder-key'

// Create client even with placeholder values for development
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'implicit',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
