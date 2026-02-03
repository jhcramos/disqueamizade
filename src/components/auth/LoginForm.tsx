import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'
import { UserCircle } from 'lucide-react'

interface LoginFormProps {
  onToggleMode: () => void
}

export const LoginForm = ({ onToggleMode }: LoginFormProps) => {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle, signInAsGuest, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Preencha todos os campos')
      return
    }

    try {
      await signIn(email, password)
      navigate('/rooms')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.')
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      await signInWithGoogle()
    } catch (err: any) {
      console.error('Google sign in error:', err)
      setError(err.message || 'Erro ao fazer login com Google')
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-zinc-50 mb-1 text-center">
        Bem-vindo de Volta
      </h2>
      <p className="text-zinc-500 text-center mb-8 text-sm">
        Entre para continuar sua jornada
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
        >
          Entrar
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-zinc-900 text-zinc-500">ou</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <div className="flex items-center justify-center gap-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar com Google
        </div>
      </Button>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-zinc-900 text-zinc-500">ou</span>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        fullWidth
        onClick={() => {
          signInAsGuest()
          navigate('/rooms')
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <UserCircle className="w-5 h-5" />
          Entrar como Convidado
        </div>
      </Button>

      <div className="mt-8 text-center">
        <p className="text-zinc-500 text-sm">
          Não tem uma conta?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Cadastre-se
          </button>
        </p>
      </div>
    </div>
  )
}
