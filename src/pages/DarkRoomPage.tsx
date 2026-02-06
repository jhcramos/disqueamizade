import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Shield, Flame, Calendar } from 'lucide-react'

export default function DarkRoomPage() {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-noite-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-darkroom/20 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-darkroom/10 rounded-full blur-[150px]" />
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-noite-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg text-red-400">
            🔥 Dark Room
          </h1>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-20 text-center">
        {/* Lock icon */}
        <div className="mx-auto w-24 h-24 rounded-full bg-darkroom/20 border-2 border-darkroom/40 flex items-center justify-center mb-8">
          <Lock className="w-10 h-10 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
          Área Restrita
        </h1>
        <p className="text-lg text-noite-400 mb-8">
          O espaço mais exclusivo da Balada Digital.<br />
          <span className="text-red-400">Só pra maiores de 18.</span>
        </p>

        {/* Coming soon badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-darkroom/20 border border-darkroom/40 mb-12">
          <Calendar className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400 font-medium">Lançamento: Março 2026</span>
        </div>

        {/* Features preview */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <div className="p-6 rounded-2xl bg-surface-light/30 border border-white/5 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-darkroom/20">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-display font-bold text-white">Verificação de idade</h3>
            </div>
            <p className="text-sm text-noite-400">
              Acesso somente com documento verificado. Segurança pra todo mundo.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-surface-light/30 border border-white/5 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-darkroom/20">
                <Flame className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-display font-bold text-white">Experiências exclusivas</h3>
            </div>
            <p className="text-sm text-noite-400">
              Creators 18+, Camarotes especiais, shows ao vivo. O que acontece aqui, fica aqui.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <button 
            disabled
            className="px-8 py-4 rounded-2xl bg-darkroom/50 text-white/50 font-bold cursor-not-allowed"
          >
            🔒 Em breve...
          </button>
          <p className="text-xs text-noite-500">
            Quer ser avisado quando abrir?{' '}
            <button className="text-red-400 hover:underline">Deixa teu email</button>
          </p>
        </div>
      </main>

      {/* Bottom disclaimer */}
      <footer className="absolute bottom-0 inset-x-0 p-6 text-center">
        <p className="text-xs text-noite-600">
          ⚠️ Este espaço é exclusivo para maiores de 18 anos com verificação de identidade.
          <br />
          Violações resultam em banimento permanente.
        </p>
      </footer>
    </div>
  )
}
