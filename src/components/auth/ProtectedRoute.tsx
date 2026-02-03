import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  requireSubscription?: boolean
  requirePremium?: boolean
}

export const ProtectedRoute = ({
  children,
  requireSubscription = false,
  requirePremium = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated, isSubscriber, isPremium, initialized } = useAuth()

  // Wait for auth to initialize
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            <p className="text-xl text-gray-400">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  // Requires subscription but user is free
  if (requireSubscription && !isSubscriber) {
    return <Navigate to="/pricing" replace />
  }

  // Requires premium but user is not premium
  if (requirePremium && !isPremium) {
    return <Navigate to="/pricing" replace />
  }

  return <>{children}</>
}
