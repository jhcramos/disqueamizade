// ═══════════════════════════════════════════════════════════════════════════
// Optimus Prime Mask — PNG helmet overlay + Canvas glowing eyes & energy effects
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'
import { loadMaskImage, getFaceBounds, drawOverlay } from './maskImageLoader'

const HELMET_PNG = '/masks/optimus-helmet.png'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const { intensity = 0.8, eyeGlow = 1.2 } = settings

  ctx.save()

  const bounds = getFaceBounds(landmarks, width, height)
  const img = loadMaskImage(HELMET_PNG)

  // ── PNG Helmet Overlay ──
  if (img) {
    const helmetWidth = bounds.faceWidth * 2.2
    const helmetHeight = helmetWidth * 1.0
    const helmetX = bounds.faceCenterX
    const helmetY = bounds.faceCenterY - bounds.faceHeight * 0.05
    drawOverlay(ctx, img, helmetX, helmetY, helmetWidth, helmetHeight, intensity * 0.95)
  }

  // ── Glowing blue eyes (Canvas accent) ──
  drawGlowingEyes(ctx, bounds, width, intensity, eyeGlow)

  // ── Autobot energy halo ──
  drawAutobotEnergy(ctx, bounds, width, height, intensity)

  ctx.restore()
}

function drawGlowingEyes(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  intensity: number,
  eyeGlow: number
): void {
  const eyeSize = width * 0.022 * eyeGlow
  const time = Date.now() * 0.004
  const pulse = (Math.sin(time) + 1) / 2

  const eyes = [bounds.leftEye, bounds.rightEye]
  eyes.forEach(eye => {
    // Outer glow
    ctx.globalAlpha = intensity * 0.7 * (0.8 + pulse * 0.2)
    ctx.shadowColor = '#3B82F6'
    ctx.shadowBlur = 25 * eyeGlow
    ctx.fillStyle = '#60A5FA'
    ctx.beginPath()
    ctx.ellipse(eye.x, eye.y, eyeSize, eyeSize * 0.7, 0, 0, Math.PI * 2)
    ctx.fill()

    // Inner bright core
    ctx.globalAlpha = intensity * 0.9
    ctx.shadowBlur = 8
    ctx.fillStyle = '#DBEAFE'
    ctx.beginPath()
    ctx.ellipse(eye.x, eye.y, eyeSize * 0.45, eyeSize * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.shadowBlur = 0
}

function drawAutobotEnergy(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  _height: number,
  intensity: number
): void {
  const time = Date.now() * 0.002

  // Subtle energy particles
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6 + time
    const dist = bounds.faceWidth * (0.8 + Math.sin(time + i * 0.7) * 0.1)
    const x = bounds.faceCenterX + Math.cos(angle) * dist
    const y = bounds.faceCenterY + Math.sin(angle) * dist
    const size = width * 0.006

    ctx.globalAlpha = intensity * 0.5 * ((Math.sin(time * 2 + i) + 1) / 2)
    ctx.fillStyle = i % 2 === 0 ? '#3B82F6' : '#DC2626'
    ctx.shadowColor = ctx.fillStyle
    ctx.shadowBlur = 8

    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0
}

export const optimusPrimeMask: MaskRenderer = {
  render,
  name: 'Optimus Prime',
  type: 'neon_wireframe'
}
