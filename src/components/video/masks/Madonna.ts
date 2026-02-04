// ═══════════════════════════════════════════════════════════════════════════
// Madonna Mask — Lace bow headband, cross earrings, beauty mark, bold lip outline, 80s neon frame
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
    neonGlow = 1.2,
    beautyMark = 1.0,
    boldLips = 1.0
  } = settings

  ctx.save()

  // Get key landmarks
  const forehead = landmarks[9]     // Center forehead
  const leftEar = landmarks[234]    // Left ear area
  const rightEar = landmarks[454]   // Right ear area
  const leftMouth = landmarks[61]   // Left mouth corner
  const rightMouth = landmarks[291] // Right mouth corner
  const upperLip = landmarks[12]    // Upper lip center
  const lowerLip = landmarks[15]    // Lower lip center
  const leftCheek = landmarks[116]  // Left cheek
  const rightCheek = landmarks[345] // Right cheek

  if (!forehead || !upperLip) {
    ctx.restore()
    return
  }

  // Draw 80s neon frame first
  draw80sNeonFrame(ctx, width, height, intensity, neonGlow)

  // Draw Madonna's iconic hair
  drawMadonnaHair(ctx, landmarks, width, height, intensity)

  // Draw lace bow headband
  drawLaceBowHeadband(ctx, forehead, width, height, intensity)

  // Draw cross earrings
  drawCrossEarrings(ctx, leftEar, rightEar, width, height, intensity)

  // Draw beauty mark
  drawBeautyMark(ctx, leftCheek, width, height, intensity, beautyMark)

  // Draw bold 80s makeup
  drawBold80sMakeup(ctx, landmarks, width, height, intensity, boldLips)

  // Add Material Girl sparkles
  drawMaterialGirlSparkles(ctx, landmarks, width, height, intensity)

  // Draw 80s fashion accessories
  draw80sFashion(ctx, landmarks, width, height, intensity)

  ctx.restore()
}

const draw80sNeonFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  neonGlow: number
): void => {
  ctx.globalAlpha = intensity * 0.6 * neonGlow

  const time = Date.now() * 0.003
  const frameThickness = width * 0.03
  const cornerRadius = frameThickness * 2

  // Cycling neon colors (quintessentially 80s)
  const colorPhase = Math.sin(time) * 0.5 + 0.5
  const r = Math.floor(255 * (0.8 + colorPhase * 0.2))      // Pink-magenta
  const g = Math.floor(20 * (0.5 + Math.sin(time * 1.3) * 0.5))  // Limited green
  const b = Math.floor(147 * (0.7 + Math.cos(time * 0.8) * 0.3)) // Purple-blue

  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`
  ctx.lineWidth = frameThickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = `rgb(${r}, ${g}, ${b})`
  ctx.shadowBlur = 25 * neonGlow

  // Neon frame with rounded corners
  ctx.beginPath()
  ctx.roundRect(
    frameThickness / 2,
    frameThickness / 2,
    width - frameThickness,
    height - frameThickness,
    cornerRadius
  )
  ctx.stroke()

  // Inner glow effect
  ctx.globalAlpha = intensity * 0.3 * neonGlow
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = frameThickness * 0.3
  ctx.shadowBlur = 10

  ctx.beginPath()
  ctx.roundRect(
    frameThickness / 2,
    frameThickness / 2,
    width - frameThickness,
    height - frameThickness,
    cornerRadius
  )
  ctx.stroke()

  // Corner accent lights
  ctx.globalAlpha = intensity * (0.8 + Math.sin(time * 2) * 0.3)
  ctx.fillStyle = '#FF69B4' // Hot pink
  ctx.shadowColor = '#FF69B4'
  ctx.shadowBlur = 15

  const corners = [
    { x: frameThickness, y: frameThickness },
    { x: width - frameThickness, y: frameThickness },
    { x: frameThickness, y: height - frameThickness },
    { x: width - frameThickness, y: height - frameThickness }
  ]

  corners.forEach(corner => {
    ctx.beginPath()
    ctx.arc(corner.x, corner.y, frameThickness * 0.4, 0, Math.PI * 2)
    ctx.fill()
  })
}

const drawMadonnaHair = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.8

  // Madonna's iconic 80s curly blonde hair
  const centerX = landmarks[9].x * width
  const centerY = landmarks[9].y * height
  const hairWidth = width * 0.5
  const hairHeight = height * 0.5
  const time = Date.now() * 0.002

  // Hair gradient (blonde with highlights)
  const hairGradient = ctx.createLinearGradient(
    centerX - hairWidth / 2, centerY - hairHeight / 2,
    centerX + hairWidth / 2, centerY + hairHeight / 2
  )
  hairGradient.addColorStop(0, '#F5DEB3') // Wheat
  hairGradient.addColorStop(0.3, '#FFE4B5') // Moccasin
  hairGradient.addColorStop(0.7, '#FFFF99') // Light yellow
  hairGradient.addColorStop(1, '#F0E68C') // Khaki

  ctx.fillStyle = hairGradient
  ctx.strokeStyle = '#DAA520'
  ctx.lineWidth = 2
  ctx.shadowColor = '#FFE4B5'
  ctx.shadowBlur = 12

  // Main hair volume (big 80s hair!)
  ctx.beginPath()
  ctx.ellipse(centerX, centerY - height * 0.08, hairWidth, hairHeight, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Curly texture (Madonna's signature curls)
  ctx.globalAlpha = intensity * 0.6
  ctx.strokeStyle = '#DEB887'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'

  // Create curly hair strands
  const curls = [
    { offsetX: -0.3, offsetY: -0.1, curlSize: 0.8 },
    { offsetX: -0.1, offsetY: -0.15, curlSize: 0.6 },
    { offsetX: 0.1, offsetY: -0.15, curlSize: 0.7 },
    { offsetX: 0.3, offsetY: -0.1, curlSize: 0.8 },
    { offsetX: -0.4, offsetY: 0.05, curlSize: 0.5 },
    { offsetX: 0.4, offsetY: 0.05, curlSize: 0.5 }
  ]

  curls.forEach((curl, index) => {
    const curlX = centerX + curl.offsetX * hairWidth
    const curlY = centerY + curl.offsetY * height
    const curlRadius = curl.curlSize * width * 0.04
    const animOffset = Math.sin(time + index) * 0.3

    // Spiral curl
    ctx.beginPath()
    for (let t = 0; t <= Math.PI * 4; t += 0.2) {
      const r = curlRadius * (1 - t / (Math.PI * 4))
      const x = curlX + Math.cos(t + animOffset) * r
      const y = curlY + Math.sin(t + animOffset) * r
      
      if (t === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  })
}

const drawLaceBowHeadband = (
  ctx: CanvasRenderingContext2D,
  forehead: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.9

  const centerX = forehead.x * width
  const centerY = forehead.y * height - height * 0.12
  const bowWidth = width * 0.15
  const bowHeight = height * 0.08

  // Lace headband base
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.shadowColor = '#FF69B4'
  ctx.shadowBlur = 8

  // Headband curve
  ctx.beginPath()
  ctx.arc(centerX, centerY + height * 0.15, width * 0.3, -Math.PI * 0.8, -Math.PI * 0.2, false)
  ctx.stroke()

  // Central lace bow
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = '#FFB6C1'
  ctx.lineWidth = 2

  // Left bow loop
  ctx.beginPath()
  ctx.ellipse(centerX - bowWidth * 0.3, centerY, bowWidth * 0.4, bowHeight, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Right bow loop
  ctx.beginPath()
  ctx.ellipse(centerX + bowWidth * 0.3, centerY, bowWidth * 0.4, bowHeight, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Bow center knot
  ctx.fillStyle = '#FFB6C1'
  ctx.beginPath()
  ctx.ellipse(centerX, centerY, bowWidth * 0.2, bowHeight * 0.6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Lace pattern details
  ctx.globalAlpha = intensity * 0.6
  ctx.strokeStyle = '#FFB6C1'
  ctx.lineWidth = 1

  // Delicate lace pattern
  for (let i = -2; i <= 2; i++) {
    const x = centerX + (i * bowWidth * 0.2)
    
    // Small lace details
    ctx.beginPath()
    ctx.arc(x, centerY - bowHeight * 0.3, bowHeight * 0.1, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.arc(x, centerY + bowHeight * 0.3, bowHeight * 0.1, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Bow tails/ribbons
  ctx.globalAlpha = intensity * 0.7
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 4

  // Left ribbon
  ctx.beginPath()
  ctx.moveTo(centerX - bowWidth * 0.5, centerY + bowHeight * 0.3)
  ctx.quadraticCurveTo(
    centerX - bowWidth * 0.8,
    centerY + bowHeight * 1.5,
    centerX - bowWidth * 0.6,
    centerY + bowHeight * 2
  )
  ctx.stroke()

  // Right ribbon
  ctx.beginPath()
  ctx.moveTo(centerX + bowWidth * 0.5, centerY + bowHeight * 0.3)
  ctx.quadraticCurveTo(
    centerX + bowWidth * 0.8,
    centerY + bowHeight * 1.5,
    centerX + bowWidth * 0.6,
    centerY + bowHeight * 2
  )
  ctx.stroke()
}

const drawCrossEarrings = (
  ctx: CanvasRenderingContext2D,
  leftEar: any,
  rightEar: any,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity

  const earringSize = width * 0.035
  const time = Date.now() * 0.005

  // Cross earring positions
  const earrings = [
    leftEar ? { x: leftEar.x * width - width * 0.08, y: leftEar.y * height + height * 0.04 } : null,
    rightEar ? { x: rightEar.x * width + width * 0.08, y: rightEar.y * height + height * 0.04 } : null
  ].filter(Boolean)

  earrings.forEach((earring, index) => {
    if (!earring) return

    const sway = Math.sin(time + index * Math.PI) * earringSize * 0.3

    // Cross earring (Madonna's signature)
    ctx.fillStyle = '#FFD700' // Gold
    ctx.strokeStyle = '#DAA520'
    ctx.lineWidth = 1
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 10

    const crossX = earring.x + sway
    const crossY = earring.y

    // Vertical bar of cross
    ctx.beginPath()
    ctx.roundRect(
      crossX - earringSize * 0.15,
      crossY - earringSize,
      earringSize * 0.3,
      earringSize * 2,
      earringSize * 0.1
    )
    ctx.fill()
    ctx.stroke()

    // Horizontal bar of cross
    ctx.beginPath()
    ctx.roundRect(
      crossX - earringSize * 0.8,
      crossY - earringSize * 0.15,
      earringSize * 1.6,
      earringSize * 0.3,
      earringSize * 0.1
    )
    ctx.fill()
    ctx.stroke()

    // Cross center jewel
    ctx.globalAlpha = intensity * 0.8
    ctx.fillStyle = '#FF69B4' // Hot pink center
    ctx.shadowBlur = 8

    ctx.beginPath()
    ctx.arc(crossX, crossY, earringSize * 0.25, 0, Math.PI * 2)
    ctx.fill()

    // Earring chain/hook
    ctx.globalAlpha = intensity * 0.7
    ctx.strokeStyle = '#C0C0C0' // Silver
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(crossX, earring.y - height * 0.02)
    ctx.lineTo(crossX, crossY - earringSize)
    ctx.stroke()
  })
}

const drawBeautyMark = (
  ctx: CanvasRenderingContext2D,
  leftCheek: any,
  width: number,
  height: number,
  intensity: number,
  beautyMark: number
): void => {
  if (!leftCheek) return

  ctx.globalAlpha = intensity * beautyMark

  // Madonna's iconic beauty mark (left side)
  const markX = leftCheek.x * width + width * 0.02
  const markY = leftCheek.y * height - height * 0.01
  const markSize = width * 0.008

  ctx.fillStyle = '#2D1B1B' // Dark brown/black
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 3

  ctx.beginPath()
  ctx.arc(markX, markY, markSize, 0, Math.PI * 2)
  ctx.fill()

  // Subtle highlight to make it pop
  ctx.globalAlpha = intensity * beautyMark * 0.5
  ctx.fillStyle = '#8B4513'

  ctx.beginPath()
  ctx.arc(markX - markSize * 0.3, markY - markSize * 0.3, markSize * 0.3, 0, Math.PI * 2)
  ctx.fill()
}

const drawBold80sMakeup = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number,
  boldLips: number
): void => {
  const leftEye = landmarks[33]
  const rightEye = landmarks[362]
  const upperLip = landmarks[12]
  const lowerLip = landmarks[15]
  const leftMouth = landmarks[61]
  const rightMouth = landmarks[291]

  // Bold 80s eyeshadow (blue and pink)
  if (leftEye && rightEye) {
    ctx.globalAlpha = intensity * 0.7

    // Blue eyeshadow gradient
    const leftEyeshadow = ctx.createRadialGradient(
      leftEye.x * width, leftEye.y * height, width * 0.01,
      leftEye.x * width, leftEye.y * height, width * 0.06
    )
    leftEyeshadow.addColorStop(0, 'rgba(0, 191, 255, 0.8)')
    leftEyeshadow.addColorStop(1, 'rgba(0, 191, 255, 0)')

    ctx.fillStyle = leftEyeshadow
    ctx.beginPath()
    ctx.ellipse(leftEye.x * width, leftEye.y * height - height * 0.025, width * 0.05, height * 0.035, 0, 0, Math.PI * 2)
    ctx.fill()

    // Right eye (same)
    const rightEyeshadow = ctx.createRadialGradient(
      rightEye.x * width, rightEye.y * height, width * 0.01,
      rightEye.x * width, rightEye.y * height, width * 0.06
    )
    rightEyeshadow.addColorStop(0, 'rgba(0, 191, 255, 0.8)')
    rightEyeshadow.addColorStop(1, 'rgba(0, 191, 255, 0)')

    ctx.fillStyle = rightEyeshadow
    ctx.beginPath()
    ctx.ellipse(rightEye.x * width, rightEye.y * height - height * 0.025, width * 0.05, height * 0.035, 0, 0, Math.PI * 2)
    ctx.fill()

    // Bold eyeliner
    ctx.globalAlpha = intensity * 0.8
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    // Dramatic winged eyeliner
    [leftEye, rightEye].forEach((eye, index) => {
      const direction = index === 0 ? -1 : 1
      const wingX = eye.x * width + (direction * width * 0.04)
      const wingY = eye.y * height - height * 0.015

      ctx.beginPath()
      ctx.moveTo(eye.x * width + (direction * width * 0.03), eye.y * height)
      ctx.lineTo(wingX, wingY)
      ctx.stroke()
    })
  }

  // Bold red lips (Madonna signature)
  if (upperLip && lowerLip && leftMouth && rightMouth) {
    ctx.globalAlpha = intensity * boldLips

    const lipCenterX = upperLip.x * width
    const lipCenterY = upperLip.y * height + height * 0.01
    const lipWidth = Math.abs(rightMouth.x - leftMouth.x) * width * 1.2
    const lipHeight = Math.abs(lowerLip.y - upperLip.y) * height * 1.5

    // Bold red lip color
    ctx.fillStyle = '#DC143C' // Crimson
    ctx.strokeStyle = '#8B0000' // Dark red outline
    ctx.lineWidth = 2
    ctx.shadowColor = '#FF69B4'
    ctx.shadowBlur = 8

    // Stylized full lips
    ctx.beginPath()
    ctx.ellipse(lipCenterX, lipCenterY, lipWidth / 2, lipHeight / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Lip highlight (glossy 80s look)
    ctx.globalAlpha = intensity * boldLips * 0.6
    ctx.fillStyle = '#FFB6C1'

    ctx.beginPath()
    ctx.ellipse(
      lipCenterX - lipWidth * 0.15,
      lipCenterY - lipHeight * 0.15,
      lipWidth * 0.2,
      lipHeight * 0.15,
      0, 0, Math.PI * 2
    )
    ctx.fill()
  }
}

const drawMaterialGirlSparkles = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.7

  const time = Date.now() * 0.004

  // Material Girl diamonds and sparkles
  const sparkles = [
    { x: 0.15, y: 0.15, size: 0.02, color: '#FFD700', type: 'diamond' },
    { x: 0.85, y: 0.2, size: 0.015, color: '#FF69B4', type: 'star' },
    { x: 0.1, y: 0.45, size: 0.018, color: '#00FFFF', type: 'diamond' },
    { x: 0.9, y: 0.5, size: 0.016, color: '#FFD700', type: 'star' },
    { x: 0.2, y: 0.8, size: 0.017, color: '#FF69B4', type: 'diamond' },
    { x: 0.8, y: 0.85, size: 0.019, color: '#00FFFF', type: 'star' }
  ]

  sparkles.forEach((sparkle, index) => {
    const twinkle = (Math.sin(time + index * 0.7) + 1) / 2
    const size = sparkle.size * width * (0.6 + twinkle * 0.8)
    const x = sparkle.x * width
    const y = sparkle.y * height

    ctx.globalAlpha = intensity * twinkle * 0.8
    ctx.fillStyle = sparkle.color
    ctx.shadowColor = sparkle.color
    ctx.shadowBlur = size * 2

    if (sparkle.type === 'diamond') {
      // Diamond shape
      ctx.beginPath()
      ctx.moveTo(x, y - size)
      ctx.lineTo(x + size * 0.7, y)
      ctx.lineTo(x, y + size)
      ctx.lineTo(x - size * 0.7, y)
      ctx.closePath()
      ctx.fill()
    } else {
      // Four-pointed star
      ctx.beginPath()
      ctx.moveTo(x, y - size)
      ctx.lineTo(x + size * 0.3, y - size * 0.3)
      ctx.lineTo(x + size, y)
      ctx.lineTo(x + size * 0.3, y + size * 0.3)
      ctx.lineTo(x, y + size)
      ctx.lineTo(x - size * 0.3, y + size * 0.3)
      ctx.lineTo(x - size, y)
      ctx.lineTo(x - size * 0.3, y - size * 0.3)
      ctx.closePath()
      ctx.fill()
    }
  })
}

const draw80sFashion = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  intensity: number
): void => {
  ctx.globalAlpha = intensity * 0.5

  // 80s fashion elements (fingerless gloves, choker, etc.)
  const chin = landmarks[18]
  
  if (chin) {
    // Choker necklace
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 8
    ctx.shadowColor = '#FF69B4'
    ctx.shadowBlur = 5

    const chokerY = chin.y * height + height * 0.08
    const chokerWidth = width * 0.3

    ctx.beginPath()
    ctx.ellipse(chin.x * width, chokerY, chokerWidth, height * 0.02, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Choker charm (small cross)
    ctx.globalAlpha = intensity * 0.8
    ctx.fillStyle = '#C0C0C0'
    ctx.strokeStyle = '#808080'
    ctx.lineWidth = 1

    const charmSize = width * 0.015
    const charmX = chin.x * width
    const charmY = chokerY + height * 0.03

    // Small cross charm
    ctx.beginPath()
    ctx.roundRect(
      charmX - charmSize * 0.2,
      charmY - charmSize,
      charmSize * 0.4,
      charmSize * 2,
      charmSize * 0.1
    )
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.roundRect(
      charmX - charmSize,
      charmY - charmSize * 0.2,
      charmSize * 2,
      charmSize * 0.4,
      charmSize * 0.1
    )
    ctx.fill()
    ctx.stroke()
  }
}

export const madonnaMask: MaskRenderer = {
  render,
  name: 'Madonna',
  type: 'neon_wireframe'
}