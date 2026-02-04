// ═══════════════════════════════════════════════════════════════════════════
// Freddie Mercury Mask — Iconic mustache, crown silhouette, microphone, royal purple aura
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
    mustacheSize = 1.0,
    crownGlow = 1.2,
    microphonePosition = 0.8
  } = settings

  ctx.save()

  // Get key landmarks
  const nose = landmarks[2]         // Nose tip
  const upperLip = landmarks[12]    // Upper lip center
  const mouthLeft = landmarks[61]   // Left mouth corner
  const mouthRight = landmarks[291] // Right mouth corner
  const forehead = landmarks[9]     // Center forehead
  const leftHand = landmarks[61]    // Approximate hand position

  if (!nose || !upperLip || !forehead) {
    ctx.restore()
    return
  }

  // Draw royal purple aura first
  drawRoyalAura(ctx, landmarks, width, height, intensity)

  // Draw iconic mustache
  drawFreddiesMustache(ctx, nose, upperLip, mouthLeft, mouthRight, width, height, intensity, mustacheSize)

  // Draw crown silhouette
  drawRoyalCrown(ctx, forehead, width, height, intensity, crownGlow)

  // Draw microphone
  drawMicrophone(ctx, width, height, intensity, microphonePosition)

  // Add stage lighting effects
  drawStageLighting(ctx, width, height, intensity)

  // Add Queen-style sparkles
  drawQueenSparkles(ctx, landmarks, width, height, intensity)

  ctx.restore()
}

const drawRoyalAura = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.3

  // Create purple gradient aura
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const gradient = ctx.createRadialGradient(
    centerX, centerY, width * 0.1,
    centerX, centerY, width * 0.5
  )
  gradient.addColorStop(0, 'rgba(147, 51, 234, 0.6)') // Purple
  gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)') // Light purple
  gradient.addColorStop(1, 'rgba(147, 51, 234, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

const drawFreddiesMustache = (
  ctx: CanvasRenderingContext2D,
  nose: any,
  upperLip: any,
  mouthLeft: any,
  mouthRight: any,
  width: number,
  height: number,
  intensity: number,
  mustacheSize: number
): void => {
  ctx.globalAlpha = intensity

  if (!mouthLeft || !mouthRight) return

  // Calculate mustache dimensions
  const centerX = upperLip.x * width
  const centerY = upperLip.y * height - height * 0.02
  const mustacheWidth = Math.abs(mouthRight.x - mouthLeft.x) * width * mustacheSize
  const mustacheHeight = height * 0.025

  // Freddie's iconic thick mustache
  ctx.fillStyle = '#2D1B1B' // Dark brown/black
  ctx.strokeStyle = '#1A1A1A'
  ctx.lineWidth = 1
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 5

  // Main mustache body (thick and bushy)
  ctx.beginPath()
  ctx.ellipse(
    centerX, 
    centerY - mustacheHeight * 0.3, 
    mustacheWidth * 0.7, 
    mustacheHeight,
    0, 0, Math.PI * 2
  )
  ctx.fill()
  ctx.stroke()

  // Left wing
  ctx.beginPath()
  ctx.ellipse(
    centerX - mustacheWidth * 0.4, 
    centerY,
    mustacheWidth * 0.3, 
    mustacheHeight * 0.8,
    -0.3, 0, Math.PI * 2
  )
  ctx.fill()
  ctx.stroke()

  // Right wing
  ctx.beginPath()
  ctx.ellipse(
    centerX + mustacheWidth * 0.4, 
    centerY,
    mustacheWidth * 0.3, 
    mustacheHeight * 0.8,
    0.3, 0, Math.PI * 2
  )
  ctx.fill()
  ctx.stroke()

  // Add mustache texture lines
  ctx.globalAlpha = intensity * 0.7
  ctx.strokeStyle = '#4A4A4A'
  ctx.lineWidth = 1

  for (let i = -3; i <= 3; i++) {
    ctx.beginPath()
    ctx.moveTo(centerX + (i * mustacheWidth * 0.1), centerY - mustacheHeight * 0.5)
    ctx.lineTo(centerX + (i * mustacheWidth * 0.1), centerY + mustacheHeight * 0.3)
    ctx.stroke()
  }
}

const drawRoyalCrown = (
  ctx: CanvasRenderingContext2D,
  forehead: any,
  width: number,
  height: number,
  intensity: number,
  crownGlow: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  const centerX = forehead.x * width
  const centerY = forehead.y * height - height * 0.1
  const crownWidth = width * 0.25
  const crownHeight = height * 0.08

  // Crown base with glow
  ctx.fillStyle = '#FFD700' // Gold
  ctx.strokeStyle = '#FFA500'
  ctx.lineWidth = 3
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 20 * crownGlow

  // Crown silhouette
  ctx.beginPath()
  ctx.moveTo(centerX - crownWidth * 0.5, centerY + crownHeight * 0.3)
  
  // Crown points (5 points like Queen logo)
  for (let i = 0; i < 5; i++) {
    const x = centerX - crownWidth * 0.5 + (i * crownWidth * 0.25)
    const peakHeight = i === 2 ? crownHeight * 1.5 : crownHeight // Middle peak higher
    ctx.lineTo(x, centerY - peakHeight)
    ctx.lineTo(x + crownWidth * 0.125, centerY + crownHeight * 0.3)
  }
  
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Add jewels on crown
  ctx.globalAlpha = intensity
  const jewels = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#FFFF00'] // Rainbow jewels

  for (let i = 0; i < 5; i++) {
    const x = centerX - crownWidth * 0.4 + (i * crownWidth * 0.2)
    const y = centerY - (i === 2 ? crownHeight * 1.2 : crownHeight * 0.7)
    
    ctx.fillStyle = jewels[i]
    ctx.shadowBlur = 15
    ctx.shadowColor = jewels[i]
    
    ctx.beginPath()
    ctx.ellipse(x, y, width * 0.01, width * 0.01, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawMicrophone = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  micPosition: number
): void => {
  ctx.globalAlpha = intensity * 0.9

  // Microphone position (right side of face, near mouth)
  const micX = width * 0.75
  const micY = height * 0.6

  // Microphone body
  const micWidth = width * 0.08
  const micHeight = height * 0.15

  // Mic body gradient
  const micGradient = ctx.createLinearGradient(micX, micY, micX + micWidth, micY + micHeight)
  micGradient.addColorStop(0, '#C0C0C0') // Silver
  micGradient.addColorStop(0.5, '#E5E7EB')
  micGradient.addColorStop(1, '#9CA3AF')

  ctx.fillStyle = micGradient
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 2

  // Microphone capsule
  ctx.beginPath()
  ctx.ellipse(micX, micY - micHeight * 0.3, micWidth * 0.6, micHeight * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Microphone handle
  ctx.beginPath()
  ctx.roundRect(
    micX - micWidth * 0.2,
    micY - micHeight * 0.1,
    micWidth * 0.4,
    micHeight * 0.8,
    micWidth * 0.1
  )
  ctx.fill()
  ctx.stroke()

  // Microphone grille lines
  ctx.globalAlpha = intensity * 0.6
  ctx.strokeStyle = '#6B7280'
  ctx.lineWidth = 1

  for (let i = 0; i < 5; i++) {
    const y = micY - micHeight * 0.4 + (i * micHeight * 0.15)
    ctx.beginPath()
    ctx.moveTo(micX - micWidth * 0.4, y)
    ctx.lineTo(micX + micWidth * 0.4, y)
    ctx.stroke()
  }

  // Hand holding microphone (simplified)
  ctx.globalAlpha = intensity * 0.7
  ctx.fillStyle = '#D2B48C' // Skin tone
  ctx.strokeStyle = '#A0522D'
  ctx.lineWidth = 2

  ctx.beginPath()
  ctx.ellipse(micX, micY + micHeight * 0.3, micWidth * 0.8, micHeight * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

const drawStageLighting = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.4

  // Stage spotlight effect
  const spotlights = [
    { x: width * 0.2, y: height * 0.1, color: '#FFD700' },
    { x: width * 0.8, y: height * 0.1, color: '#FF69B4' },
    { x: width * 0.5, y: height * 0.05, color: '#9370DB' }
  ]

  spotlights.forEach(light => {
    const gradient = ctx.createRadialGradient(
      light.x, light.y, 0,
      light.x, light.y, width * 0.3
    )
    gradient.addColorStop(0, light.color + '60')
    gradient.addColorStop(1, light.color + '00')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  })
}

const drawQueenSparkles = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  // Add sparkles around the face
  const sparklePositions = [
    { x: 0.3, y: 0.2 }, { x: 0.7, y: 0.2 },
    { x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 },
    { x: 0.4, y: 0.8 }, { x: 0.6, y: 0.8 }
  ]

  sparklePositions.forEach((pos, index) => {
    const x = pos.x * width
    const y = pos.y * height
    const sparkleSize = width * 0.015
    const colors = ['#FFD700', '#FF69B4', '#9370DB', '#00FFFF', '#FF4500']
    
    ctx.fillStyle = colors[index % colors.length]
    ctx.shadowColor = colors[index % colors.length]
    ctx.shadowBlur = 10

    // Star shape
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4
      const radius = i % 2 === 0 ? sparkleSize : sparkleSize * 0.5
      const pointX = x + Math.cos(angle) * radius
      const pointY = y + Math.sin(angle) * radius
      
      if (i === 0) ctx.moveTo(pointX, pointY)
      else ctx.lineTo(pointX, pointY)
    }
    ctx.closePath()
    ctx.fill()
  })
}

export const freddieMercuryMask: MaskRenderer = {
  render,
  name: 'Freddie Mercury',
  type: 'neon_wireframe'
}