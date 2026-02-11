import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, ChevronUp, X } from 'lucide-react'

// ─── Types ───
export interface Video {
  id: string
  title: string
  artist: string
  addedBy?: string
  votes?: number
}

// ─── Equalizer Bars ───
const EqualizerBars = ({ playing, size = 'sm' }: { playing: boolean; size?: 'sm' | 'md' }) => {
  const h = size === 'md' ? 'h-5' : 'h-4'
  const w = size === 'md' ? 'w-[3px]' : 'w-[2px]'
  return (
    <div className={`flex items-end gap-[2px] ${h}`}>
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className={`${w} rounded-full transition-all ${playing ? 'bg-pink-500' : 'bg-dark-600'}`}
          style={{
            height: playing ? undefined : '3px',
            animation: playing ? `yt-eq-bar ${0.35 + i * 0.12}s ease-in-out infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ─── VHS Scanline Overlay ───
const ScanlineOverlay = () => (
  <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]"
    style={{
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
    }}
  />
)

// ─── YouTube Player Component ───
interface YouTubePlayerProps {
  currentVideo: Video | null
  isPlaying: boolean
  volume: number
  onVolumeChange: (v: number) => void
  onPlayPause: () => void
  onSkipVote: () => void
  skipVotes: number
  onExpand: () => void
  expanded: boolean
  onMinimize: () => void
  onVideoEnd: () => void
  onVideoError: () => void
}

export const YouTubePlayer = ({
  currentVideo,
  isPlaying,
  volume,
  onVolumeChange,
  onPlayPause,
  onSkipVote,
  skipVotes,
  onExpand,
  expanded,
  onMinimize,
  onVideoEnd,
  onVideoError,
}: YouTubePlayerProps) => {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [, setIsFullscreen] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [muted, setMuted] = useState(false)

  // Load YouTube IFrame API
  useEffect(() => {
    if ((window as any).YT) return
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  }, [])

  // Create/update player when video changes
  useEffect(() => {
    if (!currentVideo) return

    const createPlayer = () => {
      if (playerRef.current) {
        try {
          playerRef.current.loadVideoById(currentVideo.id)
          return
        } catch { /* recreate */ }
      }

      playerRef.current = new (window as any).YT.Player(`yt-player-${currentVideo.id}`, {
        videoId: currentVideo.id,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            setPlayerReady(true)
            e.target.setVolume(volume)
            if (isPlaying) e.target.playVideo()
          },
          onStateChange: (e: any) => {
            if (e.data === 0) onVideoEnd() // ended
            if (e.data === -1 || e.data === 150) { // unplayable
              setTimeout(() => onVideoError(), 1000)
            }
          },
          onError: () => onVideoError(),
        },
      })
    }

    if ((window as any).YT?.Player) {
      createPlayer()
    } else {
      (window as any).onYouTubeIframeAPIReady = createPlayer
    }

    return () => {
      // Don't destroy on every video change, reuse player
    }
  }, [currentVideo?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync play/pause
  useEffect(() => {
    if (!playerRef.current?.getPlayerState) return
    try {
      if (isPlaying) playerRef.current.playVideo()
      else playerRef.current.pauseVideo()
    } catch { /* ignore */ }
  }, [isPlaying])

  // Sync volume
  useEffect(() => {
    if (!playerRef.current?.setVolume) return
    try {
      playerRef.current.setVolume(muted ? 0 : volume)
    } catch { /* ignore */ }
  }, [volume, muted])

  // Progress tracker
  useEffect(() => {
    if (!playerRef.current || !isPlaying) return
    const interval = setInterval(() => {
      try {
        const ct = playerRef.current.getCurrentTime?.() || 0
        const dur = playerRef.current.getDuration?.() || 0
        setCurrentTime(ct)
        setDuration(dur)
        setProgress(dur > 0 ? (ct / dur) * 100 : 0)
      } catch { /* ignore */ }
    }, 500)
    return () => clearInterval(interval)
  }, [isPlaying, playerReady])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!currentVideo) return null

  // ─── Minimized Bar ───
  if (!expanded) {
    return (
      <div className="flex-shrink-0 bg-dark-900/95 border-b border-pink-500/20 backdrop-blur-sm cursor-pointer group"
        onClick={onExpand}
      >
        <div className="h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 opacity-60" />
        <div className="px-3 py-2 flex items-center gap-3">
          {/* Thumbnail */}
          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-pink-500/30">
            <img
              src={`https://img.youtube.com/vi/${currentVideo.id}/default.jpg`}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '' }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              {isPlaying ? (
                <EqualizerBars playing={true} size="sm" />
              ) : (
                <Play className="w-3 h-3 text-white" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              ▶️ {currentVideo.title}
            </p>
            <p className="text-[10px] text-dark-400 truncate">
              {currentVideo.artist}{currentVideo.addedBy ? ` — adicionado por ${currentVideo.addedBy}` : ''}
            </p>
          </div>

          {/* Mini progress */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] text-dark-500">{formatTime(currentTime)}</span>
            <div className="w-20 h-1 bg-dark-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-dark-500">{formatTime(duration)}</span>
          </div>

          {/* Mini controls */}
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={onPlayPause} className="p-1.5 rounded-lg text-pink-400 hover:bg-pink-500/20 transition-all">
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onSkipVote} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all relative">
              <SkipForward className="w-3.5 h-3.5" />
              {skipVotes > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-pink-500 text-[8px] text-white flex items-center justify-center font-bold">{skipVotes}</span>
              )}
            </button>
          </div>

          <ChevronUp className="w-4 h-4 text-dark-500 group-hover:text-pink-400 transition-colors flex-shrink-0" />
        </div>

        {/* Full-width progress bar */}
        <div className="h-[2px] bg-dark-800">
          <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    )
  }

  // ─── Expanded Player ───
  return (
    <div ref={containerRef} className="flex-shrink-0 bg-dark-950 border-b border-pink-500/30 relative animate-slide-down-yt">
      {/* Neon top border */}
      <div className="h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" />

      {/* Video container - 16:9 responsive */}
      <div className="relative w-full" style={{ maxHeight: '40vh' }}>
        <div className="relative w-full" style={{ paddingBottom: '56.25%', maxHeight: '40vh' }}>
          <div className="absolute inset-0 bg-black">
            <div id={`yt-player-${currentVideo.id}`} className="w-full h-full" />
            <ScanlineOverlay />
          </div>
        </div>

        {/* Neon border glow */}
        <div className="absolute inset-0 pointer-events-none border-2 border-pink-500/30 shadow-[inset_0_0_30px_rgba(236,72,153,0.1)]" />
      </div>

      {/* Controls */}
      <div className="px-4 py-3 bg-dark-900/95 backdrop-blur-sm">
        {/* Song info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-sm font-bold text-white truncate">{currentVideo.title}</p>
            <p className="text-xs text-dark-400 truncate">
              {currentVideo.artist}{currentVideo.addedBy ? ` — ${currentVideo.addedBy}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onMinimize} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all" title="Minimizar">
              <Minimize2 className="w-4 h-4" />
            </button>
            <button onClick={() => { onMinimize() }} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all" title="Fechar">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              if (!playerRef.current?.seekTo) return
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              playerRef.current.seekTo(pct * duration, true)
            }}
          >
            <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-dark-500">{formatTime(currentTime)}</span>
            <span className="text-[10px] text-dark-500">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onPlayPause} className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-all">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={onSkipVote} className="p-2 rounded-xl bg-white/[0.06] text-dark-400 hover:text-white hover:bg-white/[0.1] transition-all relative" title={`Pular (${skipVotes}/3)`}>
              <SkipForward className="w-4 h-4" />
              {skipVotes > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-[9px] text-white flex items-center justify-center font-bold">{skipVotes}</span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setMuted(!muted)} className="p-1.5 rounded-lg text-dark-400 hover:text-white transition-all">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range" min={0} max={100} value={muted ? 0 : volume}
              onChange={e => { onVolumeChange(Number(e.target.value)); setMuted(false) }}
              className="w-20 h-1 accent-pink-500 cursor-pointer"
            />
            <button onClick={toggleFullscreen} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-60" />

      <style>{`
        @keyframes yt-eq-bar { 0% { height: 3px; } 100% { height: 16px; } }
        @keyframes slide-down-yt { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 80vh; } }
        .animate-slide-down-yt { animation: slide-down-yt 0.3s ease-out; }
      `}</style>
    </div>
  )
}

// ─── Exported helper to duck volume via postMessage ───
export function duckYouTubeVolume(volume: number) {
  // Used by PTT to lower volume when talking
  const iframes = document.querySelectorAll('iframe[src*="youtube.com"]')
  iframes.forEach(iframe => {
    (iframe as HTMLIFrameElement).contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'setVolume', args: [volume] }),
      '*'
    )
  })
}
