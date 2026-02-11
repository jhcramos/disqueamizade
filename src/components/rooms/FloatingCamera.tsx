import { useState, useRef, useEffect, useCallback } from 'react'
import { Minimize2, Maximize2, X } from 'lucide-react'

interface FloatingCameraProps {
  stream: MediaStream
  performerName: string
  stageTimer: string
  isMicOn: boolean
  onClose: () => void
}

const MIN_W = 200
const MIN_H = 150

export const FloatingCamera = ({
  stream,
  performerName,
  stageTimer,
  isMicOn,
  onClose,
}: FloatingCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [pos, setPos] = useState({ x: Math.max(0, window.innerWidth / 2 - 200), y: 100 })
  const [size, setSize] = useState({ w: 400, h: 300 })
  const [isFullscreen, setIsFullscreen] = useState(false)

  const isDragging = useRef(false)
  const isResizing = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const onPointerMove = useCallback((clientX: number, clientY: number) => {
    if (isDragging.current) {
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 100, clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 50, clientY - dragOffset.current.y)),
      })
    }
    if (isResizing.current) {
      const dw = clientX - resizeStart.current.x
      const dh = clientY - resizeStart.current.y
      setSize({
        w: Math.max(MIN_W, Math.min(window.innerWidth, resizeStart.current.w + dw)),
        h: Math.max(MIN_H, Math.min(window.innerHeight, resizeStart.current.h + dh)),
      })
    }
  }, [])

  useEffect(() => {
    const onMM = (e: MouseEvent) => onPointerMove(e.clientX, e.clientY)
    const onTM = (e: TouchEvent) => { const t = e.touches[0]; onPointerMove(t.clientX, t.clientY) }
    const onUp = () => { isDragging.current = false; isResizing.current = false }
    document.addEventListener('mousemove', onMM)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onTM, { passive: false })
    document.addEventListener('touchend', onUp)
    return () => {
      document.removeEventListener('mousemove', onMM)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onTM)
      document.removeEventListener('touchend', onUp)
    }
  }, [onPointerMove])

  const startDrag = (clientX: number, clientY: number) => {
    if (isFullscreen) return
    isDragging.current = true
    dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y }
  }

  const startResize = (clientX: number, clientY: number) => {
    isResizing.current = true
    resizeStart.current = { x: clientX, y: clientY, w: size.w, h: size.h }
  }

  const containerStyle: React.CSSProperties = isFullscreen
    ? {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 50,
        boxShadow: '0 0 40px rgba(236,72,153,0.4), 0 0 80px rgba(139,92,246,0.2)',
        border: '2px solid rgba(236,72,153,0.5)',
      }
    : {
        position: 'fixed', top: pos.y, left: pos.x, width: size.w, height: size.h, zIndex: 50,
        boxShadow: '0 0 40px rgba(236,72,153,0.4), 0 0 80px rgba(139,92,246,0.2)',
        border: '2px solid rgba(236,72,153,0.5)',
      }

  return (
    <div style={containerStyle} className="flex flex-col bg-dark-900 rounded-xl overflow-hidden">
      {/* Drag handle / title bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-dark-800/90 cursor-move select-none flex-shrink-0"
        onMouseDown={e => startDrag(e.clientX, e.clientY)}
        onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      >
        <span className="text-xs font-bold text-fuchsia-300 truncate">
          🎤 {performerName}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/50 font-mono mr-2">⏱️ {stageTimer}</span>
          <span className={`text-[10px] mr-2 ${isMicOn ? 'text-emerald-400' : 'text-red-400'}`}>
            {isMicOn ? '🔊' : '🔇'}
          </span>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Minimizar">
            <Minimize2 className="w-3 h-3" />
          </button>
          <button onClick={() => setIsFullscreen(f => !f)} className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Tela cheia">
            <Maximize2 className="w-3 h-3" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-red-400/60 hover:text-red-400" title="Fechar">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="relative flex-1 bg-black min-h-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full"
          style={{ objectFit: 'contain' }}
        />
      </div>

      {/* Resize handle */}
      {!isFullscreen && (
        <div
          className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize flex items-center justify-center text-white/30 hover:text-white/60 select-none"
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); startResize(e.clientX, e.clientY) }}
          onTouchStart={e => { e.stopPropagation(); startResize(e.touches[0].clientX, e.touches[0].clientY) }}
        >
          <span className="text-[10px]">⇲</span>
        </div>
      )}
    </div>
  )
}
