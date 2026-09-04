// Temporary LiveKit type shim retained from the existing project.
declare module 'livekit-client' {
  export enum ConnectionState {
    Connected = 'connected',
    Connecting = 'connecting',
    Reconnecting = 'reconnecting',
    Disconnected = 'disconnected',
  }

  export enum RoomEvent {
    ConnectionStateChanged = 'connectionStateChanged',
    ParticipantConnected = 'participantConnected',
    ParticipantDisconnected = 'participantDisconnected',
    TrackSubscribed = 'trackSubscribed',
    TrackUnsubscribed = 'trackUnsubscribed',
    TrackMuted = 'trackMuted',
    TrackUnmuted = 'trackUnmuted',
    Disconnected = 'disconnected',
  }

  export namespace Track {
    export enum Kind {
      Audio = 'audio',
      Video = 'video',
    }
  }

  export interface LocalTrack {
    kind: Track.Kind
    stop(): void
  }

  export interface RemoteTrack {
    kind: Track.Kind
    mediaStreamTrack: MediaStreamTrack
  }

  export interface RemoteTrackPublication {
    track?: RemoteTrack | null
  }

  export interface LocalTrackPublication {
    track?: LocalTrack | null
  }

  export interface RemoteParticipant {
    identity: string
    sid: string
    isCameraEnabled: boolean
    isMicrophoneEnabled: boolean
    trackPublications: Map<string, RemoteTrackPublication>
  }

  export interface LocalParticipant {
    trackPublications: Map<string, LocalTrackPublication>
    publishTrack(track: LocalTrack): Promise<unknown>
    unpublishTrack(track: LocalTrack): unknown
  }

  export class Room {
    constructor(options?: Record<string, unknown>)
    remoteParticipants: Map<string, RemoteParticipant>
    localParticipant: LocalParticipant
    on(event: RoomEvent, callback: (...args: any[]) => void): this
    connect(url: string, token: string): Promise<void>
    disconnect(): void
  }

  export function createLocalTracks(options: Record<string, unknown>): Promise<LocalTrack[]>
}
