import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Coins, User, LogIn } from 'lucide-react'

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/rooms', label: 'Salas' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/hobbies', label: 'Hobbies' },
  { to: '/pricing', label: 'Planos' },
]

export const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="border-b border-white/5 bg-surface/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-lg group-hover:shadow-card-hover transition-shadow">
              DA
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">DISQUE</h1>
              <h1 className="text-lg font-bold text-primary-light leading-none">AMIZADE</h1>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  location.pathname === link.to
                    ? 'text-white bg-primary/15 shadow-glow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Ficha Balance */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20">
              <Coins className="w-4 h-4 text-accent" />
              <span className="text-accent font-bold text-sm">150</span>
            </div>

            {/* Auth buttons */}
            <Link
              to="/auth"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 text-primary-light hover:bg-primary/10 transition-all text-sm font-semibold"
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </Link>

            <Link
              to="/profile/cr1"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden mt-4 pb-2 border-t border-white/5 pt-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl font-medium transition-all ${
                  location.pathname === link.to
                    ? 'text-white bg-primary/15'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl font-medium text-primary-light hover:bg-primary/10 transition-all"
            >
              Entrar / Cadastrar
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
