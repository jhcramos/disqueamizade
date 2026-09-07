import { Link, useLocation } from 'react-router-dom'
import { Home, Users, Shuffle, BookOpen, User } from 'lucide-react'

const mobileNavItems = [
  { to: '/', label: 'Início', Icon: Home },
  { to: '/rooms', label: 'Salas', Icon: Users },
  { to: '/roulette', label: 'Roleta 1:1', Icon: Shuffle },
  { to: '/blog', label: 'Blog', Icon: BookOpen },
  { to: '/profile/me', label: 'Perfil', Icon: User },
]

export const MobileNav = () => {
  const location = useLocation()

  // Hide on full-screen experiences (inside a room)
  const hideOnPaths = ['/room/']
  if (hideOnPaths.some(path => location.pathname.startsWith(path))) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-noite-900/95 backdrop-blur-lg border-t border-white/5 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map(({ to, label, Icon }) => {
          const isActive = location.pathname === to || 
            (to === '/rooms' && location.pathname.startsWith('/room')) ||
            (to === '/profile/me' && location.pathname.startsWith('/profile'))
          
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[56px] transition-all ${
                isActive
                  ? 'text-primary-200 bg-primary-500/10'
                  : 'text-noite-500 hover:text-noite-300 active:text-white active:bg-white/5'
              }`}
            >
              <Icon size={19} strokeWidth={1.6} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
