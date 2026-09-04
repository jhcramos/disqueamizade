import { useEffect } from 'react'
import { useTracks, VideoTrack, useParticipants } from '@livekit/components-react'
import { VideoOff, Eye } from 'lucide-react'
import { track as analytics } from '@/services/analytics'
import { siteUrl } from '@/config/site'

interface Props {
  roomId: string
  /** identity -> nome de exibição (vem da presença do chat) */
  names: Map<string, string>
  localIdentity: string
  onReport?: (identity: string, name: string) => void
  onBlock?: (identity: string, name: string) => void
  blocked: Set<string>
}

/**
 * Grid de vídeo das câmeras publicando. Espectadores não geram tile.
 * Dispara `room_first_remote_seen` na primeira câmera remota vista.
 */
export const RoomVideoGrid = ({ roomId, names, localIdentity, onReport, onBlock, blocked }: Props) => {
  // 'camera' em vez de Track.Source.Camera: os tipos do namespace não resolvem
  // neste bundle, mas o valor em runtime é o mesmo.
  const cameraTracks = useTracks(['camera' as any], { onlySubscribed: false })
  const participants = useParticipants()

  const remoteCameras = cameraTracks.filter(
    (t) => t.participant.identity !== localIdentity && !blocked.has(t.participant.identity),
  )
  const spectators = participants.length - cameraTracks.length

  useEffect(() => {
    if (remoteCameras.length > 0) analytics('room_first_remote_seen', { room: roomId })
    // dispara uma vez por montagem quando aparece a primeira câmera remota
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteCameras.length > 0])

  const cols = remoteCameras.length <= 1 ? 1 : remoteCameras.length <= 4 ? 2 : 3

  return (
    <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
      {remoteCameras.length === 0 ? (
        <EmptyStage roomId={roomId} spectators={spectators} />
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {remoteCameras.map((trackRef) => {
            const id = trackRef.participant.identity
            const name = names.get(id) || 'Alguém'
            return (
              <div key={trackRef.participant.sid + trackRef.publication.trackSid} className="group relative rounded-2xl overflow-hidden bg-dark-900 border border-white/5 aspect-[4/3]">
                <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate">{name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onReport && (
                      <button onClick={() => onReport(id, name)} title="Denunciar" className="px-2 py-0.5 rounded bg-red-500/30 text-red-200 text-[10px] font-bold">Denunciar</button>
                    )}
                    {onBlock && (
                      <button onClick={() => onBlock(id, name)} title="Bloquear" className="px-2 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-bold">Bloquear</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {spectators > 0 && remoteCameras.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-dark-400">
          <Eye className="w-3.5 h-3.5" /> {spectators} assistindo sem câmera
        </div>
      )}
    </div>
  )
}

const EmptyStage = ({ roomId, spectators }: { roomId: string; spectators: number }) => {
  const shareUrl = siteUrl(`/sala/${roomId}`)
  const wa = `https://wa.me/?text=${encodeURIComponent(`Bora conversar no Disque Amizade? ${shareUrl}`)}`
  return (
    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <VideoOff className="w-7 h-7 text-dark-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">
        {spectators > 1 ? 'Ninguém ligou a câmera ainda' : 'Você é a primeira pessoa aqui'}
      </h3>
      <p className="text-dark-400 text-sm max-w-sm mb-6">
        Ligue sua câmera para começar, ou chame alguém. Horário mais movimentado: das 20h às 23h.
      </p>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors">
        Chamar alguém pelo WhatsApp
      </a>
    </div>
  )
}
