// ═══════════════════════════════════════════════════════════════════════════
// She-Ra Mask — PNG golden tiara overlay + Canvas sparkles, power gem rays & magic swirls
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'
import { loadMaskImage, getFaceBounds, drawOverlay } from './maskImageLoader'

const TIARA_PNG = '/masks/shera-tiara.png'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const { intensity = 0.8, sparkleIntensity = 1.0, powerGlow = 0.9 } = settings

  ctx.save()

  const bounds = getFaceBounds(landmarks, width, height)
  const img = loadMaskImage(TIARA_PNG)

  // ── Power shimmer aura ──
  drawPowerShimmer(ctx, bounds, width, height, intensity, powerGlow)

  // ── PNG Tiara Overlay ──
  if (img) {
    const tiaraWidth = bounds.faceWidth * 2.0
    const tiaraHeight = tiaraWidth * 0.55
    const tiaraX = bounds.foreheadCenterX
    const tiaraY = bounds.foreheadY - tiaraHeight * 0.08
    drawOverlay(ctx, img, tiaraX, tiaraY, tiaraWidth, tiaraHeight, intensity)
  }

  // ── Magical sparkles ──
  drawSparkles(ctx, width, height, intensity, sparkleIntensity)

  // ── Magic swirls ──
  drawMagicSwirls(ctx, bounds, width, intensity)

  ctx.restore()
}

function drawPowerShimmer(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  height: number,
  intensity: number,
  powerGlow: number
): void {
  const time = Date.now() * 0.002
  const pulse = (Math.sin(time) + 1) / 2

  ctx.globalAlpha = intensity * 0.28 * powerGlow
  const gradient = ctx.createRadialGradient(
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 0.05,
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 1.5
  )
  gradient.addColorStop(0, `rgba(255, 215, 0, ${0.5 + pulse * 0.2})`)
  gradient.addColorStop(0.3, 'rgba(255, 182, 193, 0.3)')
  gradient.addColorStop(0.6, 'rgba(135, 206, 250, 0.2)')
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawSparkles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  sparkleIntensity: number
): void {
  const time = Date.now() * 0.004
  const sparkles = [
    { x: 0.18, y: 0.12, color: '#FFD700', phase: 0 },
    { x: 0.82, y: 0.16, color: '#FF69B4', phase: 1 },
    { x: 0.1, y: 0.42, color: '#87CEEB', phase: 2 },
    { x: 0.9, y: 0.48, color: '#FFD700', phase: 3 },
    { x: 0.28, y: 0.72, color: '#FF69B4', phase: 4 },
    { x: 0.72, y: 0.78, color: '#87CEEB', phase: 5 },
    { x: 0.14, y: 0.88, color: '#FFD700', phase: 6 },
    { x: 0.86, y: 0.84, color: '#FF69B4', phase: 7 }
  ]

  sparkles.forEach(sp => {
    const twinkle = (Math.sin(time + sp.phase) + 1) / 2
    const size = width * 0.018 * (0.6 + twinkle * 0.5) * sparkleIntensity
    const x = sp.x * width
    const y = sp.y * height

    ctx.globalAlpha = intensity * sparkleIntensity * twinkle * 0.8
    ctx.fillStyle = sp.color
    ctx.shadowColor = sp.color
    ctx.shadowBlur = size * 2

    // Four-pointed star
    ctx.beginPath()
    ctx.moveTo(x, y - size)
    ctx.lineTo(x + size * 0.3, y - size * 0.3)
    ctx.lineTo(x + size, y)
    ctx.lineTo(x + size * 0.3, y + size * 0.3)
    ctx.lineTo(x, y + size)
    ctx.lineTo(x - size * 0.3, y + size * 0.3)
    ctx.lineTo(x - size, y)
    ctx.lineTo(x - size * 0.3, y - size * 0.3)
    ctx.closePath()
    ctx.fill()
  })
  ctx.shadowBlur = 0
}

function drawMagicSwirls(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  _width: number,
  intensity: number
): void {
  const time = Date.now() * 0.002
  ctx.globalAlpha = intensity * 0.35
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 8

  for (let i = 0; i < 3; i++) {
    const radius = bounds.faceWidth * (0.8 + i * 0.25)
    const angleOffset = time + (i * Math.PI * 2) / 3

    ctx.beginPath()
    for (let angle = 0; angle < Math.PI * 1.5; angle += 0.1) {
      const r = radius * (1 + Math.sin(angle * 3) * 0.2)
      const x = bounds.faceCenterX + Math.cos(angle + angleOffset) * r
      const y = bounds.faceCenterY + Math.sin(angle + angleOffset) * r
      if (angle === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.shadowBlur = 0
}

export const sheRaMask: MaskRenderer = {
  render,
  name: 'She-Ra',
  type: 'neon_wireframe'
}
