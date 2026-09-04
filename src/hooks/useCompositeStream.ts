import { useRef, useEffect, useState } from 'react'
import { getMask } from '@/masks'
import type { TrackedFace } from './useVideoFilter'

/** A prévia e a publicação usam exclusivamente este canvas, nunca o vídeo bruto. */
export function useCompositeStream(
  videoRef: React.RefObject<HTMLVideoElement | null>, rawStream: MediaStream | undefined | null,
  filterStyle: string, maskId: string | null, faceRef: React.MutableRefObject<TrackedFace | null>,
  beautySmooth: boolean, beautyBrighten: boolean,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const settings = useRef({ filterStyle, maskId, beautySmooth, beautyBrighten })
  settings.current = { filterStyle, maskId, beautySmooth, beautyBrighten }
  const loadedMask = useRef<string | null>(null)
  const [compositeStream, setCompositeStream] = useState<MediaStream | null>(null)
  const [renderedChoice, setRenderedChoice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadedMask.current = null
    if (maskId) getMask(maskId)?.preload().then(() => { if (!cancelled) loadedMask.current = maskId }).catch(() => {})
    return () => { cancelled = true }
  }, [maskId])

  useEffect(() => {
    if (!rawStream || !videoRef.current) { setCompositeStream(null); setRenderedChoice(null); return }
    setRenderedChoice(null)
    const canvas = document.createElement('canvas')
    canvasRef.current = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const video = videoRef.current
    let raf = 0, lastChoice: string | null = null
    const ready = (choice: string | null) => {
      if (lastChoice !== choice) { lastChoice = choice; setRenderedChoice(choice) }
    }
    const cover = () => {
      // Também remove clips/transforms deixados por um renderer que falhou.
      canvas.width = canvas.width
      ctx.filter = 'none'; ctx.fillStyle = '#13111c'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#e9d5ff'; ctx.textAlign = 'center'; ctx.font = '20px sans-serif'
      ctx.fillText('Câmera protegida', canvas.width / 2, canvas.height / 2)
      ready(null)
    }
    canvas.width = 640; canvas.height = 480; cover()
    const render = () => {
      raf = requestAnimationFrame(render)
      const current = settings.current
      if (video.paused || video.ended || video.readyState < 2) { cover(); return }
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480
      }
      const mask = getMask(current.maskId), face = faceRef.current
      if (current.maskId && (!mask || loadedMask.current !== current.maskId || !face || performance.now() - face.frame.ts > 150)) { cover(); return }
      // A detecção guarda seu próprio frame: nunca aplicar a máscara antiga
      // à imagem nova da câmera, mesmo se os loops tiverem cadências diferentes.
      const source = current.maskId ? face?.source : video
      if (!source) { cover(); return }
      const parts = [current.filterStyle !== 'none' ? current.filterStyle : '', current.beautySmooth ? 'blur(0.5px) contrast(1.05)' : '', current.beautyBrighten ? 'brightness(1.15) saturate(1.05)' : ''].filter(Boolean)
      ctx.filter = parts.join(' ') || 'none'
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height); ctx.filter = 'none'
      if (mask && face) {
        ctx.save()
        try { mask.render({ ctx, w: canvas.width, h: canvas.height, frame: face.frame, pose: face.pose, t: performance.now() }) }
        catch { ctx.restore(); cover(); return }
        ctx.restore()
      }
      ready(current.maskId || 'none')
    }
    raf = requestAnimationFrame(render)
    const output = canvas.captureStream(30)
    for (const audioTrack of rawStream.getAudioTracks()) output.addTrack(audioTrack)
    setCompositeStream(output)
    return () => { cancelAnimationFrame(raf); output.getVideoTracks().forEach(track => track.stop()) }
  }, [rawStream, videoRef, faceRef])

  return { compositeStream, canvasRef, previewReady: !!compositeStream && renderedChoice === (maskId || 'none') }
}
