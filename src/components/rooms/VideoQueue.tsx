import { useState, useCallback } from 'react'
import { ThumbsUp, ThumbsDown, Trash2, Plus, Link2, Search, X, ListMusic } from 'lucide-react'
import type { Video } from './YouTubePlayer'

// ─── Starter Playlists ───
const STARTER_PLAYLISTS: Record<string, Video[]> = {
  default: [
    { id: 'xT8HIiFQ8Y0', title: 'Aquarela', artist: 'Toquinho' },
    { id: 'KJzBxJ8ExRk', title: 'Garota de Ipanema', artist: 'Tom Jobim & Vinícius' },
    { id: 'ePjtnSPFWK8', title: 'Evidências', artist: 'Chitãozinho & Xororó' },
    { id: 'cXelMzaCmiQ', title: 'Mas Que Nada', artist: 'Sergio Mendes' },
    { id: 'OR74idpsweg', title: 'Anunciação', artist: 'Alceu Valença' },
    { id: 'sfixHYBWaiU', title: 'Pais e Filhos', artist: 'Legião Urbana' },
    { id: 'iojYDSjKK00', title: 'Fico Assim Sem Você', artist: 'Adriana Calcanhotto' },
    { id: 'RkkGVgOqPuM', title: 'Trem das Onze', artist: 'Adoniran Barbosa' },
  ],
  drinks: [
    { id: 'ePjtnSPFWK8', title: 'Cerveja', artist: 'Skank' },
    { id: '0fBOX7Ip830', title: 'Não Deixe o Samba Morrer', artist: 'Alcione' },
    { id: 'y68mlZ6X2v0', title: 'Que País É Este', artist: 'Legião Urbana' },
  ],
  cities: [
    { id: 't4pl079t548', title: 'Sampa', artist: 'Caetano Veloso' },
    { id: '_2tZa12-CYw', title: 'Eduardo e Mônica', artist: 'Legião Urbana' },
    { id: '2ZZ-LSIwKYc', title: 'Pela Internet', artist: 'Gilberto Gil' },
  ],
  interests: [
    { id: 'HrxX9TBj2zY', title: 'Another Brick in the Wall', artist: 'Pink Floyd' },
    { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen' },
    { id: 'hTWKbfoikeg', title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
  ],
  eletronica: [
    { id: '_ovdm2yX4MA', title: 'Levels', artist: 'Avicii' },
    { id: 'gCYcHz2k5x0', title: 'Animals', artist: 'Martin Garrix' },
    { id: 'IcrbM1l_BoI', title: 'Wake Me Up', artist: 'Avicii' },
    { id: 'JRfuAukYTKg', title: 'Titanium', artist: 'David Guetta ft. Sia' },
    { id: 'tKi9Z-f6qX4', title: 'Strobe', artist: 'Deadmau5' },
    { id: 'y6120QOlsfU', title: 'Sandstorm', artist: 'Darude' },
    { id: '1y6smkh6c-0', title: "Don't You Worry Child", artist: 'Swedish House Mafia' },
    { id: 'OPf0YbXqDm0', title: 'Uptown Funk (Remix)', artist: 'Mark Ronson ft. Bruno Mars' },
    { id: 'ebXbLfLACGM', title: 'Summer', artist: 'Calvin Harris' },
    { id: 'WSeNSzJ2-Jw', title: 'Scary Monsters and Nice Sprites', artist: 'Skrillex' },
    { id: 'P8JEm4d6Wu4', title: 'Insomnia', artist: 'Faithless' },
    { id: 'LKYPYj2XX80', title: 'Around the World', artist: 'Daft Punk' },
  ],
}

// ─── Extract YouTube Video ID ───
function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = input.match(p)
    if (m) return m[1]
  }
  return null
}

// ─── Video Queue Component ───
interface VideoQueueProps {
  queue: Video[]
  currentVideo: Video | null
  currentUserId?: string
  onAddVideo: (video: Video) => void
  onRemoveVideo: (index: number) => void
  onVote: (index: number, direction: 'up' | 'down') => void
  onClose: () => void
  roomCategory?: string
}

export const VideoQueue = ({
  queue,
  currentVideo,
  currentUserId,
  onAddVideo,
  onRemoveVideo,
  onVote,
  onClose,
  roomCategory,
}: VideoQueueProps) => {
  const [urlInput, setUrlInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions = STARTER_PLAYLISTS[roomCategory || ''] || STARTER_PLAYLISTS.default

  const handleAddUrl = useCallback(async () => {
    const input = urlInput.trim()
    if (!input) return

    const videoId = extractVideoId(input)
    if (!videoId) {
      setError('URL inválida. Cole um link do YouTube.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
      const data = await res.json()

      onAddVideo({
        id: videoId,
        title: data.title || `Vídeo ${videoId}`,
        artist: data.author_name || 'YouTube',
        addedBy: currentUserId || 'Você',
        votes: 0,
      })
      setUrlInput('')
    } catch {
      // Fallback: add with just the ID
      onAddVideo({
        id: videoId,
        title: `Vídeo ${videoId}`,
        artist: 'YouTube',
        addedBy: currentUserId || 'Você',
        votes: 0,
      })
      setUrlInput('')
    }
    setIsLoading(false)
  }, [urlInput, currentUserId, onAddVideo])

  const handleAddSuggestion = (video: Video) => {
    onAddVideo({ ...video, addedBy: currentUserId || 'Você', votes: 0 })
    setShowSuggestions(false)
  }

  return (
    <div className="flex flex-col h-full bg-dark-900/95 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-pink-500/20">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-bold text-white">🎬 Fila de Vídeos</h3>
          <span className="text-[10px] text-dark-500 bg-dark-800 px-1.5 py-0.5 rounded-full">{queue.length}</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Add Video */}
      <div className="p-3 border-b border-white/5">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-500" />
            <input
              type="text"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
              placeholder="Cole um link do YouTube..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-dark-500 text-xs focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-pink-500/20 transition-all"
            />
          </div>
          <button
            onClick={handleAddUrl}
            disabled={isLoading || !urlInput.trim()}
            className="px-3 py-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 hover:bg-pink-500/30 transition-all text-xs font-semibold disabled:opacity-30 flex items-center gap-1"
          >
            {isLoading ? '...' : <><Plus className="w-3.5 h-3.5" /> Adicionar</>}
          </button>
        </div>
        {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}

        {/* Suggestions toggle */}
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="mt-2 flex items-center gap-1.5 text-[10px] text-dark-400 hover:text-pink-400 transition-colors"
        >
          <Search className="w-3 h-3" />
          {showSuggestions ? 'Esconder sugestões' : 'Ver sugestões de músicas'}
        </button>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="border-b border-white/5 max-h-40 overflow-y-auto">
          <div className="p-2 space-y-1">
            {suggestions.map((video) => {
              const alreadyInQueue = queue.some(q => q.id === video.id) || currentVideo?.id === video.id
              return (
                <button
                  key={video.id}
                  onClick={() => !alreadyInQueue && handleAddSuggestion(video)}
                  disabled={alreadyInQueue}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors text-left ${
                    alreadyInQueue ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/default.jpg`}
                    alt=""
                    className="w-10 h-8 rounded object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{video.title}</p>
                    <p className="text-[10px] text-dark-500 truncate">{video.artist}</p>
                  </div>
                  {!alreadyInQueue && <Plus className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Now Playing */}
      {currentVideo && (
        <div className="p-3 border-b border-pink-500/10 bg-pink-500/[0.03]">
          <p className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider mb-1.5">▶️ Tocando agora</p>
          <div className="flex items-center gap-2.5">
            <img
              src={`https://img.youtube.com/vi/${currentVideo.id}/default.jpg`}
              alt=""
              className="w-12 h-9 rounded object-cover flex-shrink-0 border border-pink-500/30"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentVideo.title}</p>
              <p className="text-[10px] text-dark-400 truncate">{currentVideo.artist}</p>
            </div>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-dark-500 text-xs">Fila vazia</p>
            <p className="text-dark-600 text-[10px] mt-1">Adicione vídeos acima ou escolha das sugestões</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {queue.map((video, i) => (
              <div key={`${video.id}-${i}`} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] transition-colors group">
                <span className="text-[10px] text-dark-600 w-4 text-center flex-shrink-0">{i + 1}</span>
                <img
                  src={`https://img.youtube.com/vi/${video.id}/default.jpg`}
                  alt=""
                  className="w-10 h-8 rounded object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{video.title}</p>
                  <p className="text-[10px] text-dark-500 truncate">
                    {video.artist}{video.addedBy ? ` • ${video.addedBy}` : ''}
                  </p>
                </div>

                {/* Votes */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => onVote(i, 'up')} className="p-1 rounded text-dark-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-dark-400 min-w-[16px] text-center">{video.votes || 0}</span>
                  <button onClick={() => onVote(i, 'down')} className="p-1 rounded text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Remove (own only) */}
                {video.addedBy === (currentUserId || 'Você') && (
                  <button onClick={() => onRemoveVideo(i)} className="p-1 rounded text-dark-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Neon bottom */}
      <div className="h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-60" />
    </div>
  )
}

export { STARTER_PLAYLISTS }
