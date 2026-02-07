import React, { useState, useEffect, useCallback } from 'react'
import { Video, VideoOff, Mic, MicOff, AlertTriangle, Maximize2, Minimize2, ArrowLeftRight } from 'lucide-react'
import { useCamera } from '@/hooks/useCamera'

interface VideoRoomProps {
  roomId: string
  username: string
  users: Array<{
    id: string
    username: string
    avatar: string
  }>
}

export const VideoRoom: React.FC<VideoRoomProps> = ({ roomId: _roomId, username: _username, users }) => {
  const {
    stream,
    videoRef,
    isCameraOn,
    isMicOn,
    permissionState,
    error,
    startCamera,
    stopCamera,
    toggleCamera,
    toggleMic,
  } = useCamera()

  const [isLiveKitConfigured, setIsLiveKitConfigured] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  // Which feed is "main" (maximized). null = grid view, 'self' = you, or user id
  const [mainFeed, setMainFeed] = useState<string | null>(null)
  const [pipPosition, setPipPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('bottom-right')

  useEffect(() => {
    const livekitUrl = import.meta.env.VITE_LIVEKIT_URL
    const configured = livekitUrl && livekitUrl !== 'wss://your-project.livekit.cloud'
    setIsLiveKitConfigured(!!configured)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Cycle PiP corner on click
  const cyclePipPosition = useCallback(() => {
    const positions: typeof pipPosition[] = ['bottom-right', 'bottom-left', 'top-left', 'top-right']
    setPipPosition(prev => {
      const idx = positions.indexOf(prev)
      return positions[(idx + 1) % positions.length]
    })
  }, [])

  // Toggle maximize: if already showing this feed maximized, go back to grid
  const toggleMaximize = useCallback((feedId: string) => {
    if (mainFeed === feedId) {
      setMainFeed(null)
      setIsMaximized(false)
    } else {
      setMainFeed(feedId)
      setIsMaximized(true)
    }
  }, [mainFeed])

  // Swap: put PiP feed as main and vice-versa
  const swapFeeds = useCallback(() => {
    if (!mainFeed) return
    const otherUsers = users.slice(0, 3)
    if (mainFeed === 'self') {
      // Swap to first other user
      if (otherUsers.length > 0) setMainFeed(otherUsers[0].id)
    } else {
      setMainFeed('self')
    }
  }, [mainFeed, users])

  const pipPositionClasses = {
    'top-right': 'top-3 right-3',
    'top-left': 'top-3 left-3',
    'bottom-right': 'bottom-16 right-3',
    'bottom-left': 'bottom-16 left-3',
  }

  // Render a video tile (self or other user)
  const renderSelfTile = (className: string, showMaxBtn = true) => (
    <div className={`bg-surface rounded-xl border-2 border-primary/40 flex items-center justify-center relative overflow-hidden group shadow-[0_0_15px_rgba(139,92,246,0.15)] ${className}`}>
      {isCameraOn && stream ? (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600/20 to-primary-800/20">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-2">
              <VideoOff className="w-6 h-6 text-primary-light" />
            </div>
            <p className="text-xs text-dark-400">Câmera desligada</p>
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary-light border border-primary/30 backdrop-blur-sm">
          Você
        </span>
        {showMaxBtn && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleMaximize('self') }}
            className="p-1 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors"
            title={mainFeed === 'self' ? 'Minimizar' : 'Maximizar'}
          >
            {mainFeed === 'self' ? <Minimize2 className="w-3.5 h-3.5 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-white" />}
          </button>
        )}
      </div>
      <div className="absolute bottom-2 left-2 text-xs font-bold flex items-center gap-2">
        <span>você</span>
        {isCameraOn && <span className="text-primary-light">📹</span>}
        {isMicOn && <span className="text-primary-light">🎤</span>}
      </div>
      {isCameraOn && (
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-red-500/80 text-[10px] font-bold text-white backdrop-blur-sm animate-pulse">
          LIVE
        </div>
      )}
    </div>
  )

  const renderUserTile = (user: typeof users[0], className: string, showMaxBtn = true) => (
    <div
      key={user.id}
      className={`bg-surface rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden group ${className}`}
    >
      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="absolute bottom-2 left-2 text-xs font-bold flex items-center gap-2">
        <span>{user.username}</span>
      </div>
      {showMaxBtn && (
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => { e.stopPropagation(); toggleMaximize(user.id) }}
            className="p-1 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
            title={mainFeed === user.id ? 'Minimizar' : 'Maximizar'}
          >
            {mainFeed === user.id ? <Minimize2 className="w-3.5 h-3.5 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-12 h-12 rounded-full border border-primary/20 animate-ping opacity-20" />
        <div className="px-2 py-1 rounded-full bg-dark-900/60 backdrop-blur-sm text-[10px] text-dark-400 border border-white/5">
          conectando...
        </div>
      </div>
    </div>
  )

  // ── MAXIMIZED VIEW (WhatsApp-style PiP) ──
  const maximizedView = () => {
    const otherUsers = users.slice(0, 3)
    const isMainSelf = mainFeed === 'self'
    const mainUser = !isMainSelf ? otherUsers.find(u => u.id === mainFeed) : null

    // If the selected user doesn't exist, fall back to grid
    if (!isMainSelf && !mainUser) {
      return null
    }

    return (
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '300px' }}>
        {/* MAIN (maximized) feed */}
        {isMainSelf
          ? renderSelfTile('w-full h-full rounded-2xl', true)
          : mainUser && renderUserTile(mainUser, 'w-full h-full rounded-2xl', true)
        }

        {/* PiP (small corner) feed — draggable position */}
        <div
          className={`absolute ${pipPositionClasses[pipPosition]} z-20 cursor-pointer transition-all duration-300 hover:scale-105`}
          style={{ width: '28%', maxWidth: '180px', minWidth: '100px' }}
          onClick={cyclePipPosition}
          title="Clique para mover • Duplo-clique para trocar"
          onDoubleClick={swapFeeds}
        >
          <div className="aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 ring-1 ring-black/30">
            {isMainSelf
              ? (mainUser ? renderUserTile(mainUser, 'w-full h-full', false) : null)
              : renderSelfTile('w-full h-full', false)
            }
          </div>
        </div>

        {/* Swap button */}
        <button
          onClick={swapFeeds}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
          style={{ opacity: 0.7 }}
          title="Trocar câmeras"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" /> Trocar
        </button>

        {/* Exit maximize hint */}
        <button
          onClick={() => { setMainFeed(null); setIsMaximized(false) }}
          className="absolute top-3 left-3 z-30 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-colors"
          title="Voltar para grade"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // ── GRID VIEW (original, with maximize buttons) ──
  const gridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {renderSelfTile('aspect-video')}
      {users.slice(0, 3).map((user) => renderUserTile(user, 'aspect-video'))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Permission denied alert */}
      {permissionState === 'denied' && (
        <div className="card p-4 border-l-4 border-red-500 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-400 mb-1">Câmera Bloqueada</h4>
              <p className="text-sm text-gray-400">
                {error || 'Permissão de câmera negada. Clique no ícone de câmera na barra de endereço para habilitar.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {permissionState === 'error' && error && (
        <div className="card p-4 border-l-4 border-amber-500 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-400 mb-1">Erro de Câmera</h4>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Area — maximized (PiP) or grid */}
      <div className="group">
        {isMaximized && mainFeed ? maximizedView() : gridView()}
      </div>

      {/* Maximize hint when in grid mode */}
      {!isMaximized && users.length > 0 && (
        <p className="text-center text-xs text-dark-500">
          💡 Passe o mouse sobre um vídeo e clique em <Maximize2 className="w-3 h-3 inline" /> para maximizar (estilo WhatsApp)
        </p>
      )}

      {/* Video Controls */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => {
            if (!isCameraOn && !stream) {
              startCamera()
            } else {
              toggleCamera()
            }
          }}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            isCameraOn
              ? 'bg-primary text-white hover:bg-primary-dark shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              : 'bg-surface border border-primary/30 text-primary-light hover:bg-primary/10'
          }`}
        >
          {isCameraOn ? (
            <>
              <Video className="w-5 h-5" /> Câmera Ligada
            </>
          ) : (
            <>
              <VideoOff className="w-5 h-5" /> Ligar Câmera
            </>
          )}
        </button>

        <button
          onClick={() => {
            if (!stream) {
              startCamera()
            } else {
              toggleMic()
            }
          }}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            isMicOn
              ? 'bg-pink-500 text-white hover:bg-pink-600 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
              : 'bg-surface border border-pink-500/30 text-pink-400 hover:bg-pink-500/10'
          }`}
        >
          {isMicOn ? (
            <>
              <Mic className="w-5 h-5" /> Microfone Ligado
            </>
          ) : (
            <>
              <MicOff className="w-5 h-5" /> Ligar Microfone
            </>
          )}
        </button>
      </div>

      {/* Status Messages */}
      {!isLiveKitConfigured && (
        <div className="card p-4 border-l-4 border-emerald-500">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📹</span>
            <div>
              <h4 className="font-bold text-emerald-400 mb-1">Câmera Local Ativa</h4>
              <p className="text-sm text-gray-400">
                Sua câmera real está funcionando! Outros participantes aparecerão quando o servidor LiveKit for configurado.
              </p>
              <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc list-inside">
                <li>Para vídeo P2P completo, configure o LiveKit no <code className="text-primary-light">.env</code></li>
                <li>Crie uma conta gratuita em <a href="https://livekit.io" target="_blank" rel="noopener noreferrer" className="text-primary-light hover:underline">livekit.io</a> (10k min/mês grátis)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {isLiveKitConfigured && (
        <div className="card p-4 border-l-4 border-emerald-500">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="font-bold text-emerald-400 mb-1">LiveKit Configurado</h4>
              <p className="text-sm text-gray-400">
                Vídeo em tempo real ativo. Até 30 participantes podem transmitir simultaneamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
