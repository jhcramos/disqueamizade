import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipForward, Volume2, ChevronDown, ChevronUp, Heart, Flame, Moon } from 'lucide-react'

// ─── Types ───
interface Song {
  title: string
  artist: string
  duration: string
  cover: string
}

// ─── Playlists ───
const ROOM_PLAYLISTS: Record<string, Song[]> = {
  default: [
    { title: 'Aquarela', artist: 'Toquinho', duration: '4:20', cover: '🎨' },
    { title: 'Garota de Ipanema', artist: 'Tom Jobim', duration: '3:45', cover: '🏖️' },
    { title: 'Evidências', artist: 'Chitãozinho & Xororó', duration: '4:55', cover: '💔' },
    { title: 'Ai Se Eu Te Pego', artist: 'Michel Teló', duration: '2:52', cover: '💃' },
    { title: 'Mas Que Nada', artist: 'Sergio Mendes', duration: '3:10', cover: '🎶' },
    { title: 'Anunciação', artist: 'Alceu Valença', duration: '4:30', cover: '☀️' },
    { title: 'Como É Grande o Meu Amor Por Você', artist: 'Roberto Carlos', duration: '3:55', cover: '❤️' },
    { title: 'Pais e Filhos', artist: 'Legião Urbana', duration: '5:08', cover: '👨‍👧' },
  ],
  cities: [
    { title: 'Sampa', artist: 'Caetano Veloso', duration: '4:15', cover: '🏙️' },
    { title: 'Cidade Maravilhosa', artist: 'André Filho', duration: '3:20', cover: '🌊' },
    { title: 'Pela Internet', artist: 'Gilberto Gil', duration: '3:45', cover: '💻' },
    { title: 'Eduardo e Mônica', artist: 'Legião Urbana', duration: '5:30', cover: '🌆' },
    { title: 'Trem das Onze', artist: 'Adoniran Barbosa', duration: '3:05', cover: '🚂' },
    { title: 'Chão de Estrelas', artist: 'Sílvio Caldas', duration: '3:40', cover: '⭐' },
  ],
  drinks: [
    { title: 'Tá na Hora do Jair, Já Ir Embora', artist: 'Blitz', duration: '3:20', cover: '🍺' },
    { title: 'Cerveja', artist: 'Skank', duration: '3:45', cover: '🍻' },
    { title: 'Saideira', artist: 'Skank', duration: '4:10', cover: '🥃' },
    { title: 'Não Deixe o Samba Morrer', artist: 'Alcione', duration: '3:55', cover: '🎤' },
    { title: 'Gostava Tanto de Você', artist: 'Tim Maia', duration: '3:40', cover: '🥂' },
  ],
  interests: [
    { title: 'Another Brick in the Wall', artist: 'Pink Floyd', duration: '6:35', cover: '🎸' },
    { title: 'Bohemian Rhapsody', artist: 'Queen', duration: '5:55', cover: '🎤' },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana', duration: '5:01', cover: '🤘' },
    { title: 'Back in Black', artist: 'AC/DC', duration: '4:15', cover: '⚡' },
  ],
  age: [
    { title: 'Detalhes', artist: 'Roberto Carlos', duration: '4:30', cover: '🌹' },
    { title: 'Fico Assim Sem Você', artist: 'Adriana Calcanhotto', duration: '3:20', cover: '💭' },
    { title: 'Sincerity', artist: 'Djavan', duration: '4:05', cover: '🎷' },
    { title: 'O Bêbado e a Equilibrista', artist: 'Elis Regina', duration: '4:45', cover: '🎭' },
  ],
}

function parseDuration(d: string): number {
  const [m, s] = d.split(':').map(Number)
  return m * 60 + s
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Equalizer Bars (CSS animation) ───
const EqualizerBars = ({ playing }: { playing: boolean }) => (
  <div className="flex items-end gap-[2px] h-4">
    {[0, 1, 2, 3, 4].map(i => (
      <div
        key={i}
        className={`w-[3px] rounded-full transition-all ${playing ? 'bg-pink-500' : 'bg-dark-600'}`}
        style={{
          height: playing ? undefined : '4px',
          animation: playing ? `eq-bar ${0.4 + i * 0.15}s ease-in-out infinite alternate` : 'none',
        }}
      />
    ))}
    <style>{`
      @keyframes eq-bar {
        0% { height: 4px; }
        100% { height: 16px; }
      }
    `}</style>
  </div>
)

// ─── Floating Reaction ───
interface FloatingEmoji {
  id: number
  emoji: string
  x: number
}

const FloatingReaction = ({ emoji, x, onDone }: { emoji: string; x: number; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      className="absolute bottom-full pointer-events-none text-xl animate-float-up"
      style={{ left: `${x}%` }}
    >
      {emoji}
      <style>{`
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.3); }
        }
        .animate-float-up { animation: float-up 2s ease-out forwards; }
      `}</style>
    </div>
  )
}

// ─── Spinning Vinyl ───
const VinylDisc = ({ playing, cover }: { playing: boolean; cover: string }) => (
  <div className={`relative w-14 h-14 flex-shrink-0 ${playing ? 'animate-spin-slow' : ''}`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-dark-800 to-dark-900 border-2 border-dark-700 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full bg-dark-950 border border-dark-600 flex items-center justify-center text-lg">
        {cover}
      </div>
      {/* Grooves */}
      <div className="absolute inset-[6px] rounded-full border border-dark-600/30" />
      <div className="absolute inset-[10px] rounded-full border border-dark-600/20" />
    </div>
    <style>{`
      @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .animate-spin-slow { animation: spin-slow 3s linear infinite; }
    `}</style>
  </div>
)

// ─── Main Jukebox Component ───
interface JukeboxProps {
  roomCategory?: string
  volume: number
  onVolumeChange: (v: number) => void
  onSongChange?: (song: Song) => void
  isOpen: boolean
  onToggle: () => void
}

export const Jukebox = ({ roomCategory, volume, onVolumeChange, onSongChange, isOpen, onToggle }: JukeboxProps) => {
  const playlist = ROOM_PLAYLISTS[roomCategory || ''] || ROOM_PLAYLISTS.default
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [skipVotes, setSkipVotes] = useState(0)
  const [reactions, setReactions] = useState<FloatingEmoji[]>([])
  const reactionIdRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const currentSong = playlist[currentIndex]
  const totalDuration = parseDuration(currentSong.duration)

  const nextSong = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % playlist.length)
    setElapsed(0)
    setSkipVotes(0)
  }, [playlist.length])

  // Song progress simulation
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev >= totalDuration) {
          nextSong()
          return 0
        }
        return prev + 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, totalDuration, nextSong])

  // Notify parent on song change
  useEffect(() => {
    onSongChange?.(currentSong)
  }, [currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const addReaction = (emoji: string) => {
    const id = ++reactionIdRef.current
    setReactions(prev => [...prev, { id, emoji, x: 20 + Math.random() * 60 }])
  }

  const removeReaction = (id: number) => {
    setReactions(prev => prev.filter(r => r.id !== id))
  }

  const handleSkipVote = () => {
    const newVotes = skipVotes + 1
    setSkipVotes(newVotes)
    if (newVotes >= 3) nextSong()
  }

  const progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          isOpen
            ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
            : 'bg-white/[0.06] text-dark-400 border border-white/10 hover:text-white hover:bg-white/[0.1]'
        }`}
      >
        <span>🎵</span>
        <span className="hidden sm:inline">Jukebox</span>
        <EqualizerBars playing={isPlaying && isOpen} />
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 rounded-2xl overflow-hidden z-50 animate-slide-down
          bg-dark-900/95 backdrop-blur-xl border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.15)]">

          {/* Neon top border */}
          <div className="h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500" />

          {/* Now Playing */}
          <div className="p-4 relative">
            {/* Floating reactions */}
            {reactions.map(r => (
              <FloatingReaction key={r.id} emoji={r.emoji} x={r.x} onDone={() => removeReaction(r.id)} />
            ))}

            <div className="flex items-center gap-3 mb-3">
              <VinylDisc playing={isPlaying} cover={currentSong.cover} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider mb-0.5">Tocando agora</p>
                <p className="text-sm font-bold text-white truncate">{currentSong.title}</p>
                <p className="text-xs text-dark-400 truncate">{currentSong.artist}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-dark-500">{formatTime(elapsed)}</span>
                <span className="text-[10px] text-dark-500">{currentSong.duration}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-xl bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleSkipVote}
                  className="p-2 rounded-xl bg-white/[0.06] text-dark-400 hover:text-white hover:bg-white/[0.1] transition-all relative"
                  title={`Pular (${skipVotes}/3 votos)`}
                >
                  <SkipForward className="w-4 h-4" />
                  {skipVotes > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-[9px] text-white flex items-center justify-center font-bold">
                      {skipVotes}
                    </span>
                  )}
                </button>
              </div>

              {/* Reactions */}
              <div className="flex items-center gap-1">
                {[
                  { emoji: '❤️', icon: <Heart className="w-3.5 h-3.5" /> },
                  { emoji: '🔥', icon: <Flame className="w-3.5 h-3.5" /> },
                  { emoji: '😴', icon: <Moon className="w-3.5 h-3.5" /> },
                ].map(({ emoji, icon }) => (
                  <button
                    key={emoji}
                    onClick={() => addReaction(emoji)}
                    className="p-1.5 rounded-lg text-dark-500 hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {/* Volume */}
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-dark-500" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={e => onVolumeChange(Number(e.target.value))}
                  className="w-16 h-1 accent-pink-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Queue */}
          <div className="border-t border-white/5 px-4 py-3">
            <p className="text-[10px] text-dark-500 font-semibold uppercase tracking-wider mb-2">Próximas</p>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
              {playlist.slice(currentIndex + 1, currentIndex + 4).concat(
                currentIndex + 4 > playlist.length ? playlist.slice(0, (currentIndex + 4) - playlist.length) : []
              ).slice(0, 3).map((song, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <span className="text-sm">{song.cover}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-dark-300 truncate">{song.title}</p>
                    <p className="text-[10px] text-dark-600 truncate">{song.artist}</p>
                  </div>
                  <span className="text-[10px] text-dark-600">{song.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Neon bottom border */}
          <div className="h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.2s ease-out; }
      `}</style>
    </div>
  )
}

export { ROOM_PLAYLISTS }
export type { Song }
