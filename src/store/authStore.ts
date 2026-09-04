import { create } from 'zustand'
import { supabase } from '@/services/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { authService } from '@/services/supabase/auth.service'
import { databaseService } from '@/services/supabase/database.service'
import { presenceService } from '@/services/supabase/presence.service'

// Apenas o apelido fica neste cache. A sessão e o UUID são geridos pelo Supabase Auth.
const GUEST_KEY = 'guest_session'
const GUEST_TTL = 30 * 24 * 60 * 60 * 1000
const NICK_ADJ = ['Alegre', 'Tranquilo', 'Curioso', 'Gente-Boa', 'Sorridente', 'Animado', 'Zen', 'Fera', 'Nobre', 'Cheio-de-Vibe']

function randomNick(): string {
  const a = NICK_ADJ[Math.floor(Math.random() * NICK_ADJ.length)]
  return `${a}${Math.floor(1000 + Math.random() * 9000)}`
}

function readGuest(): { user: any; profile: any } | null {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && (!parsed.ts || Date.now() - parsed.ts < GUEST_TTL)) return { user: parsed.user, profile: parsed.profile }
    }
  } catch { /* ignore */ }
  try {
    const legacy = sessionStorage.getItem(GUEST_KEY)
    if (legacy) return JSON.parse(legacy)
  } catch { /* ignore */ }
  return null
}

function writeGuest(_user: User, profile: Profile) {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify({ profile: { username: profile.username }, ts: Date.now() })) } catch { /* ignore */ }
}

function clearGuest() {
  try { localStorage.removeItem(GUEST_KEY) } catch { /* ignore */ }
  try { sessionStorage.removeItem(GUEST_KEY) } catch { /* ignore */ }
}


let guestSignIn: Promise<void> | null = null
let initialization: Promise<void> | null = null
let authListenerInstalled = false

function guestProfile(user: User): Profile {
  const nick = String(user.user_metadata?.username || 'Convidado').trim().slice(0, 24)
  return {
    id: user.id,
    username: nick,
    subscription_tier: 'free',
    is_online: true,
    is_featured: false,
    stars_balance: 0,
    fichas_balance: 0,
    saldo_fichas: 0,
    is_ostentacao: false,
    is_creator: false,
    is_vip: false,
    is_elite: false,
    creator_verified: false,
    is_service_provider: false,
    total_earnings_stars: 0,
    total_earnings_fichas: 0,
    total_earned: 0,
    total_spent_fichas: 0,
    total_services_completed: 0,
    rooms_visited: 0,
    messages_sent: 0,
    games_played: 0,
    time_online_minutes: 0,
    badges: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

}

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  isGuest: boolean

  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, options?: { is_creator?: boolean; birth_date?: string }) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInAsGuest: (nickname?: string) => Promise<void>
  setGuestNickname: (name: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,
  isGuest: false,

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      // Clear any guest session first
      clearGuest()
      set({ isGuest: false })

      // Retry up to 2 times on network failures (mobile Safari flakiness)
      let result
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) await new Promise(r => setTimeout(r, 1000))
          result = await authService.signIn(email, password)
          break
        } catch (err: any) {
          const msg = err?.message?.toLowerCase() || ''
          const isNetwork = msg.includes('aborted') || msg.includes('load failed') || msg.includes('fetch') || msg.includes('network') || err?.name === 'AbortError' || err?.name === 'TypeError'
          if (!isNetwork || attempt === 2) throw err
          console.warn(`Sign in attempt ${attempt + 1} failed (${msg}), retrying...`)
        }
      }
      const { user } = result!

      if (user) {
        let profile: Profile | null = null
        try {
          profile = await databaseService.getProfile(user.id)
        } catch {
          // Profile doesn't exist yet — create from user metadata
          const meta = user.user_metadata || {}
          profile = await databaseService.upsertProfile(user.id, {
            username: meta.username || meta.display_name || user.email?.split('@')[0] || 'Usuário',
            display_name: meta.display_name || meta.username || user.email?.split('@')[0] || 'Usuário',
            is_creator: meta.is_creator ?? false,
            is_vip: false,
            is_elite: false,
            saldo_fichas: 50,
            total_earned: 0,
          })
        }
        set({ user, profile })

        // Set online status
        await presenceService.setOnlineStatus(user.id, true)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email: string, password: string, username: string, options?: { is_creator?: boolean; birth_date?: string }) => {
    set({ loading: true })
    try {
      // Clear any guest session first
      clearGuest()
      set({ isGuest: false })

      const result = await authService.signUp(email, password, username, options)
      const user = result?.user

      if (user) {
        // signUp now auto-confirms + auto-signs-in, so session should be active
        let profile: Profile | null = null
        try {
          profile = await databaseService.getProfile(user.id)
        } catch {
          // Profile might not exist yet — create it
          try {
            const meta = user.user_metadata || {}
            profile = await databaseService.upsertProfile(user.id, {
              username: meta.username || username,
              display_name: meta.display_name || username,
              is_creator: options?.is_creator ?? false,
              is_vip: false,
              is_elite: false,
              saldo_fichas: 50,
              total_earned: 0,
            })
          } catch {
            // Will load on next page visit
          }
        }
        set({ user, profile, isGuest: false })
        await presenceService.setOnlineStatus(user.id, true)
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true })
    try {
      await authService.signInWithGoogle()
      // User and profile will be set by onAuthStateChange
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signInAsGuest: async (nickname?: string) => {
    if (guestSignIn) return guestSignIn
    guestSignIn = (async () => {
      set({ loading: true })
      try {
        const session = await authService.getSession()
        let user = session?.user
        if (!user) {
          // Migra apenas o apelido antigo. A identidade é emitida pelo Supabase Auth.
          const cached = readGuest()
          const nick = (nickname?.trim() || cached?.profile?.username || randomNick()).slice(0, 24)
          const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { username: nick } } })
          if (error || !data.user) throw new Error('Não foi possível entrar como convidado. Tente novamente em instantes.')
          user = data.user
        }
        if (!user) throw new Error('Não foi possível iniciar sua sessão.')
        if (user.is_anonymous) {
          const profile = guestProfile(user)
          writeGuest(user, profile)
          set({ user, profile, isGuest: true })
        } else {
          set({ user, isGuest: false })
        }
      } finally { set({ loading: false }) }
    })()
    try { await guestSignIn } finally { guestSignIn = null }
  },

  setGuestNickname: async (name: string) => {
    const { user, isGuest } = get()
    const nick = name.trim().slice(0, 24)
    if (!isGuest || !user || !nick) return
    const { data, error } = await supabase.auth.updateUser({ data: { username: nick } })
    if (error || !data.user) throw new Error('Não foi possível atualizar o apelido.')
    const profile = guestProfile(data.user)
    writeGuest(data.user, profile)
    set({ user: data.user, profile })
  },

  signOut: async () => {
    set({ loading: true })
    try {
      if (guestSignIn) await guestSignIn.catch(() => {})
      const { user, isGuest } = get()

      if (isGuest) {
        clearGuest()
        await authService.signOut()
        set({ user: null, profile: null, isGuest: false, loading: false })
        return
      }

      if (user) {
        // Set offline status
        await presenceService.setOnlineStatus(user.id, false)
      }

      await authService.signOut()
      set({ user: null, profile: null })
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  initialize: async () => {
    if (get().initialized) return
    if (initialization) return initialization
    initialization = (async () => {
      set({ loading: true })
      let revision = 0
      const hydrate = async (user: User | null, currentRevision = ++revision) => {
        if (currentRevision !== revision) return
        if (!user) { set({ user: null, profile: null, isGuest: false }); return }
        if (user.is_anonymous) {
          const profile = guestProfile(user)
          writeGuest(user, profile)
          set({ user, profile, isGuest: true })
          return
        }
        clearGuest()
        set({ user, profile: null, isGuest: false })
        let profile: Profile | null = null
        try { profile = await databaseService.getProfile(user.id) } catch {
          const meta = user.user_metadata || {}
          try {
            profile = await databaseService.upsertProfile(user.id, {
              username: meta.username || meta.display_name || user.email?.split('@')[0] || 'Usuário',
              display_name: meta.display_name || meta.username || user.email?.split('@')[0] || 'Usuário',
            })
          } catch { /* A sessão continua válida mesmo se o perfil estiver indisponível. */ }
        }
        if (currentRevision === revision) set({ profile })
      }
      try {
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) return
        if (!authListenerInstalled) {
          authListenerInstalled = true
          authService.onAuthStateChange((_event, session) => {
            // Não chama APIs de Auth dentro do callback, que mantém o lock da sessão.
            const eventRevision = ++revision
            setTimeout(() => { void hydrate(session?.user ?? null, eventRevision) }, 0)
          })
        }
        const revisionBeforeRead = revision
        const session = await authService.getSession()
        if (revisionBeforeRead === revision) await hydrate(session?.user ?? null)
      } catch {
        set({ user: null, profile: null, isGuest: false })
      } finally { set({ initialized: true, loading: false }) }
    })()
    try { await initialization } finally { initialization = null }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user, profile } = get()
    if (!user || !profile) return

    set({ loading: true })
    try {
      const updatedProfile = await databaseService.updateProfile(user.id, updates)
      set({ profile: updatedProfile })
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))
