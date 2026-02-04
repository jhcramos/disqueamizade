// ═══════════════════════════════════════════════════════════════════════════
// useVideoFilter Hook — MediaPipe Face Mesh Integration
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { FaceMesh } from '@mediapipe/face_mesh'
import { Camera } from '@mediapipe/camera_utils'
import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { VideoFilterHookResult, FilterState, DetectionResult, MaskRenderer } from '../types/filters'

// Import mask renderers
import { neonWireframeMask } from '../components/video/masks/NeonWireframe'
import { pixelFaceMask } from '../components/video/masks/PixelFace'
import { emojiTrackerMask } from '../components/video/masks/EmojiTracker'
import { animalMorphMask } from '../components/video/masks/AnimalMorph'
import { animeStyleMask } from '../components/video/masks/AnimeStyle'
// 🔥 80s Legends Collection 🔥
import { heManMask } from '../components/video/masks/HeMan'
import { optimusPrimeMask } from '../components/video/masks/OptimusPrime'
import { freddieMercuryMask } from '../components/video/masks/FreddieMercury'
import { knightRiderMask } from '../components/video/masks/KnightRider'
import { jaspionMask } from '../components/video/masks/Jaspion'
import { sheRaMask } from '../components/video/masks/SheRa'
import { jemMask } from '../components/video/masks/Jem'
import { wonderWomanMask } from '../components/video/masks/WonderWoman'
import { madonnaMask } from '../components/video/masks/Madonna'
import { cheetaraMask } from '../components/video/masks/Cheetara'

const MASK_RENDERERS: Record<string, MaskRenderer> = {
  neon_wireframe: neonWireframeMask,
  pixel_face: pixelFaceMask,
  emoji_tracker: emojiTrackerMask,
  cat_morph: animalMorphMask,
  anime_style: animeStyleMask,
  // 🔥 80s Legends Collection 🔥
  he_man: heManMask,
  optimus_prime: optimusPrimeMask,
  freddie_mercury: freddieMercuryMask,
  knight_rider: knightRiderMask,
  jaspion: jaspionMask,
  she_ra: sheRaMask,
  jem: jemMask,
  wonder_woman: wonderWomanMask,
  madonna: madonnaMask,
  cheetara: cheetaraMask
}

export const useVideoFilter = (
  videoStream: MediaStream | null,
  initialFilter: string | null = null
): VideoFilterHookResult => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const faceMeshRef = useRef<FaceMesh | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const animationFrameRef = useRef<number>(0)

  // State
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const saved = localStorage.getItem('disque-video-filter')
    return saved ? JSON.parse(saved) : {
      enabled: false,
      currentMask: initialFilter,
      intensity: 1.0,
      settings: {}
    }
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [filteredStream, setFilteredStream] = useState<MediaStream | null>(null)
  const [detectionResults, setDetectionResults] = useState<DetectionResult | null>(null)

  // Save filter state to localStorage
  useEffect(() => {
    localStorage.setItem('disque-video-filter', JSON.stringify(filterState))
  }, [filterState])

  // Initialize MediaPipe Face Mesh
  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      }
    })

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })

    faceMesh.onResults((results) => {
      if (!canvasRef.current || !results.multiFaceLandmarks?.[0]) {
        setDetectionResults(null)
        return
      }

      const landmarks = results.multiFaceLandmarks[0]
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw original video frame
      if (results.image) {
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)
      }

      // Apply filter if enabled
      if (filterState.enabled && filterState.currentMask) {
        const renderer = MASK_RENDERERS[filterState.currentMask]
        if (renderer) {
          try {
            renderer.render(ctx, landmarks, canvas.width, canvas.height, filterState.settings)
          } catch (error) {
            console.warn('Filter rendering error:', error)
          }
        }
      }

      // Update detection results
      setDetectionResults({
        landmarks,
        confidence: 0.9, // MediaPipe doesn't provide this directly
        boundingBox: calculateBoundingBox(landmarks, canvas.width, canvas.height)
      })
    })

    faceMeshRef.current = faceMesh
    return () => {
      faceMesh.close()
    }
  }, [filterState.enabled, filterState.currentMask, filterState.settings])

  // Initialize camera and video processing
  useEffect(() => {
    if (!videoStream || !faceMeshRef.current || !canvasRef.current) {
      return
    }

    const video = document.createElement('video')
    video.playsInline = true
    video.muted = true
    video.autoplay = true
    video.width = 640
    video.height = 480

    const canvas = canvasRef.current
    canvas.width = 640
    canvas.height = 480

    video.srcObject = videoStream
    videoRef.current = video

    video.onloadedmetadata = () => {
      video.play()
      setIsProcessing(true)

      const camera = new Camera(video, {
        onFrame: async () => {
          if (faceMeshRef.current) {
            await faceMeshRef.current.send({ image: video })
          }
        },
        width: 640,
        height: 480
      })

      camera.start()
      cameraRef.current = camera

      // Create filtered stream from canvas
      const stream = canvas.captureStream(30)
      setFilteredStream(stream)
    }

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
      video.pause()
      video.srcObject = null
      setIsProcessing(false)
      setFilteredStream(null)
    }
  }, [videoStream])

  // Helper function to calculate bounding box from landmarks
  const calculateBoundingBox = (
    landmarks: NormalizedLandmarkList, 
    width: number, 
    height: number
  ) => {
    const xs = landmarks.map(l => l.x * width)
    const ys = landmarks.map(l => l.y * height)
    
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    }
  }

  // Filter control functions
  const enableFilter = useCallback((maskId: string) => {
    if (MASK_RENDERERS[maskId]) {
      setFilterState(prev => ({
        ...prev,
        enabled: true,
        currentMask: maskId
      }))
    }
  }, [])

  const disableFilter = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      enabled: false
    }))
  }, [])

  const switchFilter = useCallback((maskId: string) => {
    if (MASK_RENDERERS[maskId]) {
      setFilterState(prev => ({
        ...prev,
        enabled: true,
        currentMask: maskId
      }))
    }
  }, [])

  return {
    canvasRef,
    filteredStream,
    isProcessing,
    enableFilter,
    disableFilter,
    switchFilter,
    currentFilter: filterState.currentMask,
    detectionResults
  }
}