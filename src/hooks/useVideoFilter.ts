// ═══════════════════════════════════════════════════════════════════════════
// useVideoFilter — Face tracking with emoji overlay
// Strategy: Try native FaceDetector → fallback face-api.js (throttled)
// Detection runs async, never blocks UI. Emoji via HTML overlay.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react'

export type MaskItem = {
  id: string
  name: string
  emoji?: string       // emoji character (covers full face)
  image?: string       // PNG image path (positioned on face)
  imageType?: 'face' | 'eyes'  // face = covers face, eyes = sits on eye line
  blendMode?: string   // CSS mix-blend-mode ('screen' for black bg images)
  category: 'emoji' | 'glasses' | 'carnival'
}

export const EMOJI_MASKS: MaskItem[] = [
  // ─── Emojis (cobrem o rosto) ───
  // Animais
  { id: 'cat', name: 'Gatinho', emoji: '😺', category: 'emoji' },
  { id: 'dog', name: 'Cachorro', emoji: '🐶', category: 'emoji' },
  { id: 'monkey', name: 'Macaco', emoji: '🐵', category: 'emoji' },
  { id: 'pig', name: 'Porquinho', emoji: '🐷', category: 'emoji' },
  { id: 'bear', name: 'Urso', emoji: '🐻', category: 'emoji' },
  { id: 'panda', name: 'Panda', emoji: '🐼', category: 'emoji' },
  { id: 'fox', name: 'Raposa', emoji: '🦊', category: 'emoji' },
  { id: 'lion', name: 'Leão', emoji: '🦁', category: 'emoji' },
  { id: 'tiger', name: 'Tigre', emoji: '🐯', category: 'emoji' },
  { id: 'cow', name: 'Vaquinha', emoji: '🐮', category: 'emoji' },
  { id: 'rabbit', name: 'Coelho', emoji: '🐰', category: 'emoji' },
  { id: 'frog', name: 'Sapo', emoji: '🐸', category: 'emoji' },
  { id: 'chicken', name: 'Galinha', emoji: '🐔', category: 'emoji' },
  { id: 'unicorn', name: 'Unicórnio', emoji: '🦄', category: 'emoji' },
  { id: 'koala', name: 'Coala', emoji: '🐨', category: 'emoji' },
  { id: 'mouse', name: 'Ratinho', emoji: '🐭', category: 'emoji' },
  { id: 'hamster', name: 'Hamster', emoji: '🐹', category: 'emoji' },
  { id: 'wolf', name: 'Lobo', emoji: '🐺', category: 'emoji' },
  // Caras engraçadas
  { id: 'clown', name: 'Palhaço', emoji: '🤡', category: 'emoji' },
  { id: 'alien', name: 'Alien', emoji: '👽', category: 'emoji' },
  { id: 'robot', name: 'Robô', emoji: '🤖', category: 'emoji' },
  { id: 'skull', name: 'Caveira', emoji: '💀', category: 'emoji' },
  { id: 'devil', name: 'Diabinho', emoji: '😈', category: 'emoji' },
  { id: 'ghost', name: 'Fantasma', emoji: '👻', category: 'emoji' },
  { id: 'sunglasses', name: 'Estiloso', emoji: '😎', category: 'emoji' },
  { id: 'heart_eyes', name: 'Apaixonado', emoji: '😍', category: 'emoji' },
  { id: 'star_eyes', name: 'Deslumbrado', emoji: '🤩', category: 'emoji' },
  { id: 'money', name: 'Ricaço', emoji: '🤑', category: 'emoji' },
  { id: 'nerd', name: 'Nerd', emoji: '🤓', category: 'emoji' },
  { id: 'monocle', name: 'Distinto', emoji: '🧐', category: 'emoji' },
  { id: 'zany', name: 'Maluco', emoji: '🤪', category: 'emoji' },
  { id: 'wink', name: 'Piscadela', emoji: '😜', category: 'emoji' },
  { id: 'crying', name: 'Chorando', emoji: '😭', category: 'emoji' },
  { id: 'laughing', name: 'Morrendo', emoji: '🤣', category: 'emoji' },
  { id: 'angry', name: 'Bravo', emoji: '🤬', category: 'emoji' },
  { id: 'scream', name: 'Grito', emoji: '😱', category: 'emoji' },
  { id: 'vomit', name: 'Enjoado', emoji: '🤮', category: 'emoji' },
  { id: 'cowboy', name: 'Cowboy', emoji: '🤠', category: 'emoji' },
  { id: 'party', name: 'Festa', emoji: '🥳', category: 'emoji' },
  { id: 'disguise', name: 'Disfarce', emoji: '🥸', category: 'emoji' },
  { id: 'shush', name: 'Silêncio', emoji: '🤫', category: 'emoji' },
  { id: 'think', name: 'Pensando', emoji: '🤔', category: 'emoji' },
  { id: 'hot', name: 'Quente', emoji: '🥵', category: 'emoji' },
  { id: 'cold', name: 'Frio', emoji: '🥶', category: 'emoji' },
  { id: 'dizzy', name: 'Tonto', emoji: '😵‍💫', category: 'emoji' },
  { id: 'explode', name: 'Explodindo', emoji: '🤯', category: 'emoji' },
  { id: 'sleeping', name: 'Dormindo', emoji: '😴', category: 'emoji' },
  { id: 'drool', name: 'Babando', emoji: '🤤', category: 'emoji' },
  // Objetos e fantasia
  { id: 'pumpkin', name: 'Abóbora', emoji: '🎃', category: 'emoji' },
  { id: 'santa', name: 'Papai Noel', emoji: '🎅', category: 'emoji' },
  { id: 'baby', name: 'Bebê', emoji: '👶', category: 'emoji' },
  { id: 'old_man', name: 'Vovô', emoji: '👴', category: 'emoji' },
  { id: 'princess', name: 'Princesa', emoji: '👸', category: 'emoji' },
  { id: 'superhero', name: 'Herói', emoji: '🦸', category: 'emoji' },
  { id: 'villain', name: 'Vilão', emoji: '🦹', category: 'emoji' },
  { id: 'zombie', name: 'Zumbi', emoji: '🧟', category: 'emoji' },
  { id: 'vampire', name: 'Vampiro', emoji: '🧛', category: 'emoji' },
  { id: 'mage', name: 'Mago', emoji: '🧙', category: 'emoji' },
  { id: 'fairy', name: 'Fada', emoji: '🧚', category: 'emoji' },
  { id: 'ogre', name: 'Ogro', emoji: '👹', category: 'emoji' },
  { id: 'goblin', name: 'Goblin', emoji: '👺', category: 'emoji' },
  // Óculos (posicionados nos olhos)
  { id: 'aviator', name: 'Aviador', image: '/masks/aviator-glasses.png', imageType: 'eyes', blendMode: 'lighten', category: 'glasses' },
  { id: 'party_glasses', name: 'Festa', image: '/masks/party-glasses.png', imageType: 'eyes', blendMode: 'lighten', category: 'glasses' },
  // Máscaras de carnaval (cobrem metade superior do rosto)
  { id: 'carnival_venice', name: 'Veneziana', image: '/masks/carnival-mask.png', imageType: 'eyes', blendMode: 'lighten', category: 'carnival' },
  { id: 'carnival_brazil', name: 'Carnaval BR', image: '/masks/carnival-brazil.png', imageType: 'eyes', blendMode: 'lighten', category: 'carnival' },
]

export interface FaceBox {
  x: number; y: number; w: number; h: number  // percentages 0-100
}

export interface VideoFilterHookResult {
  activeMask: MaskItem | null
  activeMaskEmoji: string | null
  faceBox: FaceBox | null
  enableFilter: (maskId: string) => void
  disableFilter: () => void
  currentFilter: string | null
  trackingStatus: 'idle' | 'loading' | 'tracking' | 'no-face' | 'fallback'
}

// ─── Detection backends ───

async function tryNativeFaceDetector(): Promise<any | null> {
  if (typeof globalThis === 'undefined' || !('FaceDetector' in globalThis)) return null
  try {
    // @ts-ignore
    const fd = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 })
    // Test it works
    const canvas = document.createElement('canvas')
    canvas.width = 10; canvas.height = 10
    await fd.detect(canvas)
    return fd
  } catch {
    return null
  }
}

let faceApiLoaded = false
let faceApiLoading = false

async function loadFaceApi() {
  if (faceApiLoaded) return true
  if (faceApiLoading) {
    // Wait for existing load
    while (faceApiLoading) await new Promise(r => setTimeout(r, 100))
    return faceApiLoaded
  }
  faceApiLoading = true
  try {
    const faceapi = await import('face-api.js')
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    faceApiLoaded = true
    return true
  } catch (e) {
    console.warn('face-api.js failed to load:', e)
    return false
  } finally {
    faceApiLoading = false
  }
}

async function detectWithFaceApi(video: HTMLVideoElement): Promise<{ x: number; y: number; width: number; height: number } | null> {
  try {
    const faceapi = await import('face-api.js')
    const result = await faceapi.detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.3 })
    )
    if (result) {
      return { x: result.box.x, y: result.box.y, width: result.box.width, height: result.box.height }
    }
  } catch { /* ignore */ }
  return null
}

// ─── Hook ───

export const useVideoFilter = (
  videoRef: React.RefObject<HTMLVideoElement>,
  stream: MediaStream | null,
): VideoFilterHookResult => {
  const [currentFilter, setCurrentFilter] = useState<string | null>(null)
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null)
  const [trackingStatus, setTrackingStatus] = useState<VideoFilterHookResult['trackingStatus']>('idle')

  const activeRef = useRef<string | null>(null)
  const nativeDetectorRef = useRef<any>(null)
  const smoothBox = useRef<FaceBox | null>(null)
  const noFaceCountRef = useRef(0)
  const runningRef = useRef(false)
  const timeoutRef = useRef<number>(0)

  // ─── Detection loop (recursive setTimeout, never overlaps) ───
  const runDetection = useCallback(async () => {
    if (!runningRef.current || !activeRef.current) return

    const video = videoRef.current
    if (!video || video.readyState < 2) {
      timeoutRef.current = window.setTimeout(runDetection, 200)
      return
    }

    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) {
      timeoutRef.current = window.setTimeout(runDetection, 200)
      return
    }

    let box: { x: number; y: number; width: number; height: number } | null = null

    // Try native first
    if (nativeDetectorRef.current) {
      try {
        const faces = await nativeDetectorRef.current.detect(video)
        if (faces.length > 0) box = faces[0].boundingBox
      } catch { /* fall through */ }
    }

    // Fallback to face-api.js
    if (!box && faceApiLoaded) {
      box = await detectWithFaceApi(video)
    }

    if (box && runningRef.current) {
      setTrackingStatus('tracking')
      const raw: FaceBox = {
        x: (box.x / vw) * 100,
        y: ((box.y + box.height * 0.08) / vh) * 100, // slight down shift
        w: (box.width / vw) * 100,
        h: (box.height / vh) * 100,
      }
      const prev = smoothBox.current
      if (prev) {
        // Extra heavy smoothing (0.85/0.15) to prevent flickering
        smoothBox.current = {
          x: prev.x * 0.85 + raw.x * 0.15,
          y: prev.y * 0.85 + raw.y * 0.15,
          w: prev.w * 0.85 + raw.w * 0.15,
          h: prev.h * 0.85 + raw.h * 0.15,
        }
      } else {
        smoothBox.current = raw
      }
      noFaceCountRef.current = 0
      setFaceBox({ ...smoothBox.current })
    } else if (runningRef.current) {
      // Keep last known position for a few frames to avoid flicker
      noFaceCountRef.current++
      if (noFaceCountRef.current > 5) {
        setTrackingStatus('no-face')
      }
      // Fallback: center of frame (only if never detected)
      if (!smoothBox.current) {
        smoothBox.current = { x: 25, y: 12, w: 50, h: 55 }
        setFaceBox({ ...smoothBox.current })
      }
      // Keep showing last box (don't clear it)
    }

    // Schedule next detection: 200ms = 5fps (smooth enough, less flicker)
    if (runningRef.current) {
      timeoutRef.current = window.setTimeout(runDetection, 200)
    }
  }, [videoRef])

  // ─── Start/stop detection when filter changes ───
  useEffect(() => {
    if (!currentFilter || !stream) {
      runningRef.current = false
      clearTimeout(timeoutRef.current)
      setTrackingStatus('idle')
      return
    }

    let cancelled = false

    const startTracking = async () => {
      setTrackingStatus('loading')

      // Try native FaceDetector
      if (!nativeDetectorRef.current) {
        nativeDetectorRef.current = await tryNativeFaceDetector()
      }

      // If no native, load face-api.js
      if (!nativeDetectorRef.current && !faceApiLoaded) {
        await loadFaceApi()
      }

      if (cancelled) return

      if (!nativeDetectorRef.current && !faceApiLoaded) {
        setTrackingStatus('fallback')
        smoothBox.current = { x: 25, y: 12, w: 50, h: 55 }
        setFaceBox({ ...smoothBox.current })
        return
      }

      runningRef.current = true
      runDetection()
    }

    startTracking()

    return () => {
      cancelled = true
      runningRef.current = false
      clearTimeout(timeoutRef.current)
    }
  }, [currentFilter, stream, runDetection])

  const enableFilter = useCallback((maskId: string) => {
    activeRef.current = maskId
    setCurrentFilter(maskId)
    smoothBox.current = null
  }, [])

  const disableFilter = useCallback(() => {
    activeRef.current = null
    setCurrentFilter(null)
    setFaceBox(null)
    smoothBox.current = null
  }, [])

  const mask = currentFilter ? EMOJI_MASKS.find(m => m.id === currentFilter) ?? null : null

  return {
    activeMask: mask,
    activeMaskEmoji: mask?.emoji ?? null,
    faceBox,
    enableFilter,
    disableFilter,
    currentFilter,
    trackingStatus,
  }
}
