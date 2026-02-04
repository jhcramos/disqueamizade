// ═══════════════════════════════════════════════════════════════════════════
// Neon Wireframe Mask — Face Contours in Glowing Neon
// ═══════════════════════════════════════════════════════════════════════════

import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'
import { FACEMESH_FACE_OVAL, FACEMESH_LEFT_EYE, FACEMESH_RIGHT_EYE, FACEMESH_LIPS } from '@mediapipe/face_mesh'
import type { MaskRenderer } from '../../../types/filters'

// Face contour landmark indices (MediaPipe Face Mesh)
const FACE_CONTOURS = {
  face: FACEMESH_FACE_OVAL,
  leftEye: FACEMESH_LEFT_EYE,
  rightEye: FACEMESH_RIGHT_EYE,
  lips: FACEMESH_LIPS
}

const render = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  settings: Record<string, any> = {}
): void => {
  const {
    color = '#00ffff',
    lineWidth = 2,
    glow = true,
    opacity = 0.8
  } = settings

  // Save context
  ctx.save()

  // Set up neon glow effect
  if (glow) {
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  // Set stroke style
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = opacity

  // Draw face oval
  drawContour(ctx, landmarks, FACE_CONTOURS.face, width, height)

  // Draw eyes
  drawContour(ctx, landmarks, FACE_CONTOURS.leftEye, width, height)
  drawContour(ctx, landmarks, FACE_CONTOURS.rightEye, width, height)

  // Draw lips
  drawContour(ctx, landmarks, FACE_CONTOURS.lips, width, height)

  // Draw additional neon accents - eyebrows and nose bridge
  drawEyebrows(ctx, landmarks, width, height, color)
  drawNoseBridge(ctx, landmarks, width, height, color)

  // Restore context
  ctx.restore()
}

const drawContour = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  contourIndices: number[][],
  width: number,
  height: number
): void => {
  for (const connection of contourIndices) {
    const [start, end] = connection
    const startPoint = landmarks[start]
    const endPoint = landmarks[end]

    if (startPoint && endPoint) {
      ctx.beginPath()
      ctx.moveTo(startPoint.x * width, startPoint.y * height)
      ctx.lineTo(endPoint.x * width, endPoint.y * height)
      ctx.stroke()
    }
  }
}

const drawEyebrows = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  _color: string
): void => {
  // Left eyebrow landmarks
  const leftEyebrow = [70, 63, 105, 66, 107]
  // Right eyebrow landmarks
  const rightEyebrow = [296, 334, 293, 300, 276]

  const drawBrow = (browIndices: number[]) => {
    if (browIndices.length < 2) return

    ctx.beginPath()
    const firstPoint = landmarks[browIndices[0]]
    if (firstPoint) {
      ctx.moveTo(firstPoint.x * width, firstPoint.y * height)

      for (let i = 1; i < browIndices.length; i++) {
        const point = landmarks[browIndices[i]]
        if (point) {
          ctx.lineTo(point.x * width, point.y * height)
        }
      }
      ctx.stroke()
    }
  }

  drawBrow(leftEyebrow)
  drawBrow(rightEyebrow)
}

const drawNoseBridge = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  _color: string
): void => {
  // Nose bridge landmarks
  const noseBridge = [6, 8, 9, 10, 151]

  ctx.beginPath()
  const firstPoint = landmarks[noseBridge[0]]
  if (firstPoint) {
    ctx.moveTo(firstPoint.x * width, firstPoint.y * height)

    for (let i = 1; i < noseBridge.length; i++) {
      const point = landmarks[noseBridge[i]]
      if (point) {
        ctx.lineTo(point.x * width, point.y * height)
      }
    }
    ctx.stroke()
  }
}

export const neonWireframeMask: MaskRenderer = {
  render,
  name: 'Neon Wireframe',
  type: 'neon_wireframe'
}