import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute = ({
  children,
}: ProtectedRouteProps) => {
  const { isAuthenticated, initialized } = useAuth()
  const location = useLocation()

  // Wait for auth to initialize (with timeout fallback)
  if (!initialized) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="bg-dark-900 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xl text-dark-400">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated — redirect to auth, saving intended destination
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
