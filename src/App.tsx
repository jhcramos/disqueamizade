import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePageV3 from './pages/HomePageV3'
import { RoomsPage } from './pages/RoomsPage'
import { MarketplacePage } from './pages/MarketplacePage'
import { PricingPage } from './pages/PricingPage'
import { ProfilePage } from './pages/ProfilePage'
import { AuthPage } from './pages/AuthPage'
import { RoomPage } from './pages/RoomPage'
import { VideoFiltersPage } from './pages/VideoFiltersPage'
import { RoulettePage } from './pages/RoulettePage'
import { InfluencerDashboardPage } from './pages/InfluencerDashboardPage'
import PistaPage from './pages/PistaPage'
import DesignSystemPage from './pages/DesignSystemPage'
import { MobileNav } from './components/common/MobileNav'
import { ToastContainer } from './components/common/ToastContainer'
import { useAuthStore } from './store/authStore'

function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="min-h-screen bg-noite-900 text-white">
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePageV3 />} />
        
        {/* Core: Pista + Roleta + Salas */}
        <Route path="/pista" element={<PistaPage />} />
        <Route path="/roleta" element={<RoulettePage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        
        {/* Creators & Marketplace (ao vivo) */}
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/creator" element={<InfluencerDashboardPage />} />
        
        {/* User */}
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        
        {/* Features */}
        <Route path="/filtros" element={<VideoFiltersPage />} />
        
        {/* Dev */}
        <Route path="/design" element={<DesignSystemPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <MobileNav />
      <ToastContainer />
    </div>
  )
}

export default App
