import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalParticipant, useConnectionState } from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import { useCameraSetup } from './CameraSetup'
import { StagePublication } from './stagePublication'
import { track as analytics } from '@/services/analytics'

export function useStageCamera(roomId: string) {
  const camera = useCameraSetup()
  const { localParticipant } = useLocalParticipant()
  const connection = useConnectionState()
  const [isLive, setIsLive] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const pendingPublication = useRef<Promise<unknown>>(Promise.resolve())
  const { approved, previewStream, stream, stop, openPreview } = camera

  useEffect(() => {
    if (!approved || !previewStream || connection !== ConnectionState.Connected) return
    let cancelled = false
    const publisher = new StagePublication(localParticipant as any)
    setPublishing(true); setPublishError(null)
    // Aguarda a limpeza da tentativa anterior antes de reutilizar a faixa.
    // Evita que uma publicação antiga remova a nova após uma reconexão.
    const operation = pendingPublication.current.then(() => cancelled ? false : publisher.start(previewStream, stream?.getAudioTracks()[0], approved))
    pendingPublication.current = operation.catch(() => {})
    void operation.then(started => {
      if (!cancelled) { setIsLive(started); if (started) analytics('camera_on', { room: roomId }) }
    }).catch(() => {
      if (!cancelled) { setPublishError('Não foi possível transmitir. Abra a prévia para tentar novamente.'); stop() }
    }).finally(() => { if (!cancelled) setPublishing(false) })
    return () => { cancelled = true; publisher.cancel(); setIsLive(false); setPublishing(false) }
  }, [approved, previewStream, stream, localParticipant, connection, roomId, stop])

  // O provider mantém a câmera privada e encerra a captura ao sair da página.
  // Aqui o cleanup encerra só a publicação, inclusive no replay do StrictMode.
  const toggleCamera = useCallback(() => {
    if (isLive) stop()
    else void openPreview()
  }, [isLive, stop, openPreview])
  return { ...camera, isLive, starting: camera.starting || publishing,
    error: publishError || camera.error, goLive: openPreview, leaveStage: stop, toggleCamera }
}
