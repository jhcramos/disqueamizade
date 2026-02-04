// ═══════════════════════════════════════════════════════════════════════════
// Animal Morph Mask — Transform into Cute Animals
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'

type AnimalType = 'cat' | 'dog' | 'fox' | 'owl'

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const {
    animal = 'cat',
    intensity = 0.8,
    showWhiskers = true,
    showEars = true,
    showNose = true
  } = settings

  switch (animal) {
    case 'cat':
      renderCatFace(ctx, landmarks, width, height, { intensity, showWhiskers, showEars, showNose })
      break
    case 'dog':
      renderDogFace(ctx, landmarks, width, height, { intensity, showEars, showNose })
      break
    case 'fox':
      renderFoxFace(ctx, landmarks, width, height, { intensity, showEars, showNose })
      break
    case 'owl':
      renderOwlFace(ctx, landmarks, width, height, { intensity })
      break
    default:
      renderCatFace(ctx, landmarks, width, height, { intensity, showWhiskers, showEars, showNose })
  }
}

const renderCatFace = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  options: { intensity: number; showWhiskers: boolean; showEars: boolean; showNose: boolean }
): void => {
  ctx.save()
  ctx.globalAlpha = options.intensity

  // Get key landmarks
  const noseTip = landmarks[1]
  const leftEye = landmarks[33]
  const rightEye = landmarks[362]
  const forehead = landmarks[10]

  if (!noseTip || !leftEye || !rightEye) {
    ctx.restore()
    return
  }

  // Cat ears
  if (options.showEars && forehead) {
    drawCatEars(ctx, forehead, leftEye, rightEye, width, height)
  }

  // Cat nose
  if (options.showNose) {
    drawCatNose(ctx, noseTip, width, height)
  }

  // Cat whiskers
  if (options.showWhiskers) {
    drawCatWhiskers(ctx, landmarks, width, height)
  }

  ctx.restore()
}

const renderDogFace = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  options: { intensity: number; showEars: boolean; showNose: boolean }
): void => {
  ctx.save()
  ctx.globalAlpha = options.intensity

  const noseTip = landmarks[1]
  const leftEye = landmarks[33]
  const rightEye = landmarks[362]
  const forehead = landmarks[10]

  if (!noseTip || !leftEye || !rightEye) {
    ctx.restore()
    return
  }

  // Dog ears (floppy)
  if (options.showEars && forehead) {
    drawDogEars(ctx, forehead, leftEye, rightEye, width, height)
  }

  // Dog nose
  if (options.showNose) {
    drawDogNose(ctx, noseTip, width, height)
  }

  // Dog tongue (occasionally)
  const mouthCenter = landmarks[13]
  if (mouthCenter && Math.random() > 0.95) { // 5% chance per frame
    drawDogTongue(ctx, mouthCenter, width, height)
  }

  ctx.restore()
}

const renderFoxFace = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  options: { intensity: number; showEars: boolean; showNose: boolean }
): void => {
  ctx.save()
  ctx.globalAlpha = options.intensity

  const noseTip = landmarks[1]
  const leftEye = landmarks[33]
  const rightEye = landmarks[362]
  const forehead = landmarks[10]

  if (!noseTip || !leftEye || !rightEye) {
    ctx.restore()
    return
  }

  // Fox ears (pointed, orange)
  if (options.showEars && forehead) {
    drawFoxEars(ctx, forehead, leftEye, rightEye, width, height)
  }

  // Fox nose (black)
  if (options.showNose) {
    drawFoxNose(ctx, noseTip, width, height)
  }

  ctx.restore()
}

const renderOwlFace = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  options: { intensity: number }
): void => {
  ctx.save()
  ctx.globalAlpha = options.intensity

  const leftEye = landmarks[33]
  const rightEye = landmarks[362]
  const noseTip = landmarks[1]

  if (!leftEye || !rightEye || !noseTip) {
    ctx.restore()
    return
  }

  // Large owl eyes
  drawOwlEyes(ctx, leftEye, rightEye, width, height)

  // Small owl beak
  drawOwlBeak(ctx, noseTip, width, height)

  ctx.restore()
}

const drawCatEars = (
  ctx: CanvasRenderingContext2D,
  forehead: any,
  leftEye: any,
  rightEye: any,
  width: number,
  height: number
): void => {
  const foreheadX = forehead.x * width
  const foreheadY = forehead.y * height
  const eyeDistance = Math.abs(leftEye.x - rightEye.x) * width
  
  const earSize = eyeDistance * 0.8
  const earOffset = eyeDistance * 0.7

  // Draw left ear
  ctx.fillStyle = '#ff6b9d'
  ctx.beginPath()
  ctx.moveTo(foreheadX - earOffset, foreheadY - earSize * 0.3)
  ctx.lineTo(foreheadX - earOffset - earSize * 0.6, foreheadY - earSize)
  ctx.lineTo(foreheadX - earOffset + earSize * 0.3, foreheadY - earSize * 0.8)
  ctx.closePath()
  ctx.fill()

  // Inner ear (pink)
  ctx.fillStyle = '#ffb3d9'
  ctx.beginPath()
  ctx.moveTo(foreheadX - earOffset, foreheadY - earSize * 0.4)
  ctx.lineTo(foreheadX - earOffset - earSize * 0.3, foreheadY - earSize * 0.8)
  ctx.lineTo(foreheadX - earOffset + earSize * 0.15, foreheadY - earSize * 0.6)
  ctx.closePath()
  ctx.fill()

  // Draw right ear
  ctx.fillStyle = '#ff6b9d'
  ctx.beginPath()
  ctx.moveTo(foreheadX + earOffset, foreheadY - earSize * 0.3)
  ctx.lineTo(foreheadX + earOffset + earSize * 0.6, foreheadY - earSize)
  ctx.lineTo(foreheadX + earOffset - earSize * 0.3, foreheadY - earSize * 0.8)
  ctx.closePath()
  ctx.fill()

  // Inner ear (pink)
  ctx.fillStyle = '#ffb3d9'
  ctx.beginPath()
  ctx.moveTo(foreheadX + earOffset, foreheadY - earSize * 0.4)
  ctx.lineTo(foreheadX + earOffset + earSize * 0.3, foreheadY - earSize * 0.8)
  ctx.lineTo(foreheadX + earOffset - earSize * 0.15, foreheadY - earSize * 0.6)
  ctx.closePath()
  ctx.fill()
}

const drawCatNose = (
  ctx: CanvasRenderingContext2D,
  noseTip: any,
  width: number,
  height: number
): void => {
  const x = noseTip.x * width
  const y = noseTip.y * height
  const size = width * 0.015

  // Draw pink triangle nose
  ctx.fillStyle = '#ff6b9d'
  ctx.beginPath()
  ctx.moveTo(x, y - size)
  ctx.lineTo(x - size, y + size)
  ctx.lineTo(x + size, y + size)
  ctx.closePath()
  ctx.fill()

  // Add highlight
  ctx.fillStyle = '#ffccdd'
  ctx.beginPath()
  ctx.arc(x - size * 0.3, y - size * 0.2, size * 0.3, 0, Math.PI * 2)
  ctx.fill()
}

const drawCatWhiskers = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number
): void => {
  const noseTip = landmarks[1]
  const leftCheek = landmarks[116]
  const rightCheek = landmarks[345]

  if (!noseTip || !leftCheek || !rightCheek) return

  const noseX = noseTip.x * width
  const noseY = noseTip.y * height

  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  const whiskerLength = width * 0.12

  // Left whiskers
  for (let i = 0; i < 3; i++) {
    const angle = (i - 1) * 0.3 - Math.PI
    ctx.beginPath()
    ctx.moveTo(noseX - width * 0.03, noseY + i * 8 - 8)
    ctx.lineTo(
      noseX - width * 0.03 + Math.cos(angle) * whiskerLength,
      noseY + i * 8 - 8 + Math.sin(angle) * whiskerLength * 0.3
    )
    ctx.stroke()
  }

  // Right whiskers
  for (let i = 0; i < 3; i++) {
    const angle = (i - 1) * 0.3
    ctx.beginPath()
    ctx.moveTo(noseX + width * 0.03, noseY + i * 8 - 8)
    ctx.lineTo(
      noseX + width * 0.03 + Math.cos(angle) * whiskerLength,
      noseY + i * 8 - 8 + Math.sin(angle) * whiskerLength * 0.3
    )
    ctx.stroke()
  }
}

// Additional animal functions (simplified for brevity)
const drawDogEars = (ctx: CanvasRenderingContext2D, forehead: any, leftEye: any, rightEye: any, width: number, height: number): void => {
  // Floppy dog ears implementation
  const foreheadX = forehead.x * width
  const foreheadY = forehead.y * height
  const eyeDistance = Math.abs(leftEye.x - rightEye.x) * width
  
  ctx.fillStyle = '#8B4513'
  // Simplified floppy ear shape
  ctx.fillRect(foreheadX - eyeDistance, foreheadY, eyeDistance * 0.4, eyeDistance * 0.8)
  ctx.fillRect(foreheadX + eyeDistance * 0.6, foreheadY, eyeDistance * 0.4, eyeDistance * 0.8)
}

const drawDogNose = (ctx: CanvasRenderingContext2D, noseTip: any, width: number, height: number): void => {
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(noseTip.x * width, noseTip.y * height, width * 0.02, 0, Math.PI * 2)
  ctx.fill()
}

const drawDogTongue = (ctx: CanvasRenderingContext2D, mouth: any, width: number, height: number): void => {
  ctx.fillStyle = '#ff69b4'
  const x = mouth.x * width
  const y = mouth.y * height
  ctx.beginPath()
  ctx.ellipse(x, y + height * 0.03, width * 0.02, height * 0.04, 0, 0, Math.PI * 2)
  ctx.fill()
}

const drawFoxEars = (ctx: CanvasRenderingContext2D, forehead: any, leftEye: any, rightEye: any, width: number, height: number): void => {
  // Orange pointed ears
  ctx.fillStyle = '#FF6600'
  const foreheadX = forehead.x * width
  const foreheadY = forehead.y * height
  const earSize = Math.abs(leftEye.x - rightEye.x) * width * 0.6
  
  // Left ear
  ctx.beginPath()
  ctx.moveTo(foreheadX - earSize, foreheadY)
  ctx.lineTo(foreheadX - earSize * 0.3, foreheadY - earSize)
  ctx.lineTo(foreheadX - earSize * 1.3, foreheadY - earSize * 0.6)
  ctx.closePath()
  ctx.fill()
  
  // Right ear
  ctx.beginPath()
  ctx.moveTo(foreheadX + earSize, foreheadY)
  ctx.lineTo(foreheadX + earSize * 0.3, foreheadY - earSize)
  ctx.lineTo(foreheadX + earSize * 1.3, foreheadY - earSize * 0.6)
  ctx.closePath()
  ctx.fill()
}

const drawFoxNose = (ctx: CanvasRenderingContext2D, noseTip: any, width: number, height: number): void => {
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(noseTip.x * width, noseTip.y * height, width * 0.015, 0, Math.PI * 2)
  ctx.fill()
}

const drawOwlEyes = (ctx: CanvasRenderingContext2D, leftEye: any, rightEye: any, width: number, height: number): void => {
  const eyeSize = width * 0.06
  
  // Left eye
  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  ctx.arc(leftEye.x * width, leftEye.y * height, eyeSize, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(leftEye.x * width, leftEye.y * height, eyeSize * 0.4, 0, Math.PI * 2)
  ctx.fill()
  
  // Right eye
  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  ctx.arc(rightEye.x * width, rightEye.y * height, eyeSize, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(rightEye.x * width, rightEye.y * height, eyeSize * 0.4, 0, Math.PI * 2)
  ctx.fill()
}

const drawOwlBeak = (ctx: CanvasRenderingContext2D, noseTip: any, width: number, height: number): void => {
  ctx.fillStyle = '#FFA500'
  const x = noseTip.x * width
  const y = noseTip.y * height
  const size = width * 0.02
  
  ctx.beginPath()
  ctx.moveTo(x, y - size)
  ctx.lineTo(x - size * 0.6, y + size * 0.8)
  ctx.lineTo(x + size * 0.6, y + size * 0.8)
  ctx.closePath()
  ctx.fill()
}

export const animalMorphMask: MaskRenderer = {
  render,
  name: 'Animal Morph',
  type: 'animal_morph'
}