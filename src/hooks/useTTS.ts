import { useCallback, useRef } from 'react'

export const VOICE_STYLES = {
  entrance:   { rate: 0.85, pitch: 0.7, volume: 0.9 },
  farewell:   { rate: 0.95, pitch: 0.8, volume: 0.7 },
  icebreaker: { rate: 1.0,  pitch: 0.9, volume: 0.8 },
  quiz:       { rate: 0.9,  pitch: 1.0, volume: 0.85 },
  reaction:   { rate: 1.1,  pitch: 1.1, volume: 0.7 },
} as const

export type VoiceStyle = keyof typeof VOICE_STYLES

const stripEmojis = (text: string): string =>
  text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}]/gu, '').replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim()

// ─── Trumpet Fanfare (Web Audio API — always works) ───
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
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.2)
        osc.connect(gain).connect(ctx.destination)
        osc.start(ctx.currentTime + i * 0.15)
        osc.stop(ctx.currentTime + i * 0.15 + 0.2)
      })
      setTimeout(resolve, notes.length * 150 + 200)
    } catch {
      resolve()
    }
  })
}

// ─── Get best PT-BR voice ───
let cachedVoice: SpeechSynthesisVoice | null = null
const getPTBRVoice = (): SpeechSynthesisVoice | null => {
  if (cachedVoice) return cachedVoice
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  // Prefer Luciana or any pt-BR female voice
  cachedVoice = voices.find(v => v.name.includes('Luciana')) 
    || voices.find(v => v.lang === 'pt-BR' && v.name.toLowerCase().includes('female'))
    || voices.find(v => v.lang === 'pt-BR')
    || voices.find(v => v.lang.startsWith('pt'))
    || null
  return cachedVoice
}

// Warm up voices on load
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = null
    getPTBRVoice()
  })
}

export function useTTS() {
  const queueRef = useRef<Array<{ text: string; style: VoiceStyle; withFanfare: boolean }>>([])
  const playingRef = useRef(false)
  const lastSpeakTime = useRef(0)

  const processQueue = useCallback(async () => {
    if (playingRef.current || queueRef.current.length === 0) return
    playingRef.current = true

    const { text, style, withFanfare } = queueRef.current.shift()!
    const params = VOICE_STYLES[style] || VOICE_STYLES.entrance

    try {
      // Play fanfare for entrances
      if (withFanfare) await playFanfare()

      // Use Web Speech API
      if ('speechSynthesis' in window) {
        await new Promise<void>((resolve) => {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = 'pt-BR'
          utterance.rate = params.rate
          utterance.pitch = params.pitch
          utterance.volume = params.volume
          
          const voice = getPTBRVoice()
          if (voice) utterance.voice = voice
          
          utterance.onend = () => resolve()
          utterance.onerror = () => resolve()
          
          // Safety timeout (max 15s per utterance)
          const timeout = setTimeout(() => {
            window.speechSynthesis.cancel()
            resolve()
          }, 15000)
          
          utterance.onend = () => { clearTimeout(timeout); resolve() }
          utterance.onerror = () => { clearTimeout(timeout); resolve() }
          
          window.speechSynthesis.speak(utterance)
        })
      }
    } catch (e) {
      console.warn('TTS error:', e)
    }

    playingRef.current = false
    lastSpeakTime.current = Date.now()

    // Process next in queue
    if (queueRef.current.length > 0) {
      setTimeout(() => processQueue(), 300)
    }
  }, [])

  const speak = useCallback((text: string, style: VoiceStyle = 'entrance', withFanfare = false) => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('arauto-voice-enabled') === 'false') return
    if (document.hidden) return
    
    // Rate limit: min 5s between speaks
    if (Date.now() - lastSpeakTime.current < 5000 && queueRef.current.length > 0) return

    const cleanText = stripEmojis(text)
    if (!cleanText || cleanText.length < 3) return

    queueRef.current.push({ text: cleanText, style, withFanfare })
    processQueue()
  }, [processQueue])

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    queueRef.current = []
    playingRef.current = false
  }, [])

  const isEnabled = useCallback(() => localStorage.getItem('arauto-voice-enabled') !== 'false', [])
  const setEnabled = useCallback((v: boolean) => localStorage.setItem('arauto-voice-enabled', String(v)), [])

  return { speak, stop, isEnabled, setEnabled }
}
