import { useState, useRef } from 'react'
import { Image, Upload, X, Check, Sparkles } from 'lucide-react'
import { useToastStore } from '@/components/common/ToastContainer'

export type BackgroundOption = {
  id: string
  label: string
  emoji: string
  src: string | null // null = no background (real camera)
}

const PRESET_BACKGROUNDS: BackgroundOption[] = [
  { id: 'none', label: 'Sem fundo', emoji: '📷', src: null },
  { id: 'blur', label: 'Desfocado', emoji: '🌫️', src: 'blur' },
  { id: 'praia', label: 'Praia', emoji: '🏖️', src: '/backgrounds/bg-praia.png' },
  { id: 'balada', label: 'Balada', emoji: '🎉', src: '/backgrounds/bg-balada.png' },
  { id: 'mansao', label: 'Mansão', emoji: '🏛️', src: '/backgrounds/bg-mansao.png' },
  { id: 'bar', label: 'Bar', emoji: '🍺', src: '/backgrounds/bg-bar.png' },
]

interface BackgroundSelectorProps {
  selectedBg: string | null
  onSelect: (bg: BackgroundOption) => void
  compact?: boolean
}

export const BackgroundSelector = ({ selectedBg, onSelect, compact = false }: BackgroundSelectorProps) => {
  const [customBgs, setCustomBgs] = useState<BackgroundOption[]>(() => {
    try {
      const saved = localStorage.getItem('da_custom_backgrounds')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [showPanel, setShowPanel] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToastStore()

  const allBackgrounds = [...PRESET_BACKGROUNDS, ...customBgs]

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      addToast({ type: 'error', title: 'Muito grande', message: 'Máximo 2MB para imagem de fundo' })
      return
    }

    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', title: 'Formato inválido', message: 'Use JPG, PNG ou WebP' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const newBg: BackgroundOption = {
        id: `custom-${Date.now()}`,
        label: file.name.split('.')[0].slice(0, 15),
        emoji: '🖼️',
        src: dataUrl,
      }
      const updated = [...customBgs, newBg]
      setCustomBgs(updated)
      localStorage.setItem('da_custom_backgrounds', JSON.stringify(updated))
      onSelect(newBg)
      addToast({ type: 'success', title: '🖼️ Fundo adicionado!', message: 'Seu fundo personalizado está pronto' })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeCustomBg = (id: string) => {
    const updated = customBgs.filter(bg => bg.id !== id)
    setCustomBgs(updated)
    localStorage.setItem('da_custom_backgrounds', JSON.stringify(updated))
    if (selectedBg === id) onSelect(PRESET_BACKGROUNDS[0]) // back to no bg
  }

  if (compact) {
    return (
      <div className="relative">
        <button onClick={() => setShowPanel(!showPanel)}
          className={`p-2 rounded-xl transition-all ${showPanel ? 'bg-primary-500/20 text-primary-400' : 'bg-white/[0.06] text-dark-400 hover:text-white hover:bg-white/10'}`}
          title="Trocar fundo">
          <Image className="w-5 h-5" />
        </button>

        {showPanel && (
          <div className="absolute bottom-full mb-2 right-0 w-72 bg-dark-900 border border-white/10 rounded-2xl shadow-elevated p-3 animate-slide-up z-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary-400" /> Fundo Virtual
              </h4>
              <button onClick={() => setShowPanel(false)} className="text-dark-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {allBackgrounds.map(bg => (
                <button key={bg.id} onClick={() => onSelect(bg)}
                  className={`relative rounded-lg overflow-hidden aspect-video border-2 transition-all ${
                    (selectedBg === bg.id || (selectedBg === null && bg.id === 'none'))
                      ? 'border-primary-500 shadow-sm shadow-primary-500/20'
                      : 'border-transparent hover:border-white/20'
                  }`}>
                  {bg.src && bg.src !== 'blur' ? (
                    <img src={bg.src} alt={bg.label} className="w-full h-full object-cover" />
                  ) : bg.src === 'blur' ? (
                    <div className="w-full h-full bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
                      <span className="text-lg">🌫️</span>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-dark-800 flex items-center justify-center">
                      <span className="text-lg">📷</span>
                    </div>
                  )}
                  {(selectedBg === bg.id || (selectedBg === null && bg.id === 'none')) && (
                    <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {bg.id.startsWith('custom-') && (
                    <button onClick={(e) => { e.stopPropagation(); removeCustomBg(bg.id) }}
                      className="absolute top-0 right-0 p-0.5 bg-red-500/80 rounded-bl-md">
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  )}
                </button>
              ))}

              {/* Upload button */}
              <button onClick={() => fileRef.current?.click()}
                className="rounded-lg aspect-video border-2 border-dashed border-white/10 hover:border-primary-500/30 flex items-center justify-center transition-all hover:bg-primary-500/[0.03]">
                <Upload className="w-3.5 h-3.5 text-dark-500" />
              </button>
            </div>

            <p className="text-[9px] text-dark-600 text-center">Clique para selecionar • Upload: max 2MB</p>

            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </div>
        )}
      </div>
    )
  }

  // Full panel (non-compact)
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-dark-300 flex items-center gap-1.5">
        <Image className="w-3.5 h-3.5" /> Fundo Virtual
      </h4>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {allBackgrounds.map(bg => (
          <button key={bg.id} onClick={() => onSelect(bg)}
            className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all group ${
              (selectedBg === bg.id || (selectedBg === null && bg.id === 'none'))
                ? 'border-primary-500 ring-2 ring-primary-500/20'
                : 'border-white/5 hover:border-white/20'
            }`}>
            {bg.src && bg.src !== 'blur' ? (
              <img src={bg.src} alt={bg.label} className="w-full h-full object-cover" />
            ) : bg.src === 'blur' ? (
              <div className="w-full h-full bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
                <span className="text-2xl">🌫️</span>
              </div>
            ) : (
              <div className="w-full h-full bg-dark-800 flex items-center justify-center">
                <span className="text-2xl">📷</span>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1">
              <span className="text-[9px] text-white font-medium">{bg.label}</span>
            </div>
          </button>
        ))}
        <button onClick={() => fileRef.current?.click()}
          className="rounded-xl aspect-video border-2 border-dashed border-white/10 hover:border-primary-500/30 flex flex-col items-center justify-center transition-all gap-1">
          <Upload className="w-4 h-4 text-dark-500" />
          <span className="text-[9px] text-dark-500">Upload</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  )
}
