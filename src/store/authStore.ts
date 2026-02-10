import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { authService } from '@/services/supabase/auth.service'
import { databaseService } from '@/services/supabase/database.service'
import { presenceService } from '@/services/supabase/presence.service'

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
  signInAsGuest: () => void
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
      sessionStorage.removeItem('guest_session')
      set({ isGuest: false })

      const { user } = await authService.signIn(email, password)

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
      sessionStorage.removeItem('guest_session')
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

  signInAsGuest: () => {
    const guestId = `guest-${Date.now()}`
    const guestUser = {
      id: guestId,
      email: 'guest@disqueamizade.com',
      app_metadata: {},
      user_metadata: { username: 'Convidado', can_chat: false, can_video: false },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User

    const guestProfile: Profile = {
      id: guestId,
      username: 'Convidado',
      subscription_tier: 'free',
      is_online: true,
      is_featured: false,
      stars_balance: 50,
      fichas_balance: 50,
      saldo_fichas: 50,
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

    sessionStorage.setItem('guest_session', JSON.stringify({ user: guestUser, profile: guestProfile }))
    set({ user: guestUser, profile: guestProfile, isGuest: true })
  },

  signOut: async () => {
    set({ loading: true })
    try {
      const { user, isGuest } = get()

      if (isGuest) {
        sessionStorage.removeItem('guest_session')
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
    set({ loading: true })
    // Safety timeout — never leave user stuck on loading
    const safetyTimeout = setTimeout(() => {
      const state = get()
      if (!state.initialized) {
        console.warn('Auth init timeout — forcing initialized')
        // Try restoring guest session as fallback
        const guestData = sessionStorage.getItem('guest_session')
        if (guestData) {
          try {
            const { user: gu, profile: gp } = JSON.parse(guestData)
            set({ user: gu, profile: gp, isGuest: true, initialized: true, loading: false })
            return
          } catch { /* ignore */ }
        }
        set({ initialized: true, loading: false })
      }
    }, 5000)
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const isPlaceholder = !supabaseUrl || !supabaseKey
        || supabaseUrl.includes('placeholder')
        || supabaseUrl.includes('your_')
        || !supabaseUrl.startsWith('http')

      if (isPlaceholder) {
        console.warn('⚠️ Supabase not configured. Running in demo mode.')
        const guestData = sessionStorage.getItem('guest_session')
        if (guestData) {
          try {
            const { user, profile } = JSON.parse(guestData)
            set({ user, profile, isGuest: true, initialized: true, loading: false })
            return
          } catch { /* ignore parse errors */ }
        }
        set({ initialized: true, loading: false })
        return
      }

      // Check for real Supabase session first — always takes priority over guest
      const session = await authService.getSession()

      if (session?.user) {
        // Real user logged in — clear any stale guest session
        sessionStorage.removeItem('guest_session')
        let profile: Profile | null = null
        try {
          profile = await databaseService.getProfile(session.user.id)
        } catch {
          const meta = session.user.user_metadata || {}
          profile = await databaseService.upsertProfile(session.user.id, {
            username: meta.username || meta.display_name || session.user.email?.split('@')[0] || 'Usuário',
            display_name: meta.display_name || meta.username || session.user.email?.split('@')[0] || 'Usuário',
            is_creator: meta.is_creator ?? false,
            is_vip: false,
            is_elite: false,
            saldo_fichas: 50,
            total_earned: 0,
          })
        }
        set({ user: session.user, profile, isGuest: false })

        // Set online status (non-blocking)
        presenceService.setOnlineStatus(session.user.id, true).catch(() => {})
      } else {
        // No real session — restore guest if exists
        const guestData = sessionStorage.getItem('guest_session')
        if (guestData) {
          try {
            const { user: gu, profile: gp } = JSON.parse(guestData)
            set({ user: gu, profile: gp, isGuest: true })
          } catch { /* ignore */ }
        }
      }

      // Listen to auth state changes
      authService.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Real auth — clear guest
          sessionStorage.removeItem('guest_session')
          set({ isGuest: false })
          let profile: Profile | null = null
          try {
            profile = await databaseService.getProfile(session.user.id)
          } catch {
            const meta = session.user.user_metadata || {}
            profile = await databaseService.upsertProfile(session.user.id, {
              username: meta.username || meta.display_name || session.user.email?.split('@')[0] || 'Usuário',
              display_name: meta.display_name || meta.username || session.user.email?.split('@')[0] || 'Usuário',
              is_creator: meta.is_creator ?? false,
              is_vip: false,
              is_elite: false,
              saldo_fichas: 50,
              total_earned: 0,
            })
          }
          set({ user: session.user, profile })
          await presenceService.setOnlineStatus(session.user.id, true)
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null })
        }
      })

      clearTimeout(safetyTimeout)
      set({ initialized: true })
    } catch (error) {
      console.error('Initialize error:', error)
      clearTimeout(safetyTimeout)
      set({ initialized: true })
    } finally {
      set({ loading: false })
    }
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
