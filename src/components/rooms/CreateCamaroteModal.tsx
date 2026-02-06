import { useState } from 'react'
import { X, Sparkles, Users } from 'lucide-react'

interface CreateCamaroteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { name: string }) => void
  userFichas: number
}

const COST = 20 // 💎
const MAX_PARTICIPANTS = 6

export const CreateCamaroteModal = ({ isOpen, onClose, onConfirm, userFichas }: CreateCamaroteModalProps) => {
  const [name, setName] = useState('')

  if (!isOpen) return null

  const canAfford = userFichas >= COST

  const handleConfirm = () => {
    if (!name.trim() || !canAfford) return
    onConfirm({ name: name.trim() })
    setName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-elite-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-elite-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Criar Camarote VIP</h2>
              <p className="text-xs text-dark-500">Sua sala privada nesta sala</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Nome do Camarote</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Cantinho do Zé"
              maxLength={30}
              className="input w-full"
              autoFocus
            />
            <p className="text-xs text-dark-500 mt-1">{name.length}/30 caracteres</p>
          </div>

          {/* Info */}
          <div className="p-3 rounded-xl bg-noite-900/50 border border-white/5">
            <div className="flex items-center gap-2 text-sm text-dark-300">
              <Users className="w-4 h-4 text-elite-400" />
              <span>Até <strong className="text-white">{MAX_PARTICIPANTS} pessoas</strong></span>
            </div>
            <p className="text-xs text-dark-500 mt-1">Você pode remover participantes a qualquer momento</p>
          </div>

          {/* Cost */}
          <div className={`p-4 rounded-xl border ${canAfford ? 'bg-elite-500/5 border-elite-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Custo</div>
                <div className="text-xs text-dark-500">Suas fichas: {userFichas}💎</div>
              </div>
              <div className={`text-2xl font-bold ${canAfford ? 'text-elite-400' : 'text-red-400'}`}>
                {COST}💎
              </div>
            </div>
            {!canAfford && (
              <p className="text-xs text-red-400 mt-2">Fichas insuficientes! Compre mais fichas.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 btn-ghost">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim() || !canAfford}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-elite-500 to-elite-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-elite-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Criar (20💎)
          </button>
        </div>
      </div>
    </div>
  )
}
