// ═══════════════════════════════════════════════════════════════════════════
// He-Man Mask — PNG golden crown overlay + Canvas power aura & warrior effects
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'
import { loadMaskImage, getFaceBounds, drawOverlay } from './maskImageLoader'

const CROWN_PNG = '/masks/heman-crown.png'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const { intensity = 0.8, glowStrength = 1.0 } = settings

  ctx.save()

  const bounds = getFaceBounds(landmarks, width, height)
  const img = loadMaskImage(CROWN_PNG)

  // ── Power Aura (behind everything) ──
  drawPowerAura(ctx, bounds, width, height, intensity, glowStrength)

  // ── PNG Crown Overlay ──
  if (img) {
    const crownWidth = bounds.faceWidth * 1.6
    const crownHeight = crownWidth * 0.65
    const crownX = bounds.foreheadCenterX
    const crownY = bounds.foreheadY - crownHeight * 0.15
    drawOverlay(ctx, img, crownX, crownY, crownWidth, crownHeight, intensity)
  }

  // ── Canvas accent effects ──
  drawEnergyParticles(ctx, bounds, width, height, intensity, glowStrength)
  drawWarriorMarks(ctx, bounds, width, height, intensity)

  ctx.restore()
}

function drawPowerAura(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  height: number,
  intensity: number,
  glowStrength: number
): void {
  ctx.globalAlpha = intensity * 0.35 * glowStrength
  const time = Date.now() * 0.002
  const pulse = (Math.sin(time) + 1) / 2

  const gradient = ctx.createRadialGradient(
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 0.15,
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 1.2
  )
  gradient.addColorStop(0, `rgba(255, 215, 0, ${0.5 + pulse * 0.3})`)
  gradient.addColorStop(0.4, 'rgba(255, 165, 0, 0.25)')
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawEnergyParticles(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  _height: number,
  intensity: number,
  glowStrength: number
): void {
  const time = Date.now() * 0.003

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8 + time * 0.5
    const distance = bounds.faceWidth * (0.7 + Math.sin(time + i) * 0.15)
    const x = bounds.faceCenterX + Math.cos(angle) * distance
    const y = bounds.faceCenterY + Math.sin(angle) * distance
    const size = width * 0.008 * (0.6 + Math.sin(time * 2 + i) * 0.4)

    ctx.globalAlpha = intensity * glowStrength * 0.7
    ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#FFA500'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 12

    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0
}

function drawWarriorMarks(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  _width: number,
  height: number,
  intensity: number
): void {
  ctx.globalAlpha = intensity * 0.45
  ctx.strokeStyle = '#8B4513'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  // Left cheek marks
  for (let i = 0; i < 3; i++) {
    const y = bounds.leftCheek.y + (i - 1) * height * 0.012
    ctx.beginPath()
    ctx.moveTo(bounds.leftCheek.x - bounds.faceWidth * 0.06, y)
    ctx.lineTo(bounds.leftCheek.x + bounds.faceWidth * 0.02, y)
    ctx.stroke()
  }
  // Right cheek marks
  for (let i = 0; i < 3; i++) {
    const y = bounds.rightCheek.y + (i - 1) * height * 0.012
    ctx.beginPath()
    ctx.moveTo(bounds.rightCheek.x - bounds.faceWidth * 0.02, y)
    ctx.lineTo(bounds.rightCheek.x + bounds.faceWidth * 0.06, y)
    ctx.stroke()
  }
}

export const heManMask: MaskRenderer = {
  render,
  name: 'He-Man',
  type: 'neon_wireframe'
}
