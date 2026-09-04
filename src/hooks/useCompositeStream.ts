// ═══════════════════════════════════════════════════════════════════════════
// useCompositeStream — compõe vídeo + filtro de cor + máscara num canvas e
// devolve um MediaStream. É ESSE stream que vai para o LiveKit: os outros
// participantes veem exatamente o que você vê (máscara inclusa).
// ═══════════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useCallback, useState } from 'react'
import { getMask } from '@/masks'
import type { TrackedFace } from './useVideoFilter'

export function useCompositeStream(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  rawStream: MediaStream | undefined | null,
  filterStyle: string,
  maskId: string | null,
  faceRef: React.MutableRefObject<TrackedFace | null>,
  beautySmooth: boolean,
  beautyBrighten: boolean,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number>(0)
  const [compositeStream, setCompositeStream] = useState<MediaStream | null>(null)
  // refs para o loop ler o valor mais recente sem recriar o stream
  const maskIdRef = useRef(maskId)
  maskIdRef.current = maskId

  const buildFilter = useCallback(() => {
    const parts: string[] = []
    if (filterStyle && filterStyle !== 'none') parts.push(filterStyle)
    if (beautySmooth) parts.push('blur(0.5px) contrast(1.05)')
    if (beautyBrighten) parts.push('brightness(1.15) saturate(1.05)')
    return parts.length > 0 ? parts.join(' ') : 'none'
  }, [filterStyle, beautySmooth, beautyBrighten])

  useEffect(() => {
    if (!rawStream || !videoRef.current) {
      setCompositeStream(null)
      return
    }

    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const video = videoRef.current

    const updateSize = () => {
      const vw = video.videoWidth || 640
      const vh = video.videoHeight || 480
      if (canvas.width !== vw || canvas.height !== vh) { canvas.width = vw; canvas.height = vh }
    }

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render)
      if (!video || video.paused || video.ended) return
      updateSize()

      const filter = buildFilter()
      ctx.filter = filter === 'none' ? 'none' : filter
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'

      const mask = getMask(maskIdRef.current)
      const face = faceRef.current
      if (mask && face) {
        try {
          mask.render({ ctx, w: canvas.width, h: canvas.height, frame: face.frame, pose: face.pose, t: performance.now() })
        } catch (e) {
          console.warn('[mask] render', e)
        }
      }
    }
    animFrameRef.current = requestAnimationFrame(render)

    const canvasStream = canvas.captureStream(30)
    for (const audioTrack of rawStream.getAudioTracks()) canvasStream.addTrack(audioTrack)
    setCompositeStream(canvasStream)

    return () => { cancelAnimationFrame(animFrameRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawStream, videoRef, buildFilter])

  return { compositeStream, canvasRef }
}
