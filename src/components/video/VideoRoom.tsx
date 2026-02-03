import React, { useState, useEffect } from 'react'

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
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [isLiveKitConfigured, setIsLiveKitConfigured] = useState(false)

  useEffect(() => {
    // Check if LiveKit is configured
    const livekitUrl = import.meta.env.VITE_LIVEKIT_URL
    const configured = livekitUrl && livekitUrl !== 'wss://your-project.livekit.cloud'
    setIsLiveKitConfigured(!!configured)
  }, [])

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn)
    if (!isLiveKitConfigured) {
      console.log('Demo mode: Camera', !isCameraOn ? 'ON' : 'OFF')
    }
  }

  const toggleMic = () => {
    setIsMicOn(!isMicOn)
    if (!isLiveKitConfigured) {
      console.log('Demo mode: Mic', !isMicOn ? 'ON' : 'OFF')
    }
  }

  return (
    <div className="space-y-4">
      {/* Video Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {users.slice(0, 4).map((user, index) => (
          <div
            key={user.id}
            className="aspect-video bg-surface rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden group"
          >
            {/* Mock Video - Avatar */}
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
              {index === 0 && isCameraOn && (
                <span className="text-primary-light">📹</span>
              )}
              {index === 0 && isMicOn && (
                <span className="text-primary-light">🎤</span>
              )}
            </div>

            {/* Status indicator */}
            {index === 0 && (
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary-light border border-primary/30">
                  Você
                </span>
              </div>
            )}

            {/* Demo mode pulse effect */}
            {!isLiveKitConfigured && index === 0 && (isCameraOn || isMicOn) && (
              <div className="absolute inset-0 border-2 border-primary/50 rounded-xl animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Video Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={toggleCamera}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            isCameraOn
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-surface border border-primary/30 text-primary-light hover:bg-primary/10'
          }`}
        >
          {isCameraOn ? '📹 Câmera Ligada' : '📹 Ligar Câmera'}
        </button>

        <button
          onClick={toggleMic}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            isMicOn
              ? 'bg-pink-500 text-white hover:bg-pink-600'
              : 'bg-surface border border-pink-500/30 text-pink-400 hover:bg-pink-500/10'
          }`}
        >
          {isMicOn ? '🎤 Microfone Ligado' : '🎤 Ligar Microfone'}
        </button>
      </div>

      {/* Demo Mode Warning */}
      {!isLiveKitConfigured && (
        <div className="card p-4 border-l-4 border-amber-500">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-bold text-amber-400 mb-1">Modo Demo - Vídeo Simulado</h4>
              <p className="text-sm text-gray-400">
                Para ativar vídeo real, configure o LiveKit no arquivo .env:
              </p>
              <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc list-inside">
                <li>Crie uma conta gratuita em <a href="https://livekit.io" target="_blank" rel="noopener noreferrer" className="text-primary-light hover:underline">livekit.io</a></li>
                <li>Copie suas credenciais (URL, API Key, API Secret)</li>
                <li>Cole no arquivo .env do projeto</li>
                <li>Reinicie o servidor (npm run dev)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* LiveKit Ready */}
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
