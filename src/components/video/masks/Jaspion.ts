// ═══════════════════════════════════════════════════════════════════════════
// Jaspion Mask — Silver/red space hero helmet, visor with glow, metallic face guard (tokusatsu)
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
    visorGlow = 1.2,
    metallicShine = 1.0,
    heroAura = 0.8
  } = settings

  ctx.save()

  // Get key landmarks
  const forehead = landmarks[9]     // Center forehead
  const leftEye = landmarks[33]     // Left eye
  const rightEye = landmarks[362]   // Right eye
  const leftTemple = landmarks[54]  // Left temple
  const rightTemple = landmarks[284] // Right temple
  const noseBridge = landmarks[6]   // Nose bridge
  const chin = landmarks[18]        // Chin

  if (!forehead || !leftEye || !rightEye) {
    ctx.restore()
    return
  }

  // Draw hero power aura first
  drawHeroAura(ctx, landmarks, width, height, intensity, heroAura)

  // Draw main helmet
  drawSpaceHelmet(ctx, landmarks, width, height, intensity, metallicShine)

  // Draw characteristic visor
  drawJaspionVisor(ctx, leftEye, rightEye, forehead, width, height, intensity, visorGlow)

  // Draw metallic face guard
  drawMetallicFaceGuard(ctx, landmarks, width, height, intensity)

  // Draw helmet details and antenna
  drawHelmetDetails(ctx, forehead, leftTemple, rightTemple, width, height, intensity)

  // Add tokusatsu energy effects
  drawTokusatsuEffects(ctx, landmarks, width, height, intensity)

  ctx.restore()
}

const drawHeroAura = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number,
  heroAura: number
): void => {
  ctx.globalAlpha = intensity * 0.3 * heroAura

  // Hero power aura (silver/blue energy)
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  
  const auraGradient = ctx.createRadialGradient(
    centerX, centerY, width * 0.1,
    centerX, centerY, width * 0.45
  )
  auraGradient.addColorStop(0, 'rgba(192, 192, 192, 0.6)') // Silver
  auraGradient.addColorStop(0.3, 'rgba(0, 123, 255, 0.4)') // Blue
  auraGradient.addColorStop(0.7, 'rgba(255, 69, 0, 0.3)') // Red-orange
  auraGradient.addColorStop(1, 'rgba(192, 192, 192, 0)')

  ctx.fillStyle = auraGradient
  ctx.fillRect(0, 0, width, height)
}

const drawSpaceHelmet = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number,
  metallicShine: number
): void => {
  ctx.globalAlpha = intensity * 0.9

  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const helmetWidth = width * 0.35
  const helmetHeight = height * 0.4

  // Create metallic gradient for helmet
  const helmetGradient = ctx.createLinearGradient(
    centerX - helmetWidth, centerY - helmetHeight,
    centerX + helmetWidth, centerY + helmetHeight
  )
  helmetGradient.addColorStop(0, '#E5E7EB') // Light silver
  helmetGradient.addColorStop(0.25, '#F9FAFB') // Almost white
  helmetGradient.addColorStop(0.5, '#C0C0C0') // Silver
  helmetGradient.addColorStop(0.75, '#9CA3AF') // Gray
  helmetGradient.addColorStop(1, '#6B7280') // Dark gray

  ctx.fillStyle = helmetGradient
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 3
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 20 * metallicShine

  // Main helmet dome
  ctx.beginPath()
  ctx.ellipse(centerX, centerY - height * 0.05, helmetWidth, helmetHeight, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Red accent stripes (Jaspion's colors)
  ctx.globalAlpha = intensity * 0.8
  ctx.strokeStyle = '#DC2626'
  ctx.lineWidth = 4
  ctx.shadowColor = '#DC2626'
  ctx.shadowBlur = 10

  // Left red stripe
  ctx.beginPath()
  ctx.arc(centerX, centerY - height * 0.05, helmetWidth * 0.8, -Math.PI * 0.7, -Math.PI * 0.3, false)
  ctx.stroke()

  // Right red stripe
  ctx.beginPath()
  ctx.arc(centerX, centerY - height * 0.05, helmetWidth * 0.8, -Math.PI * 0.7, -Math.PI * 0.3, true)
  ctx.stroke()

  // Central red line
  ctx.beginPath()
  ctx.moveTo(centerX, centerY - helmetHeight * 0.9)
  ctx.lineTo(centerX, centerY + helmetHeight * 0.3)
  ctx.stroke()
}

const drawJaspionVisor = (
  ctx: CanvasRenderingContext2D,
  leftEye: any,
  rightEye: any,
  forehead: any,
  width: number,
  height: number,
  intensity: number,
  visorGlow: number
): void => {
  ctx.globalAlpha = intensity

  const centerX = forehead.x * width
  const eyeCenterY = (leftEye.y + rightEye.y) * height / 2
  const visorWidth = Math.abs(rightEye.x - leftEye.x) * width * 1.8
  const visorHeight = height * 0.08

  // Visor background (dark tinted)
  ctx.fillStyle = 'rgba(30, 30, 30, 0.9)'
  ctx.strokeStyle = '#1F2937'
  ctx.lineWidth = 2

  ctx.beginPath()
  ctx.ellipse(centerX, eyeCenterY, visorWidth / 2, visorHeight, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Visor glow effect
  ctx.globalAlpha = intensity * visorGlow * 0.8
  const visorGradient = ctx.createRadialGradient(
    centerX, eyeCenterY, visorWidth * 0.1,
    centerX, eyeCenterY, visorWidth * 0.6
  )
  visorGradient.addColorStop(0, 'rgba(0, 191, 255, 0.8)') // Cyan glow
  visorGradient.addColorStop(0.7, 'rgba(0, 123, 255, 0.4)') // Blue
  visorGradient.addColorStop(1, 'rgba(0, 191, 255, 0)')

  ctx.fillStyle = visorGradient
  ctx.beginPath()
  ctx.ellipse(centerX, eyeCenterY, visorWidth / 2.2, visorHeight * 0.8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Scanning lines inside visor
  ctx.globalAlpha = intensity * 0.6
  ctx.strokeStyle = '#00BFFF'
  ctx.lineWidth = 1

  for (let i = 0; i < 5; i++) {
    const y = eyeCenterY - visorHeight * 0.5 + (i * visorHeight * 0.25)
    ctx.beginPath()
    ctx.moveTo(centerX - visorWidth * 0.4, y)
    ctx.lineTo(centerX + visorWidth * 0.4, y)
    ctx.stroke()
  }

  // Central scanner beam
  const time = Date.now() * 0.005
  const beamOffset = Math.sin(time) * visorWidth * 0.3
  
  ctx.globalAlpha = intensity * 0.8
  ctx.strokeStyle = '#FF4500'
  ctx.lineWidth = 2
  ctx.shadowColor = '#FF4500'
  ctx.shadowBlur = 15

  ctx.beginPath()
  ctx.moveTo(centerX + beamOffset, eyeCenterY - visorHeight * 0.3)
  ctx.lineTo(centerX + beamOffset, eyeCenterY + visorHeight * 0.3)
  ctx.stroke()
}

const drawMetallicFaceGuard = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.7

  // Lower face protection
  const noseBridge = landmarks[6]
  const mouthCenter = landmarks[13]
  const chin = landmarks[18]

  if (!noseBridge || !mouthCenter || !chin) return

  const centerX = noseBridge.x * width
  const startY = noseBridge.y * height + height * 0.03
  const endY = chin.y * height + height * 0.02
  const guardWidth = width * 0.2

  // Metallic face guard gradient
  const guardGradient = ctx.createLinearGradient(
    centerX - guardWidth, startY,
    centerX + guardWidth, endY
  )
  guardGradient.addColorStop(0, '#F3F4F6') // Almost white
  guardGradient.addColorStop(0.5, '#D1D5DB') // Light gray
  guardGradient.addColorStop(1, '#9CA3AF') // Medium gray

  ctx.fillStyle = guardGradient
  ctx.strokeStyle = '#6B7280'
  ctx.lineWidth = 2

  // Face guard shape
  ctx.beginPath()
  ctx.moveTo(centerX - guardWidth * 0.3, startY)
  ctx.quadraticCurveTo(centerX, startY - height * 0.01, centerX + guardWidth * 0.3, startY)
  ctx.lineTo(centerX + guardWidth * 0.4, endY)
  ctx.quadraticCurveTo(centerX, endY + height * 0.015, centerX - guardWidth * 0.4, endY)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Add ventilation grilles
  ctx.globalAlpha = intensity * 0.5
  ctx.strokeStyle = '#4B5563'
  ctx.lineWidth = 1

  const mouthY = mouthCenter.y * height
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath()
    ctx.moveTo(centerX - guardWidth * 0.15 + (i * guardWidth * 0.075), mouthY - height * 0.01)
    ctx.lineTo(centerX - guardWidth * 0.15 + (i * guardWidth * 0.075), mouthY + height * 0.02)
    ctx.stroke()
  }
}

const drawHelmetDetails = (
  ctx: CanvasRenderingContext2D,
  forehead: any,
  leftTemple: any,
  rightTemple: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  const centerX = forehead.x * width
  const centerY = forehead.y * height

  // Communication antenna
  ctx.strokeStyle = '#6B7280'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(centerX - width * 0.02, centerY - height * 0.15)
  ctx.lineTo(centerX - width * 0.04, centerY - height * 0.22)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(centerX + width * 0.02, centerY - height * 0.15)
  ctx.lineTo(centerX + width * 0.04, centerY - height * 0.22)
  ctx.stroke()

  // Antenna tips (blinking lights)
  const time = Date.now() * 0.01
  const blinkAlpha = (Math.sin(time) + 1) / 2

  ctx.globalAlpha = intensity * blinkAlpha
  ctx.fillStyle = '#00FF00'
  ctx.shadowColor = '#00FF00'
  ctx.shadowBlur = 10

  ctx.beginPath()
  ctx.arc(centerX - width * 0.04, centerY - height * 0.22, width * 0.008, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(centerX + width * 0.04, centerY - height * 0.22, width * 0.008, 0, Math.PI * 2)
  ctx.fill()

  // Side panels
  if (leftTemple && rightTemple) {
    ctx.globalAlpha = intensity * 0.6
    ctx.fillStyle = '#9CA3AF'
    ctx.strokeStyle = '#6B7280'
    ctx.lineWidth = 1

    // Left panel
    ctx.beginPath()
    ctx.roundRect(
      leftTemple.x * width - width * 0.02,
      leftTemple.y * height - height * 0.03,
      width * 0.03,
      height * 0.06,
      3
    )
    ctx.fill()
    ctx.stroke()

    // Right panel
    ctx.beginPath()
    ctx.roundRect(
      rightTemple.x * width - width * 0.01,
      rightTemple.y * height - height * 0.03,
      width * 0.03,
      height * 0.06,
      3
    )
    ctx.fill()
    ctx.stroke()
  }
}

const drawTokusatsuEffects = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.6

  // Energy particles around helmet
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const time = Date.now() * 0.003

  const particles = [
    { angle: 0, distance: 0.3, color: '#00BFFF' },
    { angle: Math.PI / 3, distance: 0.35, color: '#FF4500' },
    { angle: 2 * Math.PI / 3, distance: 0.32, color: '#00BFFF' },
    { angle: Math.PI, distance: 0.28, color: '#FF4500' },
    { angle: 4 * Math.PI / 3, distance: 0.33, color: '#00BFFF' },
    { angle: 5 * Math.PI / 3, distance: 0.31, color: '#FF4500' }
  ]

  particles.forEach((particle, index) => {
    const oscillation = Math.sin(time + index) * 0.05
    const distance = (particle.distance + oscillation) * width
    const x = centerX + Math.cos(particle.angle + time * 0.5) * distance
    const y = centerY + Math.sin(particle.angle + time * 0.5) * distance

    ctx.fillStyle = particle.color
    ctx.shadowColor = particle.color
    ctx.shadowBlur = 8

    ctx.beginPath()
    ctx.arc(x, y, width * 0.008, 0, Math.PI * 2)
    ctx.fill()
  })

  // Power surge lines
  ctx.globalAlpha = intensity * 0.4
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 4])

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + time * 0.5
    const startDistance = width * 0.2
    const endDistance = width * 0.35
    
    ctx.beginPath()
    ctx.moveTo(
      centerX + Math.cos(angle) * startDistance,
      centerY + Math.sin(angle) * startDistance
    )
    ctx.lineTo(
      centerX + Math.cos(angle) * endDistance,
      centerY + Math.sin(angle) * endDistance
    )
    ctx.stroke()
  }

  ctx.setLineDash([]) // Reset dash
}

export const jaspionMask: MaskRenderer = {
  render,
  name: 'Jaspion',
  type: 'neon_wireframe'
}