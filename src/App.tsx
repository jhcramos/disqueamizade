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
import PistaPage from './pages/PistaPage'
import HomePageV3 from './pages/HomePageV3'
import DesignSystemPage from './pages/DesignSystemPage'
import { RoletaPage } from './pages/RoletaPage'
import { CamarotePage } from './pages/CamarotePage'
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
        {/* Home original */}
        <Route path="/" element={<HomePage />} />
        
        {/* Salas e experiências */}
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/roulette" element={<RoulettePage />} />
        <Route path="/cabines" element={<SecretCabinsPage />} />
        <Route path="/hobbies" element={<HobbiesPage />} />
        
        {/* V3 Balada Digital (novo jogo dentro das salas) */}
        <Route path="/pista" element={<PistaPage />} />
        <Route path="/roleta" element={<RoletaPage />} />
        <Route path="/camarote/:camaroteId" element={<CamarotePage />} />
        <Route path="/v3" element={<HomePageV3 />} />
        
        {/* Creators & Marketplace */}
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
