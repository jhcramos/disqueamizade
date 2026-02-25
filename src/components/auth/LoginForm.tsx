import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'

interface LoginFormProps {
  onToggleMode: () => void
}

export const LoginForm = ({ onToggleMode }: LoginFormProps) => {
  const navigate = useNavigate()
  const { signIn, loading } = useAuth()

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

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-white mb-2 text-center">
        Bem-vindo de Volta
      </h2>
      <p className="text-gray-400 text-center mb-8">
        Entre para continuar sua jornada
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="card border border-red-500 bg-red-500/10 p-4">
            <p className="text-red-500 text-sm">{error}</p>
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

      <div className="mt-8 text-center">
        <p className="text-gray-400">
          Não tem uma conta?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary-light hover:text-primary font-semibold transition-colors"
          >
            Cadastre-se
          </button>
        </p>
      </div>
    </div>
  )
}
