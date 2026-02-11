import { useCallback, useRef } from 'react'

const API_URL = '/api/tts'

// ─── Voice Styles mapped to edge-tts parameters ───
export const VOICE_STYLES = {
  entrance:   { rate: '-10%', pitch: '-3Hz', volume: '+0%' },
  farewell:   { rate: '+0%',  pitch: '+0Hz', volume: '-10%' },
  icebreaker: { rate: '+5%',  pitch: '+2Hz', volume: '+0%' },
  quiz:       { rate: '+0%',  pitch: '+5Hz', volume: '+0%' },
  reaction:   { rate: '+15%', pitch: '+5Hz', volume: '-5%' },
} as const

export type VoiceStyle = keyof typeof VOICE_STYLES

// ─── Strip emojis from text for TTS ───
const stripEmojis = (text: string): string =>
  text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').trim()

// ─── Audio cache for repeated phrases ───
const audioCache = new Map<string, Blob>()
const MAX_CACHE = 20

const getCacheKey = (text: string, style: string) => `${style}:${text}`

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
      setTimeout(resolve, notes.length * 150 + 100)
    } catch {
      resolve()
    }
  })
}

// ─── Fetch TTS audio (with caching) ───
const fetchAudio = async (text: string, style: VoiceStyle): Promise<Blob> => {
  const key = getCacheKey(text, style)
  const cached = audioCache.get(key)
  if (cached) return cached

  const params = VOICE_STYLES[style] || VOICE_STYLES.entrance
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, ...params }),
  })

  if (!response.ok) throw new Error(`TTS failed: ${response.status}`)

  const blob = await response.blob()

  // Cache it (evict oldest if full)
  if (audioCache.size >= MAX_CACHE) {
    const firstKey = audioCache.keys().next().value
    if (firstKey) audioCache.delete(firstKey)
  }
  audioCache.set(key, blob)

  return blob
}

// ─── TTS Hook ───
export const useTTS = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<Array<{ text: string; style: VoiceStyle }>>([])
  const playingRef = useRef(false)
  const lastSpokenTime = useRef(0)
  const joinedTime = useRef(Date.now())

  const isEnabled = (): boolean => {
    const stored = localStorage.getItem('arauto-voice-enabled')
    if (stored === null) return true
    return stored === 'true'
  }

  const setEnabled = (enabled: boolean) => {
    localStorage.setItem('arauto-voice-enabled', String(enabled))
  }

  const processQueue = async () => {
    if (playingRef.current || queueRef.current.length === 0) return
    playingRef.current = true

    const { text, style } = queueRef.current.shift()!

    try {
      if (style === 'entrance') await playFanfare()

      const blob = await fetchAudio(text, style)
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      await new Promise<void>((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve() }
        audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
        audio.play().catch(() => resolve())
      })
    } catch (e) {
      console.warn('Edge TTS error:', e)
    }

    playingRef.current = false
    if (queueRef.current.length > 0) processQueue()
  }

  const speak = useCallback((text: string, style?: VoiceStyle, withFanfare = false) => {
    if (!isEnabled()) return
    if (document.hidden) return
    if (Date.now() - joinedTime.current < 2000) return

    const now = Date.now()
    if (now - lastSpokenTime.current < 30000) return
    lastSpokenTime.current = now

    const cleanText = stripEmojis(text)
    if (!cleanText) return

    const effectiveStyle = style || 'entrance'

    queueRef.current.push({ text: cleanText, style: withFanfare ? 'entrance' : effectiveStyle })
    processQueue()
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    queueRef.current = []
    playingRef.current = false
  }, [])

  return { speak, stop, isEnabled, setEnabled }
}
