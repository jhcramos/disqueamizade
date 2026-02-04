// ═══════════════════════════════════════════════════════════════════════════
// Cheetara Mask — Spotted pattern on cheeks, cat eyes enhancement, orange/yellow streaks, cat ears
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
    intensity = 0.8,
    spotPattern = 1.0,
    catEyeIntensity = 1.2,
    earAnimation = 1.0
  } = settings

  ctx.save()

  // Get key landmarks
  const leftEye = landmarks[33]     // Left eye
  const rightEye = landmarks[362]   // Right eye
  const leftCheek = landmarks[116]  // Left cheek
  const rightCheek = landmarks[345] // Right cheek
  const nose = landmarks[2]         // Nose tip
  const forehead = landmarks[9]     // Center forehead
  const leftTemple = landmarks[54]  // Left temple
  const rightTemple = landmarks[284] // Right temple

  if (!leftEye || !rightEye || !nose) {
    ctx.restore()
    return
  }

  // Draw ThunderCats energy aura
  drawThunderCatsAura(ctx, landmarks, width, height, intensity)

  // Draw cheetah spotted pattern
  drawCheetahSpots(ctx, landmarks, width, height, intensity, spotPattern)

  // Draw enhanced cat eyes
  drawCatEyes(ctx, leftEye, rightEye, width, height, intensity, catEyeIntensity)

  // Draw cat ears on top
  drawCatEars(ctx, forehead, leftTemple, rightTemple, width, height, intensity, earAnimation)

  // Draw cheetah hair with orange/yellow streaks
  drawCheetahHair(ctx, landmarks, width, height, intensity)

  // Draw cat nose enhancement
  drawCatNose(ctx, nose, width, height, intensity)

  // Add speed lines (Cheetara's super speed)
  drawSpeedLines(ctx, width, height, intensity)

  // Draw ThunderCats emblem
  drawThunderCatsEmblem(ctx, forehead, width, height, intensity)

  // Add feline grace sparkles
  drawFelineSparkles(ctx, landmarks, width, height, intensity)

  ctx.restore()
}

const drawThunderCatsAura = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.4

  // ThunderCats orange/red energy aura
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  
  const time = Date.now() * 0.003
  const energyPulse = (Math.sin(time) + 1) / 2

  const auraGradient = ctx.createRadialGradient(
    centerX, centerY, width * 0.05,
    centerX, centerY, width * 0.45
  )
  auraGradient.addColorStop(0, 'rgba(255, 140, 0, 0.6)') // Orange
  auraGradient.addColorStop(0.3, 'rgba(255, 69, 0, 0.4)') // Red-orange
  auraGradient.addColorStop(0.6, 'rgba(255, 215, 0, 0.3)') // Gold
  auraGradient.addColorStop(1, 'rgba(255, 140, 0, 0)')

  ctx.fillStyle = auraGradient
  ctx.fillRect(0, 0, width, height)

  // Thunder energy pulses
  ctx.globalAlpha = intensity * 0.3 * energyPulse
  const thunderGradient = ctx.createRadialGradient(
    centerX, centerY, width * 0.1,
    centerX, centerY, width * 0.25
  )
  thunderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
  thunderGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = thunderGradient
  ctx.fillRect(0, 0, width, height)
}

const drawCheetahSpots = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number,
  spotPattern: number
): void => {
  ctx.globalAlpha = intensity * 0.7 * spotPattern

  // Cheetah face spots pattern
  const leftCheek = landmarks[116]
  const rightCheek = landmarks[345]
  const forehead = landmarks[9]

  if (!leftCheek || !rightCheek || !forehead) return

  // Spot color (dark orange/brown)
  ctx.fillStyle = '#8B4513'
  ctx.strokeStyle = '#654321'
  ctx.lineWidth = 1

  // Define spot patterns for different face areas
  const spotAreas = [
    { 
      center: leftCheek,
      spots: [
        { offsetX: -0.02, offsetY: -0.01, size: 0.008 },
        { offsetX: 0.01, offsetY: 0.01, size: 0.006 },
        { offsetX: -0.03, offsetY: 0.02, size: 0.007 },
        { offsetX: 0.02, offsetY: -0.02, size: 0.005 },
        { offsetX: -0.01, offsetY: 0.03, size: 0.006 }
      ]
    },
    {
      center: rightCheek,
      spots: [
        { offsetX: 0.02, offsetY: -0.01, size: 0.008 },
        { offsetX: -0.01, offsetY: 0.01, size: 0.006 },
        { offsetX: 0.03, offsetY: 0.02, size: 0.007 },
        { offsetX: -0.02, offsetY: -0.02, size: 0.005 },
        { offsetX: 0.01, offsetY: 0.03, size: 0.006 }
      ]
    },
    {
      center: forehead,
      spots: [
        { offsetX: -0.015, offsetY: 0.02, size: 0.005 },
        { offsetX: 0.015, offsetY: 0.025, size: 0.006 },
        { offsetX: 0, offsetY: 0.04, size: 0.004 }
      ]
    }
  ]

  // Draw spots for each area
  spotAreas.forEach(area => {
    area.spots.forEach(spot => {
      const spotX = area.center.x * width + spot.offsetX * width
      const spotY = area.center.y * height + spot.offsetY * height
      const spotSize = spot.size * width

      // Irregular cheetah spot shape
      ctx.beginPath()
      ctx.ellipse(spotX, spotY, spotSize, spotSize * 0.8, Math.random() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Add some spots with irregular edges
      if (Math.random() > 0.7) {
        ctx.globalAlpha = intensity * 0.5
        ctx.fillStyle = '#A0522D'
        
        ctx.beginPath()
        ctx.ellipse(spotX + spotSize * 0.3, spotY + spotSize * 0.3, spotSize * 0.4, spotSize * 0.3, 0, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.globalAlpha = intensity * 0.7 * spotPattern
        ctx.fillStyle = '#8B4513'
      }
    })
  })
}

const drawCatEyes = (
  ctx: CanvasRenderingContext2D,
  leftEye: any,
  rightEye: any,
  width: number,
  height: number,
  intensity: number,
  catEyeIntensity: number
): void => {
  ctx.globalAlpha = intensity * catEyeIntensity

  const eyeWidth = width * 0.04
  const eyeHeight = height * 0.025

  // Enhanced cat-like eyes
  [leftEye, rightEye].forEach((eye, index) => {
    const eyeX = eye.x * width
    const eyeY = eye.y * height

    // Cat eye base (almond shape)
    ctx.fillStyle = '#FFD700' // Golden yellow
    ctx.strokeStyle = '#FF8C00'
    ctx.lineWidth = 2
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 10

    ctx.beginPath()
    ctx.ellipse(eyeX, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Cat pupil (vertical slit)
    ctx.globalAlpha = intensity * catEyeIntensity * 0.9
    ctx.fillStyle = '#000000'
    ctx.shadowBlur = 5

    ctx.beginPath()
    ctx.ellipse(eyeX, eyeY, eyeWidth * 0.15, eyeHeight * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()

    // Eye reflection/highlight
    ctx.globalAlpha = intensity * catEyeIntensity * 0.8
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowBlur = 3

    ctx.beginPath()
    ctx.ellipse(
      eyeX - eyeWidth * 0.3, 
      eyeY - eyeHeight * 0.3, 
      eyeWidth * 0.2, 
      eyeHeight * 0.2, 
      0, 0, Math.PI * 2
    )
    ctx.fill()

    // Cat eye liner (dramatic wing)
    ctx.globalAlpha = intensity * catEyeIntensity
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    const direction = index === 0 ? -1 : 1
    ctx.beginPath()
    ctx.moveTo(eyeX + (direction * eyeWidth), eyeY)
    ctx.lineTo(eyeX + (direction * eyeWidth * 1.5), eyeY - eyeHeight * 0.5)
    ctx.stroke()

    // Inner eye corner detail
    ctx.strokeStyle = '#FF8C00'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.moveTo(eyeX - (direction * eyeWidth), eyeY)
    ctx.lineTo(eyeX - (direction * eyeWidth * 0.7), eyeY - eyeHeight * 0.2)
    ctx.stroke()
  })
}

const drawCatEars = (
  ctx: CanvasRenderingContext2D,
  forehead: any,
  leftTemple: any,
  rightTemple: any,
  width: number,
  height: number,
  intensity: number,
  earAnimation: number
): void => {
  ctx.globalAlpha = intensity * earAnimation

  if (!leftTemple || !rightTemple) return

  const time = Date.now() * 0.004
  const earTwitch = Math.sin(time) * 0.1 // Subtle ear movement

  // Cat ear positions
  const earSize = width * 0.06
  const earHeight = height * 0.1

  const ears = [
    { 
      x: leftTemple.x * width - width * 0.05, 
      y: forehead.y * height - height * 0.15,
      twitch: earTwitch
    },
    { 
      x: rightTemple.x * width + width * 0.05, 
      y: forehead.y * height - height * 0.15,
      twitch: -earTwitch
    }
  ]

  ears.forEach((ear, index) => {
    const earX = ear.x + ear.twitch * width * 0.02
    const earY = ear.y

    // Outer ear (orange)
    ctx.fillStyle = '#FF8C00'
    ctx.strokeStyle = '#FF4500'
    ctx.lineWidth = 2
    ctx.shadowColor = '#FF8C00'
    ctx.shadowBlur = 8

    ctx.beginPath()
    ctx.moveTo(earX, earY + earHeight)
    ctx.lineTo(earX - earSize, earY + earHeight * 0.3)
    ctx.lineTo(earX, earY)
    ctx.lineTo(earX + earSize, earY + earHeight * 0.3)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Inner ear (pink)
    ctx.globalAlpha = intensity * earAnimation * 0.8
    ctx.fillStyle = '#FFB6C1'
    ctx.strokeStyle = '#FF69B4'
    ctx.lineWidth = 1

    const innerSize = earSize * 0.6
    const innerHeight = earHeight * 0.7

    ctx.beginPath()
    ctx.moveTo(earX, earY + innerHeight * 0.8)
    ctx.lineTo(earX - innerSize * 0.5, earY + innerHeight * 0.4)
    ctx.lineTo(earX, earY + innerHeight * 0.2)
    ctx.lineTo(earX + innerSize * 0.5, earY + innerHeight * 0.4)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Ear tufts (fur detail)
    ctx.globalAlpha = intensity * earAnimation * 0.6
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    for (let i = 0; i < 3; i++) {
      const tuftX = earX + (i - 1) * earSize * 0.2
      const tuftY = earY - height * 0.02

      ctx.beginPath()
      ctx.moveTo(tuftX, earY)
      ctx.lineTo(tuftX + (Math.random() - 0.5) * width * 0.01, tuftY)
      ctx.stroke()
    }
  })
}

const drawCheetahHair = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  // Cheetara's flowing hair with orange/yellow streaks
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const hairWidth = width * 0.35
  const hairHeight = height * 0.4
  const time = Date.now() * 0.003

  // Base hair (orange-red gradient)
  const hairGradient = ctx.createLinearGradient(
    centerX - hairWidth / 2, centerY - hairHeight / 2,
    centerX + hairWidth / 2, centerY + hairHeight / 2
  )
  hairGradient.addColorStop(0, '#FF4500') // Orange-red
  hairGradient.addColorStop(0.3, '#FF8C00') // Dark orange
  hairGradient.addColorStop(0.7, '#FFD700') // Gold
  hairGradient.addColorStop(1, '#FFA500') // Orange

  ctx.fillStyle = hairGradient
  ctx.strokeStyle = '#FF6347'
  ctx.lineWidth = 2
  ctx.shadowColor = '#FF8C00'
  ctx.shadowBlur = 10

  ctx.beginPath()
  ctx.ellipse(centerX, centerY - height * 0.05, hairWidth, hairHeight, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Flowing hair strands (animated)
  ctx.globalAlpha = intensity * 0.6
  const strands = [
    { offsetX: -0.25, curve: 0.6, color: '#FFD700' },
    { offsetX: -0.1, curve: 0.3, color: '#FF8C00' },
    { offsetX: 0.1, curve: -0.3, color: '#FFD700' },
    { offsetX: 0.25, curve: -0.6, color: '#FF4500' }
  ]

  strands.forEach((strand, index) => {
    ctx.strokeStyle = strand.color
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.shadowColor = strand.color
    ctx.shadowBlur = 8

    const startX = centerX + strand.offsetX * hairWidth
    const startY = centerY - hairHeight * 0.3
    const flowOffset = Math.sin(time + index) * width * 0.03

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.quadraticCurveTo(
      startX + strand.curve * width * 0.1 + flowOffset,
      centerY + hairHeight * 0.2,
      startX + flowOffset * 2,
      centerY + hairHeight * 0.8
    )
    ctx.stroke()
  })
}

const drawCatNose = (
  ctx: CanvasRenderingContext2D,
  nose: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  const noseX = nose.x * width
  const noseY = nose.y * height
  const noseSize = width * 0.015

  // Cat nose (pink triangle)
  ctx.fillStyle = '#FFB6C1'
  ctx.strokeStyle = '#FF69B4'
  ctx.lineWidth = 1
  ctx.shadowColor = '#FFB6C1'
  ctx.shadowBlur = 5

  ctx.beginPath()
  ctx.moveTo(noseX, noseY - noseSize * 0.8)
  ctx.lineTo(noseX - noseSize, noseY + noseSize * 0.5)
  ctx.lineTo(noseX + noseSize, noseY + noseSize * 0.5)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Nose highlight
  ctx.globalAlpha = intensity * 0.6
  ctx.fillStyle = '#FFFFFF'

  ctx.beginPath()
  ctx.ellipse(noseX - noseSize * 0.2, noseY - noseSize * 0.2, noseSize * 0.3, noseSize * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()

  // Cat whiskers
  ctx.globalAlpha = intensity * 0.7
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  const whiskerLength = width * 0.08

  // Left whiskers
  for (let i = 0; i < 3; i++) {
    const whiskerY = noseY + (i - 1) * height * 0.015
    ctx.beginPath()
    ctx.moveTo(noseX - noseSize * 2, whiskerY)
    ctx.lineTo(noseX - noseSize * 2 - whiskerLength, whiskerY + (Math.random() - 0.5) * height * 0.01)
    ctx.stroke()
  }

  // Right whiskers
  for (let i = 0; i < 3; i++) {
    const whiskerY = noseY + (i - 1) * height * 0.015
    ctx.beginPath()
    ctx.moveTo(noseX + noseSize * 2, whiskerY)
    ctx.lineTo(noseX + noseSize * 2 + whiskerLength, whiskerY + (Math.random() - 0.5) * height * 0.01)
    ctx.stroke()
  }
}

const drawSpeedLines = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.5

  const time = Date.now() * 0.01
  const lineSpeed = time * width * 0.1

  // Cheetara's super speed effect
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 10

  // Horizontal speed lines
  for (let i = 0; i < 8; i++) {
    const y = (height / 9) * (i + 1)
    const lineOffset = (lineSpeed + i * width * 0.2) % (width * 1.5) - width * 0.25
    const lineLength = width * 0.3

    ctx.globalAlpha = intensity * 0.5 * (1 - Math.abs(lineOffset) / (width * 0.6))

    if (lineOffset > -width * 0.2 && lineOffset < width * 1.2) {
      ctx.beginPath()
      ctx.moveTo(lineOffset, y)
      ctx.lineTo(lineOffset + lineLength, y)
      ctx.stroke()
    }
  }

  // Diagonal speed streaks
  ctx.strokeStyle = '#FF8C00'
  ctx.lineWidth = 2

  for (let i = 0; i < 5; i++) {
    const startX = -width * 0.2 + (time * width * 0.15 + i * width * 0.3) % (width * 1.4)
    const startY = height * 0.2 + i * height * 0.15

    ctx.globalAlpha = intensity * 0.4
    
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(startX + width * 0.25, startY - height * 0.1)
    ctx.stroke()
  }
}

const drawThunderCatsEmblem = (
  ctx: CanvasRenderingContext2D,
  forehead: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.7

  const centerX = forehead.x * width
  const centerY = forehead.y * height + height * 0.05
  const emblemSize = width * 0.04

  // ThunderCats emblem (simplified cat head silhouette)
  ctx.fillStyle = '#FFD700'
  ctx.strokeStyle = '#FF8C00'
  ctx.lineWidth = 2
  ctx.shadowColor = '#FFD700'
  ctx.shadowBlur = 10

  // Cat head shape
  ctx.beginPath()
  ctx.ellipse(centerX, centerY, emblemSize, emblemSize * 0.8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Cat ears on emblem
  ctx.beginPath()
  ctx.moveTo(centerX - emblemSize * 0.5, centerY - emblemSize * 0.5)
  ctx.lineTo(centerX - emblemSize * 0.8, centerY - emblemSize * 1.2)
  ctx.lineTo(centerX - emblemSize * 0.3, centerY - emblemSize * 0.7)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(centerX + emblemSize * 0.5, centerY - emblemSize * 0.5)
  ctx.lineTo(centerX + emblemSize * 0.8, centerY - emblemSize * 1.2)
  ctx.lineTo(centerX + emblemSize * 0.3, centerY - emblemSize * 0.7)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // "Thunder" text effect
  ctx.globalAlpha = intensity * 0.5
  ctx.fillStyle = '#FF4500'
  ctx.font = `${width * 0.02}px Arial`
  ctx.textAlign = 'center'

  ctx.fillText('⚡', centerX, centerY + emblemSize * 1.8)
}

const drawFelineSparkles = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.6

  const time = Date.now() * 0.005
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height

  // Graceful feline energy sparkles
  const sparkles = [
    { x: 0.2, y: 0.3, color: '#FFD700', phase: 0 },
    { x: 0.8, y: 0.35, color: '#FF8C00', phase: 1 },
    { x: 0.15, y: 0.65, color: '#FFD700', phase: 2 },
    { x: 0.85, y: 0.7, color: '#FF4500', phase: 3 },
    { x: 0.3, y: 0.9, color: '#FFD700', phase: 4 },
    { x: 0.7, y: 0.85, color: '#FF8C00', phase: 5 }
  ]

  sparkles.forEach(sparkle => {
    const twinkle = (Math.sin(time + sparkle.phase) + 1) / 2
    const size = width * 0.015 * (0.5 + twinkle * 0.8)
    const x = sparkle.x * width
    const y = sparkle.y * height

    ctx.globalAlpha = intensity * twinkle * 0.7
    ctx.fillStyle = sparkle.color
    ctx.shadowColor = sparkle.color
    ctx.shadowBlur = size * 2

    // Paw print sparkle
    ctx.beginPath()
    // Main pad
    ctx.ellipse(x, y, size * 0.6, size * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()

    // Toe pads
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 - Math.PI / 4
      const padX = x + Math.cos(angle) * size * 0.4
      const padY = y + Math.sin(angle) * size * 0.4 - size * 0.6

      ctx.beginPath()
      ctx.ellipse(padX, padY, size * 0.2, size * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  // Speed trails around the head
  ctx.globalAlpha = intensity * 0.4
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + time
    const radius = width * 0.2
    const trailLength = width * 0.05

    const startX = centerX + Math.cos(angle) * radius
    const startY = centerY + Math.sin(angle) * radius
    const endX = startX + Math.cos(angle + Math.PI) * trailLength
    const endY = startY + Math.sin(angle + Math.PI) * trailLength

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  }
}

export const cheetaraMask: MaskRenderer = {
  render,
  name: 'Cheetara',
  type: 'neon_wireframe'
}