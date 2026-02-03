import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Header } from '../components/common/Header'

export const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(mode === 'login' ? 'Login (demo) — Supabase ainda não configurado' : 'Registro (demo) — Supabase ainda não configurado')
  }

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Back link */}
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary-light transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Link>

          <div className="card rounded-2xl p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                DA
              </div>
              <h1 className="text-2xl font-bold text-white">
                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'login'
                  ? 'Bem-vindo(a) de volta!'
                  : 'Junte-se à comunidade Disque Amizade'}
              </p>
            </div>

            {/* Mode tabs */}
            <div className="flex rounded-xl bg-surface/50 p-1 mb-6">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  mode === 'login'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  mode === 'register'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Cadastrar
              </button>
            </div>

            {/* Google Login */}
            <button className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-surface/50 hover:bg-surface transition-all mb-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="font-semibold text-gray-300">Continuar com Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-gray-500">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username (register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                    Nome de Usuário
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="seu_nome"
                      className="input-modern pl-11"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="input-modern pl-11"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-modern pl-11 pr-11"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-light transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Register extras */}
              {mode === 'register' && (
                <div className="space-y-3 pt-2">
                  {/* Age verification */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
                    <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-accent font-semibold">Verificação de Idade</p>
                      <p className="text-xs text-gray-500 mt-1">
                        A plataforma é exclusiva para maiores de 18 anos. Ao se cadastrar, você confirma ter pelo menos 18 anos.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={ageConfirmed}
                      onChange={(e) => setAgeConfirmed(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-surface text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-400 group-hover:text-gray-300">
                      Confirmo que tenho 18 anos ou mais
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-surface text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-400 group-hover:text-gray-300">
                      Li e aceito os{' '}
                      <a href="#" className="text-primary-light hover:underline">Termos de Uso</a>
                      {' '}e a{' '}
                      <a href="#" className="text-primary-light hover:underline">Política de Privacidade</a>
                    </span>
                  </label>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={mode === 'register' && (!ageConfirmed || !termsAccepted)}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark hover:shadow-card-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            </form>

            {/* Footer */}
            {mode === 'login' && (
              <div className="mt-4 text-center">
                <a href="#" className="text-sm text-primary-light hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
            )}
          </div>

          {/* Guest mode */}
          <div className="mt-6 text-center">
            <Link
              to="/rooms"
              className="text-sm text-gray-500 hover:text-primary-light transition-colors"
            >
              Ou continue como convidado (funcionalidades limitadas) →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
