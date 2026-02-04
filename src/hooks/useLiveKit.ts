// ═══════════════════════════════════════════════════════════════════════════
// useLiveKit Hook — LiveKit Room Integration
// Ready for when the backend (Supabase + LiveKit Cloud) is configured.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  RemoteTrackPublication,
  LocalTrackPublication,
  ConnectionState,
  createLocalTracks,
  type LocalTrack,
} from 'livekit-client'

export type LiveKitConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface RemoteParticipantInfo {
  identity: string
  sid: string
  videoTrack: MediaStreamTrack | null
  audioTrack: MediaStreamTrack | null
  isCameraEnabled: boolean
  isMicEnabled: boolean
}

export interface UseLiveKitResult {
  /** Whether LiveKit is configured in env */
  isConfigured: boolean
  /** Current connection state */
  connectionState: LiveKitConnectionState
  /** Connect to a LiveKit room */
  connectToRoom: (roomId: string, token: string) => Promise<void>
  /** Publish local camera & mic tracks */
  publishLocalTracks: (video: boolean, audio: boolean) => Promise<void>
  /** Unpublish all local tracks */
  unpublishLocalTracks: () => void
  /** Disconnect from room */
  disconnect: () => void
  /** Local video track */
  localVideoTrack: LocalTrack | null
  /** Local audio track */
  localAudioTrack: LocalTrack | null
  /** Remote participants */
  remoteParticipants: RemoteParticipantInfo[]
  /** Error message */
  error: string | null
  /** The LiveKit Room instance (for advanced use) */
  room: Room | null
}

/** Check if LiveKit is configured */
function checkLiveKitConfigured(): boolean {
  const url = import.meta.env.VITE_LIVEKIT_URL
  return !!(url && url !== 'wss://your-project.livekit.cloud' && url.startsWith('wss://'))
}

/** Fetch a LiveKit token from the edge function */
export async function fetchLiveKitToken(roomId: string, participantName: string): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
    throw new Error('Supabase not configured — cannot fetch LiveKit token')
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/livekit-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ roomId, participantName }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch LiveKit token: ${response.statusText}`)
  }

  const data = await response.json()
  return data.token
}

export const useLiveKit = (): UseLiveKitResult => {
  const [isConfigured] = useState(() => checkLiveKitConfigured())
  const [connectionState, setConnectionState] = useState<LiveKitConnectionState>('disconnected')
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalTrack | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalTrack | null>(null)
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipantInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  const roomRef = useRef<Room | null>(null)

  // Map ConnectionState to our simplified state
  const mapConnectionState = (state: ConnectionState): LiveKitConnectionState => {
    switch (state) {
      case ConnectionState.Connected: return 'connected'
      case ConnectionState.Connecting: return 'connecting'
      case ConnectionState.Reconnecting: return 'reconnecting'
      case ConnectionState.Disconnected: return 'disconnected'
      default: return 'disconnected'
    }
  }

  // Build remote participant info from Room
  const updateRemoteParticipants = useCallback(() => {
    if (!roomRef.current) {
      setRemoteParticipants([])
      return
    }

    const participants: RemoteParticipantInfo[] = []
    roomRef.current.remoteParticipants.forEach((participant: RemoteParticipant) => {
      let videoTrack: MediaStreamTrack | null = null
      let audioTrack: MediaStreamTrack | null = null

      participant.trackPublications.forEach((pub: RemoteTrackPublication) => {
        if (pub.track) {
          if (pub.track.kind === Track.Kind.Video) {
            videoTrack = pub.track.mediaStreamTrack
          } else if (pub.track.kind === Track.Kind.Audio) {
            audioTrack = pub.track.mediaStreamTrack
          }
        }
      })

      participants.push({
        identity: participant.identity,
        sid: participant.sid,
        videoTrack,
        audioTrack,
        isCameraEnabled: participant.isCameraEnabled,
        isMicEnabled: participant.isMicrophoneEnabled,
      })
    })

    setRemoteParticipants(participants)
  }, [])

  // Connect to a LiveKit room
  const connectToRoom = useCallback(async (_roomId: string, token: string) => {
    if (!isConfigured) {
      setError('LiveKit não está configurado. Defina VITE_LIVEKIT_URL no .env')
      return
    }

    try {
      setError(null)
      setConnectionState('connecting')

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })

      // Wire up events
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        setConnectionState(mapConnectionState(state))
      })

      room.on(RoomEvent.ParticipantConnected, () => updateRemoteParticipants())
      room.on(RoomEvent.ParticipantDisconnected, () => updateRemoteParticipants())
      room.on(RoomEvent.TrackSubscribed, () => updateRemoteParticipants())
      room.on(RoomEvent.TrackUnsubscribed, () => updateRemoteParticipants())
      room.on(RoomEvent.TrackMuted, () => updateRemoteParticipants())
      room.on(RoomEvent.TrackUnmuted, () => updateRemoteParticipants())

      room.on(RoomEvent.Disconnected, () => {
        setConnectionState('disconnected')
        setRemoteParticipants([])
      })

      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL as string
      await room.connect(livekitUrl, token)

      roomRef.current = room
      setConnectionState('connected')
      updateRemoteParticipants()
    } catch (err) {
      console.error('LiveKit connection error:', err)
      setError('Erro ao conectar ao servidor de vídeo. Tente novamente.')
      setConnectionState('error')
    }
  }, [isConfigured, updateRemoteParticipants])

  // Publish local tracks
  const publishLocalTracks = useCallback(async (video: boolean, audio: boolean) => {
    if (!roomRef.current) {
      setError('Não conectado a uma sala')
      return
    }

    try {
      const tracks = await createLocalTracks({
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
        video: video ? { resolution: { width: 640, height: 480 }, facingMode: 'user' } : false,
      })

      for (const track of tracks) {
        await roomRef.current.localParticipant.publishTrack(track)
        if (track.kind === Track.Kind.Video) {
          setLocalVideoTrack(track)
        } else if (track.kind === Track.Kind.Audio) {
          setLocalAudioTrack(track)
        }
      }
    } catch (err) {
      console.error('Error publishing tracks:', err)
      setError('Erro ao publicar câmera/microfone.')
    }
  }, [])

  // Unpublish local tracks
  const unpublishLocalTracks = useCallback(() => {
    if (!roomRef.current) return

    const localParticipant = roomRef.current.localParticipant
    localParticipant.trackPublications.forEach((pub: LocalTrackPublication) => {
      if (pub.track) {
        localParticipant.unpublishTrack(pub.track)
        pub.track.stop()
      }
    })

    setLocalVideoTrack(null)
    setLocalAudioTrack(null)
  }, [])

  // Disconnect
  const disconnect = useCallback(() => {
    if (roomRef.current) {
      unpublishLocalTracks()
      roomRef.current.disconnect()
      roomRef.current = null
    }
    setConnectionState('disconnected')
    setRemoteParticipants([])
    setError(null)
  }, [unpublishLocalTracks])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
        roomRef.current = null
      }
    }
  }, [])

  return {
    isConfigured,
    connectionState,
    connectToRoom,
    publishLocalTracks,
    unpublishLocalTracks,
    disconnect,
    localVideoTrack,
    localAudioTrack,
    remoteParticipants,
    error,
    room: roomRef.current,
  }
}
