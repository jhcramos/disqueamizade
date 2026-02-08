import { useState } from 'react'

const AGE_GATE_KEY = 'disqueamizade_age_verified'

interface AgeGateProps {
  children: React.ReactNode
}

export const AgeGate = ({ children }: AgeGateProps) => {
  const [verified, setVerified] = useState(() => localStorage.getItem(AGE_GATE_KEY) === 'true')

  if (verified) return <>{children}</>

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-dark-950 border border-white/10 rounded-2xl w-full max-w-sm p-8 text-center animate-slide-up">
        <div className="text-5xl mb-4">🔞</div>
        <h2 className="text-xl font-bold text-white mb-2">Conteúdo Adulto</h2>
        <p className="text-dark-400 text-sm mb-6">
          Você tem 18 anos ou mais?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-dark-300 font-medium hover:bg-white/[0.1] transition-all"
          >
            Não
          </button>
          <button
            onClick={() => {
              localStorage.setItem(AGE_GATE_KEY, 'true')
              setVerified(true)
            }}
            className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-all"
          >
            Sim, tenho 18+
          </button>
        </div>
      </div>
    </div>
  )
}

export const useAgeVerified = () => localStorage.getItem(AGE_GATE_KEY) === 'true'
