// ═══════════════════════════════════════════════════════════════════════════
// He-Man Mask — Golden crown/tiara, strong jaw, blond hair, power glow aura
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
    glowStrength = 1.0,
    crownSize = 1.2
  } = settings

  ctx.save()

  // Get key landmarks
  const forehead = landmarks[9]   // Center forehead
  const leftTemple = landmarks[54]  // Left temple
  const rightTemple = landmarks[284] // Right temple
  const jawLeft = landmarks[172]    // Left jaw
  const jawRight = landmarks[397]   // Right jaw
  const chinTip = landmarks[18]     // Chin tip

  if (!forehead || !leftTemple || !rightTemple) {
    ctx.restore()
    return
  }

  // Draw power glow aura first (behind everything)
  drawPowerAura(ctx, landmarks, width, height, intensity)

  // Draw blond flowing hair outline
  drawBlondHair(ctx, landmarks, width, height, intensity)

  // Draw golden crown/tiara
  drawGoldenCrown(ctx, forehead, leftTemple, rightTemple, width, height, intensity, crownSize)

  // Enhance jaw line (strong jaw)
  drawStrongJaw(ctx, jawLeft, jawRight, chinTip, width, height, intensity)

  // Add He-Man face paint/warrior marks
  drawWarriorMarks(ctx, landmarks, width, height, intensity)

  ctx.restore()
}

const drawPowerAura = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.4

  // Create gradient for power glow
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const gradient = ctx.createRadialGradient(
    centerX, centerY, width * 0.1,
    centerX, centerY, width * 0.4
  )
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)') // Gold
  gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.3)') // Orange
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

const drawBlondHair = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.7

  // Hair outline points (around head)
  const hairPoints = [
    landmarks[10], landmarks[151], landmarks[9], landmarks[10], // Top
    landmarks[54], landmarks[103], landmarks[67], landmarks[109], // Left side
    landmarks[284], landmarks[332], landmarks[297], landmarks[338] // Right side
  ].filter(Boolean)

  if (hairPoints.length < 4) return

  // Draw flowing hair strands
  ctx.strokeStyle = '#FFD700' // Golden yellow
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.shadowColor = '#FFA500'
  ctx.shadowBlur = 15

  for (let i = 0; i < hairPoints.length - 1; i++) {
    const point = hairPoints[i]
    const nextPoint = hairPoints[i + 1]
    
    ctx.beginPath()
    ctx.moveTo(point.x * width, point.y * height)
    
    // Create flowing curve
    const controlX = (point.x + nextPoint.x) * width / 2 + (Math.random() - 0.5) * width * 0.1
    const controlY = (point.y + nextPoint.y) * height / 2 - height * 0.05
    
    ctx.quadraticCurveTo(
      controlX, controlY,
      nextPoint.x * width, nextPoint.y * height
    )
    ctx.stroke()
  }
}

const drawGoldenCrown = (
  ctx: CanvasRenderingContext2D,
  forehead: any,
  leftTemple: any,
  rightTemple: any,
  width: number,
  height: number,
  intensity: number,
  crownSize: number
): void => {
  ctx.globalAlpha = intensity

  const centerX = forehead.x * width
  const centerY = forehead.y * height - height * 0.08
  const crownWidth = Math.abs(rightTemple.x - leftTemple.x) * width * crownSize
  const crownHeight = height * 0.06

  // Crown base
  ctx.fillStyle = '#FFD700' // Pure gold
  ctx.shadowColor = '#FFA500'
  ctx.shadowBlur = 20
  
  ctx.beginPath()
  ctx.ellipse(centerX, centerY, crownWidth * 0.6, crownHeight * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Crown spikes
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'

  for (let i = -2; i <= 2; i++) {
    const spikeX = centerX + (i * crownWidth * 0.15)
    const spikeHeight = i === 0 ? crownHeight * 1.5 : crownHeight
    
    ctx.beginPath()
    ctx.moveTo(spikeX, centerY + crownHeight * 0.2)
    ctx.lineTo(spikeX, centerY - spikeHeight)
    ctx.stroke()
  }

  // Central gem
  ctx.fillStyle = '#FF4500' // Orange-red gem
  ctx.beginPath()
  ctx.ellipse(centerX, centerY - crownHeight * 0.5, crownHeight * 0.3, crownHeight * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
}

const drawStrongJaw = (
  ctx: CanvasRenderingContext2D,
  jawLeft: any,
  jawRight: any,
  chinTip: any,
  width: number,
  height: number,
  intensity: number
): void => {
  if (!jawLeft || !jawRight || !chinTip) return

  ctx.globalAlpha = intensity * 0.6
  ctx.strokeStyle = '#8B4513' // Brown for jaw definition
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.shadowColor = '#654321'
  ctx.shadowBlur = 8

  // Enhanced jaw line
  ctx.beginPath()
  ctx.moveTo(jawLeft.x * width, jawLeft.y * height)
  ctx.quadraticCurveTo(
    chinTip.x * width, chinTip.y * height + height * 0.02,
    jawRight.x * width, jawRight.y * height
  )
  ctx.stroke()

  // Strong chin enhancement
  ctx.fillStyle = 'rgba(139, 69, 19, 0.3)'
  ctx.beginPath()
  ctx.ellipse(
    chinTip.x * width, 
    chinTip.y * height + height * 0.01,
    width * 0.03, 
    height * 0.02, 
    0, 0, Math.PI * 2
  )
  ctx.fill()
}

const drawWarriorMarks = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.5

  // Face paint stripes (like war paint)
  const leftCheek = landmarks[116]
  const rightCheek = landmarks[345]

  if (leftCheek && rightCheek) {
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    // Left cheek marks
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(
        leftCheek.x * width - width * 0.02, 
        leftCheek.y * height + (i - 1) * height * 0.015
      )
      ctx.lineTo(
        leftCheek.x * width + width * 0.02, 
        leftCheek.y * height + (i - 1) * height * 0.015
      )
      ctx.stroke()
    }

    // Right cheek marks
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(
        rightCheek.x * width - width * 0.02, 
        rightCheek.y * height + (i - 1) * height * 0.015
      )
      ctx.lineTo(
        rightCheek.x * width + width * 0.02, 
        rightCheek.y * height + (i - 1) * height * 0.015
      )
      ctx.stroke()
    }
  }
}

export const heManMask: MaskRenderer = {
  render,
  name: 'He-Man',
  type: 'neon_wireframe' // Using existing type for now
}