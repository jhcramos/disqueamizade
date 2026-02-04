// ═══════════════════════════════════════════════════════════════════════════
// Emoji Tracker Mask — Expression-Based Emoji Display
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'

type Emotion = 'neutral' | 'happy' | 'surprise' | 'sad' | 'angry' | 'kiss' | 'wink'

const EMOTION_EMOJIS: Record<Emotion, string> = {
  neutral: '😐',
  happy: '😄',
  surprise: '😲',
  sad: '😢',
  angry: '😠',
  kiss: '😘',
  wink: '😉'
}

let lastEmotion: Emotion = 'neutral'
let emotionStability = 0 // Frames since last emotion change
const EMOTION_STABILITY_THRESHOLD = 10 // Require 10 frames of same emotion to change

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const {
    size = 'large',
    position = 'forehead',
    showBackground = true,
    opacity = 1.0
  } = settings

  // Detect current emotion from landmarks
  const currentEmotion = detectEmotion(landmarks)
  
  // Apply stability filter to prevent rapid emotion changes
  if (currentEmotion === lastEmotion) {
    emotionStability++
  } else {
    if (emotionStability >= EMOTION_STABILITY_THRESHOLD) {
      lastEmotion = currentEmotion
      emotionStability = 0
    } else {
      emotionStability = 0
    }
  }

  // Get emoji size
  const emojiSize = getEmojiSize(size, width)
  
  // Get position
  const { x, y } = getEmojiPosition(landmarks, position, width, height, emojiSize)

  // Draw background circle if enabled
  if (showBackground) {
    ctx.save()
    ctx.globalAlpha = opacity * 0.3
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, emojiSize * 0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Draw emoji
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.font = `${emojiSize}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Add slight shadow for better visibility
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  
  ctx.fillText(EMOTION_EMOJIS[lastEmotion], x, y)
  ctx.restore()
}

const detectEmotion = (landmarks: NormalizedLandmarkList): Emotion => {
  // Mouth landmarks for smile/frown detection
  const leftMouth = landmarks[61]  // Left corner of mouth
  const rightMouth = landmarks[291] // Right corner of mouth
  const topLip = landmarks[13]     // Top of upper lip
  const bottomLip = landmarks[14]  // Bottom of lower lip
  
  // Eye landmarks for blink/wink detection
  const leftEyeTop = landmarks[159]
  const leftEyeBottom = landmarks[145]
  const rightEyeTop = landmarks[386]
  const rightEyeBottom = landmarks[374]
  
  // Eyebrow landmarks for surprise
  const leftEyebrow = landmarks[70]
  const rightEyebrow = landmarks[107]
  const noseBridge = landmarks[9]

  if (!leftMouth || !rightMouth || !topLip || !bottomLip) {
    return 'neutral'
  }

  // Calculate mouth width and height
  const mouthWidth = Math.abs(rightMouth.x - leftMouth.x)
  const mouthHeight = Math.abs(bottomLip.y - topLip.y)
  const mouthRatio = mouthHeight / mouthWidth

  // Calculate mouth curve (smile/frown)
  const leftCornerY = leftMouth.y
  const rightCornerY = rightMouth.y
  const centerY = (topLip.y + bottomLip.y) / 2
  const mouthCurve = (leftCornerY + rightCornerY) / 2 - centerY

  // Calculate eye openness
  const leftEyeOpenness = leftEyeTop && leftEyeBottom ? 
    Math.abs(leftEyeTop.y - leftEyeBottom.y) : 0
  const rightEyeOpenness = rightEyeTop && rightEyeBottom ? 
    Math.abs(rightEyeTop.y - rightEyeBottom.y) : 0

  // Detect wink (one eye much more closed)
  if (leftEyeOpenness > 0 && rightEyeOpenness > 0) {
    const eyeRatio = leftEyeOpenness / rightEyeOpenness
    if (eyeRatio < 0.3 || eyeRatio > 3.0) {
      return 'wink'
    }
  }

  // Detect kiss (pursed lips)
  if (mouthRatio < 0.3 && mouthWidth < 0.03) {
    return 'kiss'
  }

  // Detect surprise (raised eyebrows, open mouth)
  if (leftEyebrow && rightEyebrow && noseBridge) {
    const eyebrowHeight = ((leftEyebrow.y + rightEyebrow.y) / 2) - noseBridge.y
    if (eyebrowHeight < -0.02 && mouthRatio > 0.8) {
      return 'surprise'
    }
  }

  // Detect happy (upward mouth curve, wide smile)
  if (mouthCurve < -0.01 && mouthWidth > 0.04) {
    return 'happy'
  }

  // Detect sad (downward mouth curve)
  if (mouthCurve > 0.01) {
    return 'sad'
  }

  // Detect angry (tense mouth, narrow eyes)
  if (mouthWidth < 0.03 && leftEyeOpenness < 0.015 && rightEyeOpenness < 0.015) {
    return 'angry'
  }

  return 'neutral'
}

const getEmojiSize = (size: string, canvasWidth: number): number => {
  switch (size) {
    case 'small':
      return canvasWidth * 0.08
    case 'medium':
      return canvasWidth * 0.12
    case 'large':
      return canvasWidth * 0.16
    default:
      return canvasWidth * 0.12
  }
}

const getEmojiPosition = (
  landmarks: NormalizedLandmarkList,
  position: string,
  width: number,
  height: number,
  emojiSize: number
): { x: number; y: number } => {
  // Get key facial landmarks
  const forehead = landmarks[9]   // Nose bridge top
  const leftEye = landmarks[33]   // Left eye
  const rightEye = landmarks[362] // Right eye
  const noseTip = landmarks[1]    // Nose tip

  switch (position) {
    case 'forehead':
      if (forehead) {
        return {
          x: forehead.x * width,
          y: (forehead.y * height) - emojiSize * 0.8
        }
      }
      break

    case 'above_eyes':
      if (leftEye && rightEye) {
        return {
          x: ((leftEye.x + rightEye.x) / 2) * width,
          y: Math.min(leftEye.y, rightEye.y) * height - emojiSize * 0.6
        }
      }
      break

    case 'nose':
      if (noseTip) {
        return {
          x: noseTip.x * width,
          y: noseTip.y * height - emojiSize * 0.3
        }
      }
      break

    default: // forehead
      if (forehead) {
        return {
          x: forehead.x * width,
          y: (forehead.y * height) - emojiSize * 0.8
        }
      }
  }

  // Fallback to center-top of canvas
  return {
    x: width / 2,
    y: emojiSize
  }
}

export const emojiTrackerMask: MaskRenderer = {
  render,
  name: 'Emoji Tracker',
  type: 'emoji_tracker'
}