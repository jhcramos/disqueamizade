import { useState } from 'react'
import { X, Sparkles, Users, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'

interface CreateCamaroteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { name: string }) => void
  isPremium: boolean // true = pagante, false = free
}

const MAX_PARTICIPANTS = 6

export const CreateCamaroteModal = ({ isOpen, onClose, onConfirm, isPremium }: CreateCamaroteModalProps) => {
  const [name, setName] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!name.trim() || !isPremium) return
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
        <div className="p-4">
          {isPremium ? (
            /* Usuário pagante - pode criar */
            <div className="space-y-4">
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
            </div>
          ) : (
            /* Usuário free - não pode criar */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-elite-500/10 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-elite-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Recurso Premium</h3>
              <p className="text-sm text-dark-400 mb-4">
                Apenas usuários pagantes podem criar Camarotes VIP.
              </p>
              <p className="text-xs text-dark-500">
                Faça upgrade para criar salas privadas, ter destaque e muito mais!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 btn-ghost">
            {isPremium ? 'Cancelar' : 'Fechar'}
          </button>
          
          {isPremium ? (
            <button
              onClick={handleConfirm}
              disabled={!name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-elite-500 to-elite-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-elite-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Criar
            </button>
          ) : (
            <Link to="/pricing" className="flex-1">
              <button className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-elite-500 to-elite-600 text-white font-bold hover:shadow-lg hover:shadow-elite-500/30 transition-all flex items-center justify-center gap-2">
                <Crown className="w-4 h-4" />
                Fazer Upgrade
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
