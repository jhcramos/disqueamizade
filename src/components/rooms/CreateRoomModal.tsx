import { useState } from 'react'
import { X, Lock, Globe, Users, Palette, Plus, Loader2 } from 'lucide-react'
import { supabase } from '@/services/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/components/common/ToastContainer'

const themes = [
  { id: 'papo', label: 'Papo Geral', emoji: '💬' },
  { id: 'hobby', label: 'Hobby', emoji: '🎯' },
  { id: 'games', label: 'Games', emoji: '🎮' },
  { id: 'musica', label: 'Música', emoji: '🎵' },
  { id: 'bebida', label: 'Bebida', emoji: '🍺' },
  { id: 'paquera', label: 'Paquera', emoji: '💘' },
  { id: 'adulto', label: '+18', emoji: '🔞' },
  { id: 'idioma', label: 'Idioma', emoji: '🌍' },
  { id: 'esporte', label: 'Esporte', emoji: '⚽' },
  { id: 'outro', label: 'Outro', emoji: '✨' },
]

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  userTier: string
  onCreated?: () => void
}

export const CreateRoomModal = ({ isOpen, onClose, onCreated }: CreateRoomModalProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState('papo')
  const [maxUsers, setMaxUsers] = useState(20)
  const [isPrivate, setIsPrivate] = useState(false)
  const [creating, setCreating] = useState(false)

  const user = useAuthStore(s => s.user)
  const profile = useAuthStore(s => s.profile)
  const isGuest = useAuthStore(s => s.isGuest)
  const { addToast } = useToastStore()

  if (!isOpen) return null

  const isLoggedIn = !!user && !isGuest

  const autoSlug = (text: string) => {
    const base = text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    // Add prefix based on theme for classification
    const prefix = theme === 'adulto' ? 'adult-' : theme === 'idioma' ? 'idioma-' : 'community-'
    return `${prefix}${base}`
  }

  const handleCreate = async () => {
    if (!name.trim() || !user) return
    setCreating(true)

    try {
      const slug = autoSlug(name)
      const themeEmoji = themes.find(t => t.id === theme)?.emoji || '💬'
      const roomName = `${themeEmoji} ${name.trim()}`

      const { error } = await supabase
        .from('rooms')
        .insert({
          name: roomName,
          slug,
          description: description.trim() || `Sala criada por ${profile?.username || 'usuário'}`,
          type: 'publica',
          max_participants: maxUsers,
          ficha_cost: 0,
          is_active: true,
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          addToast({ type: 'error', title: 'Nome já existe', message: 'Já existe uma sala com esse nome. Tente outro!' })
        } else {
          throw error
        }
      } else {
        addToast({ type: 'success', title: '🎉 Sala criada!', message: `"${roomName}" está no ar!` })
        setName('')
        setDescription('')
        setTheme('papo')
        onClose()
        onCreated?.()
      }
    } catch (err: any) {
      console.error('Create room error:', err)
      addToast({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível criar a sala' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up rounded-t-3xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white">Criar Sala</h2>
            <p className="text-xs text-dark-500 mt-0.5">Sua sala, suas regras</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isLoggedIn ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-3">🔐</div>
            <h3 className="text-lg font-bold text-white mb-2">Faça login primeiro</h3>
            <p className="text-dark-400 text-sm mb-4">Crie uma conta gratuita para abrir sua própria sala.</p>
            <a href="/auth" className="btn-primary inline-flex">Criar Conta</a>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs text-dark-400 font-medium uppercase tracking-wider mb-1.5 block">Nome da Sala *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex: Papo sobre Tecnologia" className="input" maxLength={50} />
              <p className="text-[10px] text-dark-600 mt-1">{name.length}/50</p>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-dark-400 font-medium uppercase tracking-wider mb-1.5 block">Descrição</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Do que é essa sala?" className="input min-h-[60px] resize-none" maxLength={150} />
            </div>

            {/* Theme */}
            <div>
              <label className="text-xs text-dark-400 font-medium uppercase tracking-wider mb-1.5 block">
                <Palette className="w-3 h-3 inline mr-1" /> Tema
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {themes.map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      theme === t.id
                        ? 'border-primary-500/40 bg-primary-500/10 text-primary-400'
                        : 'border-white/5 bg-white/[0.02] text-dark-400 hover:bg-white/[0.04]'
                    }`}>
                    <div className="text-lg">{t.emoji}</div>
                    <div className="text-[9px] mt-0.5 font-medium">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Capacity + Access */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-dark-400 font-medium uppercase tracking-wider mb-1.5 block">
                  <Users className="w-3 h-3 inline mr-1" /> Capacidade
                </label>
                <select value={maxUsers} onChange={e => setMaxUsers(Number(e.target.value))} className="input text-sm">
                  <option value={5}>5 pessoas</option>
                  <option value={10}>10 pessoas</option>
                  <option value={15}>15 pessoas</option>
                  <option value={20}>20 pessoas</option>
                  <option value={30}>30 pessoas</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 font-medium uppercase tracking-wider mb-1.5 block">Acesso</label>
                <div className="flex gap-1.5">
                  <button onClick={() => setIsPrivate(false)}
                    className={`flex-1 p-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                      !isPrivate ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/5 text-dark-400'
                    }`}>
                    <Globe className="w-3 h-3" /> Pública
                  </button>
                  <button onClick={() => setIsPrivate(true)}
                    className={`flex-1 p-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                      isPrivate ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-white/5 text-dark-400'
                    }`}>
                    <Lock className="w-3 h-3" /> Privada
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleCreate} disabled={!name.trim() || creating}
              className="btn-primary w-full py-3 disabled:opacity-40 font-semibold flex items-center justify-center gap-2">
              {creating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</>
              ) : (
                <><Plus className="w-4 h-4" /> Criar Sala</>
              )}
            </button>

            <p className="text-[10px] text-dark-600 text-center">
              Salas da comunidade podem ser moderadas pela equipe do Disque Amizade.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
