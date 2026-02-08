import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Calendar, Sparkles, MessageCircle, Video, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/components/common/ToastContainer'

export const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // multi-step register: 1=info, 2=account

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
        addToast({ type: 'success', title: '👋 Bem-vindo de volta!', message: 'Bora conversar!' })
      } else {
        if (step === 1) {
          // Validate step 1
          if (!username.trim()) {
            addToast({ type: 'error', title: 'Ops!', message: 'Escolha um nome de usuário' })
            setLoading(false)
            return
          }
          if (username.trim().length < 3) {
            addToast({ type: 'error', title: 'Ops!', message: 'Nome precisa ter pelo menos 3 caracteres' })
            setLoading(false)
            return
          }
          if (!birthDate) {
            addToast({ type: 'error', title: 'Ops!', message: 'Informe sua data de nascimento' })
            setLoading(false)
            return
          }
          const birth = new Date(birthDate)
          const today = new Date()
          let age = today.getFullYear() - birth.getFullYear()
          const monthDiff = today.getMonth() - birth.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
          if (age < 18) {
            addToast({ type: 'error', title: '🔞 Idade mínima', message: 'Você precisa ter 18 anos ou mais' })
            setLoading(false)
            return
          }
          setStep(2)
          setLoading(false)
          return
        }

        // Step 2: create account
        if (!ageConfirmed) {
          addToast({ type: 'error', title: 'Confirme sua idade', message: 'Marque a confirmação de idade' })
          setLoading(false)
          return
        }
        await signUp(email, password, username, { is_creator: isCreator, birth_date: birthDate })
        addToast({ type: 'success', title: '🎉 Conta criada!', message: 'Seja bem-vindo ao Disque Amizade!' })
      }
      navigate(redirectTo)
    } catch (err: any) {
      const msg = err?.message || 'Erro desconhecido'
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        addToast({ type: 'error', title: 'Email já existe', message: 'Tente fazer login ou use outro email.' })
      } else if (msg.includes('Invalid login')) {
        addToast({ type: 'error', title: 'Dados incorretos', message: 'Verifique seu email e senha.' })
      } else if (msg.includes('rate limit')) {
        addToast({ type: 'warning', title: 'Muitas tentativas', message: 'Aguarde um momento e tente novamente.' })
      } else {
        addToast({ type: 'error', title: 'Erro', message: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = () => {
    signInAsGuest()
    addToast({ type: 'success', title: '👀 Modo visitante', message: 'Explore à vontade! Crie uma conta para participar.' })
    navigate(redirectTo)
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-pink-500/3 blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-sm">
          {/* Logo + Tagline */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-glow-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <span className="relative">DA</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">
              <span className="text-white">DISQUE </span>
              <span className="bg-gradient-to-r from-primary-400 to-pink-400 bg-clip-text text-transparent">AMIZADE</span>
            </h1>
            <p className="text-dark-400 text-sm mt-2">Conecte-se com pessoas incríveis por vídeo</p>
          </div>

          {/* Feature pills - only on login */}
          {mode === 'login' && step === 1 && (
            <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-dark-300">
                <Video className="w-3 h-3 text-primary-400" /> Vídeo ao vivo
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-dark-300">
                <MessageCircle className="w-3 h-3 text-emerald-400" /> Chat
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-dark-300">
                <Users className="w-3 h-3 text-purple-400" /> Salas temáticas
              </span>
            </div>
          )}

          {/* Card */}
          <div className="bg-dark-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
            {/* Toggle - clean pills */}
            <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-6 border border-white/[0.06]">
              <button
                onClick={() => { setMode('login'); setStep(1) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-primary-500/20 to-purple-500/20 text-white shadow-sm border border-primary-500/20'
                    : 'text-dark-400 hover:text-dark-300'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => { setMode('register'); setStep(1) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-primary-500/20 to-purple-500/20 text-white shadow-sm border border-primary-500/20'
                    : 'text-dark-400 hover:text-dark-300'
                }`}
              >
                Criar Conta
              </button>
            </div>

            {/* Register step indicator */}
            {mode === 'register' && (
              <div className="flex items-center gap-2 mb-5">
                <div className={`flex-1 h-1 rounded-full transition-all ${step >= 1 ? 'bg-primary-500' : 'bg-white/10'}`} />
                <div className={`flex-1 h-1 rounded-full transition-all ${step >= 2 ? 'bg-primary-500' : 'bg-white/10'}`} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ─── LOGIN MODE ─── */}
              {mode === 'login' && (
                <>
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Seu email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 focus:bg-white/[0.06] transition-all"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha"
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 focus:bg-white/[0.06] transition-all"
                        required
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
                </>
              )}

              {/* ─── REGISTER STEP 1: Personal info ─── */}
              {mode === 'register' && step === 1 && (
                <>
                  <div>
                    <label className="text-xs text-dark-400 mb-1.5 block font-medium">Como quer ser chamado?</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/\s/g, '_').toLowerCase())}
                        placeholder="seu_nome"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 focus:bg-white/[0.06] transition-all"
                        required
                        autoFocus
                        maxLength={20}
                      />
                    </div>
                    {username && (
                      <p className="text-xs text-dark-500 mt-1">Seu perfil: <span className="text-primary-400">@{username}</span></p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 mb-1.5 block font-medium">Data de nascimento</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 focus:bg-white/[0.06] transition-all [color-scheme:dark]"
                        required
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ─── REGISTER STEP 2: Account ─── */}
              {mode === 'register' && step === 2 && (
                <>
                  <div className="text-center mb-2">
                    <p className="text-sm text-dark-300">Quase lá, <span className="text-primary-400 font-semibold">@{username}</span>! 🎉</p>
                  </div>
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Seu email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 focus:bg-white/[0.06] transition-all"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Crie uma senha"
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-primary-500/40 focus:bg-white/[0.06] transition-all"
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
                    {password && (
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex-1 h-1 rounded-full transition-all ${
                            password.length >= i * 3 ? (password.length >= 10 ? 'bg-emerald-500' : password.length >= 6 ? 'bg-yellow-500' : 'bg-red-500') : 'bg-white/10'
                          }`} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Age + Creator options */}
                  <div className="space-y-3 pt-1">
                    <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        ageConfirmed ? 'bg-primary-500 border-primary-500' : 'border-dark-600'
                      }`}>
                        {ageConfirmed && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className="text-sm text-dark-300">Confirmo que tenho 18 anos ou mais</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isCreator ? 'bg-purple-500 border-purple-500' : 'border-dark-600'
                      }`}>
                        {isCreator && <Sparkles className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <span className="text-sm text-dark-300">Quero ser Creator</span>
                        <p className="text-[10px] text-dark-500">Ganhe fichas criando conteúdo</p>
                      </div>
                    </label>
                    {/* Hidden inputs for custom checkboxes */}
                    <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="hidden" />
                    <input type="checkbox" checked={isCreator} onChange={(e) => setIsCreator(e.target.checked)} className="hidden" />
                  </div>
                </>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold text-sm hover:from-primary-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-wait shadow-lg shadow-primary-500/20 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === 'login' ? 'Entrando...' : step === 1 ? 'Verificando...' : 'Criando conta...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {mode === 'login' ? 'Entrar' : step === 1 ? 'Continuar' : 'Criar Conta'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              {/* Back button for step 2 */}
              {mode === 'register' && step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2.5 text-sm text-dark-400 hover:text-white transition-colors"
                >
                  ← Voltar
                </button>
              )}
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-dark-600 uppercase tracking-wider">ou</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Guest entry */}
            <button
              onClick={handleGuestLogin}
              className="w-full py-3 rounded-xl border border-white/[0.08] text-dark-300 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.03] transition-all text-sm font-medium"
            >
              👀 Entrar como visitante
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-dark-600 mt-5">
            Ao continuar, você concorda com os{' '}
            <a href="#" className="text-primary-400/70 hover:text-primary-400">Termos</a>{' '}
            e a{' '}
            <a href="#" className="text-primary-400/70 hover:text-primary-400">Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
