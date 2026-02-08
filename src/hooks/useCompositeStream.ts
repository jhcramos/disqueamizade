import { useRef, useEffect, useCallback, useState } from 'react'

type FaceBox = { x: number; y: number; w: number; h: number }

/**
 * Composites video + CSS filters + emoji mask into a canvas,
 * returning a MediaStream that includes all visual effects.
 * This stream is what gets sent via WebRTC so remote users see filters/masks.
 */
export function useCompositeStream(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  rawStream: MediaStream | undefined | null,
  filterStyle: string,
  maskEmoji: string | null,
  faceBox: FaceBox | null,
  beautySmooth: boolean,
  beautyBrighten: boolean,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number>(0)
  const [compositeStream, setCompositeStream] = useState<MediaStream | null>(null)

  // Build the CSS filter string
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

    // Create offscreen canvas
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    // Match video dimensions
    const video = videoRef.current
    const updateSize = () => {
      const vw = video.videoWidth || 640
      const vh = video.videoHeight || 480
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw
        canvas.height = vh
      }
    }

    // Render loop
    const render = () => {
      if (!video || video.paused || video.ended) {
        animFrameRef.current = requestAnimationFrame(render)
        return
      }

      updateSize()

      // Apply CSS filter to canvas context
      const filter = buildFilter()
      ctx.filter = filter === 'none' ? 'none' : filter

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Reset filter for overlay drawing
      ctx.filter = 'none'

      // Draw emoji mask at face position
      if (maskEmoji && faceBox) {
        const cx = (faceBox.x + faceBox.w / 2) / 100 * canvas.width
        const cy = (faceBox.y + faceBox.h / 2) / 100 * canvas.height
        const size = Math.max(faceBox.w, faceBox.h) / 100 * Math.max(canvas.width, canvas.height) * 1.5

        ctx.font = `${Math.round(size)}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(maskEmoji, cx, cy)
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    // Start rendering
    animFrameRef.current = requestAnimationFrame(render)

    // Capture stream from canvas (30fps)
    const canvasStream = canvas.captureStream(30)

    // Add audio tracks from original stream
    for (const audioTrack of rawStream.getAudioTracks()) {
      canvasStream.addTrack(audioTrack)
    }

    setCompositeStream(canvasStream)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [rawStream, videoRef, buildFilter, maskEmoji, faceBox])

  // Update composite when filter/mask changes (no need to recreate stream)
  // The render loop already reads the latest values via closure

  return compositeStream
}
