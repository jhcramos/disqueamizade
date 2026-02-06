import { Link, useLocation } from 'react-router-dom'

const mobileNavItems = [
  { to: '/', label: 'Início', emoji: '🏠' },
  { to: '/rooms', label: 'Salas', emoji: '📹' },
  { to: '/marketplace', label: 'Creators', emoji: '⭐' },
  { to: '/roulette', label: '1-on-1', emoji: '🎲' },
  { to: '/profile/me', label: 'Perfil', emoji: '👤' },
]

export const MobileNav = () => {
  const location = useLocation()

  // Hide on full-screen experiences (inside a room/camarote)
  const hideOnPaths = ['/room/', '/camarote/']
  if (hideOnPaths.some(path => location.pathname.startsWith(path))) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-noite-900/95 backdrop-blur-lg border-t border-white/5 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map(({ to, label, emoji }) => {
          const isActive = location.pathname === to || 
            (to === '/rooms' && location.pathname.startsWith('/room')) ||
            (to === '/profile/me' && location.pathname.startsWith('/profile'))
          
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[56px] transition-all ${
                isActive
                  ? 'text-balada-400 bg-balada-500/10'
                  : 'text-noite-500 hover:text-noite-300 active:text-white active:bg-white/5'
              }`}
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
