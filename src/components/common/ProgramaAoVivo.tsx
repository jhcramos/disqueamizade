import { useToastStore } from '@/components/common/ToastContainer'
// ═══════════════════════════════════════════════════════════════════════════
// ProgramaAoVivo — âncora de retenção: um horário fixo por dia (Plano V4, 4.3)
//
// Todo dia às 21h (horário de Brasília) tem "programa" na sala principal. Fora
// do horário mostra contagem regressiva; das 21h às 23h mostra "AO VIVO agora".
// Sem backend: o horário dá motivo concreto para voltar sempre no mesmo horário.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAgeVerification } from '@/components/common/AgeVerificationModal'
import { track } from '@/services/analytics'

const START_HOUR = 21 // 21h BRT
const END_HOUR = 23   // programa vai até 23h

/** Agora em horário de Brasília (UTC-3, sem horário de verão). */
function brtNow() {
  const now = new Date()
  return new Date(now.getTime() + (now.getTimezoneOffset() - 180) * 60000)
}

export const ProgramaAoVivo = ({ compact = false }: { compact?: boolean }) => {
  const navigate = useNavigate()
  const signInAsGuest = useAuthStore((s) => s.signInAsGuest)
  const { verifyAge } = useAgeVerification()
  const [, tick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const b = brtNow()
  const live = b.getHours() >= START_HOUR && b.getHours() < END_HOUR

  // Próximo 21h
  const next = new Date(b)
  next.setHours(START_HOUR, 0, 0, 0)
  if (b.getHours() >= START_HOUR) next.setDate(next.getDate() + 1)
  const diff = Math.max(0, next.getTime() - b.getTime())
  const hh = Math.floor(diff / 3600000)
  const mm = Math.floor((diff % 3600000) / 60000)
  const ss = Math.floor((diff % 60000) / 1000)
  const pad = (n: number) => n.toString().padStart(2, '0')

  const enter = () => {
    track('cta_enter_click', { cta: 'programa_21h' })
    verifyAge(() => { void signInAsGuest().then(() => navigate('/room/geral-brasil')).catch(() => useToastStore.getState().addToast({ type: 'error', title: 'Entrada indisponível', message: 'Não foi possível entrar. Tente novamente em instantes.' })) })
  }

  return (
    <div className={`rounded-2xl border ${live ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-white/10 bg-white/[0.03]'} ${compact ? 'p-3' : 'p-4'} flex items-center gap-3`}>
      {live ? <Radio className="w-5 h-5 text-emerald-400 animate-pulse flex-shrink-0" /> : <Clock className="w-5 h-5 text-primary-400 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        {live ? (
          <p className="text-sm font-semibold text-emerald-300">Programa AO VIVO agora na sala principal 🔴</p>
        ) : (
          <p className="text-sm text-dark-300">
            Programa ao vivo hoje às <b className="text-white">21h</b> · começa em <b className="text-white tabular-nums">{pad(hh)}:{pad(mm)}:{pad(ss)}</b>
          </p>
        )}
      </div>
      <button onClick={enter} className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm ${live ? 'bg-emerald-500 text-white' : 'bg-primary-500 text-white'} hover:scale-[1.02] transition-transform`}>
        {live ? 'Entrar' : 'Lembrar'}
      </button>
    </div>
  )
}

export default ProgramaAoVivo
