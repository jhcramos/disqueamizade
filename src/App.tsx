import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { RoomsPage } from './pages/RoomsPage'
import { MarketplacePage } from './pages/MarketplacePage'
import { PricingPage } from './pages/PricingPage'
import { ProfilePage } from './pages/ProfilePage'
import { HobbiesPage } from './pages/HobbiesPage'
import { AuthPage } from './pages/AuthPage'

function App() {
  return (
    <div className="min-h-screen bg-dark-950 text-white nostalgia-bg">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/hobbies" element={<HobbiesPage />} />
        <Route path="/auth" element={<AuthPage />} />
        {/* Legacy route support */}
        <Route path="/room/:roomId" element={<Navigate to="/rooms" replace />} />
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
