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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/6 rounded-full blur-[100px]" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 md:p-10 max-w-md w-full relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold">DA</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-50 font-jakarta">
            Disque Amizade
          </h1>
        </div>

        {/* Forms */}
        {mode === 'login' ? (
          <LoginForm onToggleMode={toggleMode} />
        ) : (
          <RegisterForm onToggleMode={toggleMode} />
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <p className="text-xs text-zinc-600 text-center">
            Ao continuar, você concorda com nossos{' '}
            <a href="/terms" className="text-violet-400 hover:underline">
              Termos de Serviço
            </a>{' '}
            e{' '}
            <a href="/privacy" className="text-violet-400 hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
