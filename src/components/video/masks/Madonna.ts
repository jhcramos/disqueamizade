// ═══════════════════════════════════════════════════════════════════════════
// Madonna Mask — PNG lace bow + cross earrings overlay + Canvas neon frame & makeup
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'
import { loadMaskImage, getFaceBounds, drawOverlay } from './maskImageLoader'

const MADONNA_PNG = '/masks/madonna-bow.png'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const { intensity = 0.8, neonGlow = 1.2, boldLips = 1.0 } = settings

  ctx.save()

  const bounds = getFaceBounds(landmarks, width, height)
  const img = loadMaskImage(MADONNA_PNG)

  // ── 80s neon frame ──
  draw80sNeonFrame(ctx, width, height, intensity, neonGlow)

  // ── PNG Bow + Cross Earrings Overlay ──
  if (img) {
    const overlayWidth = bounds.faceWidth * 2.5
    const overlayHeight = overlayWidth * 1.0
    const overlayX = bounds.faceCenterX
    const overlayY = bounds.faceCenterY - bounds.faceHeight * 0.05
    drawOverlay(ctx, img, overlayX, overlayY, overlayWidth, overlayHeight, intensity * 0.9)
  }

  // ── Bold 80s makeup (Canvas) ──
  drawBold80sMakeup(ctx, bounds, intensity, boldLips)

  // ── Material Girl sparkles ──
  drawMaterialGirlSparkles(ctx, width, height, intensity)

  ctx.restore()
}

function draw80sNeonFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  neonGlow: number
): void {
  const time = Date.now() * 0.003
  const frameW = width * 0.03
  const cornerR = frameW * 2

  const phase = Math.sin(time) * 0.5 + 0.5
  const r = Math.floor(255 * (0.8 + phase * 0.2))
  const g = Math.floor(20 * (0.5 + Math.sin(time * 1.3) * 0.5))
  const b = Math.floor(147 * (0.7 + Math.cos(time * 0.8) * 0.3))

  ctx.globalAlpha = intensity * 0.55 * neonGlow
  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`
  ctx.lineWidth = frameW
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = `rgb(${r}, ${g}, ${b})`
  ctx.shadowBlur = 22 * neonGlow

  ctx.beginPath()
  ctx.roundRect(frameW / 2, frameW / 2, width - frameW, height - frameW, cornerR)
  ctx.stroke()

  // Corner accent lights
  ctx.globalAlpha = intensity * (0.7 + Math.sin(time * 2) * 0.3)
  ctx.fillStyle = '#FF69B4'
  ctx.shadowColor = '#FF69B4'
  ctx.shadowBlur = 12

  const corners = [
    { x: frameW, y: frameW },
    { x: width - frameW, y: frameW },
    { x: frameW, y: height - frameW },
    { x: width - frameW, y: height - frameW }
  ]
  corners.forEach(c => {
    ctx.beginPath()
    ctx.arc(c.x, c.y, frameW * 0.35, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.shadowBlur = 0
}

function drawBold80sMakeup(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  intensity: number,
  boldLips: number
): void {
  // Blue eyeshadow
  const eyes = [bounds.leftEye, bounds.rightEye]
  eyes.forEach(eye => {
    ctx.globalAlpha = intensity * 0.55
    const grad = ctx.createRadialGradient(
      eye.x, eye.y, bounds.faceWidth * 0.01,
      eye.x, eye.y, bounds.faceWidth * 0.09
    )
    grad.addColorStop(0, 'rgba(0, 191, 255, 0.7)')
    grad.addColorStop(1, 'rgba(0, 191, 255, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(eye.x, eye.y - bounds.faceWidth * 0.04, bounds.faceWidth * 0.07, bounds.faceWidth * 0.05, 0, 0, Math.PI * 2)
    ctx.fill()
  })

  // Dramatic winged eyeliner
  ctx.globalAlpha = intensity * 0.7
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(bounds.leftEye.x - bounds.faceWidth * 0.05, bounds.leftEye.y)
  ctx.lineTo(bounds.leftEye.x - bounds.faceWidth * 0.08, bounds.leftEye.y - bounds.faceWidth * 0.025)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(bounds.rightEye.x + bounds.faceWidth * 0.05, bounds.rightEye.y)
  ctx.lineTo(bounds.rightEye.x + bounds.faceWidth * 0.08, bounds.rightEye.y - bounds.faceWidth * 0.025)
  ctx.stroke()

  // Bold red lips
  ctx.globalAlpha = intensity * boldLips * 0.7
  const lipX = bounds.upperLip.x
  const lipY = (bounds.upperLip.y + bounds.lowerLip.y) / 2
  const lipW = bounds.faceWidth * 0.25
  const lipH = Math.abs(bounds.lowerLip.y - bounds.upperLip.y) * 1.3

  ctx.fillStyle = '#DC143C'
  ctx.strokeStyle = '#8B0000'
  ctx.lineWidth = 1.5
  ctx.shadowColor = '#FF69B4'
  ctx.shadowBlur = 6

  ctx.beginPath()
  ctx.ellipse(lipX, lipY, lipW / 2, lipH / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Lip gloss highlight
  ctx.globalAlpha = intensity * boldLips * 0.45
  ctx.fillStyle = '#FFB6C1'
  ctx.beginPath()
  ctx.ellipse(lipX - lipW * 0.12, lipY - lipH * 0.12, lipW * 0.15, lipH * 0.12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

function drawMaterialGirlSparkles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  const time = Date.now() * 0.004
  const sparkles = [
    { x: 0.15, y: 0.15, color: '#FFD700', type: 'diamond' as const },
    { x: 0.85, y: 0.2, color: '#FF69B4', type: 'star' as const },
    { x: 0.1, y: 0.45, color: '#00FFFF', type: 'diamond' as const },
    { x: 0.9, y: 0.5, color: '#FFD700', type: 'star' as const },
    { x: 0.2, y: 0.8, color: '#FF69B4', type: 'diamond' as const },
    { x: 0.8, y: 0.85, color: '#00FFFF', type: 'star' as const }
  ]

  sparkles.forEach((sp, i) => {
    const twinkle = (Math.sin(time + i * 0.7) + 1) / 2
    const size = sp.type === 'diamond' ? width * 0.016 : width * 0.014
    const s = size * (0.6 + twinkle * 0.7)
    const x = sp.x * width
    const y = sp.y * height

    ctx.globalAlpha = intensity * twinkle * 0.75
    ctx.fillStyle = sp.color
    ctx.shadowColor = sp.color
    ctx.shadowBlur = s * 2

    ctx.beginPath()
    if (sp.type === 'diamond') {
      ctx.moveTo(x, y - s)
      ctx.lineTo(x + s * 0.7, y)
      ctx.lineTo(x, y + s)
      ctx.lineTo(x - s * 0.7, y)
    } else {
      ctx.moveTo(x, y - s)
      ctx.lineTo(x + s * 0.3, y - s * 0.3)
      ctx.lineTo(x + s, y)
      ctx.lineTo(x + s * 0.3, y + s * 0.3)
      ctx.lineTo(x, y + s)
      ctx.lineTo(x - s * 0.3, y + s * 0.3)
      ctx.lineTo(x - s, y)
      ctx.lineTo(x - s * 0.3, y - s * 0.3)
    }
    ctx.closePath()
    ctx.fill()
  })
  ctx.shadowBlur = 0
}

export const madonnaMask: MaskRenderer = {
  render,
  name: 'Madonna',
  type: 'neon_wireframe'
}
