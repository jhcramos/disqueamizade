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
  | 'he_man'
  | 'optimus_prime'
  | 'freddie_mercury'
  | 'knight_rider'
  | 'jaspion'
  | 'she_ra'
  | 'jem'
  | 'wonder_woman'
  | 'madonna'
  | 'cheetara'

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
  },
  // 🔥 80s Legends Collection 🔥
  {
    id: 'he_man',
    name: 'He-Man',
    type: 'he_man',
    emoji: '🗡️',
    description: 'Golden crown, strong jaw, power glow aura',
    requiredTier: 'premium',
    category: '80s Legends',
    settings: {
      intensity: 0.8,
      glowStrength: 1.0,
      crownSize: 1.2
    }
  },
  {
    id: 'optimus_prime',
    name: 'Optimus Prime',
    type: 'optimus_prime',
    emoji: '🤖',
    description: 'Red/blue metallic face plate, glowing blue eyes',
    requiredTier: 'premium',
    category: '80s Legends',
    settings: {
      intensity: 0.8,
      metallicShine: 1.0,
      eyeGlow: 1.2
    }
  },
  {
    id: 'freddie_mercury',
    name: 'Freddie Mercury',
    type: 'freddie_mercury',
    emoji: '🎤',
    description: 'Iconic mustache, crown, microphone, royal purple aura',
    requiredTier: 'premium',
    category: '80s Legends',
    settings: {
      intensity: 0.8,
      mustacheSize: 1.0,
      crownGlow: 1.2,
      microphonePosition: 0.8
    }
  },
  {
    id: 'knight_rider',
    name: 'Knight Rider',
    type: 'knight_rider',
    emoji: '🚗',
    description: '80s hair, leather jacket, KITT scanner eyes',
    requiredTier: 'premium',
    category: '80s Legends',
    settings: {
      intensity: 0.8,
      scannerSpeed: 1.0,
      hairVolume: 1.2,
      leatherShine: 0.9
    }
  },
  {
    id: 'jaspion',
    name: 'Jaspion',
    type: 'jaspion',
    emoji: '🦸',
    description: 'Silver/red space hero helmet, visor with glow',
    requiredTier: 'premium',
    category: '80s Legends',
    settings: {
      intensity: 0.8,
      visorGlow: 1.2,
      metallicShine: 1.0,
      heroAura: 0.8
    }
  },
  {
    id: 'she_ra',
    name: 'She-Ra',
    type: 'she_ra',
    emoji: '⚔️',
    description: 'Golden tiara with gem, flowing hair, sparkles',
    requiredTier: 'premium',
    category: '80s Legends',
    settings: {
      intensity: 0.8,
      sparkleIntensity: 1.0,
      hairFlow: 1.2,
      powerGlow: 0.9
    }
  },
  {
    id: 'jem',
    name: 'Jem',
    type: 'jem',
    emoji: '💎',
    description: 'Pink star earrings, holographic hair, glitter',
    requiredTier: 'premium',
    category: '80s Legends',
    settings: {
      intensity: 0.8,
      hologramEffect: 1.2,
      glitterDensity: 1.0,
      starGlow: 1.0
    }
  },
  {
    id: 'wonder_woman',
    name: 'Wonder Woman',
    type: 'wonder_woman',
    emoji: '🌟',
    description: 'Golden tiara with star, golden lasso glow',
    requiredTier: 'premium',
    category: '80s Legends',
    settings: {
      intensity: 0.8,
      lassoGlow: 1.2,
      patrioticColors: 1.0,
      heroicAura: 0.9
    }
  },
  {
    id: 'madonna',
    name: 'Madonna',
    type: 'madonna',
    emoji: '💋',
    description: 'Lace bow, cross earrings, beauty mark, 80s neon',
    requiredTier: 'premium',
    category: '80s Legends',
    settings: {
      intensity: 0.8,
      neonGlow: 1.2,
      beautyMark: 1.0,
      boldLips: 1.0
    }
  },
  {
    id: 'cheetara',
    name: 'Cheetara',
    type: 'cheetara',
    emoji: '🐆',
    description: 'Spotted pattern, cat eyes, orange streaks, cat ears',
    requiredTier: 'premium',
    category: '80s Legends',
    settings: {
      intensity: 0.8,
      spotPattern: 1.0,
      catEyeIntensity: 1.2,
      earAnimation: 1.0
    }
  }
]