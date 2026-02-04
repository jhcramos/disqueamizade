// ═══════════════════════════════════════════════════════════════════════════
// Jem Mask — Pink/magenta star earrings, holographic hair, glitter particles, star on cheek
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
    hologramEffect = 1.2,
    glitterDensity = 1.0,
    starGlow = 1.0
  } = settings

  ctx.save()

  // Get key landmarks
  const leftEar = landmarks[234]    // Left ear area
  const rightEar = landmarks[454]   // Right ear area
  const leftCheek = landmarks[116]  // Left cheek
  const rightCheek = landmarks[345] // Right cheek
  const forehead = landmarks[9]     // Center forehead

  if (!leftCheek || !rightCheek || !forehead) {
    ctx.restore()
    return
  }

  // Draw holographic aura first
  drawHolographicAura(ctx, landmarks, width, height, intensity, hologramEffect)

  // Draw holographic hair effect
  drawHolographicHair(ctx, landmarks, width, height, intensity)

  // Draw star earrings
  drawStarEarrings(ctx, leftEar, rightEar, width, height, intensity, starGlow)

  // Draw star on cheek
  drawCheekStar(ctx, rightCheek, width, height, intensity, starGlow)

  // Add glitter particles everywhere
  drawGlitterParticles(ctx, width, height, intensity, glitterDensity)

  // Add Jem's signature makeup
  drawJemMakeup(ctx, landmarks, width, height, intensity)

  // Add hologram scan lines
  drawHologramScanLines(ctx, width, height, intensity)

  ctx.restore()
}

const drawHolographicAura = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number,
  hologramEffect: number
): void => {
  ctx.globalAlpha = intensity * 0.4 * hologramEffect

  // Jem's holographic showtime aura
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  
  const time = Date.now() * 0.003
  const colorShift = Math.sin(time) * 0.5 + 0.5

  // Color-shifting holographic gradient
  const haloGradient = ctx.createRadialGradient(
    centerX, centerY, width * 0.05,
    centerX, centerY, width * 0.5
  )
  
  // Colors shift between pink, cyan, and purple (80s hologram style)
  const r = Math.floor(255 * (0.8 + colorShift * 0.2))      // Pink-red
  const g = Math.floor(105 * (0.5 + colorShift * 0.5))      // Limited green
  const b = Math.floor(255 * (0.6 + Math.sin(time * 1.2) * 0.4)) // Blue-purple

  haloGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`)
  haloGradient.addColorStop(0.3, `rgba(${Math.floor(r * 0.8)}, ${Math.floor(g * 1.5)}, ${Math.floor(b * 0.9)}, 0.4)`)
  haloGradient.addColorStop(0.7, `rgba(${Math.floor(r * 0.6)}, ${g}, ${Math.floor(b * 1.1)}, 0.2)`)
  haloGradient.addColorStop(1, 'rgba(255, 20, 147, 0)') // Hot pink

  ctx.fillStyle = haloGradient
  ctx.fillRect(0, 0, width, height)
}

const drawHolographicHair = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const time = Date.now() * 0.004

  // Jem's iconic pink holographic hair
  const hairWidth = width * 0.45
  const hairHeight = height * 0.6

  // Create shifting holographic hair gradient
  const colorPhase = Math.sin(time) * 0.5 + 0.5
  const hairGradient = ctx.createLinearGradient(
    centerX - hairWidth / 2, centerY - hairHeight / 2,
    centerX + hairWidth / 2, centerY + hairHeight / 2
  )
  
  hairGradient.addColorStop(0, `hsla(${320 + colorPhase * 40}, 70%, 65%, 0.9)`) // Pink
  hairGradient.addColorStop(0.3, `hsla(${280 + colorPhase * 40}, 80%, 70%, 0.8)`) // Magenta
  hairGradient.addColorStop(0.6, `hsla(${340 + colorPhase * 20}, 75%, 75%, 0.7)`) // Hot pink
  hairGradient.addColorStop(1, `hsla(${300 + colorPhase * 30}, 85%, 60%, 0.9)`) // Purple-pink

  ctx.fillStyle = hairGradient
  ctx.strokeStyle = '#FF1493'
  ctx.lineWidth = 3
  ctx.shadowColor = '#FF69B4'
  ctx.shadowBlur = 20

  // Main hair volume (wild 80s style)
  ctx.beginPath()
  ctx.ellipse(centerX, centerY - height * 0.1, hairWidth, hairHeight, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Wild hair spikes (80s rock style)
  ctx.globalAlpha = intensity * 0.6
  const spikes = [
    { x: -0.4, y: -0.2, length: 0.3, angle: -0.5 },
    { x: -0.2, y: -0.25, length: 0.4, angle: -0.2 },
    { x: 0, y: -0.3, length: 0.5, angle: 0 },
    { x: 0.2, y: -0.25, length: 0.4, angle: 0.2 },
    { x: 0.4, y: -0.2, length: 0.3, angle: 0.5 }
  ]

  spikes.forEach((spike, index) => {
    const spikeX = centerX + spike.x * hairWidth
    const spikeY = centerY + spike.y * height
    const waveOffset = Math.sin(time + index) * 0.1

    ctx.strokeStyle = '#FF69B4'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'

    ctx.beginPath()
    ctx.moveTo(spikeX, spikeY)
    ctx.lineTo(
      spikeX + Math.cos(spike.angle + waveOffset) * spike.length * width * 0.2,
      spikeY + Math.sin(spike.angle + waveOffset) * spike.length * height * 0.2 - height * 0.1
    )
    ctx.stroke()
  })

  // Holographic shimmer lines through hair
  ctx.globalAlpha = intensity * 0.5
  ctx.strokeStyle = '#00FFFF'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 10])

  for (let i = 0; i < 6; i++) {
    const lineY = centerY - hairHeight * 0.4 + (i * hairHeight * 0.15)
    const shimmerOffset = Math.sin(time * 2 + i) * width * 0.05

    ctx.beginPath()
    ctx.moveTo(centerX - hairWidth * 0.4 + shimmerOffset, lineY)
    ctx.lineTo(centerX + hairWidth * 0.4 + shimmerOffset, lineY)
    ctx.stroke()
  }

  ctx.setLineDash([]) // Reset dash
}

const drawStarEarrings = (
  ctx: CanvasRenderingContext2D,
  leftEar: any,
  rightEar: any,
  width: number,
  height: number,
  intensity: number,
  starGlow: number
): void => {
  ctx.globalAlpha = intensity

  const earringSize = width * 0.03
  const time = Date.now() * 0.006
  const glowPulse = (Math.sin(time) + 1) / 2

  // Draw star earrings
  const ears = [
    leftEar ? { x: leftEar.x * width - width * 0.06, y: leftEar.y * height } : null,
    rightEar ? { x: rightEar.x * width + width * 0.06, y: rightEar.y * height } : null
  ].filter(Boolean)

  ears.forEach((ear, index) => {
    if (!ear) return

    // Star earring glow
    ctx.globalAlpha = intensity * starGlow * (0.8 + glowPulse * 0.3)
    ctx.fillStyle = '#FF1493' // Deep pink
    ctx.shadowColor = '#FF69B4'
    ctx.shadowBlur = 15 * starGlow

    // Five-pointed star
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5
      const radius = (i % 2 === 0) ? earringSize : earringSize * 0.5
      const x = ear.x + Math.cos(angle - Math.PI / 2) * radius
      const y = ear.y + Math.sin(angle - Math.PI / 2) * radius
      
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()

    // Star center highlight
    ctx.globalAlpha = intensity * (0.9 + glowPulse * 0.1)
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowBlur = 5

    ctx.beginPath()
    ctx.arc(ear.x, ear.y, earringSize * 0.3, 0, Math.PI * 2)
    ctx.fill()

    // Dangling effect lines
    ctx.globalAlpha = intensity * 0.6
    ctx.strokeStyle = '#FF69B4'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(ear.x, ear.y + earringSize)
    ctx.lineTo(ear.x, ear.y + earringSize * 2 + Math.sin(time + index) * earringSize * 0.5)
    ctx.stroke()
  })
}

const drawCheekStar = (
  ctx: CanvasRenderingContext2D,
  rightCheek: any,
  width: number,
  height: number,
  intensity: number,
  starGlow: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  const starX = rightCheek.x * width + width * 0.03
  const starY = rightCheek.y * height + height * 0.02
  const starSize = width * 0.025
  const time = Date.now() * 0.005

  // Cheek star (Jem's signature)
  const glowIntensity = (Math.sin(time) + 1) / 2

  ctx.fillStyle = '#FF1493'
  ctx.shadowColor = '#FF69B4'
  ctx.shadowBlur = 12 * starGlow * (1 + glowIntensity * 0.5)

  // Four-pointed star on cheek
  ctx.beginPath()
  ctx.moveTo(starX, starY - starSize)
  ctx.lineTo(starX + starSize * 0.3, starY - starSize * 0.3)
  ctx.lineTo(starX + starSize, starY)
  ctx.lineTo(starX + starSize * 0.3, starY + starSize * 0.3)
  ctx.lineTo(starX, starY + starSize)
  ctx.lineTo(starX - starSize * 0.3, starY + starSize * 0.3)
  ctx.lineTo(starX - starSize, starY)
  ctx.lineTo(starX - starSize * 0.3, starY - starSize * 0.3)
  ctx.closePath()
  ctx.fill()

  // Star highlight
  ctx.globalAlpha = intensity * (0.7 + glowIntensity * 0.3)
  ctx.fillStyle = '#FFFFFF'
  ctx.shadowBlur = 3

  ctx.beginPath()
  ctx.arc(starX, starY, starSize * 0.4, 0, Math.PI * 2)
  ctx.fill()
}

const drawGlitterParticles = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  glitterDensity: number
): void => {
  const time = Date.now() * 0.003
  const particleCount = Math.floor(20 * glitterDensity)

  // Generate consistent pseudo-random glitter positions
  for (let i = 0; i < particleCount; i++) {
    const seed = i * 1234.5678 // Pseudo-random seed
    const x = ((seed % 1) * 0.8 + 0.1) * width
    const y = (((seed * 7) % 1) * 0.8 + 0.1) * height
    const size = ((seed * 13) % 1) * 0.008 + 0.004
    const phase = (seed * 17) % (Math.PI * 2)
    
    const twinkle = (Math.sin(time + phase) + 1) / 2
    const particleSize = size * width * (0.5 + twinkle * 0.8)
    
    ctx.globalAlpha = intensity * glitterDensity * twinkle * 0.8
    
    // Cycle through glitter colors
    const colors = ['#FF69B4', '#00FFFF', '#FFFFFF', '#FFD700', '#FF1493']
    ctx.fillStyle = colors[i % colors.length]
    ctx.shadowColor = colors[i % colors.length]
    ctx.shadowBlur = particleSize * 3

    // Diamond-shaped glitter
    ctx.beginPath()
    ctx.moveTo(x, y - particleSize)
    ctx.lineTo(x + particleSize * 0.7, y)
    ctx.lineTo(x, y + particleSize)
    ctx.lineTo(x - particleSize * 0.7, y)
    ctx.closePath()
    ctx.fill()
  }
}

const drawJemMakeup = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.6

  const leftEye = landmarks[33]
  const rightEye = landmarks[362]
  
  if (leftEye && rightEye) {
    // Bold 80s eyeshadow
    const eyeshadowGradient = ctx.createRadialGradient(
      leftEye.x * width, leftEye.y * height, width * 0.01,
      leftEye.x * width, leftEye.y * height, width * 0.05
    )
    eyeshadowGradient.addColorStop(0, 'rgba(255, 20, 147, 0.6)')
    eyeshadowGradient.addColorStop(1, 'rgba(255, 20, 147, 0)')

    ctx.fillStyle = eyeshadowGradient
    ctx.beginPath()
    ctx.ellipse(leftEye.x * width, leftEye.y * height - height * 0.02, width * 0.04, height * 0.025, 0, 0, Math.PI * 2)
    ctx.fill()

    // Right eye
    const rightEyeshadowGradient = ctx.createRadialGradient(
      rightEye.x * width, rightEye.y * height, width * 0.01,
      rightEye.x * width, rightEye.y * height, width * 0.05
    )
    rightEyeshadowGradient.addColorStop(0, 'rgba(255, 20, 147, 0.6)')
    rightEyeshadowGradient.addColorStop(1, 'rgba(255, 20, 147, 0)')

    ctx.fillStyle = rightEyeshadowGradient
    ctx.beginPath()
    ctx.ellipse(rightEye.x * width, rightEye.y * height - height * 0.02, width * 0.04, height * 0.025, 0, 0, Math.PI * 2)
    ctx.fill()

    // Bold eyeliner
    ctx.strokeStyle = '#FF1493'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    // Left eyeliner wing
    ctx.beginPath()
    ctx.moveTo(leftEye.x * width - width * 0.025, leftEye.y * height)
    ctx.lineTo(leftEye.x * width - width * 0.04, leftEye.y * height - height * 0.015)
    ctx.stroke()

    // Right eyeliner wing
    ctx.beginPath()
    ctx.moveTo(rightEye.x * width + width * 0.025, rightEye.y * height)
    ctx.lineTo(rightEye.x * width + width * 0.04, rightEye.y * height - height * 0.015)
    ctx.stroke()
  }

  // Bold lips
  const lips = landmarks[13]
  if (lips) {
    ctx.globalAlpha = intensity * 0.7
    ctx.fillStyle = '#FF69B4'
    ctx.strokeStyle = '#FF1493'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.ellipse(lips.x * width, lips.y * height, width * 0.025, height * 0.015, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

const drawHologramScanLines = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.3

  const time = Date.now() * 0.01
  const lineSpacing = height * 0.05
  const scanOffset = (time * height * 0.02) % (lineSpacing * 2)

  ctx.strokeStyle = '#00FFFF'
  ctx.lineWidth = 1

  // Moving scan lines (hologram effect)
  for (let y = -lineSpacing + scanOffset; y < height + lineSpacing; y += lineSpacing) {
    ctx.globalAlpha = intensity * 0.2 * (1 + Math.sin(time + y * 0.01))
    
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Vertical interference lines
  ctx.globalAlpha = intensity * 0.15
  ctx.strokeStyle = '#FF69B4'
  
  for (let i = 0; i < 3; i++) {
    const x = (width / 4) * (i + 1) + Math.sin(time + i) * width * 0.02
    
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
}

export const jemMask: MaskRenderer = {
  render,
  name: 'Jem',
  type: 'neon_wireframe'
}