import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { NotFoundPage } from './pages/NotFoundPage'

// Rotas pesadas/secundárias em lazy: tira LiveKit + MediaPipe + face-api do
// bundle inicial. A Home fica leve. (Plano V4, item 2.4)
const RoomsPage = lazy(() => import('./pages/RoomsPage').then(m => ({ default: m.RoomsPage })))
const MarketplacePage = lazy(() => import('./pages/MarketplacePage').then(m => ({ default: m.MarketplacePage })))
const PricingPage = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const HobbiesPage = lazy(() => import('./pages/HobbiesPage').then(m => ({ default: m.HobbiesPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })))
const RoomPage = lazy(() => import('./rooms/RoomPage').then(m => ({ default: m.RoomPage })))
const CamarotePage = lazy(() => import('./pages/CamarotePage').then(m => ({ default: m.CamarotePage })))
const VideoFiltersPage = lazy(() => import('./pages/VideoFiltersPage').then(m => ({ default: m.VideoFiltersPage })))
const RoulettePage = lazy(() => import('./pages/RoulettePage').then(m => ({ default: m.RoulettePage })))
const InfluencerDashboardPage = lazy(() => import('./pages/InfluencerDashboardPage').then(m => ({ default: m.InfluencerDashboardPage })))
const CreatorProfilePage = lazy(() => import('./pages/CreatorProfilePage').then(m => ({ default: m.CreatorProfilePage })))
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage'))
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })))
const BlogPage = lazy(() => import('./pages/blog/BlogPage').then(m => ({ default: m.BlogPage })))
const BlogPostPage = lazy(() => import('./pages/blog/BlogPostPage').then(m => ({ default: m.BlogPostPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })))
const SalaPublicaPage = lazy(() => import('./pages/SalaPublicaPage').then(m => ({ default: m.SalaPublicaPage })))
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
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-dark-400">Carregando…</div>}>
      <Routes>
        {/* Home principal - design original */}
        <Route path="/" element={<HomePage />} />
        
        {/* Salas - requer login */}
        {/* Públicas: entram convidado, sem cadastro (Plano V4 1.4/2.1) */}
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/camarote/:camaroteId" element={<ProtectedRoute><CamarotePage /></ProtectedRoute>} />
        <Route path="/roulette" element={<RoulettePage />} />
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
        <Route path="/termos" element={<LegalPage type="terms" />} />
        <Route path="/privacidade" element={<LegalPage type="privacy" />} />
        <Route path="/lgpd" element={<LegalPage type="lgpd" />} />
        <Route path="/diretrizes" element={<LegalPage type="guidelines" />} />
        
        {/* Features */}
        <Route path="/filtros" element={<VideoFiltersPage />} />
        
        {/* Blog — public, no auth required (SEO) */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* About — public, SEO */}
        <Route path="/sobre" element={<AboutPage />} />
        <Route path="/sala/:slug" element={<SalaPublicaPage />} />

        {/* Dev */}
        <Route path="/design" element={<DesignSystemPage />} />
        
        {/* Admin */}
        <Route path="/admin" element={<AdminPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
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
