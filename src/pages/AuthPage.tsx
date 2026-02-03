import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Chrome } from 'lucide-react'
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
  const { signIn, signUp, signInAsGuest, signInWithGoogle } = useAuthStore()
  const { addToast } = useToastStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        await signIn(email, password)
        addToast({ type: 'success', title: 'Bem-vindo de volta!', message: 'Login realizado com sucesso' })
      } else {
        if (!username.trim()) {
          addToast({ type: 'error', title: 'Erro', message: 'Nome de usuário é obrigatório' })
          setLoading(false)
          return
        }
        await signUp(email, password, username)
        addToast({ type: 'success', title: 'Conta criada!', message: 'Verifique seu email para confirmar' })
      }
      navigate('/')
    } catch (err) {
      // In demo mode, fall back to guest
      signInAsGuest()
      addToast({ type: 'info', title: 'Modo Demo', message: 'Entrando como convidado (Supabase não configurado)' })
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = () => {
    signInAsGuest()
    addToast({ type: 'success', title: 'Bem-vindo!', message: 'Você entrou como convidado' })
    navigate('/')
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch {
      signInAsGuest()
      addToast({ type: 'info', title: 'Modo Demo', message: 'Google OAuth não configurado. Entrando como convidado.' })
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl shadow-glow-primary">
            DA
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-none">DISQUE</h1>
            <h1 className="text-2xl font-bold text-primary-400 leading-none">AMIZADE</h1>
          </div>
        </Link>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-white text-center mb-2">
            {mode === 'login' ? 'Bem-vindo de volta!' : 'Criar sua conta'}
          </h2>
          <p className="text-sm text-dark-500 text-center mb-6">
            {mode === 'login' ? 'Entre com suas credenciais' : 'Preencha os dados para começar'}
          </p>

          {/* Toggle */}
          <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-6 border border-white/5">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-primary-500/15 text-primary-400' : 'text-dark-400'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'register' ? 'bg-primary-500/15 text-primary-400' : 'text-dark-400'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-sm text-dark-300 mb-1.5 block">Nome de Usuário</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="seu_nome"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-dark-300 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-dark-300 mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-wait"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-dark-600">ou continue com</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Social + Guest */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
            >
              <Chrome className="w-4 h-4" />
              Entrar com Google
            </button>
            
            <button
              onClick={handleGuestLogin}
              className="btn-ghost w-full py-3 text-dark-400 hover:text-white"
            >
              Continuar como Convidado
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-dark-600 mt-6">
          Ao continuar, você concorda com os{' '}
          <a href="#" className="text-primary-400 hover:underline">Termos de Uso</a>{' '}
          e a{' '}
          <a href="#" className="text-primary-400 hover:underline">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  )
}
