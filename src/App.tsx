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
import { CamarotePage } from './pages/CamarotePage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
// SecretCabinsPage removed — simplifying
import { VideoFiltersPage } from './pages/VideoFiltersPage'
import { RoulettePage } from './pages/RoulettePage'
import { InfluencerDashboardPage } from './pages/InfluencerDashboardPage'
import { CreatorProfilePage } from './pages/CreatorProfilePage'
import DesignSystemPage from './pages/DesignSystemPage'
import { AdminPage } from './pages/AdminPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import { BlogPage } from './pages/blog/BlogPage'
import { BlogPostPage } from './pages/blog/BlogPostPage'
import { MobileNav } from './components/common/MobileNav'
import { ToastContainer } from './components/common/ToastContainer'
import { CamaroteMinimizado } from './components/rooms/CamaroteMinimizado'
import { AgeVerificationProvider } from './components/common/AgeVerificationModal'
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
    <AgeVerificationProvider>
    <div className="min-h-screen bg-noite-900 text-white">
      <Routes>
        {/* Home principal - design original */}
        <Route path="/" element={<HomePage />} />
        
        {/* Salas - requer login */}
        <Route path="/rooms" element={<ProtectedRoute><RoomsPage /></ProtectedRoute>} />
        <Route path="/room/:roomId" element={<ProtectedRoute><RoomPage /></ProtectedRoute>} />
        <Route path="/camarote/:camaroteId" element={<ProtectedRoute><CamarotePage /></ProtectedRoute>} />
        <Route path="/roulette" element={<ProtectedRoute><RoulettePage /></ProtectedRoute>} />
        {/* cabines removed — simplifying */}
        <Route path="/hobbies" element={<ProtectedRoute><HobbiesPage /></ProtectedRoute>} />
        
        {/* Creators & Marketplace - requer login */}
        <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
        <Route path="/creator/:id" element={<ProtectedRoute><CreatorProfilePage /></ProtectedRoute>} />
        <Route path="/creator" element={<ProtectedRoute><InfluencerDashboardPage /></ProtectedRoute>} />
        
        {/* User - requer login */}
        <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        
        {/* Features */}
        <Route path="/filtros" element={<VideoFiltersPage />} />
        
        {/* Blog — public, no auth required (SEO) */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* Dev */}
        <Route path="/design" element={<DesignSystemPage />} />
        
        {/* Admin */}
        <Route path="/admin" element={<AdminPage />} />
        
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
    </AgeVerificationProvider>
  )
}

export default App
