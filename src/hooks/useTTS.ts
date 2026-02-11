import { useCallback, useRef } from 'react'

// ─── Voice Styles ───
export const VOICE_STYLES = {
  entrance: { rate: 0.85, pitch: 0.7, volume: 0.9 },
  farewell: { rate: 0.95, pitch: 0.8, volume: 0.7 },
  icebreaker: { rate: 1.0, pitch: 0.9, volume: 0.8 },
  quiz: { rate: 0.9, pitch: 1.0, volume: 0.85 },
  reaction: { rate: 1.1, pitch: 1.1, volume: 0.7 },
} as const

export type VoiceStyle = keyof typeof VOICE_STYLES

// ─── Strip emojis from text for TTS ───
const stripEmojis = (text: string): string =>
  text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').trim()

// ─── Trumpet Fanfare ───
const playFanfare = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const ctx = new AudioContext()
      const notes = [523.25, 659.25, 783.99] // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.value = freq
        gain.gain.value = 0.3
        osc.connect(gain).connect(ctx.destination)
        osc.start(ctx.currentTime + i * 0.15)
        osc.stop(ctx.currentTime + i * 0.15 + 0.15)
      })
      // Wait for fanfare to finish
      setTimeout(resolve, notes.length * 150 + 100)
    } catch {
      resolve()
    }
  })
}

// ─── TTS Hook ───
export const useTTS = () => {
  const lastSpokenTime = useRef(0)
  const joinedTime = useRef(Date.now())

  const isEnabled = (): boolean => {
    const stored = localStorage.getItem('arauto-voice-enabled')
    if (stored === null) return true // Default ON
    return stored === 'true'
  }

  const setEnabled = (enabled: boolean) => {
    localStorage.setItem('arauto-voice-enabled', String(enabled))
  }

  const speak = useCallback((text: string, style?: VoiceStyle, withFanfare = false) => {
    // Check if enabled
    if (!isEnabled()) return
    if (!('speechSynthesis' in window)) return

    // Don't speak if tab is hidden
    if (document.hidden) return

    // Don't speak if user just joined (2s grace period)
    if (Date.now() - joinedTime.current < 2000) return

    // Rate limit: max 1 spoken announcement per 30 seconds
    const now = Date.now()
    if (now - lastSpokenTime.current < 30000) return
    lastSpokenTime.current = now

    const cleanText = stripEmojis(text)
    if (!cleanText) return

    const opts = style ? VOICE_STYLES[style] : { rate: 0.9, pitch: 0.8, volume: 0.8 }

    const doSpeak = () => {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'pt-BR'
      utterance.rate = opts.rate
      utterance.pitch = opts.pitch
      utterance.volume = opts.volume

      // Try to find a Portuguese voice
      const voices = window.speechSynthesis.getVoices()
      const ptVoice = voices.find(v => v.lang.startsWith('pt-BR')) || voices.find(v => v.lang.startsWith('pt'))
      if (ptVoice) utterance.voice = ptVoice

      window.speechSynthesis.speak(utterance)
    }

    if (withFanfare) {
      playFanfare().then(doSpeak)
    } else {
      doSpeak()
    }
  }, [])

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  return { speak, stop, isEnabled, setEnabled }
}
