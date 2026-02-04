import React, { useState, useEffect } from 'react'
import { Video, VideoOff, Mic, MicOff, AlertTriangle } from 'lucide-react'
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

      {/* Video Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* YOUR video tile - first position */}
        <div className="aspect-video bg-surface rounded-xl border-2 border-primary/40 flex items-center justify-center relative overflow-hidden group shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          {isCameraOn && stream ? (
            /* Real camera feed */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            /* Placeholder when camera is off */
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600/20 to-primary-800/20">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-2">
                  <VideoOff className="w-6 h-6 text-primary-light" />
                </div>
                <p className="text-xs text-dark-400">Câmera desligada</p>
              </div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

          {/* "Você" badge */}
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary-light border border-primary/30 backdrop-blur-sm">
              Você
            </span>
          </div>

          {/* Status icons */}
          <div className="absolute bottom-2 left-2 text-xs font-bold flex items-center gap-2">
            <span>você</span>
            {isCameraOn && <span className="text-primary-light">📹</span>}
            {isMicOn && <span className="text-primary-light">🎤</span>}
          </div>

          {/* Live camera pulse */}
          {isCameraOn && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-red-500/80 text-[10px] font-bold text-white backdrop-blur-sm animate-pulse">
              LIVE
            </div>
          )}
        </div>

        {/* Other users - mock avatars with connecting animation */}
        {users.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className="aspect-video bg-surface rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden group"
          >
            <img
              src={user.avatar}
              alt={user.username}
              className="w-full h-full object-cover opacity-50"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

            {/* Username */}
            <div className="absolute bottom-2 left-2 text-xs font-bold flex items-center gap-2">
              <span>{user.username}</span>
            </div>

            {/* Connecting animation - subtle pulse ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full border border-primary/20 animate-ping opacity-20" />
              <div className="px-2 py-1 rounded-full bg-dark-900/60 backdrop-blur-sm text-[10px] text-dark-400 border border-white/5">
                conectando...
              </div>
            </div>
          </div>
        ))}
      </div>

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
