import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { RoomsPage } from './pages/RoomsPage'
import { RoomPage } from './pages/RoomPage'
import { ProfilePage } from './pages/ProfilePage'
import { MarketplacePage } from './pages/MarketplacePage'
import { PricingPage } from './pages/PricingPage'
import { AuthPage } from './pages/AuthPage'
import { SecretCabinsPage } from './pages/SecretCabinsPage'
import { VideoFiltersPage } from './pages/VideoFiltersPage'
import { ComponentsShowcase } from './pages/ComponentsShowcase'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import { Loading } from './components/common/Loading'

function App() {
  const { initialized } = useAuth()

  // Show loading screen while initializing auth
  if (!initialized) {
    return <Loading message="Inicializando..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 mesh-gradient">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/pricing" element={<PricingPage />} />

        {/* Protected routes */}
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <RoomsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <ProtectedRoute>
              <RoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <MarketplacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/secret-cabins"
          element={
            <ProtectedRoute>
              <SecretCabinsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video-filters"
          element={
            <ProtectedRoute>
              <VideoFiltersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/components" element={<ComponentsShowcase />} />

        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
