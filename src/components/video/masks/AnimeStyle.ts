// ═══════════════════════════════════════════════════════════════════════════
// Anime Style Mask — Stylized Anime-like Face Rendering
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const {
    eyeSize = 1.5,
    skinSmooth = 0.8,
    intensity = 0.7,
    colorBoost = 1.2
  } = settings

  ctx.save()

  // Get key landmarks
  const leftEye = landmarks[33]
  const rightEye = landmarks[362]
  const leftEyeOuter = landmarks[130]
  const rightEyeOuter = landmarks[359]
  const nose = landmarks[1]
  const mouth = landmarks[13]

  if (!leftEye || !rightEye || !nose || !mouth) {
    ctx.restore()
    return
  }

  // Draw enlarged anime eyes
  drawAnimeEyes(ctx, leftEye, rightEye, leftEyeOuter, rightEyeOuter, width, height, eyeSize, intensity)

  // Draw small anime nose (just a tiny dot or line)
  drawAnimeNose(ctx, nose, width, height, intensity)

  // Add anime-style highlights and effects
  drawAnimeHighlights(ctx, leftEye, rightEye, width, height, intensity)

  // Add blush on cheeks
  drawAnimeBlush(ctx, landmarks, width, height, intensity)

  ctx.restore()
}

const drawAnimeEyes = (
  ctx: CanvasRenderingContext2D,
  leftEye: any,
  rightEye: any,
  leftEyeOuter: any,
  rightEyeOuter: any,
  width: number,
  height: number,
  eyeSize: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity

  // Calculate eye dimensions
  const baseEyeWidth = Math.abs(leftEyeOuter.x - leftEye.x) * width
  const eyeWidth = baseEyeWidth * eyeSize
  const eyeHeight = eyeWidth * 0.8

  // Left anime eye
  const leftCenterX = leftEye.x * width
  const leftCenterY = leftEye.y * height

  // Draw left eye outline (larger)
  ctx.strokeStyle = '#2d3748'
  ctx.lineWidth = 3
  ctx.fillStyle = '#ffffff'
  
  ctx.beginPath()
  ctx.ellipse(leftCenterX, leftCenterY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Draw left iris (larger and more colorful)
  ctx.fillStyle = '#4a90e2'
  ctx.beginPath()
  ctx.ellipse(leftCenterX, leftCenterY, eyeWidth * 0.6, eyeHeight * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()

  // Draw left pupil
  ctx.fillStyle = '#1a202c'
  ctx.beginPath()
  ctx.ellipse(leftCenterX, leftCenterY, eyeWidth * 0.25, eyeHeight * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Right anime eye
  const rightCenterX = rightEye.x * width
  const rightCenterY = rightEye.y * height

  // Draw right eye outline (larger)
  ctx.fillStyle = '#ffffff'
  
  ctx.beginPath()
  ctx.ellipse(rightCenterX, rightCenterY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Draw right iris
  ctx.fillStyle = '#4a90e2'
  ctx.beginPath()
  ctx.ellipse(rightCenterX, rightCenterY, eyeWidth * 0.6, eyeHeight * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()

  // Draw right pupil
  ctx.fillStyle = '#1a202c'
  ctx.beginPath()
  ctx.ellipse(rightCenterX, rightCenterY, eyeWidth * 0.25, eyeHeight * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
}

const drawAnimeNose = (
  ctx: CanvasRenderingContext2D,
  nose: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.6

  // Very minimal anime nose - just a small shadow line
  const noseX = nose.x * width
  const noseY = nose.y * height
  
  ctx.strokeStyle = '#d1a3a3'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  
  ctx.beginPath()
  ctx.moveTo(noseX - width * 0.008, noseY)
  ctx.lineTo(noseX + width * 0.008, noseY + height * 0.015)
  ctx.stroke()
}

const drawAnimeHighlights = (
  ctx: CanvasRenderingContext2D,
  leftEye: any,
  rightEye: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.9

  // Eye highlights (typical anime sparkles)
  const highlightSize = width * 0.015

  // Left eye main highlight
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(
    leftEye.x * width - highlightSize,
    leftEye.y * height - highlightSize,
    highlightSize,
    0,
    Math.PI * 2
  )
  ctx.fill()

  // Left eye small highlight
  ctx.beginPath()
  ctx.arc(
    leftEye.x * width + highlightSize * 0.5,
    leftEye.y * height - highlightSize * 0.5,
    highlightSize * 0.4,
    0,
    Math.PI * 2
  )
  ctx.fill()

  // Right eye main highlight
  ctx.beginPath()
  ctx.arc(
    rightEye.x * width - highlightSize,
    rightEye.y * height - highlightSize,
    highlightSize,
    0,
    Math.PI * 2
  )
  ctx.fill()

  // Right eye small highlight
  ctx.beginPath()
  ctx.arc(
    rightEye.x * width + highlightSize * 0.5,
    rightEye.y * height - highlightSize * 0.5,
    highlightSize * 0.4,
    0,
    Math.PI * 2
  )
  ctx.fill()
}

const drawAnimeBlush = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.4

  // Get cheek positions (approximate)
  const leftCheek = landmarks[116]  // Left cheek area
  const rightCheek = landmarks[345] // Right cheek area

  if (!leftCheek || !rightCheek) return

  const blushSize = width * 0.04

  // Soft pink blush
  ctx.fillStyle = '#ff9fb5'
  
  // Left blush
  ctx.beginPath()
  ctx.ellipse(
    leftCheek.x * width + width * 0.02,
    leftCheek.y * height + height * 0.01,
    blushSize,
    blushSize * 0.6,
    0,
    0,
    Math.PI * 2
  )
  ctx.fill()

  // Right blush
  ctx.beginPath()
  ctx.ellipse(
    rightCheek.x * width - width * 0.02,
    rightCheek.y * height + height * 0.01,
    blushSize,
    blushSize * 0.6,
    0,
    0,
    Math.PI * 2
  )
  ctx.fill()
}

export const animeStyleMask: MaskRenderer = {
  render,
  name: 'Anime Style',
  type: 'anime_style'
}