// ═══════════════════════════════════════════════════════════════════════════
// Knight Rider / Michael Knight Mask — 80s hair, leather jacket collar, KITT scanner eyes
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const {
    intensity = 0.8,
    scannerSpeed = 1.0,
    hairVolume = 1.2,
    leatherShine = 0.9
  } = settings

  ctx.save()

  // Get key landmarks
  const forehead = landmarks[9]     // Center forehead
  const leftEye = landmarks[33]     // Left eye
  const rightEye = landmarks[362]   // Right eye
  const leftTemple = landmarks[54]  // Left temple
  const rightTemple = landmarks[284] // Right temple
  const chin = landmarks[18]        // Chin
  const jawLeft = landmarks[172]    // Left jaw
  const jawRight = landmarks[397]   // Right jaw

  if (!forehead || !leftEye || !rightEye) {
    ctx.restore()
    return
  }

  // Draw 80s feathered hair
  draw80sHair(ctx, landmarks, width, height, intensity, hairVolume)

  // Draw leather jacket collar
  drawLeatherCollar(ctx, chin, jawLeft, jawRight, width, height, intensity, leatherShine)

  // Draw KITT scanner light across eyes
  drawKITTScanner(ctx, leftEye, rightEye, width, height, intensity, scannerSpeed)

  // Add 80s style glow/neon effect
  draw80sGlow(ctx, landmarks, width, height, intensity)

  // Add aviator sunglasses reflection
  drawAviatorReflection(ctx, leftEye, rightEye, width, height, intensity)

  ctx.restore()
}

const draw80sHair = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number,
  hairVolume: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  // Get hair outline points
  const hairPoints = [
    landmarks[10], landmarks[151], landmarks[9], landmarks[10], // Top
    landmarks[54], landmarks[103], landmarks[67], landmarks[109], // Left side
    landmarks[284], landmarks[332], landmarks[297], landmarks[338] // Right side
  ].filter(Boolean)

  if (hairPoints.length < 8) return

  // 80s feathered hair - voluminous and styled
  ctx.fillStyle = '#8B4513' // Brown hair
  ctx.strokeStyle = '#654321'
  ctx.lineWidth = 3
  ctx.shadowColor = '#2D1B1B'
  ctx.shadowBlur = 10

  // Main hair volume (bigger and more styled)
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const hairWidth = width * 0.4 * hairVolume
  const hairHeight = height * 0.35 * hairVolume

  ctx.beginPath()
  ctx.ellipse(
    centerX,
    centerY - height * 0.15,
    hairWidth,
    hairHeight,
    0, 0, Math.PI * 2
  )
  ctx.fill()
  ctx.stroke()

  // Feathered side layers (iconic 80s style)
  ctx.globalAlpha = intensity * 0.6

  // Left feather
  ctx.beginPath()
  ctx.ellipse(
    centerX - hairWidth * 0.7,
    centerY - height * 0.05,
    hairWidth * 0.4,
    hairHeight * 0.6,
    -0.3, 0, Math.PI * 2
  )
  ctx.fill()
  ctx.stroke()

  // Right feather
  ctx.beginPath()
  ctx.ellipse(
    centerX + hairWidth * 0.7,
    centerY - height * 0.05,
    hairWidth * 0.4,
    hairHeight * 0.6,
    0.3, 0, Math.PI * 2
  )
  ctx.fill()
  ctx.stroke()

  // Add hair texture/strands
  ctx.globalAlpha = intensity * 0.4
  ctx.strokeStyle = '#A0522D'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  for (let i = -5; i <= 5; i++) {
    const startX = centerX + (i * hairWidth * 0.15)
    const startY = centerY - hairHeight * 0.8
    const endX = startX + (Math.random() - 0.5) * width * 0.05
    const endY = centerY - height * 0.05

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.quadraticCurveTo(
      startX + (i * width * 0.02),
      centerY - hairHeight * 0.5,
      endX, endY
    )
    ctx.stroke()
  }
}

const drawLeatherCollar = (
  ctx: CanvasRenderingContext2D,
  chin: any,
  jawLeft: any,
  jawRight: any,
  width: number,
  height: number,
  intensity: number,
  leatherShine: number
): void => {
  ctx.globalAlpha = intensity * 0.9

  if (!chin || !jawLeft || !jawRight) return

  const centerX = chin.x * width
  const centerY = chin.y * height + height * 0.1
  const collarWidth = Math.abs(jawRight.x - jawLeft.x) * width * 1.3
  const collarHeight = height * 0.15

  // Create leather gradient
  const leatherGradient = ctx.createLinearGradient(
    centerX - collarWidth / 2, centerY,
    centerX + collarWidth / 2, centerY + collarHeight
  )
  leatherGradient.addColorStop(0, '#2D1B1B') // Dark brown
  leatherGradient.addColorStop(0.3, '#4A2C2A') // Medium brown
  leatherGradient.addColorStop(0.7, '#1A1A1A') // Almost black
  leatherGradient.addColorStop(1, '#0F0F0F') // Black

  ctx.fillStyle = leatherGradient
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 3
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 15 * leatherShine

  // Draw leather jacket collar shape
  ctx.beginPath()
  ctx.moveTo(centerX - collarWidth * 0.5, centerY + collarHeight)
  ctx.lineTo(centerX - collarWidth * 0.3, centerY - collarHeight * 0.2)
  ctx.lineTo(centerX - collarWidth * 0.1, centerY - collarHeight * 0.5)
  ctx.lineTo(centerX, centerY - collarHeight * 0.3)
  ctx.lineTo(centerX + collarWidth * 0.1, centerY - collarHeight * 0.5)
  ctx.lineTo(centerX + collarWidth * 0.3, centerY - collarHeight * 0.2)
  ctx.lineTo(centerX + collarWidth * 0.5, centerY + collarHeight)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Add leather texture/stitching
  ctx.globalAlpha = intensity * 0.6
  ctx.strokeStyle = '#8B4513'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 2])

  // Collar edge stitching
  ctx.beginPath()
  ctx.moveTo(centerX - collarWidth * 0.25, centerY - collarHeight * 0.3)
  ctx.lineTo(centerX + collarWidth * 0.25, centerY - collarHeight * 0.3)
  ctx.stroke()

  ctx.setLineDash([]) // Reset dash
}

const drawKITTScanner = (
  ctx: CanvasRenderingContext2D,
  leftEye: any,
  rightEye: any,
  width: number,
  height: number,
  intensity: number,
  scannerSpeed: number
): void => {
  ctx.globalAlpha = intensity

  // KITT scanner bar across eyes
  const eyeCenterY = (leftEye.y + rightEye.y) * height / 2
  const scannerWidth = Math.abs(rightEye.x - leftEye.x) * width * 1.4
  const scannerHeight = height * 0.02
  const centerX = (leftEye.x + rightEye.x) * width / 2

  // Animated scanner position (moves left to right)
  const time = Date.now() * 0.003 * scannerSpeed
  const scannerOffset = Math.sin(time) * scannerWidth * 0.4

  // Scanner bar background
  ctx.fillStyle = 'rgba(51, 51, 51, 0.8)' // Dark background
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1
  
  ctx.beginPath()
  ctx.roundRect(
    centerX - scannerWidth / 2,
    eyeCenterY - scannerHeight / 2,
    scannerWidth,
    scannerHeight,
    scannerHeight / 2
  )
  ctx.fill()
  ctx.stroke()

  // Moving red scanner light
  ctx.globalAlpha = intensity * 0.9
  const scannerGradient = ctx.createLinearGradient(
    centerX + scannerOffset - width * 0.05,
    eyeCenterY,
    centerX + scannerOffset + width * 0.05,
    eyeCenterY
  )
  scannerGradient.addColorStop(0, 'rgba(255, 0, 0, 0)')
  scannerGradient.addColorStop(0.5, 'rgba(255, 0, 0, 1)')
  scannerGradient.addColorStop(1, 'rgba(255, 0, 0, 0)')

  ctx.fillStyle = scannerGradient
  ctx.shadowColor = '#FF0000'
  ctx.shadowBlur = 20

  ctx.beginPath()
  ctx.roundRect(
    centerX + scannerOffset - width * 0.05,
    eyeCenterY - scannerHeight / 2,
    width * 0.1,
    scannerHeight,
    scannerHeight / 2
  )
  ctx.fill()

  // Add scanner reflection lines
  ctx.globalAlpha = intensity * 0.7
  ctx.strokeStyle = '#FF4444'
  ctx.lineWidth = 1

  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(centerX + scannerOffset - width * 0.03 + (i * width * 0.02), eyeCenterY - scannerHeight * 0.3)
    ctx.lineTo(centerX + scannerOffset - width * 0.03 + (i * width * 0.02), eyeCenterY + scannerHeight * 0.3)
    ctx.stroke()
  }
}

const draw80sGlow = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.3

  // 80s neon glow effect around the head
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  
  const glowGradient = ctx.createRadialGradient(
    centerX, centerY, width * 0.1,
    centerX, centerY, width * 0.4
  )
  glowGradient.addColorStop(0, 'rgba(255, 20, 147, 0.3)') // Hot pink
  glowGradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.2)') // Deep sky blue
  glowGradient.addColorStop(1, 'rgba(255, 20, 147, 0)')

  ctx.fillStyle = glowGradient
  ctx.fillRect(0, 0, width, height)
}

const drawAviatorReflection = (
  ctx: CanvasRenderingContext2D,
  leftEye: any,
  rightEye: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.6

  // Subtle aviator sunglasses reflection
  const eyeWidth = Math.abs(rightEye.x - leftEye.x) * width * 0.7
  const eyeHeight = eyeWidth * 0.6

  // Left lens
  ctx.fillStyle = 'rgba(75, 85, 99, 0.7)' // Dark gray
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 2

  ctx.beginPath()
  ctx.ellipse(
    leftEye.x * width,
    leftEye.y * height,
    eyeWidth * 0.3,
    eyeHeight * 0.3,
    0, 0, Math.PI * 2
  )
  ctx.fill()
  ctx.stroke()

  // Right lens
  ctx.beginPath()
  ctx.ellipse(
    rightEye.x * width,
    rightEye.y * height,
    eyeWidth * 0.3,
    eyeHeight * 0.3,
    0, 0, Math.PI * 2
  )
  ctx.fill()
  ctx.stroke()

  // Bridge
  ctx.strokeStyle = '#6B7280'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(leftEye.x * width + eyeWidth * 0.25, leftEye.y * height)
  ctx.lineTo(rightEye.x * width - eyeWidth * 0.25, rightEye.y * height)
  ctx.stroke()

  // Lens reflections (sky/horizon)
  ctx.globalAlpha = intensity * 0.4
  const reflectionGradient = ctx.createLinearGradient(
    0, (leftEye.y * height) - eyeHeight * 0.2,
    0, (leftEye.y * height) + eyeHeight * 0.2
  )
  reflectionGradient.addColorStop(0, 'rgba(135, 206, 235, 0.5)') // Sky blue
  reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)') // White

  ctx.fillStyle = reflectionGradient
  
  // Left lens reflection
  ctx.beginPath()
  ctx.ellipse(
    leftEye.x * width,
    leftEye.y * height,
    eyeWidth * 0.25,
    eyeHeight * 0.25,
    0, 0, Math.PI * 2
  )
  ctx.fill()

  // Right lens reflection
  ctx.beginPath()
  ctx.ellipse(
    rightEye.x * width,
    rightEye.y * height,
    eyeWidth * 0.25,
    eyeHeight * 0.25,
    0, 0, Math.PI * 2
  )
  ctx.fill()
}

export const knightRiderMask: MaskRenderer = {
  render,
  name: 'Knight Rider',
  type: 'neon_wireframe'
}