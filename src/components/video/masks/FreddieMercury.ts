// ═══════════════════════════════════════════════════════════════════════════
// Freddie Mercury Mask — PNG mustache+crown overlay + Canvas royal aura & stage effects
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'
import { loadMaskImage, getFaceBounds, drawOverlay } from './maskImageLoader'

const FREDDIE_PNG = '/masks/freddie-mustache-crown.png'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const { intensity = 0.8, crownGlow = 1.2 } = settings

  ctx.save()

  const bounds = getFaceBounds(landmarks, width, height)
  const img = loadMaskImage(FREDDIE_PNG)

  // ── Royal purple aura (behind) ──
  drawRoyalAura(ctx, bounds, width, height, intensity)

  // ── Stage spotlights ──
  drawStageLighting(ctx, width, height, intensity)

  // ── PNG Crown + Mustache Overlay ──
  if (img) {
    const overlayWidth = bounds.faceWidth * 2.0
    const overlayHeight = overlayWidth * 1.0
    const overlayX = bounds.faceCenterX
    const overlayY = bounds.faceCenterY - bounds.faceHeight * 0.08
    drawOverlay(ctx, img, overlayX, overlayY, overlayWidth, overlayHeight, intensity)
  }

  // ── Queen sparkles (Canvas) ──
  drawQueenSparkles(ctx, width, height, intensity, crownGlow)

  ctx.restore()
}

function drawRoyalAura(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  height: number,
  intensity: number
): void {
  ctx.globalAlpha = intensity * 0.3
  const gradient = ctx.createRadialGradient(
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 0.1,
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 1.5
  )
  gradient.addColorStop(0, 'rgba(147, 51, 234, 0.5)')
  gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)')
  gradient.addColorStop(1, 'rgba(147, 51, 234, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawStageLighting(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  ctx.globalAlpha = intensity * 0.3
  const lights = [
    { x: width * 0.2, y: height * 0.05, color: '#FFD700' },
    { x: width * 0.8, y: height * 0.05, color: '#FF69B4' },
    { x: width * 0.5, y: 0, color: '#9370DB' }
  ]
  lights.forEach(light => {
    const grad = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, width * 0.3)
    grad.addColorStop(0, light.color + '50')
    grad.addColorStop(1, light.color + '00')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  })
}

function drawQueenSparkles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  crownGlow: number
): void {
  const time = Date.now() * 0.004
  const positions = [
    { x: 0.25, y: 0.15 }, { x: 0.75, y: 0.18 },
    { x: 0.15, y: 0.5 }, { x: 0.85, y: 0.55 },
    { x: 0.35, y: 0.82 }, { x: 0.65, y: 0.85 }
  ]
  const colors = ['#FFD700', '#FF69B4', '#9370DB', '#00FFFF', '#FF4500', '#FFD700']

  positions.forEach((pos, i) => {
    const twinkle = (Math.sin(time + i * 1.1) + 1) / 2
    const size = width * 0.014 * (0.6 + twinkle * 0.6) * crownGlow
    const x = pos.x * width
    const y = pos.y * height

    ctx.globalAlpha = intensity * twinkle * 0.75
    ctx.fillStyle = colors[i % colors.length]
    ctx.shadowColor = colors[i % colors.length]
    ctx.shadowBlur = size

    // Star shape
    ctx.beginPath()
    for (let j = 0; j < 8; j++) {
      const angle = (j * Math.PI) / 4
      const r = j % 2 === 0 ? size : size * 0.45
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      if (j === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
  })
  ctx.shadowBlur = 0
}

export const freddieMercuryMask: MaskRenderer = {
  render,
  name: 'Freddie Mercury',
  type: 'neon_wireframe'
}
