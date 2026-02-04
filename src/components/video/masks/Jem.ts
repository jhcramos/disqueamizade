// ═══════════════════════════════════════════════════════════════════════════
// Jem Mask — PNG star earrings + holographic hair outline + Canvas glitter & scan lines
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'
import { loadMaskImage, getFaceBounds, drawOverlay } from './maskImageLoader'

const JEM_PNG = '/masks/jem-stars.png'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const { intensity = 0.8, hologramEffect = 1.2, glitterDensity = 1.0 } = settings

  ctx.save()

  const bounds = getFaceBounds(landmarks, width, height)
  const img = loadMaskImage(JEM_PNG)

  // ── Holographic aura ──
  drawHolographicAura(ctx, bounds, width, height, intensity, hologramEffect)

  // ── PNG Star Earrings + Hair Outline ──
  if (img) {
    const overlayWidth = bounds.faceWidth * 2.6
    const overlayHeight = overlayWidth * 1.0
    const overlayX = bounds.faceCenterX
    const overlayY = bounds.faceCenterY - bounds.faceHeight * 0.05
    drawOverlay(ctx, img, overlayX, overlayY, overlayWidth, overlayHeight, intensity * 0.9)
  }

  // ── Bold 80s makeup (Canvas) ──
  drawJemMakeup(ctx, bounds, intensity)

  // ── Glitter particles ──
  drawGlitterParticles(ctx, width, height, intensity, glitterDensity)

  // ── Hologram scan lines ──
  drawHologramLines(ctx, width, height, intensity)

  ctx.restore()
}

function drawHolographicAura(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  height: number,
  intensity: number,
  hologramEffect: number
): void {
  const time = Date.now() * 0.003
  const shift = Math.sin(time) * 0.5 + 0.5

  ctx.globalAlpha = intensity * 0.35 * hologramEffect
  const gradient = ctx.createRadialGradient(
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 0.05,
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 1.5
  )
  const r = Math.floor(255 * (0.8 + shift * 0.2))
  const g = Math.floor(105 * (0.5 + shift * 0.5))
  const b = Math.floor(255 * (0.6 + Math.sin(time * 1.2) * 0.4))
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`)
  gradient.addColorStop(0.5, `rgba(${Math.floor(r * 0.6)}, ${g}, ${Math.floor(b * 1.1)}, 0.2)`)
  gradient.addColorStop(1, 'rgba(255, 20, 147, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawJemMakeup(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  intensity: number
): void {
  // Pink eyeshadow
  ctx.globalAlpha = intensity * 0.5
  const eyes = [bounds.leftEye, bounds.rightEye]
  eyes.forEach(eye => {
    const grad = ctx.createRadialGradient(
      eye.x, eye.y, bounds.faceWidth * 0.01,
      eye.x, eye.y, bounds.faceWidth * 0.08
    )
    grad.addColorStop(0, 'rgba(255, 20, 147, 0.5)')
    grad.addColorStop(1, 'rgba(255, 20, 147, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(eye.x, eye.y - bounds.faceWidth * 0.03, bounds.faceWidth * 0.06, bounds.faceWidth * 0.04, 0, 0, Math.PI * 2)
    ctx.fill()
  })

  // Bold eyeliner wings
  ctx.globalAlpha = intensity * 0.65
  ctx.strokeStyle = '#FF1493'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(bounds.leftEye.x - bounds.faceWidth * 0.04, bounds.leftEye.y)
  ctx.lineTo(bounds.leftEye.x - bounds.faceWidth * 0.07, bounds.leftEye.y - bounds.faceWidth * 0.025)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(bounds.rightEye.x + bounds.faceWidth * 0.04, bounds.rightEye.y)
  ctx.lineTo(bounds.rightEye.x + bounds.faceWidth * 0.07, bounds.rightEye.y - bounds.faceWidth * 0.025)
  ctx.stroke()
}

function drawGlitterParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  glitterDensity: number
): void {
  const time = Date.now() * 0.003
  const count = Math.floor(18 * glitterDensity)
  const colors = ['#FF69B4', '#00FFFF', '#FFFFFF', '#FFD700', '#FF1493']

  for (let i = 0; i < count; i++) {
    const seed = i * 1234.5678
    const x = ((seed % 1) * 0.8 + 0.1) * width
    const y = (((seed * 7) % 1) * 0.8 + 0.1) * height
    const phase = (seed * 17) % (Math.PI * 2)
    const twinkle = (Math.sin(time + phase) + 1) / 2
    const size = (((seed * 13) % 1) * 0.007 + 0.004) * width * (0.5 + twinkle * 0.8)

    ctx.globalAlpha = intensity * glitterDensity * twinkle * 0.7
    ctx.fillStyle = colors[i % colors.length]
    ctx.shadowColor = colors[i % colors.length]
    ctx.shadowBlur = size * 3

    ctx.beginPath()
    ctx.moveTo(x, y - size)
    ctx.lineTo(x + size * 0.7, y)
    ctx.lineTo(x, y + size)
    ctx.lineTo(x - size * 0.7, y)
    ctx.closePath()
    ctx.fill()
  }
  ctx.shadowBlur = 0
}

function drawHologramLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  const time = Date.now() * 0.01
  const spacing = height * 0.05
  const offset = (time * height * 0.02) % (spacing * 2)

  ctx.strokeStyle = '#00FFFF'
  ctx.lineWidth = 1

  for (let y = -spacing + offset; y < height + spacing; y += spacing) {
    ctx.globalAlpha = intensity * 0.15 * (1 + Math.sin(time + y * 0.01))
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

export const jemMask: MaskRenderer = {
  render,
  name: 'Jem',
  type: 'neon_wireframe'
}
