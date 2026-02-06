import { Link, useLocation } from 'react-router-dom'
import { Home, MessageSquare, Sparkles, Lock, User } from 'lucide-react'

const mobileNavItems = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/rooms', label: 'Salas', icon: MessageSquare },
  { to: '/cabines', label: 'Cabines', icon: Lock },
  { to: '/hobbies', label: 'Hobbies', icon: Sparkles },
  { to: '/profile/me', label: 'Perfil', icon: User },
]

export const MobileNav = () => {
  const location = useLocation()

  // Hide on room pages (they have their own controls)
  if (location.pathname.startsWith('/room/')) return null
  if (location.pathname === '/pista') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-noite-900/95 backdrop-blur-lg border-t border-white/5 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || 
            (to === '/rooms' && location.pathname.startsWith('/rooms')) ||
            (to === '/profile/me' && location.pathname.startsWith('/profile'))
          
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[56px] transition-all ${
                isActive
                  ? 'text-balada-400'
                  : 'text-noite-500 active:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
