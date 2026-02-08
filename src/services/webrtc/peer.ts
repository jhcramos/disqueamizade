import { supabase } from '@/services/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
]

type PeerCallback = {
  onRemoteStream: (userId: string, stream: MediaStream) => void
  onPeerDisconnect: (userId: string) => void
}

class WebRTCRoom {
  private channel: RealtimeChannel | null = null
  private peers: Map<string, RTCPeerConnection> = new Map()
  private remoteStreams: Map<string, MediaStream> = new Map()
  private localStream: MediaStream | null = null
  private userId: string = ''
  private callbacks: PeerCallback | null = null
  private makingOffer: Map<string, boolean> = new Map()

  /**
   * Join a room with video/audio
   */
  async join(
    roomId: string,
    userId: string,
    localStream: MediaStream,
    callbacks: PeerCallback,
  ) {
    this.userId = userId
    this.localStream = localStream
    this.callbacks = callbacks

    // Clean up any previous session
    this.leave()

    this.channel = supabase.channel(`webrtc:${roomId}`, {
      config: { presence: { key: userId } },
    })

    // Handle signaling messages
    this.channel
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        if (payload.to !== this.userId) return
        this.handleSignal(payload.from, payload.data)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // New user joined — if we have lower ID, we initiate the call
        for (const p of newPresences as any[]) {
          const peerId = p.user_id || Object.keys(this.channel!.presenceState()).find(k => k !== this.userId)
          if (peerId && peerId !== this.userId && !this.peers.has(peerId)) {
            // Lower ID initiates to avoid both sides offering simultaneously
            if (this.userId < peerId) {
              this.createPeerConnection(peerId, true)
            }
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const p of leftPresences as any[]) {
          const peerId = p.user_id
          if (peerId) this.removePeer(peerId)
        }
      })
      .on('presence', { event: 'sync' }, () => {
        // On initial sync, connect to all existing users
        const state = this.channel!.presenceState()
        for (const peerId of Object.keys(state)) {
          if (peerId !== this.userId && !this.peers.has(peerId)) {
            if (this.userId < peerId) {
              this.createPeerConnection(peerId, true)
            }
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel!.track({ user_id: this.userId, joined_at: Date.now() })
        }
      })
  }

  private async createPeerConnection(peerId: string, initiator: boolean) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    this.peers.set(peerId, pc)
    this.makingOffer.set(peerId, false)

    // Add local tracks
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream)
      }
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (remoteStream) {
        this.remoteStreams.set(peerId, remoteStream)
        this.callbacks?.onRemoteStream(peerId, remoteStream)
      }
    }

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, { type: 'candidate', candidate: event.candidate })
      }
    }

    // Negotiation needed (for initiator)
    pc.onnegotiationneeded = async () => {
      if (!initiator) return
      try {
        this.makingOffer.set(peerId, true)
        const offer = await pc.createOffer()
        if (pc.signalingState !== 'stable') return
        await pc.setLocalDescription(offer)
        this.sendSignal(peerId, { type: 'offer', sdp: pc.localDescription })
      } catch (err) {
        console.error('Negotiation error:', err)
      } finally {
        this.makingOffer.set(peerId, false)
      }
    }

    // Connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.removePeer(peerId)
      }
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce()
      }
    }
  }

  private async handleSignal(from: string, data: any) {
    let pc = this.peers.get(from)

    if (data.type === 'offer') {
      // Received an offer — create PC if needed (we're the receiver)
      if (!pc) {
        await this.createPeerConnection(from, false)
        pc = this.peers.get(from)!
      }

      const offerCollision = this.makingOffer.get(from) || pc.signalingState !== 'stable'
      const polite = this.userId > from // Higher ID is polite

      if (offerCollision && !polite) {
        // Impolite peer ignores incoming offer during collision
        return
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      this.sendSignal(from, { type: 'answer', sdp: pc.localDescription })

    } else if (data.type === 'answer') {
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))

    } else if (data.type === 'candidate') {
      if (!pc) return
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
      } catch (err) {
        console.warn('ICE candidate error:', err)
      }
    }
  }

  private sendSignal(to: string, data: any) {
    this.channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { from: this.userId, to, data },
    })
  }

  private removePeer(peerId: string) {
    const pc = this.peers.get(peerId)
    if (pc) {
      pc.close()
      this.peers.delete(peerId)
    }
    this.remoteStreams.delete(peerId)
    this.makingOffer.delete(peerId)
    this.callbacks?.onPeerDisconnect(peerId)
  }

  /**
   * Update local stream (e.g., camera toggled)
   */
  updateStream(stream: MediaStream) {
    this.localStream = stream
    for (const [, pc] of this.peers) {
      const senders = pc.getSenders()
      for (const track of stream.getTracks()) {
        const sender = senders.find(s => s.track?.kind === track.kind)
        if (sender) {
          sender.replaceTrack(track)
        } else {
          pc.addTrack(track, stream)
        }
      }
    }
  }

  /**
   * Leave the room and clean up all connections
   */
  leave() {
    for (const [peerId] of this.peers) {
      this.removePeer(peerId)
    }
    this.peers.clear()
    this.remoteStreams.clear()
    this.makingOffer.clear()
    if (this.channel) {
      this.channel.untrack()
      supabase.removeChannel(this.channel)
      this.channel = null
    }
  }

  getPeerCount() {
    return this.peers.size
  }

  getRemoteStreams() {
    return new Map(this.remoteStreams)
  }
}

// Singleton
export const webrtcRoom = new WebRTCRoom()
