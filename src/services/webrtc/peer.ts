import { supabase } from '@/services/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

type PeerCallback = {
  onRemoteStream: (userId: string, stream: MediaStream) => void
  onPeerDisconnect: (userId: string) => void
}

class WebRTCRoom {
  private channel: RealtimeChannel | null = null
  private peers: Map<string, RTCPeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private userId: string = ''
  private callbacks: PeerCallback | null = null

  async join(
    roomId: string,
    userId: string,
    localStream: MediaStream,
    callbacks: PeerCallback,
  ) {
    this.leave()
    this.userId = userId
    this.localStream = localStream
    this.callbacks = callbacks

    console.log('[WebRTC] Joining room:', roomId, 'as:', userId.slice(0, 8))

    this.channel = supabase.channel(`webrtc:${roomId}`, {
      config: { presence: { key: userId } },
    })

    this.channel
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        if (payload.to !== this.userId) return
        this.handleSignal(payload.from, payload.data)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        for (const p of newPresences as any[]) {
          const peerId = p.user_id
          if (peerId && peerId !== this.userId && !this.peers.has(peerId)) {
            console.log('[WebRTC] Peer joined:', peerId.slice(0, 8))
            this.createPeer(peerId)
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const p of leftPresences as any[]) {
          if (p.user_id) this.removePeer(p.user_id)
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState()
        for (const [key, presences] of Object.entries(state)) {
          // key is the presence key (userId)
          const peerId = (presences as any[])[0]?.user_id || key
          if (peerId !== this.userId && !this.peers.has(peerId)) {
            console.log('[WebRTC] Sync found peer:', peerId.slice(0, 8))
            this.createPeer(peerId)
          }
        }
      })
      .subscribe(async (status) => {
        console.log('[WebRTC] Channel status:', status)
        if (status === 'SUBSCRIBED') {
          await this.channel!.track({ user_id: this.userId, joined_at: Date.now() })
        }
      })
  }

  private createPeer(peerId: string) {
    if (this.peers.has(peerId)) return

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    this.peers.set(peerId, pc)

    // Polite peer = higher ID (yields on collision)
    const polite = this.userId > peerId
    let makingOffer = false
    let ignoreOffer = false

    // Add local tracks
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream)
      }
    }

    // Remote tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC] Got remote track from:', peerId.slice(0, 8))
      const [stream] = event.streams
      if (stream) this.callbacks?.onRemoteStream(peerId, stream)
    }

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send(peerId, { type: 'candidate', candidate: event.candidate.toJSON() })
      }
    }

    // Negotiation needed — impolite peer (lower ID) always offers
    pc.onnegotiationneeded = async () => {
      try {
        makingOffer = true
        await pc.setLocalDescription()
        this.send(peerId, { type: 'offer', sdp: pc.localDescription!.toJSON() })
      } catch (err) {
        console.error('[WebRTC] Offer error:', err)
      } finally {
        makingOffer = false
      }
    }

    // Connection state
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', peerId.slice(0, 8), pc.connectionState)
      if (pc.connectionState === 'failed') {
        this.removePeer(peerId)
      }
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce()
      }
    }

    // Store handler for incoming signals
    ;(pc as any)._handleSignal = async (data: any) => {
      try {
        if (data.type === 'offer') {
          const offerCollision = makingOffer || pc.signalingState !== 'stable'
          ignoreOffer = !polite && offerCollision
          if (ignoreOffer) return

          await pc.setRemoteDescription(data.sdp)
          await pc.setLocalDescription()
          this.send(peerId, { type: 'answer', sdp: pc.localDescription!.toJSON() })

        } else if (data.type === 'answer') {
          await pc.setRemoteDescription(data.sdp)

        } else if (data.type === 'candidate') {
          try {
            await pc.addIceCandidate(data.candidate)
          } catch (err) {
            if (!ignoreOffer) console.warn('[WebRTC] ICE error:', err)
          }
        }
      } catch (err) {
        console.error('[WebRTC] Signal handling error:', err)
      }
    }
  }

  private handleSignal(from: string, data: any) {
    // Create peer if we don't have one yet (they offered first)
    if (!this.peers.has(from)) {
      console.log('[WebRTC] Creating peer on signal from:', from.slice(0, 8))
      this.createPeer(from)
    }
    const pc = this.peers.get(from)
    if (pc && (pc as any)._handleSignal) {
      (pc as any)._handleSignal(data)
    }
  }

  private send(to: string, data: any) {
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
    this.callbacks?.onPeerDisconnect(peerId)
  }

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

  leave() {
    for (const [peerId] of this.peers) {
      this.removePeer(peerId)
    }
    this.peers.clear()
    if (this.channel) {
      this.channel.untrack()
      supabase.removeChannel(this.channel)
      this.channel = null
    }
  }

  getPeerCount() { return this.peers.size }
}

export const webrtcRoom = new WebRTCRoom()
