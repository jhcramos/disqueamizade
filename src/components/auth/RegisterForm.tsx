import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'

interface RegisterFormProps {
  onToggleMode: () => void
}

export const RegisterForm = ({ onToggleMode }: RegisterFormProps) => {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle, loading } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos')
      return false
    }

    if (username.length < 3) {
      setError('Username deve ter pelo menos 3 caracteres')
      return false
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username deve conter apenas letras, números e underscore')
      return false
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres')
      return false
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    try {
      await signUp(email, password, username)
      navigate('/rooms')
    } catch (err: any) {
      console.error('Register error:', err)

      // Handle specific errors
      if (err.message?.includes('already registered')) {
        setError('Este email já está cadastrado')
      } else if (err.message?.includes('duplicate key value violates unique constraint')) {
        setError('Este username já está em uso')
      } else {
        setError(err.message || 'Erro ao criar conta. Tente novamente.')
      }
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
      <h2 className="text-3xl font-bold text-glow-cyan mb-2 text-center">
        Criar Conta
      </h2>
      <p className="text-gray-400 text-center mb-8">
        Junte-se à comunidade Disque Amizade
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Username"
          type="text"
          placeholder="seu_username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          disabled={loading}
        />

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

        <Input
          label="Confirmar Senha"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />

        {error && (
          <div className="glass-card border-2 border-red-500 bg-red-500/10 p-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="text-xs text-gray-400 space-y-1">
          <p>• Mínimo 6 caracteres na senha</p>
          <p>• Username único (apenas letras, números e _)</p>
          <p>• Você deve ter 18+ anos</p>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
        >
          Criar Conta
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-dark-bg text-gray-400">OU</span>
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

      <div className="mt-8 text-center">
        <p className="text-gray-400">
          Já tem uma conta?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-neon-cyan hover:text-neon-cyan/80 font-semibold transition-colors"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  )
}
