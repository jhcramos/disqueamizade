// ═══════════════════════════════════════════════════════════════════════════
// Wonder Woman Mask — PNG golden tiara w/ star overlay + Canvas lasso glow & divine sparkles
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'
import { loadMaskImage, getFaceBounds, drawOverlay } from './maskImageLoader'

const TIARA_PNG = '/masks/wonderwoman-tiara.png'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const { intensity = 0.8, lassoGlow = 1.2, heroicAura = 0.9 } = settings

  ctx.save()

  const bounds = getFaceBounds(landmarks, width, height)
  const img = loadMaskImage(TIARA_PNG)

  // ── Golden lasso frame glow ──
  drawGoldenLassoGlow(ctx, width, height, intensity, lassoGlow)

  // ── Heroic aura ──
  drawHeroicAura(ctx, bounds, width, height, intensity, heroicAura)

  // ── PNG Tiara Overlay ──
  if (img) {
    const tiaraWidth = bounds.faceWidth * 2.0
    const tiaraHeight = tiaraWidth * 0.4
    const tiaraX = bounds.foreheadCenterX
    const tiaraY = bounds.foreheadY + tiaraHeight * 0.1
    drawOverlay(ctx, img, tiaraX, tiaraY, tiaraWidth, tiaraHeight, intensity)
  }

  // ── Truth & justice sparkles ──
  drawTruthSparkles(ctx, bounds, width, height, intensity)

  // ── Divine light rays ──
  drawDivineRays(ctx, bounds, width, intensity)

  ctx.restore()
}

function drawGoldenLassoGlow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  lassoGlow: number
): void {
  const time = Date.now() * 0.003
  const pulse = (Math.sin(time) + 1) / 2

  ctx.globalAlpha = intensity * 0.35 * lassoGlow
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 5 * (1 + pulse * 0.3)
  ctx.lineCap = 'round'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 18 * lassoGlow

  const radius = Math.min(width, height) * 0.44
  const cx = width / 2
  const cy = height / 2

  ctx.beginPath()
  for (let i = 0; i <= 32; i++) {
    const angle = (i * Math.PI * 2) / 32 + time * 0.5
    const wave = Math.sin(angle * 4 + time * 2) * 0.02
    const r = radius * (1 + wave)
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.shadowBlur = 0
}

function drawHeroicAura(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  height: number,
  intensity: number,
  heroicAura: number
): void {
  ctx.globalAlpha = intensity * 0.25 * heroicAura
  const gradient = ctx.createRadialGradient(
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 0.05,
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 1.3
  )
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)')
  gradient.addColorStop(0.3, 'rgba(220, 20, 60, 0.3)')
  gradient.addColorStop(0.6, 'rgba(0, 100, 200, 0.2)')
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawTruthSparkles(
  ctx: CanvasRenderingContext2D,
  _bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  height: number,
  intensity: number
): void {
  const time = Date.now() * 0.004
  const sparkles = [
    { x: 0.2, y: 0.2, color: '#FFD700', phase: 0 },
    { x: 0.8, y: 0.25, color: '#DC143C', phase: 1 },
    { x: 0.15, y: 0.6, color: '#4682B4', phase: 2 },
    { x: 0.85, y: 0.65, color: '#FFD700', phase: 3 },
    { x: 0.3, y: 0.85, color: '#DC143C', phase: 4 },
    { x: 0.7, y: 0.9, color: '#4682B4', phase: 5 }
  ]

  sparkles.forEach(sp => {
    const twinkle = (Math.sin(time + sp.phase) + 1) / 2
    const size = width * 0.018 * (0.5 + twinkle * 0.6)
    const x = sp.x * width
    const y = sp.y * height

    ctx.globalAlpha = intensity * twinkle * 0.75
    ctx.fillStyle = sp.color
    ctx.shadowColor = sp.color
    ctx.shadowBlur = size

    // Five-pointed star
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2
      const r = i % 2 === 0 ? size : size * 0.45
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
  })
  ctx.shadowBlur = 0
}

function drawDivineRays(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  _width: number,
  intensity: number
): void {
  const time = Date.now() * 0.002
  ctx.globalAlpha = intensity * 0.25
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.shadowColor = '#FFFFFF'
  ctx.shadowBlur = 8

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + time * 0.5
    const inner = bounds.faceWidth * 0.5
    const outer = bounds.faceWidth * 0.8

    ctx.beginPath()
    ctx.moveTo(
      bounds.faceCenterX + Math.cos(angle) * inner,
      bounds.faceCenterY + Math.sin(angle) * inner
    )
    ctx.lineTo(
      bounds.faceCenterX + Math.cos(angle) * outer,
      bounds.faceCenterY + Math.sin(angle) * outer
    )
    ctx.stroke()
  }
  ctx.shadowBlur = 0
}

export const wonderWomanMask: MaskRenderer = {
  render,
  name: 'Wonder Woman',
  type: 'neon_wireframe'
}
