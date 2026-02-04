// ═══════════════════════════════════════════════════════════════════════════
// useCamera Hook — Real Camera via getUserMedia
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraPermissionState = 'prompt' | 'granted' | 'denied' | 'error'

export interface UseCameraResult {
  /** The raw MediaStream from getUserMedia */
  stream: MediaStream | null
  /** Ref to attach to <video> elements for local preview */
  videoRef: React.RefObject<HTMLVideoElement>
  /** Whether camera is currently active */
  isCameraOn: boolean
  /** Whether mic is currently active */
  isMicOn: boolean
  /** Permission state */
  permissionState: CameraPermissionState
  /** Error message if any */
  error: string | null
  /** Start camera (requests permissions if needed) */
  startCamera: () => Promise<void>
  /** Stop camera completely */
  stopCamera: () => void
  /** Toggle camera on/off */
  toggleCamera: () => void
  /** Toggle mic on/off */
  toggleMic: () => void
}

export const useCamera = (): UseCameraResult => {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [permissionState, setPermissionState] = useState<CameraPermissionState>('prompt')
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Attach stream to video element whenever either changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Cleanup on unmount — stop ALL tracks
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        streamRef.current = null
      }
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setError(null)

      // Check if getUserMedia is available
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Seu navegador não suporta acesso à câmera. Use Chrome, Firefox ou Safari.')
        setPermissionState('error')
        return
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: true,
      })

      streamRef.current = mediaStream
      setStream(mediaStream)
      setIsCameraOn(true)
      setIsMicOn(true)
      setPermissionState('granted')

      // Attach to video ref if available
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: unknown) {
      const e = err as DOMException
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setPermissionState('denied')
        setError('Permissão de câmera negada. Habilite nas configurações do navegador.')
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setPermissionState('error')
        setError('Nenhuma câmera encontrada. Conecte uma câmera e tente novamente.')
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        setPermissionState('error')
        setError('Câmera está sendo usada por outro aplicativo.')
      } else {
        setPermissionState('error')
        setError('Erro ao acessar câmera. Tente novamente.')
      }
      console.error('Camera error:', e)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }
    setStream(null)
    setIsCameraOn(false)
    setIsMicOn(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const toggleCamera = useCallback(() => {
    if (!streamRef.current) {
      // If no stream exists, start camera
      startCamera()
      return
    }

    const videoTracks = streamRef.current.getVideoTracks()
    if (videoTracks.length > 0) {
      const newState = !videoTracks[0].enabled
      videoTracks.forEach(track => {
        track.enabled = newState
      })
      setIsCameraOn(newState)
    }
  }, [startCamera])

  const toggleMic = useCallback(() => {
    if (!streamRef.current) return

    const audioTracks = streamRef.current.getAudioTracks()
    if (audioTracks.length > 0) {
      const newState = !audioTracks[0].enabled
      audioTracks.forEach(track => {
        track.enabled = newState
      })
      setIsMicOn(newState)
    }
  }, [])

  return {
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
  }
}
