import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { NotFoundPage } from './pages/NotFoundPage'

// Rotas pesadas/secundárias em lazy: tira LiveKit + MediaPipe + face-api do
// bundle inicial. A Home fica leve. (Plano V4, item 2.4)
const RoomsPage = lazy(() => import('./pages/RoomsPage').then(m => ({ default: m.RoomsPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })))
const RoomPage = lazy(() => import('./rooms/RoomPage').then(m => ({ default: m.RoomPage })))
const VideoFiltersPage = lazy(() => import('./pages/VideoFiltersPage').then(m => ({ default: m.VideoFiltersPage })))
const RoulettePage = lazy(() => import('./pages/RoulettePage').then(m => ({ default: m.RoulettePage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })))
const BlogPage = lazy(() => import('./pages/blog/BlogPage').then(m => ({ default: m.BlogPage })))
const BlogPostPage = lazy(() => import('./pages/blog/BlogPostPage').then(m => ({ default: m.BlogPostPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })))
const SalaPublicaPage = lazy(() => import('./pages/SalaPublicaPage').then(m => ({ default: m.SalaPublicaPage })))
import { MobileNav } from './components/common/MobileNav'
import { ToastContainer } from './components/common/ToastContainer'
import { AgeVerificationProvider } from './components/common/AgeVerificationModal'
import { useAuthStore } from './store/authStore'

function App() {
  const initialize = useAuthStore((s) => s.initialize)

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
        <Route path="/roulette" element={<RoulettePage />} />
        {/* cabines removed — simplifying */}
        
        
        {/* User - requer login */}
        <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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

        
        {/* Admin */}
        <Route path="/admin" element={<AdminPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
      <MobileNav />
      <ToastContainer />
      

    </div>
    </AgeVerificationProvider>
  )
}

export default App
