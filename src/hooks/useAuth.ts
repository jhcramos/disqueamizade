import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'

export const useAuth = () => {
  const {
    user,
    profile,
    loading,
    initialized,
    isGuest,
    signIn,
    signUp,
    signInWithGoogle,
    signInAsGuest,
    signOut,
    initialize,
    updateProfile,
  } = useAuthStore()

  // Initialize auth on mount
  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])

  const isAuthenticated = !!user
  const isSubscriber = profile?.subscription_tier !== 'free'
  const isPremium = profile?.subscription_tier === 'premium'

  return {
    user,
    profile,
    loading,
    initialized,
    isAuthenticated,
    isSubscriber,
    isPremium,
    isGuest,
    signIn,
    signUp,
    signInWithGoogle,
    signInAsGuest,
    signOut,
    updateProfile,
  }
}
