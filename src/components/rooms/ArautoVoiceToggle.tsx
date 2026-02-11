import { useState } from 'react'

interface ArautoVoiceToggleProps {
  isEnabled: () => boolean
  setEnabled: (enabled: boolean) => void
}

export const ArautoVoiceToggle = ({ isEnabled, setEnabled }: ArautoVoiceToggleProps) => {
  const [enabled, setLocalEnabled] = useState(isEnabled())

  const toggle = () => {
    const next = !enabled
    setLocalEnabled(next)
    setEnabled(next)
    if (!next) {
      window.speechSynthesis?.cancel()
    }
  }

  return (
    <button
      onClick={toggle}
      title="Voz do Arauto"
      className={`
        p-2 rounded-lg transition-all text-sm
        ${enabled
          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
          : 'bg-dark-700/50 text-dark-500 hover:bg-dark-600/50 border border-dark-600/30'
        }
      `}
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  )
}

export default ArautoVoiceToggle
