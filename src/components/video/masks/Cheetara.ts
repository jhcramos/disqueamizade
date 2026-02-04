// ═══════════════════════════════════════════════════════════════════════════
// Cheetara Mask — PNG cat ears + spots + whiskers overlay + Canvas speed lines & cat eyes
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'
import { loadMaskImage, getFaceBounds, drawOverlay } from './maskImageLoader'

const CHEETARA_PNG = '/masks/cheetara-ears.png'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const { intensity = 0.8, catEyeIntensity = 1.2 } = settings

  ctx.save()

  const bounds = getFaceBounds(landmarks, width, height)
  const img = loadMaskImage(CHEETARA_PNG)

  // ── ThunderCats energy aura ──
  drawThunderCatsAura(ctx, bounds, width, height, intensity)

  // ── PNG Cat Ears + Spots + Whiskers ──
  if (img) {
    const overlayWidth = bounds.faceWidth * 2.3
    const overlayHeight = overlayWidth * 1.0
    const overlayX = bounds.faceCenterX
    const overlayY = bounds.faceCenterY - bounds.faceHeight * 0.02
    drawOverlay(ctx, img, overlayX, overlayY, overlayWidth, overlayHeight, intensity * 0.9)
  }

  // ── Enhanced cat eyes (Canvas) ──
  drawCatEyes(ctx, bounds, width, intensity, catEyeIntensity)

  // ── Speed lines ──
  drawSpeedLines(ctx, width, height, intensity)

  // ── Feline grace sparkles ──
  drawFelineSparkles(ctx, bounds, width, height, intensity)

  ctx.restore()
}

function drawThunderCatsAura(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  height: number,
  intensity: number
): void {
  const time = Date.now() * 0.003
  const pulse = (Math.sin(time) + 1) / 2

  ctx.globalAlpha = intensity * 0.35
  const gradient = ctx.createRadialGradient(
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 0.05,
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 1.4
  )
  gradient.addColorStop(0, `rgba(255, 140, 0, ${0.5 + pulse * 0.2})`)
  gradient.addColorStop(0.3, 'rgba(255, 69, 0, 0.3)')
  gradient.addColorStop(0.6, 'rgba(255, 215, 0, 0.2)')
  gradient.addColorStop(1, 'rgba(255, 140, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawCatEyes(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  intensity: number,
  catEyeIntensity: number
): void {
  const eyeW = width * 0.035
  const eyeH = width * 0.022

  const eyes = [
    { ...bounds.leftEye, dir: -1 },
    { ...bounds.rightEye, dir: 1 }
  ]

  eyes.forEach(eye => {
    // Golden cat eye
    ctx.globalAlpha = intensity * catEyeIntensity * 0.85
    ctx.fillStyle = '#FFD700'
    ctx.strokeStyle = '#FF8C00'
    ctx.lineWidth = 2
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 10

    ctx.beginPath()
    ctx.ellipse(eye.x, eye.y, eyeW, eyeH, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Vertical slit pupil
    ctx.globalAlpha = intensity * catEyeIntensity * 0.9
    ctx.fillStyle = '#000000'
    ctx.shadowBlur = 3
    ctx.beginPath()
    ctx.ellipse(eye.x, eye.y, eyeW * 0.12, eyeH * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()

    // Eye reflection
    ctx.globalAlpha = intensity * catEyeIntensity * 0.7
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(eye.x - eyeW * 0.3, eye.y - eyeH * 0.3, eyeW * 0.18, eyeH * 0.18, 0, 0, Math.PI * 2)
    ctx.fill()

    // Dramatic eyeliner wing
    ctx.globalAlpha = intensity * catEyeIntensity * 0.8
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.shadowBlur = 0

    ctx.beginPath()
    ctx.moveTo(eye.x + eye.dir * eyeW, eye.y)
    ctx.lineTo(eye.x + eye.dir * eyeW * 1.5, eye.y - eyeH * 0.5)
    ctx.stroke()
  })
  ctx.shadowBlur = 0
}

function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  const time = Date.now() * 0.01

  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 8

  for (let i = 0; i < 7; i++) {
    const y = (height / 8) * (i + 1)
    const lineOffset = (time * width * 0.08 + i * width * 0.2) % (width * 1.5) - width * 0.25
    const lineLength = width * 0.25

    ctx.globalAlpha = intensity * 0.4 * Math.max(0, 1 - Math.abs(lineOffset) / (width * 0.6))

    if (lineOffset > -width * 0.2 && lineOffset < width * 1.2) {
      ctx.beginPath()
      ctx.moveTo(lineOffset, y)
      ctx.lineTo(lineOffset + lineLength, y)
      ctx.stroke()
    }
  }
  ctx.shadowBlur = 0
}

function drawFelineSparkles(
  ctx: CanvasRenderingContext2D,
  _bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  height: number,
  intensity: number
): void {
  const time = Date.now() * 0.005
  const sparkles = [
    { x: 0.2, y: 0.3, color: '#FFD700', phase: 0 },
    { x: 0.8, y: 0.35, color: '#FF8C00', phase: 1 },
    { x: 0.15, y: 0.65, color: '#FFD700', phase: 2 },
    { x: 0.85, y: 0.7, color: '#FF4500', phase: 3 },
    { x: 0.3, y: 0.88, color: '#FFD700', phase: 4 },
    { x: 0.7, y: 0.85, color: '#FF8C00', phase: 5 }
  ]

  sparkles.forEach(sp => {
    const twinkle = (Math.sin(time + sp.phase) + 1) / 2
    const size = width * 0.012 * (0.5 + twinkle * 0.7)
    const x = sp.x * width
    const y = sp.y * height

    ctx.globalAlpha = intensity * twinkle * 0.6
    ctx.fillStyle = sp.color
    ctx.shadowColor = sp.color
    ctx.shadowBlur = size * 2

    // Paw print sparkle
    ctx.beginPath()
    ctx.ellipse(x, y, size * 0.6, size * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()

    for (let j = 0; j < 4; j++) {
      const angle = (j * Math.PI) / 2 - Math.PI / 4
      const px = x + Math.cos(angle) * size * 0.5
      const py = y + Math.sin(angle) * size * 0.5 - size * 0.6
      ctx.beginPath()
      ctx.ellipse(px, py, size * 0.2, size * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  ctx.shadowBlur = 0
}

export const cheetaraMask: MaskRenderer = {
  render,
  name: 'Cheetara',
  type: 'neon_wireframe'
}
