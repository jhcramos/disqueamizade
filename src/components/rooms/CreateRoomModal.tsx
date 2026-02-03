import { useState } from 'react'
import { X, Lock, Globe, Users, Palette, Plus } from 'lucide-react'

const themes = [
  { id: 'cidade', label: 'Cidade', emoji: '🏙️' },
  { id: 'idade', label: 'Faixa Etária', emoji: '📊' },
  { id: 'hobby', label: 'Hobby', emoji: '🎯' },
  { id: 'idioma', label: 'Idioma', emoji: '🌍' },
  { id: 'gamer', label: 'Games', emoji: '🎮' },
]

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  userTier: 'free' | 'basic' | 'premium'
}

export const CreateRoomModal = ({ isOpen, onClose, userTier }: CreateRoomModalProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState('hobby')
  const [maxUsers, setMaxUsers] = useState(30)
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')

  if (!isOpen) return null

  const canCreate = userTier !== 'free'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">Criar Nova Sala</h2>
            <p className="text-xs text-dark-500 mt-1">Configure sua sala de chat</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!canCreate ? (
          <div className="p-6 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-lg font-bold text-white mb-2">Plano Basic+ necessário</h3>
            <p className="text-dark-400 text-sm mb-6">
              Faça upgrade para o plano Basic ou Premium para criar suas próprias salas.
            </p>
            <a href="/pricing" className="btn-primary inline-flex">Ver Planos</a>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="text-sm font-semibold text-dark-300 mb-2 block">Nome da Sala *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Papo sobre Tecnologia"
                className="input"
                maxLength={60}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold text-dark-300 mb-2 block">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Do que se trata esta sala?"
                className="input min-h-[80px] resize-none"
                maxLength={200}
              />
            </div>

            {/* Theme */}
            <div>
              <label className="text-sm font-semibold text-dark-300 mb-2 block">
                <Palette className="w-4 h-4 inline mr-1" />
                Categoria
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                      theme === t.id
                        ? 'border-primary-500/40 bg-primary-500/10 text-primary-400'
                        : 'border-white/5 bg-white/[0.02] text-dark-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="mr-1.5">{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Users */}
            <div>
              <label className="text-sm font-semibold text-dark-300 mb-2 block">
                <Users className="w-4 h-4 inline mr-1" />
                Capacidade Máxima
              </label>
              <select
                value={maxUsers}
                onChange={(e) => setMaxUsers(Number(e.target.value))}
                className="input"
              >
                <option value={10}>10 pessoas</option>
                <option value={20}>20 pessoas</option>
                <option value={30}>30 pessoas</option>
              </select>
            </div>

            {/* Privacy */}
            <div>
              <label className="text-sm font-semibold text-dark-300 mb-3 block">Acesso</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsPrivate(false)}
                  className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                    !isPrivate
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/5 text-dark-400 hover:bg-white/[0.04]'
                  }`}
                >
                  <Globe className="w-4 h-4" /> Pública
                </button>
                <button
                  onClick={() => setIsPrivate(true)}
                  className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                    isPrivate
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-white/5 text-dark-400 hover:bg-white/[0.04]'
                  }`}
                >
                  <Lock className="w-4 h-4" /> Privada
                </button>
              </div>
            </div>

            {/* Password (if private) */}
            {isPrivate && (
              <div>
                <label className="text-sm font-semibold text-dark-300 mb-2 block">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Defina uma senha para a sala"
                  className="input"
                />
              </div>
            )}

            {/* Submit */}
            <button
              disabled={!name.trim()}
              className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Criar Sala
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
