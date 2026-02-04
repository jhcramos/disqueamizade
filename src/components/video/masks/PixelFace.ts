// ═══════════════════════════════════════════════════════════════════════════
// Pixel Face Mask — Anonymity Filter with Pixelated Face
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
    pixelSize = 12,
    opacity = 0.9,
    faceOnly = true
  } = settings

  // Calculate face bounding box from landmarks
  const { minX, minY, maxX, maxY } = getFaceBounds(landmarks, width, height)

  // Expand the bounds slightly for better coverage
  const padding = Math.max(pixelSize * 2, 20)
  const x = Math.max(0, minX - padding)
  const y = Math.max(0, minY - padding)
  const w = Math.min(width - x, maxX - minX + padding * 2)
  const h = Math.min(height - y, maxY - minY + padding * 2)

  // Get image data from the face region
  const imageData = ctx.getImageData(x, y, w, h)
  
  // Create pixelated version
  const pixelatedData = pixelateImageData(imageData, pixelSize)
  
  // Draw the pixelated face back
  ctx.save()
  ctx.globalAlpha = opacity
  
  // Create temporary canvas for the pixelated data
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w
  tempCanvas.height = h
  const tempCtx = tempCanvas.getContext('2d')!
  tempCtx.putImageData(pixelatedData, 0, 0)
  
  // If faceOnly is true, use a mask to only show pixels within face contours
  if (faceOnly) {
    ctx.save()
    createFaceMask(ctx, landmarks, width, height)
    ctx.clip()
  }
  
  ctx.drawImage(tempCanvas, x, y)
  
  if (faceOnly) {
    ctx.restore()
  }
  
  ctx.restore()
}

const getFaceBounds = (
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number
) => {
  const xs = landmarks.map(l => l.x * width)
  const ys = landmarks.map(l => l.y * height)
  
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  }
}

const pixelateImageData = (imageData: ImageData, pixelSize: number): ImageData => {
  const { data, width, height } = imageData
  const newData = new Uint8ClampedArray(data)

  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      // Sample color from the top-left pixel of each block
      const pixelIndex = (y * width + x) * 4
      
      const r = data[pixelIndex]
      const g = data[pixelIndex + 1]
      const b = data[pixelIndex + 2]
      const a = data[pixelIndex + 3]

      // Apply this color to the entire pixel block
      for (let dy = 0; dy < pixelSize && y + dy < height; dy++) {
        for (let dx = 0; dx < pixelSize && x + dx < width; dx++) {
          const index = ((y + dy) * width + (x + dx)) * 4
          newData[index] = r
          newData[index + 1] = g
          newData[index + 2] = b
          newData[index + 3] = a
        }
      }
    }
  }

  return new ImageData(newData, width, height)
}

const createFaceMask = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number
): void => {
  // Create a path that follows the face contour for masking
  ctx.beginPath()
  
  // Use face oval landmarks for the mask
  const faceOvalIndices = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
  ]
  
  // Start path
  const firstPoint = landmarks[faceOvalIndices[0]]
  if (firstPoint) {
    ctx.moveTo(firstPoint.x * width, firstPoint.y * height)
    
    // Draw smooth curve through face oval points
    for (let i = 1; i < faceOvalIndices.length; i++) {
      const point = landmarks[faceOvalIndices[i]]
      if (point) {
        ctx.lineTo(point.x * width, point.y * height)
      }
    }
    
    ctx.closePath()
  }
}

export const pixelFaceMask: MaskRenderer = {
  render,
  name: 'Pixel Face',
  type: 'pixel_face'
}