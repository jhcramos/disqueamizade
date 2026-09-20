import { useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useLocalParticipant,
  useRoomContext,
  useTracks,
} from '@livekit/components-react'
import {
  createLocalVideoTrack,
  LocalVideoTrack,
  RemoteTrackPublication,
  RoomEvent,
  Track,
  VideoQuality,
} from 'livekit-client'
import { Camera, Mic, MicOff, VideoOff, X } from 'lucide-react'
import { communityAction } from '@/services/supabase/communityRooms'

type Props = { slug: string; threadId?: string; blocked: string[] }
export default function CommunityVideo({ slug, threadId, blocked }: Props) {
  const [connection, setConnection] = useState<{
    token: string
    url: string
  } | null>(null)
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  async function connect() {
    setBusy(true)
    setError('')
    try {
      const data = await communityAction<{ token: string; url: string }>(
        'video-token',
        { slug, threadId },
      )
      if (alive.current) setConnection(data)
    } catch (e) {
      if (alive.current) setError((e as Error).message)
    } finally {
      if (alive.current) setBusy(false)
    }
  }
  if (!connection)
    return (
      <section className="cam-dock" aria-label="Câmeras">
        <div className="cam-dock-head">
          <div>
            <strong>{threadId ? 'Câmera reservada' : 'Câmeras da sala'}</strong>
            <span>Uma câmera em destaque. Você escolhe quem acompanhar.</span>
          </div>
          <button disabled={busy} onClick={() => void connect()}>
            {busy ? 'Conectando…' : 'Abrir câmeras'}
          </button>
        </div>
        <div className="cam-spotlight-body">
          <Camera size={32} />
          <strong>O papo também acontece cara a cara.</strong>
          <p>
            Entre para assistir. Sua câmera e seu microfone começam desligados.
          </p>
        </div>
        {error && <p role="alert">{error}</p>}
      </section>
    )
  return (
    <LiveKitRoom
      token={connection.token}
      serverUrl={connection.url}
      connect
      video={false}
      audio={false}
      options={{
        adaptiveStream: false,
        dynacast: true,
        publishDefaults: { simulcast: true },
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720, frameRate: 24 },
        },
      }}
      connectOptions={{ autoSubscribe: false }}
      onError={(e) => setError(e.message)}
      onDisconnected={() => setConnection(null)}
    >
      <VideoStage
        blocked={blocked}
        privateCall={!!threadId}
        onClose={() => setConnection(null)}
      />
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
    </LiveKitRoom>
  )
}
function VideoStage({
  blocked,
  privateCall,
  onClose,
}: {
  blocked: string[]
  privateCall: boolean
  onClose: () => void
}) {
  const room = useRoomContext()
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled } =
    useLocalParticipant()
  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  }).filter(
    (t) => !blocked.includes(t.participant.identity) && !t.publication.isMuted,
  )
  const [selected, setSelected] = useState(''),
    [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [listening, setListening] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<LocalVideoTrack | null>(null)
  const previewRef = useRef<HTMLVideoElement>(null),
    previewDialog = useRef<HTMLDialogElement>(null),
    stageRef = useRef<HTMLElement>(null),
    pendingTrack = useRef<LocalVideoTrack | null>(null),
    alive = useRef(true)
  const focus =
    tracks.find((t) => t.participant.identity === selected) || tracks[0]
  const others = tracks.filter((t) => t !== focus),
    pages = Math.max(1, Math.ceil(others.length / 4))
  const thumbnails = others.slice(
    Math.min(page, pages - 1) * 4,
    Math.min(page, pages - 1) * 4 + 4,
  )
  const visibleIds = [focus, ...thumbnails]
    .filter(Boolean)
    .map((t) => t!.participant.identity)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      pendingTrack.current?.stop()
    }
  }, [])
  useEffect(() => {
    const node = previewRef.current
    if (preview) previewDialog.current?.showModal()
    if (preview && node) preview.attach(node)
    return () => {
      if (preview && node) preview.detach(node)
    }
  }, [preview])
  useEffect(() => {
    const intersecting = new Set<string>()
    function update() {
      room.remoteParticipants.forEach((p) =>
        p.trackPublications.forEach((pub) => {
          const camera = pub.source === Track.Source.Camera
          const visible =
            !document.hidden &&
            !blocked.includes(p.identity) &&
            (camera
              ? visibleIds.includes(p.identity) && intersecting.has(p.identity)
              : listening && p.identity === focus?.participant.identity)
          pub.setSubscribed(visible)
          if (camera && visible && pub instanceof RemoteTrackPublication)
            pub.setVideoQuality(
              p.identity === focus?.participant.identity
                ? VideoQuality.HIGH
                : VideoQuality.LOW,
            )
        }),
      )
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const identity = (entry.target as HTMLElement).dataset.cameraIdentity
          if (!identity) return
          if (entry.isIntersecting) intersecting.add(identity)
          else intersecting.delete(identity)
        })
        update()
      },
      { threshold: 0.1 },
    )
    stageRef.current
      ?.querySelectorAll('[data-camera-identity]')
      .forEach((node) => observer.observe(node))
    update()
    room.on(RoomEvent.TrackPublished, update)
    room.on(RoomEvent.TrackUnpublished, update)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer.disconnect()
      room.off(RoomEvent.TrackPublished, update)
      room.off(RoomEvent.TrackUnpublished, update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [
    room,
    visibleIds.join(','),
    focus?.participant.identity,
    listening,
    blocked.join(','),
    tracks.length,
  ])
  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch {
      setError(
        'Não foi possível acessar a câmera ou o microfone. Confira a permissão do navegador.',
      )
    } finally {
      if (alive.current) setBusy(false)
    }
  }
  async function prepare() {
    const old = localParticipant.getTrackPublication(Track.Source.Camera)?.track
    if (old) await localParticipant.unpublishTrack(old, true)
    const track = await createLocalVideoTrack({
      resolution: { width: 1280, height: 720, frameRate: 24 },
    })
    if (!alive.current) {
      track.stop()
      return
    }
    pendingTrack.current = track
    setPreview(track)
  }
  function cancelPreview() {
    pendingTrack.current?.stop()
    pendingTrack.current = null
    setPreview(null)
  }
  async function publish() {
    if (!preview) return
    await localParticipant.publishTrack(preview, {
      source: Track.Source.Camera,
      simulcast: true,
    })
    if (!alive.current || pendingTrack.current !== preview) {
      await localParticipant.unpublishTrack(preview, true)
      preview.stop()
      return
    }
    pendingTrack.current = null
    setPreview(null)
  }
  return (
    <section
      ref={stageRef}
      className={'cam-dock ' + (expanded ? 'expanded' : '')}
      aria-label="Câmeras conectadas"
    >
      <RoomAudioRenderer />
      <div className="cam-dock-head">
        <div>
          <strong>
            {privateCall ? 'Vídeo só entre vocês' : 'Câmeras da sala'} ·{' '}
            {tracks.length}
          </strong>
          <span>Toque em uma miniatura para colocar em destaque.</span>
        </div>
        <div>
          <button
            aria-pressed={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Reduzir' : 'Ampliar'}
          </button>
          <button
            disabled={busy}
            onClick={() =>
              void run(
                isCameraEnabled
                  ? async () => {
                      const track = localParticipant.getTrackPublication(
                        Track.Source.Camera,
                      )?.track
                      if (track)
                        await localParticipant.unpublishTrack(track, true)
                    }
                  : prepare,
              )
            }
          >
            {isCameraEnabled ? <VideoOff size={15} /> : <Camera size={15} />}{' '}
            {isCameraEnabled ? 'Desligar' : 'Minha câmera'}
          </button>
          <button aria-label="Fechar câmeras" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
      </div>
      <div className="cam-spotlight-layout">
        <div className="cam-spotlight">
          <div className="cam-spotlight-top">
            <strong>
              {focus?.participant.name || 'A primeira câmera pode ser a sua'}
            </strong>
            <span>{focus ? 'AO VIVO' : 'SEM CÂMERAS'}</span>
          </div>
          <div
            className="community-main-video"
            data-camera-identity={focus?.participant.identity}
          >
            {focus ? (
              <VideoTrack trackRef={focus} />
            ) : (
              <>
                <Camera size={32} />
                <p>Continue conversando ou abra sua câmera.</p>
              </>
            )}
          </div>
          <div className="cam-spotlight-footer">
            <button onClick={() => setListening(!listening)}>
              {listening ? 'Silenciar áudio' : 'Ouvir câmera selecionada'}
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void run(() =>
                  localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled),
                )
              }
            >
              {isMicrophoneEnabled ? <Mic size={15} /> : <MicOff size={15} />}{' '}
              {isMicrophoneEnabled ? 'Desligar mic' : 'Ligar mic'}
            </button>
          </div>
        </div>
        <div className="cam-thumbnails">
          {thumbnails.map((t) => (
            <button
              key={t.participant.identity}
              data-camera-identity={t.participant.identity}
              onClick={() => setSelected(t.participant.identity)}
              aria-label={'Destacar ' + t.participant.name}
            >
              <VideoTrack trackRef={t} />
              <strong>{t.participant.name || 'Participante'}</strong>
            </button>
          ))}
          {pages > 1 && (
            <button onClick={() => setPage((page + 1) % pages)}>
              Mais câmeras · {Math.min(page, pages - 1) + 1}/{pages}
            </button>
          )}
          <p>
            Sua transmissão: {isCameraEnabled ? 'ligada' : 'desligada'}.
            Microfone: {isMicrophoneEnabled ? 'ligado' : 'desligado'}.
          </p>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      {preview && (
        <dialog
          ref={previewDialog}
          className="community-preview-dialog"
          onCancel={cancelPreview}
          aria-label="Prévia da câmera"
        >
          <div className="community-modal">
            <h2>Antes de entrar em cena</h2>
            <p>
              {privateCall
                ? 'Apenas a outra pessoa receberá sua câmera.'
                : 'Todos que entrarem nas câmeras desta sala poderão ver você.'}{' '}
              O microfone continua no estado que você escolheu.
            </p>
            <video ref={previewRef} autoPlay muted playsInline />
            <div>
              <button onClick={cancelPreview}>Cancelar</button>
              <button
                disabled={busy}
                className="primary"
                onClick={() => void run(publish)}
              >
                Transmitir minha câmera
              </button>
            </div>
          </div>
        </dialog>
      )}
    </section>
  )
}
