import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/components/common/ToastContainer'

export const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as any)?.from || '/'
  const { signIn, signUp, signInAsGuest } = useAuthStore()
  const { addToast } = useToastStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        if (!username.trim() || username.trim().length < 3) {
          addToast({ type: 'error', title: 'Ops', message: 'Nome precisa ter 3+ caracteres' })
          setLoading(false)
          return
        }
        await signUp(email, password, username, { birth_date: '2000-01-01' })
      }
      navigate(redirectTo)
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        addToast({ type: 'error', title: 'Email já existe', message: 'Tente fazer login.' })
      } else if (msg.includes('Invalid login')) {
        addToast({ type: 'error', title: 'Dados incorretos', message: 'Verifique email e senha.' })
      } else if (msg.includes('rate limit')) {
        addToast({ type: 'warning', title: 'Aguarde', message: 'Muitas tentativas. Tente em 1 minuto.' })
      } else {
        addToast({ type: 'error', title: 'Erro', message: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">
            DA
          </div>
          <div className="leading-tight">
            <span className="text-xl font-bold text-white">DISQUE </span>
            <span className="text-xl font-bold text-primary-400">AMIZADE</span>
          </div>
        </Link>

        {/* Toggle */}
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-5 border border-white/[0.06]">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'login' ? 'bg-primary-500/20 text-white border border-primary-500/20' : 'text-dark-400'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'register' ? 'bg-primary-500/20 text-white border border-primary-500/20' : 'text-dark-400'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, '_').toLowerCase())}
                placeholder="Nome de usuário"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 transition-all"
                required
                autoFocus
                maxLength={20}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 transition-all"
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 transition-all"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {mode === 'login' && (
            <div className="text-right -mt-1">
              <a href="/reset-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                Esqueceu a senha?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest */}
        <button
          onClick={() => { signInAsGuest(); navigate(redirectTo) }}
          className="w-full mt-4 py-2.5 text-sm text-dark-500 hover:text-dark-300 transition-colors"
        >
          Entrar sem conta →
        </button>

        <p className="text-center text-[10px] text-dark-600 mt-6">
          Ao continuar você aceita os <a href="#" className="text-primary-400/60">Termos</a> e <a href="#" className="text-primary-400/60">Privacidade</a>.
          <br />Apenas maiores de 18 anos.
        </p>
      </div>
    </div>
  )
}
