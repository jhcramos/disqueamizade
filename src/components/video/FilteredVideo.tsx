// ═══════════════════════════════════════════════════════════════════════════
// FilteredVideo Component — Video with AI Face Filters
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useEffect, useState } from 'react'
import { Sparkles, Settings, Eye, EyeOff } from 'lucide-react'
import { useVideoFilter } from '../../hooks/useVideoFilter'
import { MaskSelector } from './MaskSelector'
import type { MaskConfig } from '../../types/filters'

interface FilteredVideoProps {
  videoStream: MediaStream | null
  className?: string
  width?: number
  height?: number
  showControls?: boolean
  onFilterChange?: (filterId: string | null) => void
  muted?: boolean
  autoPlay?: boolean
  playsInline?: boolean
}

export const FilteredVideo: React.FC<FilteredVideoProps> = ({
  videoStream,
  className = '',
  width = 640,
  height = 480,
  showControls = true,
  onFilterChange,
  muted = true,
  autoPlay = true,
  playsInline = true
}) => {
  // Video filter hook
  const {
    canvasRef,
    filteredStream,
    isProcessing,
    enableFilter,
    disableFilter,
    switchFilter: _switchFilter,
    currentFilter,
    detectionResults
  } = useVideoFilter(videoStream)

  // Local state
  const [showSelector, setShowSelector] = useState(false)
  const [isFilterEnabled, setIsFilterEnabled] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Set up video stream
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream
    }
  }, [videoStream])

  // Handle filter changes
  useEffect(() => {
    setIsFilterEnabled(!!currentFilter)
    onFilterChange?.(currentFilter)
  }, [currentFilter, onFilterChange])

  const handleFilterSelect = (mask: MaskConfig) => {
    if (currentFilter === mask.id) {
      // Toggle off if same filter
      disableFilter()
      setIsFilterEnabled(false)
    } else {
      // Switch to new filter
      enableFilter(mask.id)
      setIsFilterEnabled(true)
    }
    setShowSelector(false)
  }

  const toggleFilter = () => {
    if (isFilterEnabled && currentFilter) {
      disableFilter()
      setIsFilterEnabled(false)
    } else if (currentFilter) {
      enableFilter(currentFilter)
      setIsFilterEnabled(true)
    } else {
      setShowSelector(true)
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Original Video (hidden when filter active) */}
      <video
        ref={videoRef}
        width={width}
        height={height}
        muted={muted}
        autoPlay={autoPlay}
        playsInline={playsInline}
        className={`${
          isProcessing && filteredStream ? 'hidden' : 'block'
        } rounded-lg bg-gray-900`}
      />

      {/* Filtered Canvas (shown when filter active) */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`${
          isProcessing && filteredStream ? 'block' : 'hidden'
        } rounded-lg bg-gray-900`}
      />

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {/* Filter Toggle Button */}
          <button
            onClick={toggleFilter}
            className={`
              p-2 rounded-lg backdrop-blur-sm border transition-all duration-200
              ${isFilterEnabled 
                ? 'bg-purple-500/80 border-purple-400 text-white shadow-purple-500/25 shadow-lg' 
                : 'bg-black/40 border-gray-600 text-gray-300 hover:bg-black/60'
              }
            `}
            title={isFilterEnabled ? 'Disable filter' : 'Enable filter'}
          >
            {isFilterEnabled ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>

          {/* Filter Selector Button */}
          <button
            onClick={() => setShowSelector(!showSelector)}
            className={`
              p-2 rounded-lg backdrop-blur-sm border transition-all duration-200
              ${showSelector 
                ? 'bg-blue-500/80 border-blue-400 text-white shadow-blue-500/25 shadow-lg' 
                : 'bg-black/40 border-gray-600 text-gray-300 hover:bg-black/60'
              }
            `}
            title="Choose filter"
          >
            <Sparkles size={20} />
          </button>

          {/* Settings Button (placeholder) */}
          <button
            className="p-2 rounded-lg backdrop-blur-sm border bg-black/40 border-gray-600 text-gray-300 hover:bg-black/60 transition-all duration-200"
            title="Filter settings"
          >
            <Settings size={20} />
          </button>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/60 rounded-lg backdrop-blur-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-white font-medium">AI Processing</span>
        </div>
      )}

      {/* Face Detection Indicator */}
      {detectionResults && isFilterEnabled && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/60 rounded-lg backdrop-blur-sm">
          <div className="w-2 h-2 bg-blue-400 rounded-full" />
          <span className="text-xs text-white font-medium">Face Detected</span>
        </div>
      )}

      {/* Filter Selector Modal */}
      {showSelector && (
        <div className="absolute top-16 right-4 z-50">
          <MaskSelector
            onSelect={handleFilterSelect}
            currentFilter={currentFilter}
            onClose={() => setShowSelector(false)}
          />
        </div>
      )}

      {/* Current Filter Badge */}
      {currentFilter && isFilterEnabled && (
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-purple-500/80 rounded-lg backdrop-blur-sm">
          <span className="text-xs text-white font-medium">
            {currentFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
      )}
    </div>
  )
}

export default FilteredVideo