// ═══════════════════════════════════════════════════════════════════════════
// Video Filter Types — MediaPipe Integration
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'

export type MaskType = 
  | 'neon_wireframe' 
  | 'pixel_face' 
  | 'emoji_tracker' 
  | 'animal_morph' 
  | 'anime_style'

export type AnimalType = 'cat' | 'dog' | 'fox' | 'owl'

export interface MaskConfig {
  id: string
  name: string
  type: MaskType
  emoji: string
  description: string
  requiredTier: 'free' | 'basic' | 'premium'
  category: string
  thumbnail?: string
  settings?: Record<string, any>
}

export interface FilterState {
  enabled: boolean
  currentMask: string | null
  intensity: number
  settings: Record<string, any>
}

export interface DetectionResult {
  landmarks: NormalizedLandmarkList
  confidence: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface MaskRenderer {
  render: (
    ctx: CanvasRenderingContext2D, 
    landmarks: NormalizedLandmarkList, 
    width: number, 
    height: number,
    settings?: Record<string, any>
  ) => void
  name: string
  type: MaskType
}

export interface VideoFilterHookResult {
  canvasRef: React.RefObject<HTMLCanvasElement>
  filteredStream: MediaStream | null
  isProcessing: boolean
  enableFilter: (maskId: string) => void
  disableFilter: () => void
  switchFilter: (maskId: string) => void
  currentFilter: string | null
  detectionResults: DetectionResult | null
}

export interface EmotionState {
  emotion: 'neutral' | 'happy' | 'surprise' | 'angry' | 'sad' | 'fear' | 'disgust'
  confidence: number
  emoji: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Predefined Mask Configurations
// ═══════════════════════════════════════════════════════════════════════════

export const AVAILABLE_MASKS: MaskConfig[] = [
  {
    id: 'neon_wireframe',
    name: 'Neon Wireframe',
    type: 'neon_wireframe',
    emoji: '🔮',
    description: 'Glowing neon face contours',
    requiredTier: 'free',
    category: 'artistic',
    settings: {
      color: '#00ffff',
      lineWidth: 2,
      glow: true
    }
  },
  {
    id: 'pixel_face',
    name: 'Pixel Anonymizer',
    type: 'pixel_face',
    emoji: '👤',
    description: 'Pixelated face for privacy',
    requiredTier: 'free',
    category: 'privacy',
    settings: {
      pixelSize: 12,
      opacity: 0.8
    }
  },
  {
    id: 'emoji_tracker',
    name: 'Emotion Emoji',
    type: 'emoji_tracker',
    emoji: '😄',
    description: 'Emoji that changes with your expression',
    requiredTier: 'basic',
    category: 'fun',
    settings: {
      size: 'large',
      position: 'forehead'
    }
  },
  {
    id: 'cat_morph',
    name: 'Cat Face',
    type: 'animal_morph',
    emoji: '🐱',
    description: 'Transform into a cute cat',
    requiredTier: 'basic',
    category: 'animal',
    settings: {
      animal: 'cat',
      intensity: 0.8
    }
  },
  {
    id: 'anime_style',
    name: 'Anime Style',
    type: 'anime_style',
    emoji: '🎌',
    description: 'Stylized anime-like rendering',
    requiredTier: 'premium',
    category: 'artistic',
    settings: {
      eyeSize: 1.5,
      skinSmooth: 0.8
    }
  }
]