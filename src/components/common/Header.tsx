import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Coins, User, LogIn, Bell, Crown } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { useFichaStore } from '@/store/fichaStore'
import { useAuthStore } from '@/store/authStore'
import { OstentacaoBadge } from '@/components/fichas/OstentacaoBadge'

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/rooms', label: 'Salas' },
  { to: '/roulette', label: 'Roleta' },
  { to: '/stories', label: 'Stories' },
  { to: '/exclusive', label: 'Exclusivo' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/hobbies', label: 'Hobbies' },
  { to: '/pricing', label: 'Planos' },
  { to: '/cabines', label: 'Cabines' },
  { to: '/filtros', label: 'Filtros' },
  { to: '/creator', label: 'Creator' },
]

export const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const location = useLocation()
  const notifRef = useRef<HTMLDivElement>(null)

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()
  const { balance, isOstentacao } = useFichaStore()
  const { user, profile, isGuest } = useAuthStore()

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isLoggedIn = !!user || isGuest

  return (
    <header className="border-b border-white/5 bg-surface/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg group-hover:shadow-card-hover transition-shadow">
              DA
            </div>
            <div className="hidden xs:block">
              <h1 className="text-lg font-bold text-white leading-none">DISQUE</h1>
              <h1 className="text-lg font-bold text-primary-400 leading-none">AMIZADE</h1>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-xl font-medium text-sm transition-all ${
                  location.pathname === link.to
                    ? 'text-white bg-primary-500/15 shadow-glow-primary'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                } ${link.to === '/roulette' ? 'text-pink-400 hover:text-pink-300' : ''}`}
              >
                {link.to === '/roulette' && <span className="mr-1">🎰</span>}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Ostentação Badge */}
            {isOstentacao && (
              <div className="hidden md:block">
                <OstentacaoBadge size="sm" />
              </div>
            )}

            {/* Fichas Balance */}
            <Link
              to="/pricing"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all group ${
                isOstentacao
                  ? 'bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                  : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15'
              }`}
            >
              {isOstentacao ? (
                <Crown className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              ) : (
                <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              )}
              <span className="text-amber-400 font-bold text-sm">{balance}</span>
            </Link>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 card p-0 overflow-hidden z-50 animate-fade-in shadow-elevated">
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 className="text-sm font-bold text-white">Notificações</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-dark-500 text-sm">
                        Nenhuma notificação
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                            !notif.read ? 'bg-primary-500/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              !notif.read ? 'bg-primary-400' : 'bg-transparent'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                              <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-dark-600 mt-1">
                                {new Date(notif.created_at).toLocaleString('pt-BR', { 
                                  hour: '2-digit', minute: '2-digit',
                                  day: '2-digit', month: 'short'
                                })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auth buttons */}
            {isLoggedIn ? (
              <Link
                to={`/profile/${profile?.id || 'me'}`}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-all"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                  isOstentacao
                    ? 'ring-2 ring-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                    : 'border border-primary-400/30'
                } bg-gradient-to-br from-primary-500 to-primary-700`}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm text-white font-medium hidden md:block">
                  {profile?.username || 'Convidado'}
                </span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-500/30 text-primary-400 hover:bg-primary-500/10 transition-all text-sm font-semibold"
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="lg:hidden mt-4 pb-2 border-t border-white/5 pt-4 space-y-1 animate-slide-up">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl font-medium transition-all ${
                  location.pathname === link.to
                    ? 'text-white bg-primary-500/15'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.to === '/roulette' && '🎰 '}{link.label}
              </Link>
            ))}
            {!isLoggedIn && (
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl font-medium text-primary-400 hover:bg-primary-500/10 transition-all"
              >
                Entrar / Cadastrar
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
