import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { VideoQueue, STARTER_PLAYLISTS } from './VideoQueue'
import { YouTubePlayer, duckYouTubeVolume } from './YouTubePlayer'
import type { Video } from './YouTubePlayer'

// Re-export Song type for backward compat
export type Song = Video

// ─── Equalizer Bars (for toggle button) ───
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
      @keyframes eq-bar { 0% { height: 4px; } 100% { height: 16px; } }
    `}</style>
  </div>
)

// ─── Main Jukebox Component (YouTube-powered) ───
interface JukeboxProps {
  roomCategory?: string
  volume: number
  onVolumeChange: (v: number) => void
  onSongChange?: (song: Song) => void
  isOpen: boolean
  onToggle: () => void
  // New: queue panel
  queue?: Video[]
  currentVideo?: Video | null
  onAddVideo?: (video: Video) => void
  onRemoveVideo?: (index: number) => void
  onVote?: (index: number, direction: 'up' | 'down') => void
  currentUserId?: string
}

export const Jukebox = ({ roomCategory, isOpen, onToggle, queue, currentVideo, onAddVideo, onRemoveVideo, onVote, currentUserId }: JukeboxProps) => {
  const [showQueue, setShowQueue] = useState(false)

  return (
    <>
      {/* Toggle Button in header */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          isOpen
            ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
            : 'bg-white/[0.06] text-dark-400 border border-white/10 hover:text-white hover:bg-white/[0.1]'
        }`}
      >
        <span>🎬</span>
        <span className="hidden sm:inline">Vídeos</span>
        <EqualizerBars playing={isOpen && !!currentVideo} />
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Queue toggle sub-button (when jukebox is open) */}
      {isOpen && (
        <button
          onClick={() => setShowQueue(!showQueue)}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
            showQueue
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-white/[0.04] text-dark-500 border border-white/5 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          📋 Fila ({queue?.length || 0})
        </button>
      )}

      {/* Queue Panel */}
      {isOpen && showQueue && (
        <div className="fixed inset-0 z-50 md:absolute md:inset-auto md:top-full md:right-0">
          <div className="md:hidden absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQueue(false)} />
          <div className="absolute bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:mt-2 md:w-80 h-[60vh] md:h-[500px] rounded-t-2xl md:rounded-2xl overflow-hidden z-50 border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.15)]">
            <VideoQueue
              queue={queue || []}
              currentVideo={currentVideo || null}
              currentUserId={currentUserId}
              onAddVideo={onAddVideo || (() => {})}
              onRemoveVideo={onRemoveVideo || (() => {})}
              onVote={onVote || (() => {})}
              onClose={() => setShowQueue(false)}
              roomCategory={roomCategory}
            />
          </div>
        </div>
      )}
    </>
  )
}

// Re-export everything
export { STARTER_PLAYLISTS, YouTubePlayer, duckYouTubeVolume, VideoQueue }
export type { Video }
