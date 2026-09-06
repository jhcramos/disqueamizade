import { useEffect, useRef, useState } from 'react'
import { LiveKitRoom, RoomAudioRenderer, useConnectionState, useLocalParticipant, useParticipants, useTracks, VideoTrack } from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import { LIVEKIT_URL } from './livekit'
import { ProcessedPreview } from './CameraSetup'
import { useStageCamera } from './useStageCamera'
import type { ContactMode } from './privateContact'

type Props = {
  token: string
  roomId: string
  identity: string
  peerName: string
  mode: Exclude<ContactMode, 'message'>
  onEnd: () => void
}

export function PrivateCall(props: Props) {
  return <LiveKitRoom
    serverUrl={LIVEKIT_URL}
    token={props.token}
    connect
    audio={false}
    video={false}
    className="min-h-screen bg-dark-950 text-white"
  >
    <RoomAudioRenderer />
    <PrivateCallInner {...props} />
  </LiveKitRoom>
}

function PrivateCallInner({ roomId, identity, peerName, mode, onEnd }: Props) {
  const connection = useConnectionState()
  const cam = useStageCamera(roomId)
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const participants = useParticipants()
  const cameraTracks = useTracks(['camera' as any], { onlySubscribed: false })
  const remoteVideo = cameraTracks.find(track => track.participant.identity !== identity)
  const peerConnected = participants.some(person => person.identity !== identity)
  const [microphoneError, setMicrophoneError] = useState<string | null>(null)
  const previewOffered = useRef(false)

  useEffect(() => {
    if (mode === 'video' && connection === ConnectionState.Connected && !previewOffered.current) {
      previewOffered.current = true
      void cam.goLive()
    }
  }, [mode, connection, cam.approved, cam.previewOpen, cam.goLive])
  useEffect(() => () => cam.stop(), [cam.stop])

  const toggleMicrophone = async () => {
    setMicrophoneError(null)
    try { await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled) }
    catch { setMicrophoneError('Não foi possível acessar o microfone.') }
  }

  return <main className="flex min-h-screen flex-col">
    <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
      <div>
        <p className="text-xs font-semibold text-primary-300">CONVERSA PRIVADA · {mode === 'video' ? 'VÍDEO' : 'ÁUDIO'}</p>
        <h1 className="font-bold">Você e {peerName}</h1>
      </div>
      <button type="button" onClick={onEnd} className="flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-sm font-bold"><PhoneOff className="h-4 w-4" /> Encerrar</button>
    </header>

    <section className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      {mode === 'video' && remoteVideo ? <VideoTrack trackRef={remoteVideo} className="absolute inset-0 h-full w-full object-contain" /> : <div className="text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary-500/30 to-pink-500/30 text-4xl font-bold">{peerName.slice(0, 1).toUpperCase()}</div>
        <h2 className="mt-4 text-xl font-bold">{peerName}</h2>
        <p className="mt-1 text-sm text-dark-400">{peerConnected ? (mode === 'video' ? 'Câmera desligada' : 'Na chamada de áudio') : 'Entrando na conversa…'}</p>
      </div>}

      {mode === 'video' && cam.isLive && cam.previewStream && <div className="absolute bottom-4 right-4 h-28 w-36 overflow-hidden rounded-xl border-2 border-primary-400/50 bg-dark-900 shadow-2xl sm:h-36 sm:w-48">
        <ProcessedPreview stream={cam.previewStream} className="h-full w-full object-cover" />
        <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px]">Você</span>
      </div>}
    </section>

    <footer className="border-t border-white/5 bg-dark-950/90 p-4">
      {(microphoneError || cam.error) && <p role="alert" className="mb-2 text-center text-sm text-red-300">{microphoneError || cam.error}</p>}
      <div className="flex items-center justify-center gap-2">
        <button type="button" onClick={toggleMicrophone} className={`flex items-center gap-2 rounded-2xl border px-4 py-3 font-semibold ${isMicrophoneEnabled ? 'border-white/10 bg-white/5' : 'border-red-500/40 bg-red-500/20'}`}>
          {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}{isMicrophoneEnabled ? 'Microfone ligado' : 'Ativar microfone'}
        </button>
        {mode === 'video' && <button type="button" onClick={cam.isLive ? cam.toggleCamera : cam.goLive} className={`flex items-center gap-2 rounded-2xl border px-4 py-3 font-semibold ${cam.isLive ? 'border-white/10 bg-white/5' : 'border-primary-400/40 bg-primary-500/15'}`}>
          {cam.isLive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}{cam.isLive ? 'Câmera ligada' : 'Abrir prévia'}
        </button>}
      </div>
      <p className="mt-2 text-center text-[11px] text-dark-500">A sala geral fica desconectada enquanto esta conversa estiver aberta.</p>
    </footer>
  </main>
}
