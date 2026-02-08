import { supabase } from './client'

export const authService = {
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, username: string, options?: { is_creator?: boolean }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
          is_creator: options?.is_creator ?? false,
        },
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No user returned from signup')

    // Try to create profile (may fail if email not confirmed yet — trigger handles it)
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          username,
          display_name: username,
          is_creator: options?.is_creator ?? false,
          is_vip: false,
          is_elite: false,
          saldo_fichas: 50,
          total_earned: 0,
        }, { onConflict: 'id' })

      if (profileError) {
        console.warn('Profile creation deferred (will be created on first login):', profileError.message)
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
