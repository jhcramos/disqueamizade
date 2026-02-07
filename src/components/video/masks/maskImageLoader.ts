// ═══════════════════════════════════════════════════════════════════════════
// Shared PNG mask image loader with caching
// ═══════════════════════════════════════════════════════════════════════════

const imageCache = new Map<string, HTMLImageElement>()

/**
 * Resolve an asset path relative to the app's base URL (handles GitHub Pages subpath).
 */
export function resolveAssetPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  // Avoid double slashes
  if (path.startsWith('/')) path = path.slice(1)
  return base.endsWith('/') ? `${base}${path}` : `${base}/${path}`
}

/**
 * Load a mask PNG image with caching.
 * Returns the image if loaded and ready, null if still loading.
 * Safe to call every frame — cached after first load.
 * Automatically resolves paths relative to BASE_URL.
 */
export function loadMaskImage(src: string): HTMLImageElement | null {
  const resolvedSrc = resolveAssetPath(src)
  if (imageCache.has(resolvedSrc)) {
    const img = imageCache.get(resolvedSrc)!
    return img.complete && img.naturalWidth > 0 ? img : null
  }
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = resolvedSrc
  imageCache.set(resolvedSrc, img)
  return null // not ready yet, will be ready next frame
}

/**
 * Get face dimensions from landmarks (normalized 0-1 coords).
 * Returns pixel values for positioning overlays.
 */
export function getFaceBounds(
  landmarks: any[],
  width: number,
  height: number
) {
  const forehead = landmarks[10]   // Forehead top
  const chin = landmarks[152]      // Chin bottom
  const leftCheek = landmarks[234] // Left side
  const rightCheek = landmarks[454] // Right side
  const foreheadCenter = landmarks[151]
  const noseTip = landmarks[1]
  const leftEyeOuter = landmarks[33]
  const rightEyeOuter = landmarks[263]
  const leftEyeInner = landmarks[133]
  const rightEyeInner = landmarks[362]
  const upperLip = landmarks[13]
  const lowerLip = landmarks[14]

  const faceWidth = Math.abs(rightCheek.x - leftCheek.x) * width
  const faceHeight = Math.abs(chin.y - forehead.y) * height
  const faceCenterX = (leftCheek.x + rightCheek.x) / 2 * width
  const faceCenterY = (forehead.y + chin.y) / 2 * height
  const foreheadY = forehead.y * height
  const chinY = chin.y * height
  const foreheadCenterX = foreheadCenter.x * width
  const foreheadCenterY = foreheadCenter.y * height

  return {
    faceWidth,
    faceHeight,
    faceCenterX,
    faceCenterY,
    foreheadY,
    chinY,
    foreheadCenterX,
    foreheadCenterY,
    noseTip: { x: noseTip.x * width, y: noseTip.y * height },
    leftEye: { x: leftEyeOuter.x * width, y: leftEyeOuter.y * height },
    rightEye: { x: rightEyeOuter.x * width, y: rightEyeOuter.y * height },
    leftEyeInner: { x: leftEyeInner.x * width, y: leftEyeInner.y * height },
    rightEyeInner: { x: rightEyeInner.x * width, y: rightEyeInner.y * height },
    upperLip: { x: upperLip.x * width, y: upperLip.y * height },
    lowerLip: { x: lowerLip.x * width, y: lowerLip.y * height },
    leftCheek: { x: leftCheek.x * width, y: leftCheek.y * height },
    rightCheek: { x: rightCheek.x * width, y: rightCheek.y * height },
  }
}

/**
 * Draw a PNG overlay centered at a position, scaled to a target size.
 * The image is drawn from its original aspect ratio, scaled to fit.
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  centerX: number,
  centerY: number,
  targetWidth: number,
  targetHeight: number,
  alpha: number = 1.0,
  rotation: number = 0
) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(centerX, centerY)
  if (rotation !== 0) ctx.rotate(rotation)
  ctx.drawImage(
    img,
    -targetWidth / 2,
    -targetHeight / 2,
    targetWidth,
    targetHeight
  )
  ctx.restore()
}
