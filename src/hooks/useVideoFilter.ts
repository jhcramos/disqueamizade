// ═══════════════════════════════════════════════════════════════════════════
// useVideoFilter — rastreamento facial ao vivo para as máscaras (v2)
//
// Roda o MediaPipe Face Landmarker num loop de animação enquanto houver uma
// máscara ativa. O rosto rastreado (478 pontos + pose) fica em `faceRef`,
// atualizado a cada frame SEM re-render do React; o loop de composição
// (useCompositeStream) lê essa ref e desenha a máscara.
//
// Substitui o face-api.js (caixa grosseira a 5 fps, emoji "flutuando").
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react'
import { getFaceLandmarker, detectFrame, FaceSmoother, type FaceFrame } from '@/vision/faceTracker'
import { computePose, type FacePose } from '@/vision/facePose'
import { getMask, type MaskDef } from '@/masks'

/** Caixa do rosto em percentuais 0-100 (compatibilidade com UI antiga). */
export interface FaceBox { x: number; y: number; w: number; h: number }

export interface TrackedFace {
  frame: FaceFrame
  videoTime: number
  source: HTMLCanvasElement
  pose: FacePose
  /** dimensões do vídeo em que a pose foi calculada */
  w: number
  h: number
}

export type TrackingStatus = 'idle' | 'loading' | 'tracking' | 'no-face' | 'error'

export interface VideoFilterHookResult {
  activeMask: MaskDef | null
  faceBox: FaceBox | null
  /** último rosto rastreado; atualizado por frame, sem re-render */
  faceRef: React.MutableRefObject<TrackedFace | null>
  enableFilter: (maskId: string) => void
  disableFilter: () => void
  currentFilter: string | null
  trackingStatus: TrackingStatus
}

/** Acima disso (ms) por detecção, pulamos um frame para não travar o vídeo. */
const SLOW_DETECT_MS = 28

export const useVideoFilter = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  stream: MediaStream | null,
): VideoFilterHookResult => {
  const [currentFilter, setCurrentFilter] = useState<string | null>(null)
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('idle')
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null)
  const faceRef = useRef<TrackedFace | null>(null)
  const rafRef = useRef(0)
  const smootherRef = useRef(new FaceSmoother())

  useEffect(() => {
    if (!currentFilter || !stream) {
      cancelAnimationFrame(rafRef.current)
      faceRef.current = null
      smootherRef.current.reset()
      setFaceBox(null)
      setTrackingStatus('idle')
      return
    }

    let cancelled = false
    const source = document.createElement('canvas')
    const sourceContext = source.getContext('2d')
    let lastVideoTime = -1
    let lastBoxAt = 0
    let lastStatus: TrackingStatus | null = null
    let skipNext = false
    const setStatus = (s: TrackingStatus) => { if (s !== lastStatus) { lastStatus = s; setTrackingStatus(s) } }

    setStatus('loading')
    getMask(currentFilter)?.preload().catch((e) => console.warn('[mask] preload', e))

    getFaceLandmarker().then((fl) => {
      if (cancelled) return
      const tick = () => {
        if (cancelled) return
        rafRef.current = requestAnimationFrame(tick)
        const video = videoRef.current
        if (!video || video.readyState < 2 || !video.videoWidth) return
        if (video.currentTime === lastVideoTime) return // mesmo frame, nada a fazer
        if (skipNext) { skipNext = false; return }
        lastVideoTime = video.currentTime

        const t0 = performance.now()
        let raw: FaceFrame | null = null
        try {
          raw = detectFrame(fl, video, t0)
        } catch (e) {
          faceRef.current = null
          setStatus('error')
          return
        }
        skipNext = performance.now() - t0 > SLOW_DETECT_MS

        const frame = raw ? smootherRef.current.push(raw) : null
        if (frame) {
          const w = video.videoWidth, h = video.videoHeight
          if (!sourceContext) { faceRef.current = null; setStatus('error'); return }
          source.width = w; source.height = h
          sourceContext.drawImage(video, 0, 0, w, h)
          const pose = computePose(frame, w, h)
          faceRef.current = { frame, pose, w, h, videoTime: video.currentTime, source }
          setStatus('tracking')
          if (t0 - lastBoxAt > 150) {
            lastBoxAt = t0
            setFaceBox({ x: (pose.box.x / w) * 100, y: (pose.box.y / h) * 100, w: (pose.box.w / w) * 100, h: (pose.box.h / h) * 100 })
          }
        } else {
          smootherRef.current.reset()
          faceRef.current = null
          setStatus('no-face')
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }).catch((e) => {
      console.error('[face] falha ao carregar o rastreador', e)
      if (!cancelled) { faceRef.current = null; setStatus('error') }
    })

    return () => {
      cancelled = true
      faceRef.current = null
      cancelAnimationFrame(rafRef.current)
    }
  }, [currentFilter, stream, videoRef])

  const enableFilter = useCallback((maskId: string) => setCurrentFilter(maskId), [])
  const disableFilter = useCallback(() => setCurrentFilter(null), [])

  return {
    activeMask: getMask(currentFilter),
    faceBox,
    faceRef,
    enableFilter,
    disableFilter,
    currentFilter,
    trackingStatus,
  }
}
