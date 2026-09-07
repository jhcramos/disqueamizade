import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react'

const AGE_VERIFIED_KEY = 'age-verified'

type AgeVerificationContextType = {
  verifyAge: (onConfirm: () => void) => void
}

const AgeVerificationContext = createContext<AgeVerificationContextType>({
  verifyAge: () => {},
})

export const useAgeVerification = () => useContext(AgeVerificationContext)

export const AgeVerificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [showModal, setShowModal] = useState(false)
  const [rejected, setRejected] = useState(false)
  const onConfirmRef = useRef<(() => void) | null>(null)

  const verifyAge = useCallback((onConfirm: () => void) => {
    if (sessionStorage.getItem(AGE_VERIFIED_KEY) === 'true') {
      onConfirm()
      return
    }
    onConfirmRef.current = onConfirm
    setRejected(false)
    setShowModal(true)
  }, [])

  const handleConfirm = () => {
    sessionStorage.setItem(AGE_VERIFIED_KEY, 'true')
    setShowModal(false)
    onConfirmRef.current?.()
    onConfirmRef.current = null
  }

  const handleReject = () => {
    setRejected(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setRejected(false)
    onConfirmRef.current = null
  }

  return (
    <AgeVerificationContext.Provider value={{ verifyAge }}>
      {children}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={handleClose}>
          <div
            className="bg-dark-900 border border-white/10 rounded-2xl w-full max-w-md p-8 text-center animate-slide-up shadow-2xl shadow-pink-500/10"
            onClick={e => e.stopPropagation()}
          >
            {!rejected ? (
              <>
                <div className="text-5xl mb-4">🔞</div>
                <h2 className="text-xl font-bold text-white mb-3">Verificação de Idade</h2>
                <p className="text-dark-300 text-sm mb-4 leading-relaxed">
                  O Disque Amizade é uma plataforma destinada a maiores de 18 anos. Ao continuar, você confirma ter 18 anos ou mais.
                </p>
                <p className="text-dark-500 text-xs mb-6 leading-relaxed italic">
                  Em conformidade com o Estatuto da Criança e do Adolescente (ECA - Lei nº 8.069/1990) e o Marco Civil da Internet (Lei nº 12.965/2014), que estabelecem a proteção de menores no ambiente digital.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirm}
                    className="w-full py-3.5 rounded-xl bg-primary-200 text-dark-950 font-bold hover:bg-primary-100 transition-colors"
                  >
                    ✅ Sim, tenho 18 anos ou mais
                  </button>
                  <button
                    onClick={handleReject}
                    className="w-full py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-dark-300 font-medium hover:bg-white/[0.1] transition-all"
                  >
                    ❌ Não tenho 18 anos
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-white mb-3">Acesso Restrito</h2>
                <p className="text-dark-300 text-sm mb-6 leading-relaxed">
                  O Disque Amizade não é permitido para menores de 18 anos, conforme o Estatuto da Criança e do Adolescente (Lei nº 8.069/1990, Art. 76-78) que protege crianças e adolescentes de conteúdo inadequado em meios de comunicação. Se você é menor de idade, recomendamos buscar plataformas adequadas à sua faixa etária.
                </p>
                <button
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-dark-300 font-medium hover:bg-white/[0.1] transition-all"
                >
                  Entendi
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </AgeVerificationContext.Provider>
  )
}

/**
 * AgeGate — wrap any page to require age verification before rendering.
 * Works for direct URL access, Link navigation, back button, etc.
 */
export const AgeGate = ({ children }: { children: React.ReactNode }) => {
  const [verified, setVerified] = useState(() => sessionStorage.getItem(AGE_VERIFIED_KEY) === 'true')
  const { verifyAge } = useAgeVerification()

  useEffect(() => {
    if (!verified) {
      verifyAge(() => setVerified(true))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!verified) return <div className="min-h-screen bg-dark-950" />
  return <>{children}</>
}
