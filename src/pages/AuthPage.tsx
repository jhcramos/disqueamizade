import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useAuth } from '@/hooks/useAuth'

export const AuthPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/rooms')
    }
  }, [isAuthenticated, navigate])

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-magenta/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="glass-card p-8 md:p-12 max-w-md w-full relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-glow-cyan mb-2">
            DISQUE AMIZADE
          </h1>
          <p className="text-sm text-gray-400 font-share-tech">
            // CONECTE-SE AO FUTURO
          </p>
        </div>

        {/* Forms */}
        {mode === 'login' ? (
          <LoginForm onToggleMode={toggleMode} />
        ) : (
          <RegisterForm onToggleMode={toggleMode} />
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Ao continuar, você concorda com nossos{' '}
            <a href="/terms" className="text-neon-cyan hover:underline">
              Termos de Serviço
            </a>{' '}
            e{' '}
            <a href="/privacy" className="text-neon-cyan hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
