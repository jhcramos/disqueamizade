import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { RoomsPage } from './pages/RoomsPage'
import { MarketplacePage } from './pages/MarketplacePage'
import { PricingPage } from './pages/PricingPage'
import { ProfilePage } from './pages/ProfilePage'
import { HobbiesPage } from './pages/HobbiesPage'
import { AuthPage } from './pages/AuthPage'
import { RoomPage } from './pages/RoomPage'
import { SecretCabinsPage } from './pages/SecretCabinsPage'
import { VideoFiltersPage } from './pages/VideoFiltersPage'
import { RoulettePage } from './pages/RoulettePage'
import { InfluencerDashboardPage } from './pages/InfluencerDashboardPage'
import { StoriesPage } from './pages/StoriesPage'
import { ExclusivePage } from './pages/ExclusivePage'
import { MobileNav } from './components/common/MobileNav'
import { ToastContainer } from './components/common/ToastContainer'
import { useAuthStore } from './store/authStore'

function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="min-h-screen bg-dark-950 text-white nostalgia-bg">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/roulette" element={<RoulettePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/hobbies" element={<HobbiesPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/cabines" element={<SecretCabinsPage />} />
        <Route path="/filtros" element={<VideoFiltersPage />} />
        <Route path="/creator" element={<InfluencerDashboardPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/exclusive" element={<ExclusivePage />} />
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <MobileNav />
      <ToastContainer />
    </div>
  )
}

export default App
