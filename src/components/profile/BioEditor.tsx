import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { UserBio } from '@/hooks/useHostBot'

const BRAZILIAN_CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza',
  'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia',
  'Belém', 'Porto Alegre', 'Florianópolis', 'Vitória', 'Natal',
  'Campo Grande', 'João Pessoa', 'Teresina', 'São Luís', 'Maceió',
  'Aracaju', 'Cuiabá', 'Macapá', 'Porto Velho', 'Boa Vista',
  'Palmas', 'Rio Branco', 'Outra',
]

const INTERESTS = [
  { label: 'Música', emoji: '🎵' },
  { label: 'Esportes', emoji: '⚽' },
  { label: 'Games', emoji: '🎮' },
  { label: 'Leitura', emoji: '📚' },
  { label: 'Filmes/Séries', emoji: '🎬' },
  { label: 'Tecnologia', emoji: '💻' },
  { label: 'Culinária', emoji: '🍳' },
  { label: 'Viagens', emoji: '✈️' },
  { label: 'Arte', emoji: '🎨' },
  { label: 'Fitness', emoji: '🏋️' },
  { label: 'Fotografia', emoji: '📷' },
  { label: 'Animais', emoji: '🐾' },
  { label: 'Idiomas', emoji: '🌍' },
  { label: 'Teatro', emoji: '🎭' },
  { label: 'Automóveis', emoji: '🚗' },
]

const MOODS = ['😄', '😎', '🤔', '😴', '🔥', '💀', '🥳', '😍']

const LOOKING_FOR = [
  { id: 'amizade', label: 'Amizade', emoji: '🤝' },
  { id: 'namoro', label: 'Namoro', emoji: '💕' },
  { id: 'bate-papo', label: 'Bate-papo', emoji: '💬' },
  { id: 'networking', label: 'Networking', emoji: '💼' },
  { id: 'games', label: 'Jogar', emoji: '🎮' },
]

interface BioEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (bio: UserBio) => void
  initialBio?: UserBio
}

function loadBio(): UserBio | null {
  try {
    const raw = localStorage.getItem('disque-amizade-bio')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveBio(bio: UserBio) {
  localStorage.setItem('disque-amizade-bio', JSON.stringify(bio))
}

export function getBioCompletion(bio?: UserBio | null): number {
  if (!bio) return 0
  let filled = 0
  const total = 5
  if (bio.displayName) filled++
  if (bio.city) filled++
  if (bio.interests && bio.interests.length > 0) filled++
  if (bio.about) filled++
  if (bio.mood) filled++
  return Math.round((filled / total) * 100)
}

export const BioEditor = ({ isOpen, onClose, onSave, initialBio }: BioEditorProps) => {
  const stored = loadBio()
  const base = initialBio || stored || { displayName: '' }
  
  const [displayName, setDisplayName] = useState(base.displayName || '')
  const [city, setCity] = useState(base.city || '')
  const [interests, setInterests] = useState<string[]>(base.interests || [])
  const [about, setAbout] = useState(base.about || '')
  const [mood, setMood] = useState(base.mood || '')
  const [lookingFor, setLookingFor] = useState<string[]>(base.lookingFor || [])

  useEffect(() => {
    if (isOpen) {
      const s = loadBio()
      if (s) {
        setDisplayName(s.displayName || '')
        setCity(s.city || '')
        setInterests(s.interests || [])
        setAbout(s.about || '')
        setMood(s.mood || '')
        setLookingFor(s.lookingFor || [])
      }
    }
  }, [isOpen])

  const toggleInterest = (label: string) => {
    setInterests(prev => prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label])
  }

  const toggleLookingFor = (id: string) => {
    setLookingFor(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleSave = () => {
    const bio: UserBio = { displayName, city: city || undefined, interests: interests.length > 0 ? interests : undefined, about: about || undefined, mood: mood || undefined, lookingFor: lookingFor.length > 0 ? lookingFor : undefined }
    saveBio(bio)
    onSave(bio)
    onClose()
  }

  const completion = getBioCompletion({ displayName, city, interests, about, mood })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-dark-900 border border-amber-500/20 rounded-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in shadow-2xl shadow-amber-500/10" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-amber-500/10 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div>
              <h2 className="text-lg font-bold text-amber-300">Seu Perfil Real</h2>
              <p className="text-xs text-amber-400/60">Complete para ser anunciado como um nobre!</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all text-dark-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Completion Meter */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-dark-400">Perfil completo</span>
              <span className="text-amber-400 font-bold">{completion}%</span>
            </div>
            <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500" style={{ width: `${completion}%` }} />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">Nome de exibição *</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Como quer ser chamado(a)?"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">Cidade</label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-amber-500/40 appearance-none cursor-pointer"
            >
              <option value="" className="bg-dark-900">Selecione sua cidade</option>
              {BRAZILIAN_CITIES.map(c => (
                <option key={c} value={c} className="bg-dark-900">{c}</option>
              ))}
            </select>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-2">Interesses</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(({ label, emoji }) => (
                <button
                  key={label}
                  onClick={() => toggleInterest(label)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    interests.includes(label)
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                      : 'bg-white/[0.03] text-dark-400 border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">Sobre mim <span className="text-dark-600">({about.length}/150)</span></label>
            <textarea
              value={about}
              onChange={e => setAbout(e.target.value.slice(0, 150))}
              placeholder="Conte algo sobre você..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-dark-500 text-sm focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
            />
          </div>

          {/* Looking For */}
          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-2">O que busco</label>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  onClick={() => toggleLookingFor(id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    lookingFor.includes(id)
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-sm shadow-violet-500/10'
                      : 'bg-white/[0.03] text-dark-400 border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-2">Humor do dia</label>
            <div className="flex gap-2">
              {MOODS.map(m => (
                <button
                  key={m}
                  onClick={() => setMood(mood === m ? '' : m)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                    mood === m
                      ? 'bg-amber-500/20 border-2 border-amber-500/40 scale-110'
                      : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-dark-400 text-sm hover:bg-white/[0.08] transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!displayName.trim()}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-dark-900 text-sm font-bold hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
          >
            👑 Salvar Perfil
          </button>
        </div>
      </div>
    </div>
  )
}

export default BioEditor
