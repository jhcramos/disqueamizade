import { useCallback, useRef } from 'react'

export const VOICE_STYLES = {
  entrance:   { rate: '-10%', pitch: '-8Hz', volume: '+10%', ssml: true },  // Grave, imponente, locutor de estádio
  farewell:   { rate: '-5%',  pitch: '+3Hz', volume: '+0%',  ssml: true },  // Caloroso, saudoso
  icebreaker: { rate: '+20%', pitch: '+8Hz', volume: '+5%',  ssml: true },  // Animado, provocador
  quiz:       { rate: '+15%', pitch: '+10Hz', volume: '+10%', ssml: true }, // Empolgado, apresentador de game show
  reaction:   { rate: '+25%', pitch: '+12Hz', volume: '+10%', ssml: true }, // Super expressivo, energia alta
} as const

export type VoiceStyle = keyof typeof VOICE_STYLES

const stripEmojis = (text: string): string =>
  text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}]/gu, '').replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim()

// Shared AudioContext — resumed on first user gesture
let sharedAudioCtx: AudioContext | null = null
const getAudioCtx = (): AudioContext => {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContext()
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume()
  }
  return sharedAudioCtx
}

// Unlocked silent audio element — mobile needs a user-gesture-unlocked Audio
let unlockedAudio: HTMLAudioElement | null = null
let audioUnlocked = false

const unlockAudio = () => {
  if (audioUnlocked) return
  // Create and play a silent audio to unlock the audio pipeline on mobile
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()

    // Also unlock HTMLAudioElement playback
    unlockedAudio = new Audio()
    unlockedAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwMHAAAAAAD/+1DEAAAB8ANX9AAAB0AYd/8QAABBmBQAdAAAAAAAANIKgICAgAAAAAfB8HwfB8EAQBA5/ygIAgCAIHB8Hw'
    unlockedAudio.volume = 0.01
    unlockedAudio.play().then(() => {
      unlockedAudio?.pause()
      audioUnlocked = true
    }).catch(() => {})
  } catch {}
}

// Resume audio context on EVERY user interaction (mobile needs repeated unlocks)
if (typeof window !== 'undefined') {
  const resumeCtx = () => {
    if (sharedAudioCtx?.state === 'suspended') sharedAudioCtx.resume()
    unlockAudio()
  }
  // Use capture phase + don't remove — mobile may need multiple unlocks
  document.addEventListener('click', resumeCtx, true)
  document.addEventListener('touchstart', resumeCtx, true)
  document.addEventListener('touchend', resumeCtx, true)
}

// ─── Trumpet Fanfare (Enhanced Web Audio API) ───
const playFanfare = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioCtx()
      const masterGain = ctx.createGain()
      masterGain.gain.value = 0.4
      
      // Reverb via delay
      const delay = ctx.createDelay()
      delay.delayTime.value = 0.08
      const delayGain = ctx.createGain()
      delayGain.gain.value = 0.2
      delay.connect(delayGain).connect(masterGain)
      masterGain.connect(ctx.destination)

      const now = ctx.currentTime

      // Brass-like tone: play a note with triangle+sawtooth mix and ADSR
      const playBrassNote = (freq: number, startTime: number, duration: number, vol: number) => {
        // Triangle (fundamental)
        const osc1 = ctx.createOscillator()
        osc1.type = 'triangle'
        osc1.frequency.value = freq
        
        // Sawtooth (harmonics/brightness)
        const osc2 = ctx.createOscillator()
        osc2.type = 'sawtooth'
        osc2.frequency.value = freq

        const gain1 = ctx.createGain()
        const gain2 = ctx.createGain()

        // ADSR envelope
        const attack = 0.02
        const decay = 0.05
        const sustainLevel = vol * 0.7
        const release = duration * 0.3

        // Triangle is louder (body)
        gain1.gain.setValueAtTime(0, startTime)
        gain1.gain.linearRampToValueAtTime(vol, startTime + attack)
        gain1.gain.linearRampToValueAtTime(sustainLevel, startTime + attack + decay)
        gain1.gain.setValueAtTime(sustainLevel, startTime + duration - release)
        gain1.gain.linearRampToValueAtTime(0, startTime + duration)

        // Sawtooth is quieter (brightness)
        gain2.gain.setValueAtTime(0, startTime)
        gain2.gain.linearRampToValueAtTime(vol * 0.3, startTime + attack)
        gain2.gain.linearRampToValueAtTime(sustainLevel * 0.3, startTime + attack + decay)
        gain2.gain.setValueAtTime(sustainLevel * 0.3, startTime + duration - release)
        gain2.gain.linearRampToValueAtTime(0, startTime + duration)

        osc1.connect(gain1).connect(masterGain)
        osc1.connect(gain1)
        gain1.connect(delay) // feed reverb
        osc2.connect(gain2).connect(masterGain)

        osc1.start(startTime)
        osc1.stop(startTime + duration + 0.01)
        osc2.start(startTime)
        osc2.stop(startTime + duration + 0.01)
      }

      // Chord 1: C5 + E5 (punchy)
      playBrassNote(523.25, now, 0.22, 0.5)
      playBrassNote(659.25, now, 0.22, 0.4)

      // Chord 2: G5 + C6 (triumphant)
      playBrassNote(783.99, now + 0.25, 0.25, 0.55)
      playBrassNote(1046.50, now + 0.25, 0.25, 0.4)

      setTimeout(() => {
        resolve()
      }, 550)
    } catch {
      resolve()
    }
  })
}

// ─── Browser SpeechSynthesis fallback ───
const speakBrowserTTS = (text: string, style: VoiceStyle): Promise<void> => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = style === 'reaction' ? 1.3 : style === 'icebreaker' ? 1.15 : 1.0
    utterance.pitch = style === 'entrance' ? 0.9 : 1.0
    // Try to pick a PT-BR voice
    const voices = speechSynthesis.getVoices()
    const ptVoice = voices.find(v => v.lang.startsWith('pt-BR')) || voices.find(v => v.lang.startsWith('pt'))
    if (ptVoice) utterance.voice = ptVoice
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    setTimeout(() => resolve(), 15000) // safety timeout
    speechSynthesis.speak(utterance)
  })
}

// ─── Edge TTS via API ───
const fetchTTSAudio = async (text: string, style: VoiceStyle): Promise<HTMLAudioElement | null> => {
  const params = VOICE_STYLES[style] || VOICE_STYLES.entrance
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 500),
        rate: params.rate,
        pitch: params.pitch,
        volume: params.volume,
        ssml: params.ssml ?? false,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const blob = await res.blob()
    if (blob.size < 100) return null // empty/error response

    // On mobile, try AudioContext decodeAudioData first (bypasses autoplay restrictions)
    try {
      const ctx = getAudioCtx()
      if (ctx.state === 'suspended') await ctx.resume()
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      // Return a pseudo-audio element that uses AudioContext for playback
      const pseudoAudio = new Audio()
      let sourceNode: AudioBufferSourceNode | null = null
      pseudoAudio.play = () => {
        return new Promise<void>((resolve, reject) => {
          try {
            sourceNode = ctx.createBufferSource()
            sourceNode.buffer = audioBuffer
            sourceNode.connect(ctx.destination)
            sourceNode.onended = () => {
              pseudoAudio.dispatchEvent(new Event('ended'))
            }
            sourceNode.start(0)
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      }
      const originalPause = pseudoAudio.pause.bind(pseudoAudio)
      pseudoAudio.pause = () => {
        try { sourceNode?.stop() } catch {}
        originalPause()
      }
      return pseudoAudio
    } catch {
      // Fallback: standard Audio element (works on desktop)
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true })
      return audio
    }
  } catch (e) {
    console.warn('Edge TTS fetch failed:', e)
    return null
  }
}

export function useTTS() {
  const queueRef = useRef<Array<{ text: string; style: VoiceStyle; withFanfare: boolean }>>([])
  const playingRef = useRef(false)
  const lastSpeakTime = useRef(0)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const processQueue = useCallback(async () => {
    if (playingRef.current || queueRef.current.length === 0) return
    playingRef.current = true

    const { text, style, withFanfare } = queueRef.current.shift()!

    try {
      // Play fanfare for entrances
      if (withFanfare) await playFanfare()

      // Fetch and play Edge TTS audio, fallback to browser TTS
      const audio = await fetchTTSAudio(text, style)
      if (audio) {
        currentAudioRef.current = audio
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            audio.pause()
            resolve()
          }, 20000)
          audio.onended = () => { clearTimeout(timeout); resolve() }
          audio.onerror = () => { clearTimeout(timeout); resolve() }
          audio.play().catch(() => {
            clearTimeout(timeout)
            resolve()
          })
        })
        currentAudioRef.current = null
      } else {
        // Fallback: browser speechSynthesis
        await speakBrowserTTS(text, style)
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
    
    // Rate limit: min 5s between speaks
    if (Date.now() - lastSpeakTime.current < 5000 && queueRef.current.length > 0) return

    const cleanText = stripEmojis(text)
    if (!cleanText || cleanText.length < 3) return

    queueRef.current.push({ text: cleanText, style, withFanfare })
    processQueue()
  }, [processQueue])

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    queueRef.current = []
    playingRef.current = false
  }, [])

  const isEnabled = useCallback(() => localStorage.getItem('arauto-voice-enabled') !== 'false', [])
  const setEnabled = useCallback((v: boolean) => localStorage.setItem('arauto-voice-enabled', String(v)), [])

  return { speak, stop, isEnabled, setEnabled }
}
