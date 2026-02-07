import { useState, useRef, useEffect } from 'react'
import { useToastStore } from '@/components/common/ToastContainer'
import { EMOJI_MASKS, type MaskItem } from '@/hooks/useVideoFilter'

// CSS filter strings for each filter ID
export const FILTER_CSS: Record<string, string> = {
  normal: 'none',
  sepia: 'sepia(0.8) saturate(1.2)',
  bw: 'grayscale(1)',
  neon: 'saturate(2.5) contrast(1.3) hue-rotate(30deg)',
  vintage: 'sepia(0.4) saturate(0.8) contrast(1.1) brightness(0.95)',
  blur: 'blur(2px)',
}

const FILTERS = [
  { id: 'normal', label: 'Normal', emoji: '🔄' },
  { id: 'sepia', label: 'Sépia', emoji: '🟤' },
  { id: 'bw', label: 'P&B', emoji: '⬛' },
  { id: 'neon', label: 'Neon', emoji: '💜' },
  { id: 'vintage', label: 'Vintage', emoji: '📼' },
  { id: 'blur', label: 'Blur', emoji: '🌫️' },
]

interface CameraMasksButtonProps {
  userTier?: 'free' | 'basic' | 'premium'
  size?: 'sm' | 'md'
  activeFilter?: string
  onFilterChange?: (filterId: string) => void
  activeMask?: string | null
  onMaskChange?: (maskId: string | null) => void
  beautySmooth?: boolean
  onBeautySmoothChange?: (v: boolean) => void
  beautyBrighten?: boolean
  onBeautyBrightenChange?: (v: boolean) => void
}

export const CameraMasksButton = ({
  size = 'md',
  activeFilter,
  onFilterChange,
  activeMask,
  onMaskChange,
  beautySmooth = false,
  onBeautySmoothChange,
  beautyBrighten = false,
  onBeautyBrightenChange,
}: CameraMasksButtonProps) => {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'masks' | 'filters' | 'beauty'>('masks')
  const ref = useRef<HTMLDivElement>(null)
  const { addToast } = useToastStore()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const btnClass = size === 'sm'
    ? 'p-2 rounded-lg text-sm'
    : 'p-3 rounded-xl'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`${btnClass} border transition-all ${
          open || activeMask ? 'bg-primary-500/15 border-primary-500/30 text-primary-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
        }`}
        title="Máscaras e Filtros"
      >
        <span className="text-lg leading-none">🎭</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-80 rounded-2xl bg-dark-900 border border-white/10 shadow-2xl overflow-hidden animate-slide-up z-50">
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">🎭 Máscaras & Filtros</h3>
            <p className="text-[10px] text-dark-400">Personalize sua câmera</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5">
            {[
              { id: 'masks' as const, label: '🎭 Máscaras' },
              { id: 'filters' as const, label: '✨ Filtros' },
              { id: 'beauty' as const, label: '💄 Beleza' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 text-xs font-medium transition-all ${
                  tab === t.id ? 'text-primary-400 bg-primary-500/10 border-b-2 border-primary-400' : 'text-dark-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto p-3">
            {/* ─── MASKS TAB ─── */}
            {tab === 'masks' && (
              <>
                {/* Emojis */}
                <p className="text-[10px] text-dark-500 font-semibold mb-1.5">😺 Emojis ({EMOJI_MASKS.filter(m => m.category === 'emoji').length})</p>
                <div className="grid grid-cols-6 gap-1 mb-3">
                  {EMOJI_MASKS.filter(m => m.category === 'emoji').map(mask => {
                    const selected = activeMask === mask.id
                    return (
                      <button
                        key={mask.id}
                        onClick={() => {
                          const next = selected ? null : mask.id
                          onMaskChange?.(next)
                          addToast({ type: 'success', title: next ? `🎭 ${mask.name}` : '🎭 Removida' })
                        }}
                        className={`flex flex-col items-center gap-0 p-1.5 rounded-lg transition-all ${
                          selected
                            ? 'bg-primary-500/20 border-2 border-primary-500/40 scale-110'
                            : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:scale-105'
                        }`}
                      >
                        <span className="text-lg">{mask.emoji}</span>
                        <span className="text-[7px] text-dark-500 truncate w-full text-center leading-tight">{mask.name}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Óculos */}
                <p className="text-[10px] text-dark-500 font-semibold mb-1.5">🕶️ Óculos</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {EMOJI_MASKS.filter(m => m.category === 'glasses').map(mask => {
                    const selected = activeMask === mask.id
                    return (
                      <button
                        key={mask.id}
                        onClick={() => {
                          const next = selected ? null : mask.id
                          onMaskChange?.(next)
                          addToast({ type: 'success', title: next ? `🕶️ ${mask.name}` : '🕶️ Removido' })
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                          selected
                            ? 'bg-primary-500/20 border-2 border-primary-500/40'
                            : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.08]'
                        }`}
                      >
                        <img src={mask.image} alt={mask.name} className="w-10 h-6 object-contain rounded" />
                        <span className="text-[10px] text-dark-300">{mask.name}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Carnaval */}
                <p className="text-[10px] text-dark-500 font-semibold mb-1.5">🎭 Carnaval</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {EMOJI_MASKS.filter(m => m.category === 'carnival').map(mask => {
                    const selected = activeMask === mask.id
                    return (
                      <button
                        key={mask.id}
                        onClick={() => {
                          const next = selected ? null : mask.id
                          onMaskChange?.(next)
                          addToast({ type: 'success', title: next ? `🎭 ${mask.name}` : '🎭 Removida' })
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                          selected
                            ? 'bg-pink-500/20 border-2 border-pink-500/40'
                            : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.08]'
                        }`}
                      >
                        <img src={mask.image} alt={mask.name} className="w-10 h-6 object-contain rounded" />
                        <span className="text-[10px] text-dark-300">{mask.name}</span>
                      </button>
                    )
                  })}
                </div>

                {activeMask && (
                  <button
                    onClick={() => { onMaskChange?.(null); addToast({ type: 'info', title: '🎭 Máscara removida' }) }}
                    className="w-full py-1.5 text-xs text-dark-400 hover:text-white bg-white/[0.03] rounded-lg border border-white/5 hover:bg-white/[0.06] transition-all"
                  >
                    ✕ Remover máscara
                  </button>
                )}

                <p className="text-[10px] text-dark-600 text-center mt-2">
                  Face tracking em tempo real 🎯
                </p>
              </>
            )}

            {/* ─── FILTERS TAB ─── */}
            {tab === 'filters' && (
              <div className="grid grid-cols-3 gap-2">
                {FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onFilterChange?.(f.id)
                      addToast({ type: 'success', title: `✨ Filtro: ${f.label}` })
                    }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      (activeFilter || 'normal') === f.id
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40 scale-105'
                        : 'bg-white/[0.04] text-dark-300 border border-white/5 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="text-xl">{f.emoji}</span>
                    <span className="text-xs font-medium">{f.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ─── BEAUTY TAB ─── */}
            {tab === 'beauty' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <span className="text-sm text-white">✨ Suavizar pele</span>
                    <p className="text-[10px] text-dark-500">Efeito blur suave no rosto</p>
                  </div>
                  <button
                    onClick={() => {
                      onBeautySmoothChange?.(!beautySmooth)
                      addToast({ type: 'info', title: !beautySmooth ? '✨ Suavizar ativado' : '✨ Suavizar desativado' })
                    }}
                    className={`w-10 h-5 rounded-full transition-all flex-shrink-0 ${beautySmooth ? 'bg-primary-500' : 'bg-dark-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${beautySmooth ? 'ml-[22px]' : 'ml-[2px]'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <span className="text-sm text-white">💡 Clarear rosto</span>
                    <p className="text-[10px] text-dark-500">Melhora iluminação facial</p>
                  </div>
                  <button
                    onClick={() => {
                      onBeautyBrightenChange?.(!beautyBrighten)
                      addToast({ type: 'info', title: !beautyBrighten ? '💡 Clarear ativado' : '💡 Clarear desativado' })
                    }}
                    className={`w-10 h-5 rounded-full transition-all flex-shrink-0 ${beautyBrighten ? 'bg-primary-500' : 'bg-dark-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${beautyBrighten ? 'ml-[22px]' : 'ml-[2px]'}`} />
                  </button>
                </div>

                <p className="text-[10px] text-dark-600 text-center">
                  Efeitos aplicados na região do rosto detectado 🎯
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CameraMasksButton
