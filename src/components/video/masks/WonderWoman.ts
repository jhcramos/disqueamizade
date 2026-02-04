// ═══════════════════════════════════════════════════════════════════════════
// Wonder Woman Mask — Golden tiara with star, red/blue theme, golden lasso glow around frame
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
    lassoGlow = 1.2,
    patrioticColors = 1.0,
    heroicAura = 0.9
  } = settings

  ctx.save()

  // Get key landmarks
  const forehead = landmarks[9]     // Center forehead
  const leftTemple = landmarks[54]  // Left temple
  const rightTemple = landmarks[284] // Right temple
  const leftEye = landmarks[33]     // Left eye
  const rightEye = landmarks[362]   // Right eye
  const leftEar = landmarks[234]    // Left ear area
  const rightEar = landmarks[454]   // Right ear area

  if (!forehead || !leftTemple || !rightTemple) {
    ctx.restore()
    return
  }

  // Draw golden lasso glow around frame first
  drawGoldenLassoGlow(ctx, width, height, intensity, lassoGlow)

  // Draw heroic aura
  drawHeroicAura(ctx, landmarks, width, height, intensity, heroicAura)

  // Draw golden tiara with star
  drawGoldenTiara(ctx, forehead, leftTemple, rightTemple, width, height, intensity)

  // Draw Wonder Woman's bracelets
  drawBracelets(ctx, leftEar, rightEar, width, height, intensity)

  // Draw patriotic face elements
  drawPatrioticElements(ctx, leftEye, rightEye, width, height, intensity, patrioticColors)

  // Add flowing hair (black with blue highlights)
  drawWonderWomanHair(ctx, landmarks, width, height, intensity)

  // Draw eagle emblem on forehead
  drawEagleEmblem(ctx, forehead, width, height, intensity)

  // Add truth and justice sparkles
  drawTruthSparkles(ctx, landmarks, width, height, intensity)

  ctx.restore()
}

const drawGoldenLassoGlow = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  lassoGlow: number
): void => {
  ctx.globalAlpha = intensity * 0.4 * lassoGlow

  const time = Date.now() * 0.003
  const pulseIntensity = (Math.sin(time) + 1) / 2

  // Golden lasso energy around the frame
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 6 * (1 + pulseIntensity * 0.5)
  ctx.lineCap = 'round'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 20 * lassoGlow

  // Draw lasso rope pattern around the edge
  const ropeRadius = Math.min(width, height) * 0.45
  const centerX = width / 2
  const centerY = height / 2
  const segments = 32

  ctx.beginPath()
  for (let i = 0; i <= segments; i++) {
    const angle = (i * Math.PI * 2) / segments + time * 0.5
    const waveOffset = Math.sin(angle * 4 + time * 2) * 0.02
    const radius = ropeRadius * (1 + waveOffset)
    
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Inner glow effect
  ctx.globalAlpha = intensity * 0.2 * pulseIntensity
  const gradient = ctx.createRadialGradient(centerX, centerY, ropeRadius * 0.8, centerX, centerY, ropeRadius * 1.1)
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0)')
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0.3)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

const drawHeroicAura = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number,
  heroicAura: number
): void => {
  ctx.globalAlpha = intensity * 0.3 * heroicAura

  // Wonder Woman's divine power aura (red, gold, blue)
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  
  // Multi-layer patriotic aura
  const auraGradient = ctx.createRadialGradient(
    centerX, centerY, width * 0.05,
    centerX, centerY, width * 0.4
  )
  auraGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)') // Gold
  auraGradient.addColorStop(0.3, 'rgba(220, 20, 60, 0.4)') // Crimson
  auraGradient.addColorStop(0.6, 'rgba(0, 100, 200, 0.3)') // Blue
  auraGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')

  ctx.fillStyle = auraGradient
  ctx.fillRect(0, 0, width, height)

  // Pulsing divine light
  const time = Date.now() * 0.004
  const divineIntensity = (Math.sin(time) + 1) / 2

  ctx.globalAlpha = intensity * 0.2 * divineIntensity
  const divineGradient = ctx.createRadialGradient(
    centerX, centerY, width * 0.1,
    centerX, centerY, width * 0.3
  )
  divineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
  divineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = divineGradient
  ctx.fillRect(0, 0, width, height)
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
  const tiaraWidth = Math.abs(rightTemple.x - leftTemple.x) * width * 1.1
  const tiaraHeight = height * 0.06

  // Golden tiara base
  ctx.fillStyle = '#FFD700'
  ctx.strokeStyle = '#DAA520'
  ctx.lineWidth = 2
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 15

  // Main tiara band
  ctx.beginPath()
  ctx.ellipse(centerX, centerY + tiaraHeight * 0.2, tiaraWidth * 0.6, tiaraHeight * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Central star design
  const starSize = tiaraHeight * 0.8

  ctx.fillStyle = '#FFD700'
  ctx.strokeStyle = '#B8860B'
  ctx.lineWidth = 2

  // Five-pointed star (Wonder Woman's symbol)
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2
    const radius = (i % 2 === 0) ? starSize : starSize * 0.5
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius - tiaraHeight * 0.3
    
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Star highlights
  ctx.globalAlpha = intensity * 0.8
  ctx.fillStyle = '#FFFFFF'
  ctx.shadowBlur = 5

  ctx.beginPath()
  ctx.arc(centerX - starSize * 0.2, centerY - tiaraHeight * 0.5, starSize * 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Red star center
  ctx.globalAlpha = intensity
  ctx.fillStyle = '#DC143C' // Crimson
  ctx.shadowColor = '#DC143C'
  ctx.shadowBlur = 10

  ctx.beginPath()
  ctx.arc(centerX, centerY - tiaraHeight * 0.3, starSize * 0.25, 0, Math.PI * 2)
  ctx.fill()

  // Side ornaments
  ctx.globalAlpha = intensity * 0.7
  ctx.fillStyle = '#FFD700'
  ctx.strokeStyle = '#DAA520'
  ctx.lineWidth = 1

  // Left ornament
  ctx.beginPath()
  ctx.ellipse(centerX - tiaraWidth * 0.35, centerY, tiaraHeight * 0.3, tiaraHeight * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Right ornament
  ctx.beginPath()
  ctx.ellipse(centerX + tiaraWidth * 0.35, centerY, tiaraHeight * 0.3, tiaraHeight * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

const drawBracelets = (
  ctx: CanvasRenderingContext2D,
  leftEar: any,
  rightEar: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  // Wonder Woman's iconic bracelets (positioned near wrists/arms)
  const braceletPositions = [
    leftEar ? { x: leftEar.x * width - width * 0.1, y: leftEar.y * height + height * 0.15 } : null,
    rightEar ? { x: rightEar.x * width + width * 0.1, y: rightEar.y * height + height * 0.15 } : null
  ].filter(Boolean)

  braceletPositions.forEach((pos, index) => {
    if (!pos) return

    const braceletWidth = width * 0.06
    const braceletHeight = height * 0.08

    // Silver bracelet with deflecting power
    ctx.fillStyle = '#C0C0C0'
    ctx.strokeStyle = '#808080'
    ctx.lineWidth = 2
    ctx.shadowColor = '#FFFFFF'
    ctx.shadowBlur = 10

    ctx.beginPath()
    ctx.ellipse(pos.x, pos.y, braceletWidth, braceletHeight, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Red design elements
    ctx.globalAlpha = intensity * 0.6
    ctx.strokeStyle = '#DC143C'
    ctx.lineWidth = 3

    // Decorative lines
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.moveTo(pos.x - braceletWidth * 0.6, pos.y + (i * braceletHeight * 0.3))
      ctx.lineTo(pos.x + braceletWidth * 0.6, pos.y + (i * braceletHeight * 0.3))
      ctx.stroke()
    }

    // Bullet deflection sparkles
    const time = Date.now() * 0.005
    const sparkleIntensity = (Math.sin(time + index * Math.PI) + 1) / 2

    ctx.globalAlpha = intensity * sparkleIntensity * 0.7
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = '#FFFFFF'
    ctx.shadowBlur = 15

    for (let j = 0; j < 3; j++) {
      const angle = (j * Math.PI * 2) / 3 + time
      const sparkleX = pos.x + Math.cos(angle) * braceletWidth * 1.2
      const sparkleY = pos.y + Math.sin(angle) * braceletHeight * 1.2

      ctx.beginPath()
      ctx.arc(sparkleX, sparkleY, width * 0.008, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

const drawPatrioticElements = (
  ctx: CanvasRenderingContext2D,
  leftEye: any,
  rightEye: any,
  width: number,
  height: number,
  intensity: number,
  patrioticColors: number
): void => {
  ctx.globalAlpha = intensity * 0.5 * patrioticColors

  if (!leftEye || !rightEye) return

  // Subtle patriotic eye makeup (red, white, blue)
  const eyeWidth = width * 0.05
  const eyeHeight = height * 0.03

  // Blue eyeshadow
  ctx.fillStyle = 'rgba(0, 100, 200, 0.4)'
  
  ctx.beginPath()
  ctx.ellipse(leftEye.x * width, leftEye.y * height - height * 0.02, eyeWidth, eyeHeight, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(rightEye.x * width, rightEye.y * height - height * 0.02, eyeWidth, eyeHeight, 0, 0, Math.PI * 2)
  ctx.fill()

  // Red accent lines
  ctx.globalAlpha = intensity * 0.6
  ctx.strokeStyle = '#DC143C'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  // Left eye accent
  ctx.beginPath()
  ctx.moveTo(leftEye.x * width - eyeWidth, leftEye.y * height)
  ctx.lineTo(leftEye.x * width + eyeWidth, leftEye.y * height)
  ctx.stroke()

  // Right eye accent
  ctx.beginPath()
  ctx.moveTo(rightEye.x * width - eyeWidth, rightEye.y * height)
  ctx.lineTo(rightEye.x * width + eyeWidth, rightEye.y * height)
  ctx.stroke()
}

const drawWonderWomanHair = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.7

  // Wonder Woman's flowing dark hair with blue highlights
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const hairWidth = width * 0.4
  const hairHeight = height * 0.45

  // Dark hair base
  const hairGradient = ctx.createLinearGradient(
    centerX - hairWidth / 2, centerY - hairHeight / 2,
    centerX + hairWidth / 2, centerY + hairHeight / 2
  )
  hairGradient.addColorStop(0, '#1C1C1C') // Very dark brown/black
  hairGradient.addColorStop(0.5, '#2D2D2D') // Dark gray
  hairGradient.addColorStop(1, '#0F0F0F') // Almost black

  ctx.fillStyle = hairGradient
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2
  ctx.shadowColor = '#4682B4' // Steel blue highlights
  ctx.shadowBlur = 8

  ctx.beginPath()
  ctx.ellipse(centerX, centerY - height * 0.08, hairWidth, hairHeight, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Blue highlights in hair
  ctx.globalAlpha = intensity * 0.4
  ctx.strokeStyle = '#4682B4'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'

  const time = Date.now() * 0.002
  for (let i = 0; i < 5; i++) {
    const offsetX = (i - 2) * hairWidth * 0.2
    const waveY = Math.sin(time + i) * height * 0.02

    ctx.beginPath()
    ctx.moveTo(centerX + offsetX, centerY - hairHeight * 0.7)
    ctx.quadraticCurveTo(
      centerX + offsetX + width * 0.02,
      centerY - hairHeight * 0.3 + waveY,
      centerX + offsetX, centerY + hairHeight * 0.2
    )
    ctx.stroke()
  }
}

const drawEagleEmblem = (
  ctx: CanvasRenderingContext2D,
  forehead: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.6

  const centerX = forehead.x * width
  const centerY = forehead.y * height + height * 0.03
  const emblemSize = width * 0.04

  // Simplified eagle emblem (golden)
  ctx.fillStyle = '#FFD700'
  ctx.strokeStyle = '#DAA520'
  ctx.lineWidth = 1
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 8

  // Eagle wings (simplified)
  ctx.beginPath()
  ctx.ellipse(centerX - emblemSize * 0.6, centerY, emblemSize * 0.8, emblemSize * 0.3, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(centerX + emblemSize * 0.6, centerY, emblemSize * 0.8, emblemSize * 0.3, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Eagle head/body (center)
  ctx.beginPath()
  ctx.ellipse(centerX, centerY, emblemSize * 0.4, emblemSize * 0.6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Eagle details
  ctx.globalAlpha = intensity * 0.8
  ctx.fillStyle = '#B8860B'
  ctx.beginPath()
  ctx.ellipse(centerX, centerY - emblemSize * 0.2, emblemSize * 0.15, emblemSize * 0.15, 0, 0, Math.PI * 2)
  ctx.fill()
}

const drawTruthSparkles = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.7

  const time = Date.now() * 0.004
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height

  // Truth and justice sparkles (patriotic colors)
  const sparkles = [
    { x: 0.2, y: 0.2, color: '#FFD700', phase: 0 },      // Gold
    { x: 0.8, y: 0.25, color: '#DC143C', phase: 1 },    // Red
    { x: 0.15, y: 0.6, color: '#4682B4', phase: 2 },    // Blue
    { x: 0.85, y: 0.65, color: '#FFD700', phase: 3 },   // Gold
    { x: 0.3, y: 0.85, color: '#DC143C', phase: 4 },    // Red
    { x: 0.7, y: 0.9, color: '#4682B4', phase: 5 }      // Blue
  ]

  sparkles.forEach(sparkle => {
    const twinkle = (Math.sin(time + sparkle.phase) + 1) / 2
    const size = width * 0.02 * (0.5 + twinkle * 0.7)

    ctx.globalAlpha = intensity * twinkle * 0.8
    ctx.fillStyle = sparkle.color
    ctx.shadowColor = sparkle.color
    ctx.shadowBlur = size

    const x = sparkle.x * width
    const y = sparkle.y * height

    // Five-pointed star
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2
      const radius = (i % 2 === 0) ? size : size * 0.5
      const pointX = x + Math.cos(angle) * radius
      const pointY = y + Math.sin(angle) * radius
      
      if (i === 0) ctx.moveTo(pointX, pointY)
      else ctx.lineTo(pointX, pointY)
    }
    ctx.closePath()
    ctx.fill()
  })

  // Divine light rays
  ctx.globalAlpha = intensity * 0.3
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.shadowColor = '#FFFFFF'
  ctx.shadowBlur = 10

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + time * 0.5
    const innerRadius = width * 0.15
    const outerRadius = width * 0.25

    ctx.beginPath()
    ctx.moveTo(centerX + Math.cos(angle) * innerRadius, centerY + Math.sin(angle) * innerRadius)
    ctx.lineTo(centerX + Math.cos(angle) * outerRadius, centerY + Math.sin(angle) * outerRadius)
    ctx.stroke()
  }
}

export const wonderWomanMask: MaskRenderer = {
  render,
  name: 'Wonder Woman',
  type: 'neon_wireframe'
}