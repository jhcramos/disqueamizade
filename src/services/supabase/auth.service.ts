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

    if (authError) throw authError
    if (!authData.user) throw new Error('No user returned from signup')

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

    try {
      // First try direct upsert
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: authData.user.id, ...profileData }, { onConflict: 'id' })

      if (profileError) {
        console.warn('Direct upsert failed, trying API route:', profileError.message)
        // Fallback: API route with service role
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
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

    return authData
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
