// ═══════════════════════════════════════════════════════════════════════════
// useVideoFilter Hook — MediaPipe Face Mesh Integration (CDN-loaded)
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react'
import type { VideoFilterHookResult, FilterState, DetectionResult, MaskRenderer } from '../types/filters'

// Import mask renderers
import { neonWireframeMask } from '../components/video/masks/NeonWireframe'
import { pixelFaceMask } from '../components/video/masks/PixelFace'
import { emojiTrackerMask } from '../components/video/masks/EmojiTracker'
import { animalMorphMask } from '../components/video/masks/AnimalMorph'
import { animeStyleMask } from '../components/video/masks/AnimeStyle'
// 🔥 80s Legends Collection 🔥
import { heManMask } from '../components/video/masks/HeMan'
import { optimusPrimeMask } from '../components/video/masks/OptimusPrime'
import { freddieMercuryMask } from '../components/video/masks/FreddieMercury'
import { knightRiderMask } from '../components/video/masks/KnightRider'
import { jaspionMask } from '../components/video/masks/Jaspion'
import { sheRaMask } from '../components/video/masks/SheRa'
import { jemMask } from '../components/video/masks/Jem'
import { wonderWomanMask } from '../components/video/masks/WonderWoman'
import { madonnaMask } from '../components/video/masks/Madonna'
import { cheetaraMask } from '../components/video/masks/Cheetara'

const MASK_RENDERERS: Record<string, MaskRenderer> = {
  neon_wireframe: neonWireframeMask,
  pixel_face: pixelFaceMask,
  emoji_tracker: emojiTrackerMask,
  cat_morph: animalMorphMask,
  anime_style: animeStyleMask,
  he_man: heManMask,
  optimus_prime: optimusPrimeMask,
  freddie_mercury: freddieMercuryMask,
  knight_rider: knightRiderMask,
  jaspion: jaspionMask,
  she_ra: sheRaMask,
  jem: jemMask,
  wonder_woman: wonderWomanMask,
  madonna: madonnaMask,
  cheetara: cheetaraMask
}

// ── CDN Script Loader ──
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.crossOrigin = 'anonymous'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

async function loadMediaPipe(): Promise<{ FaceMesh: any; Camera: any }> {
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js')
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
  const w = window as any
  if (!w.FaceMesh) throw new Error('FaceMesh not found on window after CDN load')
  if (!w.Camera) throw new Error('Camera not found on window after CDN load')
  return { FaceMesh: w.FaceMesh, Camera: w.Camera }
}

export const useVideoFilter = (
  videoStream: MediaStream | null,
  initialFilter: string | null = null
): VideoFilterHookResult => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const faceMeshRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  // ★ Use a ref to always have the latest filterState in the onResults callback
  const filterStateRef = useRef<FilterState>({
    enabled: false,
    currentMask: initialFilter,
    intensity: 1.0,
    settings: {}
  })

  const [filterState, setFilterState] = useState<FilterState>(() => {
    try {
      const saved = localStorage.getItem('disque-video-filter')
      const parsed = saved ? JSON.parse(saved) : {
        enabled: false,
        currentMask: initialFilter,
        intensity: 1.0,
        settings: {}
      }
      filterStateRef.current = parsed
      return parsed
    } catch {
      return { enabled: false, currentMask: initialFilter, intensity: 1.0, settings: {} }
    }
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [filteredStream, setFilteredStream] = useState<MediaStream | null>(null)
  const [detectionResults, setDetectionResults] = useState<DetectionResult | null>(null)
  const [mediaPipeReady, setMediaPipeReady] = useState(false)
  const [mediaPipeError, setMediaPipeError] = useState<string | null>(null)

  // ★ Keep the ref in sync with state
  useEffect(() => {
    filterStateRef.current = filterState
    try { localStorage.setItem('disque-video-filter', JSON.stringify(filterState)) } catch {}
  }, [filterState])

  // Load MediaPipe from CDN (once)
  useEffect(() => {
    let cancelled = false
    loadMediaPipe()
      .then(({ FaceMesh }) => {
        if (cancelled) return
        const faceMesh = new FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        })
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
        faceMesh.onResults((results: any) => {
          if (!canvasRef.current || !results.multiFaceLandmarks?.[0]) {
            setDetectionResults(null)
            return
          }
          const landmarks = results.multiFaceLandmarks[0]
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')!
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          if (results.image) ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

          // ★ Read from ref (always current) instead of stale closure
          const fs = filterStateRef.current
          if (fs.enabled && fs.currentMask) {
            const renderer = MASK_RENDERERS[fs.currentMask]
            if (renderer) {
              try { renderer.render(ctx, landmarks, canvas.width, canvas.height, fs.settings) }
              catch (e) { console.warn('Filter render error:', e) }
            }
          }

          setDetectionResults({
            landmarks,
            confidence: 0.9,
            boundingBox: calcBBox(landmarks, canvas.width, canvas.height)
          })
        })
        faceMeshRef.current = faceMesh
        setMediaPipeReady(true)
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('MediaPipe load failed:', err)
          setMediaPipeError(String(err))
        }
      })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start camera processing when stream + MediaPipe are ready
  useEffect(() => {
    if (!videoStream || !faceMeshRef.current || !canvasRef.current || !mediaPipeReady) return

    const w = window as any
    const CameraClass = w.Camera
    if (!CameraClass) { console.warn('Camera class not available'); return }

    const video = document.createElement('video')
    video.playsInline = true; video.muted = true; video.autoplay = true
    video.width = 640; video.height = 480

    const canvas = canvasRef.current
    canvas.width = 640; canvas.height = 480

    video.srcObject = videoStream
    videoRef.current = video

    video.onloadedmetadata = () => {
      video.play()
      setIsProcessing(true)
      const camera = new CameraClass(video, {
        onFrame: async () => {
          if (faceMeshRef.current) await faceMeshRef.current.send({ image: video })
        },
        width: 640, height: 480
      })
      camera.start()
      cameraRef.current = camera
      const stream = canvas.captureStream(30)
      setFilteredStream(stream)
    }

    return () => {
      if (cameraRef.current) cameraRef.current.stop()
      video.pause(); video.srcObject = null
      setIsProcessing(false); setFilteredStream(null)
    }
  }, [videoStream, mediaPipeReady])

  const calcBBox = (landmarks: any[], w: number, h: number) => {
    const xs = landmarks.map((l: any) => l.x * w)
    const ys = landmarks.map((l: any) => l.y * h)
    return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
  }

  const enableFilter = useCallback((maskId: string) => {
    if (MASK_RENDERERS[maskId]) setFilterState(prev => ({ ...prev, enabled: true, currentMask: maskId }))
  }, [])

  const disableFilter = useCallback(() => {
    setFilterState(prev => ({ ...prev, enabled: false }))
  }, [])

  const switchFilter = useCallback((maskId: string) => {
    if (MASK_RENDERERS[maskId]) setFilterState(prev => ({ ...prev, enabled: true, currentMask: maskId }))
  }, [])

  return {
    canvasRef,
    filteredStream,
    isProcessing,
    enableFilter,
    disableFilter,
    switchFilter,
    currentFilter: filterState.currentMask,
    detectionResults,
    mediaPipeReady,
    mediaPipeError
  }
}
