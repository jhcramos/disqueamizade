import { useState } from 'react'
import { supabase } from '@/services/supabase/client'
import { ArrowLeft, Mail, KeyRound, CheckCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const isReset = searchParams.get('type') === 'recovery'
  
  if (isReset) {
    return <NewPasswordForm />
  }
  return <RequestResetForm />
}

function RequestResetForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=recovery`,
      })
      if (resetError) throw resetError
      
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'reset',
            to: email,
            username: email.split('@')[0],
            url: `${window.location.origin}/reset-password?type=recovery`,
          }),
        })
      } catch {
        // Non-critical
      }

      setSent(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar email'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Email enviado! 📧</h2>
          <p className="text-gray-400 mb-6">
            Enviamos um link para <strong className="text-purple-300">{email}</strong>. 
            Confira sua caixa de entrada (e o spam também 😉).
          </p>
          <Link to="/auth" className="text-purple-400 hover:text-purple-300 text-sm">
            ← Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-8">
        <Link to="/auth" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar ao login
        </Link>
        
        <div className="text-center mb-6">
          <Mail className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Esqueceu a senha?</h1>
          <p className="text-gray-400 mt-2">Sem problema! Vamos te enviar um link para criar uma nova.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Seu email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/40 transition-all"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>
      </div>
    </div>
  )
}

function NewPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao redefinir senha'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Senha redefinida! 🎉</h2>
          <p className="text-gray-400 mb-6">Sua nova senha foi salva com sucesso.</p>
          <Link to="/auth" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold text-sm">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-8">
        <div className="text-center mb-6">
          <KeyRound className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Nova senha</h1>
          <p className="text-gray-400 mt-2">Escolha uma senha nova para sua conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/40 transition-all"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/40 transition-all"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20"
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
