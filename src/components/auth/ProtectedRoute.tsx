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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Carregando...</p>
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
