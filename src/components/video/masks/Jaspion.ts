// ═══════════════════════════════════════════════════════════════════════════
// Jaspion Mask — PNG tokusatsu helmet overlay + Canvas visor glow & energy effects
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'
import { loadMaskImage, getFaceBounds, drawOverlay } from './maskImageLoader'

const HELMET_PNG = '/masks/jaspion-helmet.png'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const { intensity = 0.8, visorGlow = 1.2, heroAura = 0.8 } = settings

  ctx.save()

  const bounds = getFaceBounds(landmarks, width, height)
  const img = loadMaskImage(HELMET_PNG)

  // ── Hero aura (behind) ──
  drawHeroAura(ctx, bounds, width, height, intensity, heroAura)

  // ── PNG Helmet Overlay ──
  if (img) {
    const helmetWidth = bounds.faceWidth * 2.3
    const helmetHeight = helmetWidth * 1.0
    const helmetX = bounds.faceCenterX
    const helmetY = bounds.faceCenterY - bounds.faceHeight * 0.02
    drawOverlay(ctx, img, helmetX, helmetY, helmetWidth, helmetHeight, intensity * 0.95)
  }

  // ── Visor scanner beam (animated Canvas) ──
  drawVisorScanner(ctx, bounds, width, intensity, visorGlow)

  // ── Tokusatsu energy particles ──
  drawTokusatsuEffects(ctx, bounds, width, intensity)

  ctx.restore()
}

function drawHeroAura(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  height: number,
  intensity: number,
  heroAura: number
): void {
  ctx.globalAlpha = intensity * 0.28 * heroAura
  const gradient = ctx.createRadialGradient(
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 0.1,
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 1.4
  )
  gradient.addColorStop(0, 'rgba(192, 192, 192, 0.5)')
  gradient.addColorStop(0.3, 'rgba(0, 123, 255, 0.3)')
  gradient.addColorStop(0.7, 'rgba(255, 69, 0, 0.2)')
  gradient.addColorStop(1, 'rgba(192, 192, 192, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawVisorScanner(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  intensity: number,
  visorGlow: number
): void {
  const time = Date.now() * 0.005
  const eyeCenterX = (bounds.leftEye.x + bounds.rightEye.x) / 2
  const eyeCenterY = (bounds.leftEye.y + bounds.rightEye.y) / 2
  const visorWidth = Math.abs(bounds.rightEye.x - bounds.leftEye.x) * 1.5
  const beamOffset = Math.sin(time) * visorWidth * 0.35

  // Scanning beam
  ctx.globalAlpha = intensity * visorGlow * 0.75
  ctx.strokeStyle = '#FF4500'
  ctx.lineWidth = 2.5
  ctx.shadowColor = '#FF4500'
  ctx.shadowBlur = 15

  ctx.beginPath()
  ctx.moveTo(eyeCenterX + beamOffset, eyeCenterY - width * 0.025)
  ctx.lineTo(eyeCenterX + beamOffset, eyeCenterY + width * 0.025)
  ctx.stroke()

  // Visor edge glow
  ctx.globalAlpha = intensity * visorGlow * 0.4
  ctx.strokeStyle = '#00BFFF'
  ctx.lineWidth = 1.5
  ctx.shadowColor = '#00BFFF'
  ctx.shadowBlur = 10

  ctx.beginPath()
  ctx.ellipse(eyeCenterX, eyeCenterY, visorWidth * 0.55, width * 0.03, 0, 0, Math.PI * 2)
  ctx.stroke()

  ctx.shadowBlur = 0
}

function drawTokusatsuEffects(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  intensity: number
): void {
  const time = Date.now() * 0.003

  const particles = [
    { color: '#00BFFF', phase: 0 },
    { color: '#FF4500', phase: Math.PI / 3 },
    { color: '#00BFFF', phase: 2 * Math.PI / 3 },
    { color: '#FF4500', phase: Math.PI },
    { color: '#00BFFF', phase: 4 * Math.PI / 3 },
    { color: '#FF4500', phase: 5 * Math.PI / 3 }
  ]

  particles.forEach((p, i) => {
    const dist = bounds.faceWidth * (0.85 + Math.sin(time + i) * 0.08)
    const angle = p.phase + time * 0.5
    const x = bounds.faceCenterX + Math.cos(angle) * dist
    const y = bounds.faceCenterY + Math.sin(angle) * dist

    ctx.globalAlpha = intensity * 0.55
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 8

    ctx.beginPath()
    ctx.arc(x, y, width * 0.007, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.shadowBlur = 0
}

export const jaspionMask: MaskRenderer = {
  render,
  name: 'Jaspion',
  type: 'neon_wireframe'
}
