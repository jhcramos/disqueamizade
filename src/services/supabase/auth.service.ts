import { supabase } from './client'

export const authService = {
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, username: string, options?: { is_creator?: boolean; birth_date?: string }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
          is_creator: options?.is_creator ?? false,
          birth_date: options?.birth_date || null,
        },
      },
    })

    // Rate limit on email sending is non-fatal — user may still be created
    if (authError) {
      const isRateLimit = authError.message?.toLowerCase().includes('rate limit') 
        || authError.status === 429
        || authError.message?.toLowerCase().includes('email rate')
      
      if (!isRateLimit) throw authError
      
      // Rate limited but user might exist — try to sign in directly
      console.warn('Email rate limited, attempting direct sign-in...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw new Error('Cadastro com rate limit. Tente fazer login com suas credenciais.')
      return signInData
    }

    if (!authData.user) throw new Error('No user returned from signup')

    // Auto-confirm email via server-side admin API
    try {
      await fetch('/api/confirm-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authData.user.id }),
      })
    } catch (e) {
      console.warn('Auto-confirm failed:', e)
    }

    // Now sign in immediately (email is confirmed)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.warn('Auto sign-in after signup failed:', signInError.message)
    }

    // Try to create profile — use API route to bypass RLS
    const profileData = {
      username,
      display_name: username,
      is_creator: options?.is_creator ?? false,
      is_vip: false,
      is_elite: false,
      saldo_fichas: 50,
      total_earned: 0,
    }

    const activeSession = signInData?.session || (await supabase.auth.getSession()).data.session

    try {
      // First try direct upsert
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: authData.user.id, ...profileData }, { onConflict: 'id' })

      if (profileError) {
        console.warn('Direct upsert failed, trying API route:', profileError.message)
        const token = activeSession?.access_token
        if (token) {
          await fetch('/api/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...profileData, _mode: 'upsert' }),
          })
        }
      }
    } catch (e) {
      console.warn('Profile creation deferred:', e)
    }

    return signInData || authData
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return data
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
