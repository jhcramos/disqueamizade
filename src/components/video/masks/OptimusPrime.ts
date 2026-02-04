// ═══════════════════════════════════════════════════════════════════════════
// Optimus Prime Mask — Red/blue metallic face plate, glowing blue eyes, Autobot helmet
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
    metallicShine = 1.0,
    eyeGlow = 1.2
  } = settings

  ctx.save()

  // Get key landmarks
  const forehead = landmarks[9]     // Center forehead
  const leftEye = landmarks[33]     // Left eye
  const rightEye = landmarks[362]   // Right eye
  const noseBridge = landmarks[6]   // Nose bridge
  const leftCheek = landmarks[116]  // Left cheek
  const rightCheek = landmarks[345] // Right cheek
  const mouthCenter = landmarks[13] // Mouth center

  if (!forehead || !leftEye || !rightEye) {
    ctx.restore()
    return
  }

  // Draw Autobot helmet base
  drawAutobotHelmet(ctx, landmarks, width, height, intensity)

  // Draw metallic face plate
  drawMetallicFacePlate(ctx, landmarks, width, height, intensity, metallicShine)

  // Draw glowing blue eyes
  drawGlowingEyes(ctx, leftEye, rightEye, width, height, intensity, eyeGlow)

  // Draw mouth grille
  drawMouthGrille(ctx, mouthCenter, width, height, intensity)

  // Add Autobot insignia
  drawAutobotInsignia(ctx, forehead, width, height, intensity)

  // Add metallic details and panels
  drawMetallicPanels(ctx, landmarks, width, height, intensity)

  ctx.restore()
}

const drawAutobotHelmet = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  // Helmet outline (blue/red gradient)
  const helmetGradient = ctx.createLinearGradient(0, 0, 0, height)
  helmetGradient.addColorStop(0, '#1E3A8A') // Deep blue
  helmetGradient.addColorStop(0.5, '#3B82F6') // Blue
  helmetGradient.addColorStop(1, '#DC2626') // Red

  ctx.fillStyle = helmetGradient
  ctx.strokeStyle = '#1F2937'
  ctx.lineWidth = 4
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 15

  // Draw helmet shape
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const helmetWidth = width * 0.35
  const helmetHeight = height * 0.4

  ctx.beginPath()
  ctx.ellipse(centerX, centerY - height * 0.05, helmetWidth, helmetHeight, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Add antenna/horn details
  ctx.strokeStyle = '#4B5563'
  ctx.lineWidth = 3
  
  // Left antenna
  ctx.beginPath()
  ctx.moveTo(centerX - helmetWidth * 0.6, centerY - helmetHeight * 0.8)
  ctx.lineTo(centerX - helmetWidth * 0.8, centerY - helmetHeight * 1.2)
  ctx.stroke()
  
  // Right antenna
  ctx.beginPath()
  ctx.moveTo(centerX + helmetWidth * 0.6, centerY - helmetHeight * 0.8)
  ctx.lineTo(centerX + helmetWidth * 0.8, centerY - helmetHeight * 1.2)
  ctx.stroke()
}

const drawMetallicFacePlate = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number,
  metallicShine: number
): void => {
  ctx.globalAlpha = intensity * 0.7

  // Create metallic gradient
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const metallicGradient = ctx.createLinearGradient(
    centerX - width * 0.1, centerY - height * 0.1,
    centerX + width * 0.1, centerY + height * 0.1
  )
  metallicGradient.addColorStop(0, '#C0C0C0') // Silver
  metallicGradient.addColorStop(0.3, '#E5E7EB') // Light silver
  metallicGradient.addColorStop(0.7, '#9CA3AF') // Gray
  metallicGradient.addColorStop(1, '#6B7280') // Dark gray

  ctx.fillStyle = metallicGradient
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 2
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 10 * metallicShine

  // Face plate shape
  const plateWidth = width * 0.25
  const plateHeight = height * 0.3

  ctx.beginPath()
  ctx.roundRect(
    centerX - plateWidth / 2,
    centerY - plateHeight / 2,
    plateWidth,
    plateHeight,
    10
  )
  ctx.fill()
  ctx.stroke()

  // Add panel lines
  ctx.strokeStyle = '#1F2937'
  ctx.lineWidth = 1

  for (let i = 1; i <= 3; i++) {
    const y = centerY - plateHeight / 2 + (plateHeight / 4) * i
    ctx.beginPath()
    ctx.moveTo(centerX - plateWidth * 0.4, y)
    ctx.lineTo(centerX + plateWidth * 0.4, y)
    ctx.stroke()
  }
}

const drawGlowingEyes = (
  ctx: CanvasRenderingContext2D,
  leftEye: any,
  rightEye: any,
  width: number,
  height: number,
  intensity: number,
  eyeGlow: number
): void => {
  ctx.globalAlpha = intensity

  const eyeSize = width * 0.025 * eyeGlow
  
  // Left eye
  const leftX = leftEye.x * width
  const leftY = leftEye.y * height

  // Blue glow effect
  ctx.shadowColor = '#3B82F6'
  ctx.shadowBlur = 20 * eyeGlow
  ctx.fillStyle = '#60A5FA'
  
  ctx.beginPath()
  ctx.ellipse(leftX, leftY, eyeSize, eyeSize * 0.8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Inner bright core
  ctx.shadowBlur = 5
  ctx.fillStyle = '#DBEAFE'
  ctx.beginPath()
  ctx.ellipse(leftX, leftY, eyeSize * 0.5, eyeSize * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Right eye
  const rightX = rightEye.x * width
  const rightY = rightEye.y * height

  ctx.shadowColor = '#3B82F6'
  ctx.shadowBlur = 20 * eyeGlow
  ctx.fillStyle = '#60A5FA'
  
  ctx.beginPath()
  ctx.ellipse(rightX, rightY, eyeSize, eyeSize * 0.8, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.shadowBlur = 5
  ctx.fillStyle = '#DBEAFE'
  ctx.beginPath()
  ctx.ellipse(rightX, rightY, eyeSize * 0.5, eyeSize * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()
}

const drawMouthGrille = (
  ctx: CanvasRenderingContext2D,
  mouthCenter: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  const centerX = mouthCenter.x * width
  const centerY = mouthCenter.y * height
  const grilleWidth = width * 0.08
  const grilleHeight = height * 0.04

  // Grille background
  ctx.fillStyle = '#374151'
  ctx.strokeStyle = '#1F2937'
  ctx.lineWidth = 2
  
  ctx.beginPath()
  ctx.roundRect(
    centerX - grilleWidth / 2,
    centerY - grilleHeight / 2,
    grilleWidth,
    grilleHeight,
    5
  )
  ctx.fill()
  ctx.stroke()

  // Grille lines
  ctx.strokeStyle = '#6B7280'
  ctx.lineWidth = 1

  for (let i = 1; i <= 4; i++) {
    const x = centerX - grilleWidth / 2 + (grilleWidth / 5) * i
    ctx.beginPath()
    ctx.moveTo(x, centerY - grilleHeight * 0.3)
    ctx.lineTo(x, centerY + grilleHeight * 0.3)
    ctx.stroke()
  }
}

const drawAutobotInsignia = (
  ctx: CanvasRenderingContext2D,
  forehead: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.9

  const centerX = forehead.x * width
  const centerY = forehead.y * height - height * 0.08
  const size = width * 0.03

  // Autobot symbol (simplified triangle)
  ctx.fillStyle = '#DC2626' // Red
  ctx.strokeStyle = '#991B1B'
  ctx.lineWidth = 2
  ctx.shadowColor = '#DC2626'
  ctx.shadowBlur = 10

  ctx.beginPath()
  ctx.moveTo(centerX, centerY - size)
  ctx.lineTo(centerX - size * 0.8, centerY + size * 0.5)
  ctx.lineTo(centerX + size * 0.8, centerY + size * 0.5)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Central detail
  ctx.fillStyle = '#FBBF24' // Yellow accent
  ctx.beginPath()
  ctx.ellipse(centerX, centerY, size * 0.3, size * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
}

const drawMetallicPanels = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.5

  // Side panels
  const leftCheek = landmarks[116]
  const rightCheek = landmarks[345]

  if (leftCheek && rightCheek) {
    ctx.strokeStyle = '#4B5563'
    ctx.lineWidth = 2
    ctx.fillStyle = 'rgba(156, 163, 175, 0.3)'

    // Left panel
    ctx.beginPath()
    ctx.roundRect(
      leftCheek.x * width - width * 0.03,
      leftCheek.y * height - height * 0.04,
      width * 0.04,
      height * 0.08,
      5
    )
    ctx.fill()
    ctx.stroke()

    // Right panel
    ctx.beginPath()
    ctx.roundRect(
      rightCheek.x * width - width * 0.01,
      rightCheek.y * height - height * 0.04,
      width * 0.04,
      height * 0.08,
      5
    )
    ctx.fill()
    ctx.stroke()
  }
}

export const optimusPrimeMask: MaskRenderer = {
  render,
  name: 'Optimus Prime',
  type: 'neon_wireframe'
}