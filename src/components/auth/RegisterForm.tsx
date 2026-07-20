import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'

interface RegisterFormProps {
  onToggleMode: () => void
}

export const RegisterForm = ({ onToggleMode }: RegisterFormProps) => {
  const navigate = useNavigate()
  const { signUp, loading } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedLegal, setAcceptedLegal] = useState(false)
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

    if (!acceptedLegal) {
      setError('Você precisa aceitar os Termos, a Política de Privacidade e confirmar que tem 18+ anos')
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

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-white mb-2 text-center">
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
          <div className="card border border-red-500 bg-red-500/10 p-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="text-xs text-gray-400 space-y-1">
          <p>• Mínimo 6 caracteres na senha</p>
          <p>• Username único (apenas letras, números e _)</p>
          <p>• Você deve ter 18+ anos</p>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={acceptedLegal}
            onChange={(e) => setAcceptedLegal(e.target.checked)}
            disabled={loading}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <span>
            Eu tenho 18 anos ou mais e aceito os{' '}
            <Link to="/termos" className="text-primary-light hover:underline">Termos de Uso</Link>, a{' '}
            <Link to="/privacidade" className="text-primary-light hover:underline">Política de Privacidade</Link>, a{' '}
            <Link to="/lgpd" className="text-primary-light hover:underline">LGPD</Link> e as{' '}
            <Link to="/diretrizes" className="text-primary-light hover:underline">Diretrizes da Comunidade</Link>.
          </span>
        </label>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          disabled={!acceptedLegal}
        >
          Criar Conta
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-400">
          Já tem uma conta?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary-light hover:text-primary font-semibold transition-colors"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  )
}
