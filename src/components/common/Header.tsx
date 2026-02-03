import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from './Button'

export const Header = () => {
  const { isAuthenticated, profile, signOut } = useAuth()

  return (
    <header className="border-b border-neon-cyan/30 bg-dark-surface/50 backdrop-blur-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center group-hover:shadow-neon-cyan transition-all">
              <span className="text-2xl">💬</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-glow-cyan">
                DISQUE AMIZADE
              </h1>
              <p className="text-xs text-gray-500 font-share-tech">
                // CONNECT TO THE FUTURE
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/rooms"
                  className="text-gray-400 hover:text-neon-cyan transition-colors font-rajdhani uppercase"
                >
                  Salas
                </Link>
                <Link
                  to="/marketplace"
                  className="text-gray-400 hover:text-neon-cyan transition-colors font-rajdhani uppercase"
                >
                  Marketplace
                </Link>
                <Link
                  to="/pricing"
                  className="text-gray-400 hover:text-neon-magenta transition-colors font-rajdhani uppercase"
                >
                  Premium
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/pricing"
                  className="text-gray-400 hover:text-neon-cyan transition-colors font-rajdhani uppercase"
                >
                  Planos
                </Link>
              </>
            )}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* Stars balance */}
                {profile && (
                  <div className="hidden sm:flex items-center gap-2 glass-card px-4 py-2 border border-neon-yellow/30">
                    <span className="text-neon-yellow">⭐</span>
                    <span className="font-bold">{profile.stars_balance}</span>
                  </div>
                )}

                {/* Profile */}
                <Link
                  to={`/profile/${profile?.id}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center font-bold">
                    {profile?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="hidden lg:block text-sm font-rajdhani">
                    {profile?.username}
                  </span>
                </Link>

                {/* Sign out */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                >
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="primary" size="sm">
                    Cadastrar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
