// ═══════════════════════════════════════════════════════════════════════════
// useStageCamera — liga a câmera local (com máscaras) e publica no LiveKit
//
// Reaproveita o pipeline existente: useCamera → useVideoFilter → useCompositeStream.
// O stream publicado é o COMPOSTO (com filtros e máscara), igual ao que os
// outros participantes veem. Entrar na sala NÃO liga a câmera: o usuário é
// espectador até chamar `goLive()`.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react'
import type { LocalTrackPublication } from 'livekit-client'
import { useLocalParticipant } from '@livekit/components-react'
import { useCamera } from '@/hooks/useCamera'
import { useVideoFilter } from '@/hooks/useVideoFilter'
import { useCompositeStream } from '@/hooks/useCompositeStream'
import { FILTER_CSS } from '@/components/camera/CameraMasks'
import { track as analytics } from '@/services/analytics'

// NB: o namespace Track.Source dos tipos do livekit-client não resolve neste
// bundle (funciona em runtime). Usamos os valores string e casts pontuais.
const SOURCE_CAMERA = 'camera'
const SOURCE_MIC = 'microphone'

export interface StageCameraControls {
  videoRef: React.RefObject<HTMLVideoElement>
  isLive: boolean
  isCameraOn: boolean
  isMicOn: boolean
  permissionState: ReturnType<typeof useCamera>['permissionState']
  error: string | null
  starting: boolean
  goLive: () => Promise<void>
  leaveStage: () => void
  toggleCamera: () => void
  toggleMic: () => void
  // filtros / máscaras
  activeFilter: string
  setActiveFilter: (f: string) => void
  activeMask: string | null
  setActiveMask: (m: string | null) => void
  beautySmooth: boolean
  setBeautySmooth: (v: boolean) => void
  beautyBrighten: boolean
  setBeautyBrighten: (v: boolean) => void
  faceBox: ReturnType<typeof useVideoFilter>['faceBox']
}

export function useStageCamera(roomId: string): StageCameraControls {
  const { localParticipant } = useLocalParticipant()
  const {
    stream, videoRef, isCameraOn, isMicOn, permissionState, error,
    startCamera, stopCamera, toggleCamera, toggleMic,
  } = useCamera()

  const [activeFilter, setActiveFilter] = useState('normal')
  const [activeMask, setActiveMask] = useState<string | null>(null)
  const [beautySmooth, setBeautySmooth] = useState(false)
  const [beautyBrighten, setBeautyBrighten] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [starting, setStarting] = useState(false)

  const {
    activeMaskEmoji, faceBox, enableFilter, disableFilter,
  } = useVideoFilter(videoRef, stream)

  useEffect(() => {
    if (activeMask) enableFilter(activeMask)
    else disableFilter()
  }, [activeMask, enableFilter, disableFilter])

  const filterStyle = FILTER_CSS[activeFilter] || 'none'
  const { compositeStream } = useCompositeStream(
    videoRef, stream, filterStyle, activeMaskEmoji, faceBox, beautySmooth, beautyBrighten,
  )

  const pubRef = useRef<LocalTrackPublication[]>([])

  const goLive = useCallback(async () => {
    if (isLive || starting) return
    setStarting(true)
    try {
      await startCamera()
      analytics('camera_on', { room: roomId })
    } finally {
      setStarting(false)
    }
  }, [isLive, starting, startCamera, roomId])

  // Quando o stream composto fica pronto após goLive, publica no LiveKit.
  useEffect(() => {
    if (!compositeStream || !localParticipant || isLive || starting) return
    let cancelled = false
    ;(async () => {
      try {
        const videoTrack = compositeStream.getVideoTracks()[0]
        const audioTrack = stream?.getAudioTracks()[0]
        const pubs: LocalTrackPublication[] = []
        if (videoTrack) {
          const p = await (localParticipant as any).publishTrack(videoTrack, { source: SOURCE_CAMERA })
          pubs.push(p)
        }
        if (audioTrack) {
          const p = await (localParticipant as any).publishTrack(audioTrack, { source: SOURCE_MIC })
          pubs.push(p)
        }
        if (cancelled) return
        pubRef.current = pubs
        setIsLive(true)
      } catch (e) {
        console.error('[stage] erro ao publicar', e)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compositeStream, localParticipant])

  const leaveStage = useCallback(() => {
    for (const pub of pubRef.current) {
      if (pub.track) localParticipant?.unpublishTrack(pub.track)
    }
    pubRef.current = []
    stopCamera()
    setIsLive(false)
  }, [localParticipant, stopCamera])

  // Limpeza ao desmontar
  useEffect(() => () => {
    for (const pub of pubRef.current) {
      if (pub.track) localParticipant?.unpublishTrack(pub.track)
    }
    stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    videoRef, isLive, isCameraOn, isMicOn, permissionState, error, starting,
    goLive, leaveStage, toggleCamera, toggleMic,
    activeFilter, setActiveFilter, activeMask, setActiveMask,
    beautySmooth, setBeautySmooth, beautyBrighten, setBeautyBrighten, faceBox,
  }
}
