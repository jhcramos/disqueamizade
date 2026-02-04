// ═══════════════════════════════════════════════════════════════════════════
// She-Ra Mask — Golden tiara with gem, flowing hair streams, sparkle effects, power shimmer
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
    sparkleIntensity = 1.0,
    hairFlow = 1.2,
    powerGlow = 0.9
  } = settings

  ctx.save()

  // Get key landmarks
  const forehead = landmarks[9]     // Center forehead
  const leftEye = landmarks[33]     // Left eye
  const rightEye = landmarks[362]   // Right eye
  const leftTemple = landmarks[54]  // Left temple
  const rightTemple = landmarks[284] // Right temple
  const nose = landmarks[2]         // Nose tip
  const chin = landmarks[18]        // Chin

  if (!forehead || !leftEye || !rightEye) {
    ctx.restore()
    return
  }

  // Draw power shimmer aura first
  drawPowerShimmer(ctx, landmarks, width, height, intensity, powerGlow)

  // Draw flowing hair streams
  drawFlowingHair(ctx, landmarks, width, height, intensity, hairFlow)

  // Draw golden tiara
  drawGoldenTiara(ctx, forehead, leftTemple, rightTemple, width, height, intensity)

  // Draw central gem
  drawPowerGem(ctx, forehead, width, height, intensity)

  // Add sparkle effects
  drawSparkleEffects(ctx, landmarks, width, height, intensity, sparkleIntensity)

  // Draw She-Ra's face markings
  drawHeroicMarkings(ctx, leftEye, rightEye, width, height, intensity)

  // Add magical energy swirls
  drawMagicalSwirls(ctx, landmarks, width, height, intensity)

  ctx.restore()
}

const drawPowerShimmer = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number,
  powerGlow: number
): void => {
  ctx.globalAlpha = intensity * 0.3 * powerGlow

  // She-Ra's divine power aura
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  
  const shimmerGradient = ctx.createRadialGradient(
    centerX, centerY, width * 0.05,
    centerX, centerY, width * 0.5
  )
  shimmerGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)') // Gold
  shimmerGradient.addColorStop(0.3, 'rgba(255, 182, 193, 0.4)') // Light pink
  shimmerGradient.addColorStop(0.6, 'rgba(135, 206, 250, 0.3)') // Light sky blue
  shimmerGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')

  ctx.fillStyle = shimmerGradient
  ctx.fillRect(0, 0, width, height)

  // Additional power pulses
  const time = Date.now() * 0.002
  const pulseIntensity = (Math.sin(time) + 1) / 2

  ctx.globalAlpha = intensity * 0.2 * pulseIntensity
  const pulseGradient = ctx.createRadialGradient(
    centerX, centerY, width * 0.1,
    centerX, centerY, width * 0.3
  )
  pulseGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)')
  pulseGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')

  ctx.fillStyle = pulseGradient
  ctx.fillRect(0, 0, width, height)
}

const drawFlowingHair = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number,
  hairFlow: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  // She-Ra's flowing golden hair
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const time = Date.now() * 0.003

  // Hair gradient (golden blonde)
  const hairGradient = ctx.createLinearGradient(0, centerY - height * 0.2, 0, centerY + height * 0.3)
  hairGradient.addColorStop(0, '#FFD700') // Gold
  hairGradient.addColorStop(0.3, '#FFA500') // Orange
  hairGradient.addColorStop(0.7, '#FFFF99') // Light yellow
  hairGradient.addColorStop(1, '#F0E68C') // Khaki

  ctx.fillStyle = hairGradient
  ctx.strokeStyle = '#DAA520'
  ctx.lineWidth = 2
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 15

  // Main hair mass
  const hairWidth = width * 0.4 * hairFlow
  const hairHeight = height * 0.5

  ctx.beginPath()
  ctx.ellipse(centerX, centerY - height * 0.1, hairWidth, hairHeight, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Flowing hair strands
  const strands = [
    { offsetX: -0.3, offsetY: -0.05, curve: 0.8, length: 0.4 },
    { offsetX: -0.15, offsetY: -0.08, curve: 0.6, length: 0.45 },
    { offsetX: 0, offsetY: -0.1, curve: 0.4, length: 0.5 },
    { offsetX: 0.15, offsetY: -0.08, curve: -0.6, length: 0.45 },
    { offsetX: 0.3, offsetY: -0.05, curve: -0.8, length: 0.4 }
  ]

  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 8 * hairFlow
  ctx.lineCap = 'round'

  strands.forEach((strand, index) => {
    const startX = centerX + strand.offsetX * hairWidth
    const startY = centerY + strand.offsetY * height
    const endX = startX + strand.curve * width * 0.1 * Math.sin(time + index)
    const endY = startY + strand.length * height

    const midX = startX + strand.curve * width * 0.05
    const midY = startY + strand.length * height * 0.5

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.quadraticCurveTo(midX, midY, endX, endY)
    ctx.stroke()
  })
}

const drawGoldenTiara = (
  ctx: CanvasRenderingContext2D,
  forehead: any,
  leftTemple: any,
  rightTemple: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity

  const centerX = forehead.x * width
  const centerY = forehead.y * height - height * 0.08
  const tiaraWidth = Math.abs(rightTemple.x - leftTemple.x) * width * 1.2
  const tiaraHeight = height * 0.06

  // Golden tiara base
  ctx.fillStyle = '#FFD700'
  ctx.strokeStyle = '#DAA520'
  ctx.lineWidth = 2
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 20

  // Tiara band
  ctx.beginPath()
  ctx.ellipse(centerX, centerY + tiaraHeight * 0.3, tiaraWidth * 0.6, tiaraHeight * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Tiara crown points (She-Ra style)
  const crownPoints = [
    { x: 0, height: 1.5 },     // Center (highest)
    { x: -0.4, height: 1.0 },  // Left
    { x: 0.4, height: 1.0 },   // Right
    { x: -0.7, height: 0.7 },  // Far left
    { x: 0.7, height: 0.7 }    // Far right
  ]

  crownPoints.forEach(point => {
    const pointX = centerX + point.x * tiaraWidth * 0.5
    const pointY = centerY - tiaraHeight * point.height

    ctx.beginPath()
    ctx.moveTo(pointX - tiaraWidth * 0.05, centerY)
    ctx.lineTo(pointX, pointY)
    ctx.lineTo(pointX + tiaraWidth * 0.05, centerY)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  })

  // Decorative elements
  ctx.globalAlpha = intensity * 0.8
  ctx.strokeStyle = '#FFA500'
  ctx.lineWidth = 1

  // Ornate patterns on the tiara
  for (let i = -2; i <= 2; i++) {
    const x = centerX + (i * tiaraWidth * 0.15)
    const y = centerY

    ctx.beginPath()
    ctx.arc(x, y, tiaraHeight * 0.15, 0, Math.PI * 2)
    ctx.stroke()
  }
}

const drawPowerGem = (
  ctx: CanvasRenderingContext2D,
  forehead: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity

  const centerX = forehead.x * width
  const centerY = forehead.y * height - height * 0.08
  const gemSize = width * 0.025

  // Power gem (blue/white crystal)
  const time = Date.now() * 0.005
  const glowIntensity = (Math.sin(time) + 1) / 2

  // Gem background
  ctx.fillStyle = '#4169E1' // Royal blue
  ctx.shadowColor = '#4169E1'
  ctx.shadowBlur = 20 * (1 + glowIntensity)

  ctx.beginPath()
  ctx.ellipse(centerX, centerY, gemSize, gemSize * 0.8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Inner crystal effect
  ctx.globalAlpha = intensity * (0.8 + glowIntensity * 0.3)
  ctx.fillStyle = '#E6E6FA' // Lavender (light)

  ctx.beginPath()
  ctx.ellipse(centerX - gemSize * 0.2, centerY - gemSize * 0.2, gemSize * 0.5, gemSize * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Central bright core
  ctx.globalAlpha = intensity * (0.9 + glowIntensity * 0.1)
  ctx.fillStyle = '#FFFFFF'

  ctx.beginPath()
  ctx.ellipse(centerX, centerY, gemSize * 0.3, gemSize * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()

  // Energy rays from gem
  ctx.globalAlpha = intensity * 0.6 * glowIntensity
  ctx.strokeStyle = '#87CEEB'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4
    const startX = centerX + Math.cos(angle) * gemSize * 1.2
    const startY = centerY + Math.sin(angle) * gemSize * 1.2
    const endX = centerX + Math.cos(angle) * gemSize * 2
    const endY = centerY + Math.sin(angle) * gemSize * 2

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  }
}

const drawSparkleEffects = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number,
  sparkleIntensity: number
): void => {
  ctx.globalAlpha = intensity * sparkleIntensity * 0.8

  const time = Date.now() * 0.004
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height

  // Magical sparkles around She-Ra
  const sparkles = [
    { x: 0.2, y: 0.1, size: 0.02, color: '#FFD700', phase: 0 },
    { x: 0.8, y: 0.15, size: 0.015, color: '#FF69B4', phase: 1 },
    { x: 0.1, y: 0.4, size: 0.018, color: '#87CEEB', phase: 2 },
    { x: 0.9, y: 0.45, size: 0.016, color: '#FFD700', phase: 3 },
    { x: 0.3, y: 0.7, size: 0.014, color: '#FF69B4', phase: 4 },
    { x: 0.7, y: 0.75, size: 0.017, color: '#87CEEB', phase: 5 },
    { x: 0.15, y: 0.85, size: 0.015, color: '#FFD700', phase: 6 },
    { x: 0.85, y: 0.8, size: 0.019, color: '#FF69B4', phase: 7 }
  ]

  sparkles.forEach(sparkle => {
    const twinkle = (Math.sin(time + sparkle.phase) + 1) / 2
    const sparkleSize = sparkle.size * width * (0.8 + twinkle * 0.4)
    const x = sparkle.x * width
    const y = sparkle.y * height

    ctx.globalAlpha = intensity * sparkleIntensity * twinkle
    ctx.fillStyle = sparkle.color
    ctx.shadowColor = sparkle.color
    ctx.shadowBlur = sparkleSize * 2

    // Four-pointed star
    ctx.beginPath()
    ctx.moveTo(x, y - sparkleSize)
    ctx.lineTo(x + sparkleSize * 0.3, y - sparkleSize * 0.3)
    ctx.lineTo(x + sparkleSize, y)
    ctx.lineTo(x + sparkleSize * 0.3, y + sparkleSize * 0.3)
    ctx.lineTo(x, y + sparkleSize)
    ctx.lineTo(x - sparkleSize * 0.3, y + sparkleSize * 0.3)
    ctx.lineTo(x - sparkleSize, y)
    ctx.lineTo(x - sparkleSize * 0.3, y - sparkleSize * 0.3)
    ctx.closePath()
    ctx.fill()
  })
}

const drawHeroicMarkings = (
  ctx: CanvasRenderingContext2D,
  leftEye: any,
  rightEye: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.6

  // Subtle heroic face markings (like war paint but elegant)
  const eyeY = (leftEye.y + rightEye.y) * height / 2
  
  ctx.strokeStyle = '#DAA520'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 5

  // Left eye marking (flowing curve)
  ctx.beginPath()
  ctx.moveTo(leftEye.x * width - width * 0.03, eyeY - height * 0.01)
  ctx.quadraticCurveTo(
    leftEye.x * width - width * 0.05,
    eyeY + height * 0.02,
    leftEye.x * width - width * 0.02,
    eyeY + height * 0.03
  )
  ctx.stroke()

  // Right eye marking (flowing curve)
  ctx.beginPath()
  ctx.moveTo(rightEye.x * width + width * 0.03, eyeY - height * 0.01)
  ctx.quadraticCurveTo(
    rightEye.x * width + width * 0.05,
    eyeY + height * 0.02,
    rightEye.x * width + width * 0.02,
    eyeY + height * 0.03
  )
  ctx.stroke()
}

const drawMagicalSwirls = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.4

  const time = Date.now() * 0.002
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height

  // Magical energy swirls
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 10

  for (let i = 0; i < 3; i++) {
    const radius = width * (0.25 + i * 0.1)
    const angleOffset = time + (i * Math.PI * 2) / 3

    ctx.beginPath()
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      const x = centerX + Math.cos(angle + angleOffset) * radius * (1 + Math.sin(angle * 3) * 0.3)
      const y = centerY + Math.sin(angle + angleOffset) * radius * (1 + Math.cos(angle * 3) * 0.3)
      
      if (angle === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

export const sheRaMask: MaskRenderer = {
  render,
  name: 'She-Ra',
  type: 'neon_wireframe'
}