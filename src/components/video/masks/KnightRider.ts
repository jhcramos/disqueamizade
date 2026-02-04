// ═══════════════════════════════════════════════════════════════════════════
// Knight Rider Mask — PNG hair+glasses+collar overlay + Canvas KITT scanner animation
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'
import { loadMaskImage, getFaceBounds, drawOverlay } from './maskImageLoader'

const KNIGHT_PNG = '/masks/knightrider-hair-scanner.png'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const { intensity = 0.8, scannerSpeed = 1.0 } = settings

  ctx.save()

  const bounds = getFaceBounds(landmarks, width, height)
  const img = loadMaskImage(KNIGHT_PNG)

  // ── 80s neon glow (behind) ──
  draw80sGlow(ctx, bounds, width, height, intensity)

  // ── PNG Hair + Aviators + Collar ──
  if (img) {
    const overlayWidth = bounds.faceWidth * 2.4
    const overlayHeight = overlayWidth * 1.0
    const overlayX = bounds.faceCenterX
    const overlayY = bounds.faceCenterY + bounds.faceHeight * 0.05
    drawOverlay(ctx, img, overlayX, overlayY, overlayWidth, overlayHeight, intensity)
  }

  // ── Animated KITT Scanner (Canvas) ──
  drawKITTScanner(ctx, bounds, width, height, intensity, scannerSpeed)

  ctx.restore()
}

function draw80sGlow(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  height: number,
  intensity: number
): void {
  ctx.globalAlpha = intensity * 0.25
  const gradient = ctx.createRadialGradient(
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 0.1,
    bounds.faceCenterX, bounds.faceCenterY, bounds.faceWidth * 1.3
  )
  gradient.addColorStop(0, 'rgba(255, 20, 147, 0.25)')
  gradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.15)')
  gradient.addColorStop(1, 'rgba(255, 20, 147, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawKITTScanner(
  ctx: CanvasRenderingContext2D,
  bounds: ReturnType<typeof getFaceBounds>,
  width: number,
  _height: number,
  intensity: number,
  scannerSpeed: number
): void {
  const eyeCenterY = (bounds.leftEye.y + bounds.rightEye.y) / 2
  const scannerWidth = Math.abs(bounds.rightEye.x - bounds.leftEye.x) * 1.6
  const scannerHeight = width * 0.012
  const centerX = (bounds.leftEye.x + bounds.rightEye.x) / 2

  // Animated position
  const time = Date.now() * 0.003 * scannerSpeed
  const offset = Math.sin(time) * scannerWidth * 0.35

  // Scanner bar background
  ctx.globalAlpha = intensity * 0.7
  ctx.fillStyle = 'rgba(30, 30, 30, 0.75)'
  ctx.beginPath()
  ctx.roundRect(
    centerX - scannerWidth / 2, eyeCenterY - scannerHeight / 2,
    scannerWidth, scannerHeight, scannerHeight / 2
  )
  ctx.fill()

  // Moving red light
  ctx.globalAlpha = intensity * 0.95
  const scanGrad = ctx.createLinearGradient(
    centerX + offset - width * 0.06, eyeCenterY,
    centerX + offset + width * 0.06, eyeCenterY
  )
  scanGrad.addColorStop(0, 'rgba(255, 0, 0, 0)')
  scanGrad.addColorStop(0.5, 'rgba(255, 0, 0, 1)')
  scanGrad.addColorStop(1, 'rgba(255, 0, 0, 0)')

  ctx.fillStyle = scanGrad
  ctx.shadowColor = '#FF0000'
  ctx.shadowBlur = 20

  ctx.beginPath()
  ctx.roundRect(
    centerX + offset - width * 0.06, eyeCenterY - scannerHeight / 2,
    width * 0.12, scannerHeight, scannerHeight / 2
  )
  ctx.fill()

  // Scanner reflection dots
  ctx.globalAlpha = intensity * 0.6
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(
      centerX + offset - width * 0.015 + i * width * 0.015,
      eyeCenterY,
      scannerHeight * 0.25,
      0, Math.PI * 2
    )
    ctx.fill()
  }
  ctx.shadowBlur = 0
}

export const knightRiderMask: MaskRenderer = {
  render,
  name: 'Knight Rider',
  type: 'neon_wireframe'
}
