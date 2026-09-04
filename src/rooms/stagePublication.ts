/** Controle de publicação com cancelamento, inclusive durante await publishTrack. */
type Participant = {
  publishTrack: (track: MediaStreamTrack, options: { source: string }) => Promise<{ track?: unknown }>
  unpublishTrack: (track: any, stopOnUnpublish?: boolean) => unknown
}
export class StagePublication {
  private revision = 0
  private tracks: MediaStreamTrack[] = []
  private publications: { track?: unknown }[] = []
  constructor(private participant: Participant) {}
  async start(stream: MediaStream, audio: MediaStreamTrack | undefined, approved: boolean): Promise<boolean> {
    if (!approved) return false
    const revision = ++this.revision
    const video = stream.getVideoTracks()[0]
    if (!video || video.readyState === 'ended') return false
    this.tracks = audio ? [video, audio] : [video]
    video.enabled = true
    try {
      for (const [track, source] of [[video, 'camera'], [audio, 'microphone']] as const) {
        if (!track || revision !== this.revision) break
        const publication = await this.participant.publishTrack(track, { source })
        if (revision !== this.revision) {
          if (publication.track) await this.participant.unpublishTrack(publication.track, false)
          return false
        }
        this.publications.push(publication)
      }
      return revision === this.revision
    } catch (error) { this.cancel(); throw error }
  }
  cancel() {
    ++this.revision
    for (const track of this.tracks) track.enabled = false
    for (const publication of this.publications) if (publication.track) void this.participant.unpublishTrack(publication.track, false)
    this.publications = []
  }
}
