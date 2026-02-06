import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Maximize2, Mic, MicOff, GripVertical } from 'lucide-react'

interface Participant {
  id: string
  username: string
  avatar: string
  videoEnabled: boolean
}

interface CamaroteMinimizadoProps {
  camaroteId: string
  camaroteName: string
  participants: Participant[]
  onClose: () => void
  onMaximize: () => void
}

export const CamaroteMinimizado = ({
  camaroteId,
  camaroteName,
  participants,
  onClose,
  onMaximize,
}: CamaroteMinimizadoProps) => {
  const navigate = useNavigate()
  const [isMuted, setIsMuted] = useState(false)
  const [position, setPosition] = useState({ x: 270, y: 400 }) // Default: ao lado da sidebar
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })

  const handleMaximize = () => {
    onMaximize()
    navigate(`/camarote/${camaroteId}`)
  }

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return // Não arrastar se clicar em botão
    setIsDragging(true)
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    setIsDragging(true)
    const touch = e.touches[0]
    dragStartPos.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const newX = e.clientX - dragStartPos.current.x
      const newY = e.clientY - dragStartPos.current.y
      
      // Limitar dentro da tela
      const maxX = window.innerWidth - 280
      const maxY = window.innerHeight - 200
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      const touch = e.touches[0]
      const newX = touch.clientX - dragStartPos.current.x
      const newY = touch.clientY - dragStartPos.current.y
      
      const maxX = window.innerWidth - 280
      const maxY = window.innerHeight - 200
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => setIsDragging(false)
    const handleTouchEnd = () => setIsDragging(false)

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging])

  return (
    <div 
      ref={dragRef}
      className={`fixed z-40 animate-slide-up ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{ 
        left: position.x, 
        top: position.y,
        touchAction: 'none',
      }}
    >
      {/* Container principal */}
      <div className="w-56 bg-noite-900 rounded-2xl border border-elite-500/30 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header - área arrastável */}
        <div 
          className={`flex items-center justify-between px-2 py-1.5 bg-elite-500/10 border-b border-elite-500/20 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center gap-1">
            <GripVertical className="w-3 h-3 text-dark-500" />
            <button 
              onClick={handleMaximize}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-elite-400 hover:text-elite-300"
            >
              <span>🛋️</span>
              <span className="truncate max-w-[100px]">{camaroteName}</span>
            </button>
          </div>
          <div className="flex items-center">
            <button 
              onClick={handleMaximize}
              className="p-1 rounded text-dark-400 hover:text-white hover:bg-white/10"
              title="Maximizar"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button 
              onClick={onClose}
              className="p-1 rounded text-dark-400 hover:text-red-400 hover:bg-red-500/10"
              title="Sair do camarote"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Video Grid - 2x2 */}
        <div 
          className="grid grid-cols-2 gap-0.5 p-0.5 bg-black cursor-pointer"
          onClick={handleMaximize}
        >
          {participants.slice(0, 4).map((p) => (
            <div 
              key={p.id} 
              className="relative aspect-square bg-noite-800 overflow-hidden"
            >
              {p.videoEnabled ? (
                <img 
                  src={p.avatar} 
                  alt={p.username} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={p.avatar} 
                    alt={p.username} 
                    className="w-6 h-6 rounded-full border border-white/20"
                  />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-0.5 py-0.5">
                <span className="text-[8px] text-white truncate block">{p.username}</span>
              </div>
            </div>
          ))}
          
          {/* Se menos de 4 participantes, preenche com placeholder */}
          {participants.length < 4 && Array.from({ length: 4 - participants.length }).map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="aspect-square bg-noite-800 flex items-center justify-center"
            >
              <span className="text-[10px] text-dark-600">+</span>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-noite-900/80">
          <span className="text-[9px] text-dark-500">{participants.length} pessoas</span>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1 rounded transition-all ${
                isMuted 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
            </button>
            <button 
              onClick={handleMaximize}
              className="px-2 py-0.5 rounded bg-elite-500/20 text-elite-400 text-[9px] font-semibold hover:bg-elite-500/30"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
