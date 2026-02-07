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
import { CreatorProfilePage } from './pages/CreatorProfilePage'
import DesignSystemPage from './pages/DesignSystemPage'
import { MobileNav } from './components/common/MobileNav'
import { ToastContainer } from './components/common/ToastContainer'
import { CamaroteMinimizado } from './components/rooms/CamaroteMinimizado'
import { useAuthStore } from './store/authStore'
import { useCamaroteStore } from './store/camaroteStore'
import { useToastStore } from './components/common/ToastContainer'

function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const { minimizedCamarote, clearMinimized } = useCamaroteStore()
  const { addToast } = useToastStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="min-h-screen bg-noite-900 text-white">
      <Routes>
        {/* Home principal - design original */}
        <Route path="/" element={<HomePage />} />
        
        {/* Salas com 30 câmeras + chat + camarotes VIP */}
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/roulette" element={<RoulettePage />} />
        <Route path="/cabines" element={<SecretCabinsPage />} />
        <Route path="/hobbies" element={<HobbiesPage />} />
        
        {/* Creators & Marketplace */}
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/creator/:id" element={<CreatorProfilePage />} />
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
      
      {/* Camarote minimizado global - aparece em qualquer página */}
      {minimizedCamarote && (
        <CamaroteMinimizado
          camaroteId={minimizedCamarote.id}
          camaroteName={minimizedCamarote.name}
          participants={minimizedCamarote.participants}
          onClose={() => {
            clearMinimized()
            addToast({ type: 'info', title: 'Saiu do camarote', message: 'Você saiu do camarote' })
          }}
          onMaximize={() => clearMinimized()}
        />
      )}
    </div>
  )
}

export default App
