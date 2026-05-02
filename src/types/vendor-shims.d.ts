// Temporary vendor type shims.
// The installed npm tarballs for @supabase/auth-js and livekit-client currently
// include .d.ts.map files but not the referenced .d.ts files, which breaks tsc.
// Keep these intentionally minimal: they cover only the APIs this app uses.

declare module '@supabase/auth-js' {
  export interface User {
    id: string
    email?: string
    user_metadata?: Record<string, any>
    [key: string]: any
  }

  export interface Session {
    access_token: string
    refresh_token?: string
    user: User
    [key: string]: unknown
  }

  export type AuthChangeEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'PASSWORD_RECOVERY' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | string

  export interface AuthResponse<T = unknown> {
    data: T
    error: Error | null
  }

  export class AuthClient {
    constructor(options?: Record<string, unknown>)
    signUp(credentials: unknown): Promise<AuthResponse<{ user: User | null; session: Session | null }>>
    signInWithPassword(credentials: unknown): Promise<AuthResponse<{ user: User | null; session: Session | null }>>
    signInWithOAuth(credentials: unknown): Promise<AuthResponse<unknown>>
    signOut(): Promise<{ error: Error | null }>
    getSession(): Promise<AuthResponse<{ session: Session | null }>>
    setSession(session: { access_token: string; refresh_token: string }): Promise<AuthResponse<{ session: Session | null; user: User | null }>>
    refreshSession(session?: { refresh_token?: string }): Promise<AuthResponse<{ session: Session | null; user: User | null }>>
    getUser(jwt?: string): Promise<AuthResponse<{ user: User | null }>>
    updateUser(attributes: Record<string, unknown>): Promise<AuthResponse<{ user: User | null }>>
    resetPasswordForEmail(email: string, options?: Record<string, unknown>): Promise<{ data: unknown; error: Error | null }>
    onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): { data: { subscription: { unsubscribe: () => void } } }
  }

  export { AuthClient as GoTrueClient }
}

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
