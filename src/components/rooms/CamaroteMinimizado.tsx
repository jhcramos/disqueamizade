import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Maximize2, Mic, MicOff } from 'lucide-react'

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

  const handleMaximize = () => {
    onMaximize()
    navigate(`/camarote/${camaroteId}`)
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 animate-slide-up">
      {/* Container principal */}
      <div className="w-64 bg-noite-900 rounded-2xl border border-elite-500/30 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-elite-500/10 border-b border-elite-500/20">
          <button 
            onClick={handleMaximize}
            className="flex items-center gap-2 text-xs font-semibold text-elite-400 hover:text-elite-300"
          >
            <span>🛋️</span>
            <span className="truncate max-w-[120px]">{camaroteName}</span>
          </button>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleMaximize}
              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10"
              title="Maximizar"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10"
              title="Sair do camarote"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-0.5 p-1 bg-black">
          {participants.slice(0, 4).map((p) => (
            <div 
              key={p.id} 
              className="relative aspect-square bg-noite-800 overflow-hidden cursor-pointer"
              onClick={handleMaximize}
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
                    className="w-8 h-8 rounded-full border border-white/20"
                  />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5">
                <span className="text-[9px] text-white truncate block">{p.username}</span>
              </div>
            </div>
          ))}
          
          {/* Se menos de 4 participantes, preenche com placeholder */}
          {participants.length < 4 && Array.from({ length: 4 - participants.length }).map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="aspect-square bg-noite-800 flex items-center justify-center"
            >
              <span className="text-xs text-dark-600">+</span>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-3 py-2 bg-noite-900/80">
          <span className="text-[10px] text-dark-500">{participants.length} pessoas</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded-lg transition-all ${
                isMuted 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={handleMaximize}
              className="px-3 py-1 rounded-lg bg-elite-500/20 text-elite-400 text-[10px] font-semibold hover:bg-elite-500/30"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
