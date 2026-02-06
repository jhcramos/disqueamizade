import { useState } from 'react'
import { X, Sparkles, Users, Lock, Unlock, MessageCircle, Gamepad2, Heart, Music } from 'lucide-react'

interface CreateCamaroteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { name: string; type: string; maxParticipants: number; isPrivate: boolean }) => void
  userFichas: number
}

const CAMAROTE_TYPES = [
  { id: 'papo', emoji: '💬', label: 'Papo Reto', description: 'Conversa profunda', icon: MessageCircle, max: 4 },
  { id: 'esquenta', emoji: '🎲', label: 'Esquenta', description: 'Jogos e diversão', icon: Gamepad2, max: 6 },
  { id: 'duo', emoji: '💕', label: 'Duo', description: 'Match a dois', icon: Heart, max: 2 },
  { id: 'karaoke', emoji: '🎵', label: 'Karaokê', description: 'Cante junto', icon: Music, max: 8 },
]

const COST = 20 // 💎

export const CreateCamaroteModal = ({ isOpen, onClose, onConfirm, userFichas }: CreateCamaroteModalProps) => {
  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState('papo')
  const [isPrivate, setIsPrivate] = useState(false)

  if (!isOpen) return null

  const selectedConfig = CAMAROTE_TYPES.find(t => t.id === selectedType)!
  const canAfford = userFichas >= COST

  const handleConfirm = () => {
    if (!name.trim() || !canAfford) return
    onConfirm({
      name: name.trim(),
      type: selectedType,
      maxParticipants: selectedConfig.max,
      isPrivate,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
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
            />
            <p className="text-xs text-dark-500 mt-1">{name.length}/30 caracteres</p>
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Tipo de Camarote</label>
            <div className="grid grid-cols-2 gap-2">
              {CAMAROTE_TYPES.map(type => {
                const Icon = type.icon
                const isSelected = selectedType === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-elite-500/10 border-elite-500/30'
                        : 'bg-noite-900/50 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{type.emoji}</span>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-elite-400' : 'text-dark-400'}`} />
                    </div>
                    <div className="text-sm font-semibold text-white">{type.label}</div>
                    <div className="text-xs text-dark-500">{type.description}</div>
                    <div className="text-xs text-dark-400 mt-1">
                      <Users className="w-3 h-3 inline mr-1" />
                      até {type.max} pessoas
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Privacy Toggle */}
          <div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                isPrivate
                  ? 'bg-energia-500/10 border-energia-500/30'
                  : 'bg-noite-900/50 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                {isPrivate ? (
                  <Lock className="w-5 h-5 text-energia-400" />
                ) : (
                  <Unlock className="w-5 h-5 text-dark-400" />
                )}
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">
                    {isPrivate ? 'Privado (com senha)' : 'Aberto (qualquer um entra)'}
                  </div>
                  <div className="text-xs text-dark-500">
                    {isPrivate ? 'Só quem você convidar' : 'Visível para todos na sala'}
                  </div>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-all ${isPrivate ? 'bg-energia-500' : 'bg-dark-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5 ${isPrivate ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
            </button>
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
            Criar Camarote
          </button>
        </div>
      </div>
    </div>
  )
}
