// ═══════════════════════════════════════════════════════════════════════════
// Mask Renderers — Canvas-based face mask effects using MediaPipe landmarks
// ═══════════════════════════════════════════════════════════════════════════

import type { MaskRenderer } from '@/types/filters'
import type { NormalizedLandmarkList } from '@mediapipe/face_mesh'

// ─── Landmark index constants ───
// MediaPipe FaceMesh 468 landmarks reference
const FACE_OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
const LEFT_EYE = [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398]
const RIGHT_EYE = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246]
const LIPS_OUTER = [61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185]
const NOSE_TIP = 1
const FOREHEAD = 10
const CHIN = 152
const LEFT_CHEEK = 234
const RIGHT_CHEEK = 454
const LEFT_EAR_TOP = 127
const RIGHT_EAR_TOP = 356
// Eye centers computed via eyeCenter() helper

// Helper: get landmark point in pixel coords
function pt(landmarks: NormalizedLandmarkList, idx: number, w: number, h: number): [number, number] {
  const l = landmarks[idx]
  return [l.x * w, l.y * h]
}

// Helper: distance between two landmarks
function dist(landmarks: NormalizedLandmarkList, a: number, b: number, w: number, h: number): number {
  const [x1, y1] = pt(landmarks, a, w, h)
  const [x2, y2] = pt(landmarks, b, w, h)
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

// Helper: eye center from eye landmarks
function eyeCenter(landmarks: NormalizedLandmarkList, eyeIndices: number[], w: number, h: number): [number, number] {
  let sx = 0, sy = 0
  for (const i of eyeIndices) {
    sx += landmarks[i].x
    sy += landmarks[i].y
  }
  return [(sx / eyeIndices.length) * w, (sy / eyeIndices.length) * h]
}

// Helper: face angle (roll) from eye positions
function faceAngle(landmarks: NormalizedLandmarkList, w: number, h: number): number {
  const le = eyeCenter(landmarks, LEFT_EYE, w, h)
  const re = eyeCenter(landmarks, RIGHT_EYE, w, h)
  return Math.atan2(le[1] - re[1], le[0] - re[0])
}

// Helper: face scale based on eye distance
function faceScale(landmarks: NormalizedLandmarkList, w: number, h: number): number {
  return dist(landmarks, LEFT_CHEEK, RIGHT_CHEEK, w, h)
}

// ═══════════════════════════════════════════════════════════════════════════
// NEON WIREFRAME
// ═══════════════════════════════════════════════════════════════════════════
const neonWireframe: MaskRenderer = {
  name: 'Neon Wireframe',
  type: 'neon_wireframe',
  render(ctx, landmarks, w, h, settings) {
    const color = settings?.color || '#00ffff'
    const lineWidth = settings?.lineWidth || 2

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.shadowColor = color
    ctx.shadowBlur = 15
    ctx.lineJoin = 'round'

    // Face oval
    drawLandmarkPath(ctx, landmarks, FACE_OVAL, w, h, true)
    ctx.stroke()

    // Eyes
    ctx.shadowBlur = 10
    drawLandmarkPath(ctx, landmarks, LEFT_EYE, w, h, true)
    ctx.stroke()
    drawLandmarkPath(ctx, landmarks, RIGHT_EYE, w, h, true)
    ctx.stroke()

    // Lips
    ctx.strokeStyle = '#ff00ff'
    ctx.shadowColor = '#ff00ff'
    ctx.shadowBlur = 12
    drawLandmarkPath(ctx, landmarks, LIPS_OUTER, w, h, true)
    ctx.stroke()

    // Nose bridge line
    ctx.strokeStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.beginPath()
    const noseBridge = [6, 197, 195, 5, NOSE_TIP]
    for (let i = 0; i < noseBridge.length; i++) {
      const [x, y] = pt(landmarks, noseBridge[i], w, h)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Cross-face grid lines for cyberpunk effect
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1
    const horizontalLines = [[127, 356], [234, 454], [58, 288]]
    for (const [a, b] of horizontalLines) {
      ctx.beginPath()
      const [x1, y1] = pt(landmarks, a, w, h)
      const [x2, y2] = pt(landmarks, b, w, h)
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    ctx.restore()
  }
}

function drawLandmarkPath(ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmarkList, indices: number[], w: number, h: number, close: boolean) {
  ctx.beginPath()
  for (let i = 0; i < indices.length; i++) {
    const [x, y] = pt(landmarks, indices[i], w, h)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  if (close) ctx.closePath()
}

// ═══════════════════════════════════════════════════════════════════════════
// PIXEL FACE
// ═══════════════════════════════════════════════════════════════════════════
const pixelFace: MaskRenderer = {
  name: 'Pixel Anonymizer',
  type: 'pixel_face',
  render(ctx, landmarks, w, h, settings) {
    const pixelSize = settings?.pixelSize || 12

    // Get face bounding box from oval landmarks
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const i of FACE_OVAL) {
      const [x, y] = pt(landmarks, i, w, h)
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }

    // Expand slightly
    const pad = 10
    minX = Math.max(0, minX - pad)
    minY = Math.max(0, minY - pad)
    maxX = Math.min(w, maxX + pad)
    maxY = Math.min(h, maxY + pad)

    const faceW = maxX - minX
    const faceH = maxY - minY
    if (faceW <= 0 || faceH <= 0) return

    // Get face image data
    const imageData = ctx.getImageData(minX, minY, faceW, faceH)
    const data = imageData.data

    // Pixelate
    for (let py = 0; py < faceH; py += pixelSize) {
      for (let px = 0; px < faceW; px += pixelSize) {
        // Average color in this block
        let r = 0, g = 0, b = 0, count = 0
        for (let dy = 0; dy < pixelSize && py + dy < faceH; dy++) {
          for (let dx = 0; dx < pixelSize && px + dx < faceW; dx++) {
            const idx = ((py + dy) * faceW + (px + dx)) * 4
            r += data[idx]
            g += data[idx + 1]
            b += data[idx + 2]
            count++
          }
        }
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)

        // Fill block with average
        for (let dy = 0; dy < pixelSize && py + dy < faceH; dy++) {
          for (let dx = 0; dx < pixelSize && px + dx < faceW; dx++) {
            const idx = ((py + dy) * faceW + (px + dx)) * 4
            data[idx] = r
            data[idx + 1] = g
            data[idx + 2] = b
          }
        }
      }
    }

    ctx.putImageData(imageData, minX, minY)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EMOJI TRACKER
// ═══════════════════════════════════════════════════════════════════════════
const emojiTracker: MaskRenderer = {
  name: 'Emotion Emoji',
  type: 'emoji_tracker',
  render(ctx, landmarks, w, h) {
    // Detect simple expression from mouth openness
    const upperLip = pt(landmarks, 13, w, h)
    const lowerLip = pt(landmarks, 14, w, h)
    const mouthOpen = Math.abs(lowerLip[1] - upperLip[1])
    const faceH = dist(landmarks, FOREHEAD, CHIN, w, h)
    const mouthRatio = mouthOpen / faceH

    let emoji = '😐'
    if (mouthRatio > 0.08) emoji = '😮'
    else if (mouthRatio > 0.04) emoji = '😄'
    else emoji = '🙂'

    // Also check eyebrow raise for surprise
    const browL = pt(landmarks, 105, w, h)
    const eyeL = eyeCenter(landmarks, LEFT_EYE, w, h)
    const browDist = Math.abs(eyeL[1] - browL[1]) / faceH
    if (browDist > 0.09 && mouthRatio > 0.06) emoji = '😲'

    // Position at forehead
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    const scale = faceScale(landmarks, w, h)
    const size = scale * 0.4

    ctx.save()
    ctx.font = `${size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Shadow glow
    ctx.shadowColor = 'rgba(139, 92, 246, 0.6)'
    ctx.shadowBlur = 20
    ctx.fillText(emoji, fx, fy - size * 0.5)
    ctx.restore()
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAT MORPH (animal_morph)
// ═══════════════════════════════════════════════════════════════════════════
const catMorph: MaskRenderer = {
  name: 'Cat Face',
  type: 'animal_morph',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)
    const angle = faceAngle(landmarks, w, h)
    const earSize = scale * 0.25

    // ─── Cat Ears ───
    const [ltx, lty] = pt(landmarks, LEFT_EAR_TOP, w, h)
    const [rtx, rty] = pt(landmarks, RIGHT_EAR_TOP, w, h)

    ctx.save()

    // Left ear
    drawCatEar(ctx, ltx - earSize * 0.2, lty - earSize * 0.8, earSize, angle + 0.3)
    // Right ear
    drawCatEar(ctx, rtx + earSize * 0.2, rty - earSize * 0.8, earSize, angle - 0.3)

    // ─── Cat Nose ───
    const [nx, ny] = pt(landmarks, NOSE_TIP, w, h)
    const noseSize = scale * 0.06

    ctx.fillStyle = '#FF69B4'
    ctx.beginPath()
    // Upside-down triangle
    ctx.moveTo(nx, ny - noseSize * 0.3)
    ctx.lineTo(nx - noseSize, ny + noseSize * 0.5)
    ctx.lineTo(nx + noseSize, ny + noseSize * 0.5)
    ctx.closePath()
    ctx.fill()

    // ─── Whiskers ───
    const [lcx, lcy] = pt(landmarks, LEFT_CHEEK, w, h)
    const [rcx, rcy] = pt(landmarks, RIGHT_CHEEK, w, h)
    const whiskerLen = scale * 0.35

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.shadowColor = 'rgba(255,255,255,0.5)'
    ctx.shadowBlur = 4

    // Left whiskers (3)
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.moveTo(lcx + 10, lcy + i * 12)
      ctx.lineTo(lcx - whiskerLen, lcy + i * 18)
      ctx.stroke()
    }

    // Right whiskers (3)
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.moveTo(rcx - 10, rcy + i * 12)
      ctx.lineTo(rcx + whiskerLen, rcy + i * 18)
      ctx.stroke()
    }

    ctx.restore()
  }
}

function drawCatEar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, tilt: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(tilt)

  // Outer ear
  ctx.fillStyle = '#444'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-size * 0.6, -size)
  ctx.lineTo(size * 0.6, -size)
  ctx.closePath()
  ctx.fill()

  // Inner ear (pink)
  ctx.fillStyle = '#FF69B4'
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.15)
  ctx.lineTo(-size * 0.35, -size * 0.8)
  ctx.lineTo(size * 0.35, -size * 0.8)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIME STYLE
// ═══════════════════════════════════════════════════════════════════════════
const animeStyle: MaskRenderer = {
  name: 'Anime Style',
  type: 'anime_style',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)

    // ─── Big sparkly eyes ───
    const leCenter = eyeCenter(landmarks, LEFT_EYE, w, h)
    const reCenter = eyeCenter(landmarks, RIGHT_EYE, w, h)
    const eyeRadius = scale * 0.08

    for (const [ex, ey] of [leCenter, reCenter]) {
      // Large eye shape
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(ex, ey, eyeRadius * 1.6, eyeRadius * 2, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#2a1a4a'
      ctx.fill()

      // Iris
      ctx.beginPath()
      ctx.ellipse(ex, ey + eyeRadius * 0.2, eyeRadius * 1.2, eyeRadius * 1.5, 0, 0, Math.PI * 2)
      const irisGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeRadius * 1.5)
      irisGrad.addColorStop(0, '#9b59b6')
      irisGrad.addColorStop(0.5, '#6c3483')
      irisGrad.addColorStop(1, '#1a0a2e')
      ctx.fillStyle = irisGrad
      ctx.fill()

      // Pupil
      ctx.beginPath()
      ctx.ellipse(ex, ey + eyeRadius * 0.3, eyeRadius * 0.4, eyeRadius * 0.5, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#000'
      ctx.fill()

      // Highlight sparkle
      ctx.beginPath()
      ctx.arc(ex - eyeRadius * 0.4, ey - eyeRadius * 0.4, eyeRadius * 0.35, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fill()

      // Small sparkle
      ctx.beginPath()
      ctx.arc(ex + eyeRadius * 0.3, ey + eyeRadius * 0.2, eyeRadius * 0.15, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fill()

      ctx.restore()
    }

    // ─── Blush marks ───
    const [lcx, lcy] = pt(landmarks, 116, w, h)
    const [rcx, rcy] = pt(landmarks, 345, w, h)
    const blushSize = scale * 0.06

    ctx.save()
    ctx.globalAlpha = 0.4
    ctx.fillStyle = '#ff6b9d'
    for (const [bx, by] of [[lcx, lcy], [rcx, rcy]]) {
      ctx.beginPath()
      ctx.ellipse(bx, by + blushSize, blushSize * 2, blushSize, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // ─── Sparkle particles ───
    const t = Date.now() / 1000
    ctx.save()
    ctx.fillStyle = '#fff'
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    for (let i = 0; i < 5; i++) {
      const angle2 = (t + i * 1.25) % (Math.PI * 2)
      const r = scale * 0.35 + Math.sin(t * 2 + i) * 10
      const sx = fx + Math.cos(angle2) * r
      const sy = fy - scale * 0.15 + Math.sin(angle2) * r * 0.4
      const sparkleSize = 2 + Math.sin(t * 3 + i) * 2
      drawSparkle(ctx, sx, sy, sparkleSize)
    }
    ctx.restore()
  }
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.fillStyle = '#fff'
  ctx.shadowColor = '#fff'
  ctx.shadowBlur = 6
  ctx.beginPath()
  // 4-point star
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    const outer = size
    const inner = size * 0.3
    ctx.lineTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer)
    ctx.lineTo(x + Math.cos(a + Math.PI / 4) * inner, y + Math.sin(a + Math.PI / 4) * inner)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// ═══════════════════════════════════════════════════════════════════════════
// 80s LEGENDS — Procedural overlays
// ═══════════════════════════════════════════════════════════════════════════

const heMan: MaskRenderer = {
  name: 'He-Man',
  type: 'he_man',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    const angle = faceAngle(landmarks, w, h)

    ctx.save()
    ctx.translate(fx, fy)
    ctx.rotate(angle)

    // Golden crown/helmet
    const crownW = scale * 0.5
    const crownH = scale * 0.2

    // Crown base
    ctx.fillStyle = '#FFD700'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.rect(-crownW / 2, -crownH * 1.8, crownW, crownH)
    ctx.fill()

    // Crown points
    ctx.beginPath()
    const points = 5
    for (let i = 0; i < points; i++) {
      const px = -crownW / 2 + (crownW / (points - 1)) * i
      ctx.lineTo(px, -crownH * 2.5 + (i % 2 === 0 ? 0 : crownH * 0.5))
    }
    ctx.lineTo(crownW / 2, -crownH * 1.8)
    ctx.lineTo(-crownW / 2, -crownH * 1.8)
    ctx.closePath()
    ctx.fill()

    // Center gem
    ctx.fillStyle = '#FF0000'
    ctx.shadowColor = '#FF0000'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(0, -crownH * 1.8, crownH * 0.25, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    // Power aura
    ctx.save()
    const t = Date.now() / 1000
    ctx.globalAlpha = 0.15 + Math.sin(t * 2) * 0.1
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 3
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 30
    for (const i of FACE_OVAL) {
      const [ox, oy] = pt(landmarks, i, w, h)
      const expand = 8 + Math.sin(t * 3 + i) * 4
      ctx.beginPath()
      ctx.arc(ox + (ox - fx) * 0.05 + Math.cos(t + i) * expand, oy + (oy - fy) * 0.05 + Math.sin(t + i) * expand, 2, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
  }
}

const optimusPrime: MaskRenderer = {
  name: 'Optimus Prime',
  type: 'optimus_prime',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)
    const angle = faceAngle(landmarks, w, h)

    // Metallic face plate over lower face
    const [nx, ny] = pt(landmarks, NOSE_TIP, w, h)
    const [, cy] = pt(landmarks, CHIN, w, h)
    const [lcx] = pt(landmarks, LEFT_CHEEK, w, h)
    const [rcx] = pt(landmarks, RIGHT_CHEEK, w, h)

    ctx.save()

    // Face plate (covers mouth/chin area)
    const plateGrad = ctx.createLinearGradient(lcx, ny, rcx, cy)
    plateGrad.addColorStop(0, '#1a3a6c')
    plateGrad.addColorStop(0.5, '#2855a0')
    plateGrad.addColorStop(1, '#1a3a6c')

    ctx.fillStyle = plateGrad
    ctx.beginPath()
    // Build plate from chin landmarks
    // Simplified: draw a rounded rect over mouth area
    const plateW = scale * 0.45
    const plateH = scale * 0.25
    const plateX = (nx) - plateW / 2
    const plateY = ny + scale * 0.02
    roundRect(ctx, plateX, plateY, plateW, plateH, 8)
    ctx.fill()

    // Metallic lines on plate
    ctx.strokeStyle = '#4a8fd4'
    ctx.lineWidth = 1.5
    ctx.shadowColor = '#4a8fd4'
    ctx.shadowBlur = 5
    for (let i = 1; i <= 3; i++) {
      const ly = plateY + (plateH / 4) * i
      ctx.beginPath()
      ctx.moveTo(plateX + 8, ly)
      ctx.lineTo(plateX + plateW - 8, ly)
      ctx.stroke()
    }

    // Glowing blue eyes
    const leCenter = eyeCenter(landmarks, LEFT_EYE, w, h)
    const reCenter = eyeCenter(landmarks, RIGHT_EYE, w, h)
    const eyeGlowSize = scale * 0.045

    ctx.shadowColor = '#00bfff'
    ctx.shadowBlur = 25
    ctx.fillStyle = '#00bfff'
    for (const [ex, ey] of [leCenter, reCenter]) {
      ctx.beginPath()
      ctx.ellipse(ex, ey, eyeGlowSize * 1.8, eyeGlowSize, angle, 0, Math.PI * 2)
      ctx.fill()
    }

    // Helmet top (red)
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    ctx.fillStyle = '#cc2222'
    ctx.shadowColor = '#ff4444'
    ctx.shadowBlur = 15
    const helmetW = scale * 0.55
    const helmetH = scale * 0.12
    roundRect(ctx, fx - helmetW / 2, fy - helmetH * 2.5, helmetW, helmetH, 6)
    ctx.fill()

    // Center crest
    ctx.fillStyle = '#cc2222'
    ctx.beginPath()
    ctx.moveTo(fx, fy - helmetH * 4)
    ctx.lineTo(fx - helmetW * 0.08, fy - helmetH * 2.5)
    ctx.lineTo(fx + helmetW * 0.08, fy - helmetH * 2.5)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }
}

const freddieMercury: MaskRenderer = {
  name: 'Freddie Mercury',
  type: 'freddie_mercury',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)

    ctx.save()

    // ─── Iconic Mustache ───
    const upperLipL = pt(landmarks, 61, w, h)
    const upperLipR = pt(landmarks, 291, w, h)
    const mustacheW = (upperLipR[0] - upperLipL[0]) * 1.2
    const mustacheH = scale * 0.06

    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    const mx = (upperLipL[0] + upperLipR[0]) / 2
    const my = (upperLipL[1] + upperLipR[1]) / 2 - mustacheH * 0.3
    // Chevron mustache shape
    ctx.moveTo(mx - mustacheW / 2, my)
    ctx.quadraticCurveTo(mx - mustacheW * 0.3, my - mustacheH, mx, my - mustacheH * 0.5)
    ctx.quadraticCurveTo(mx + mustacheW * 0.3, my - mustacheH, mx + mustacheW / 2, my)
    ctx.quadraticCurveTo(mx + mustacheW * 0.3, my + mustacheH * 0.5, mx, my + mustacheH * 0.2)
    ctx.quadraticCurveTo(mx - mustacheW * 0.3, my + mustacheH * 0.5, mx - mustacheW / 2, my)
    ctx.fill()

    // ─── Crown ───
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    const crownW = scale * 0.4
    ctx.fillStyle = '#FFD700'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 20
    ctx.beginPath()
    const crBase = fy - scale * 0.22
    ctx.moveTo(fx - crownW / 2, crBase)
    ctx.lineTo(fx - crownW / 2, crBase - crownW * 0.3)
    ctx.lineTo(fx - crownW * 0.25, crBase - crownW * 0.15)
    ctx.lineTo(fx, crBase - crownW * 0.4)
    ctx.lineTo(fx + crownW * 0.25, crBase - crownW * 0.15)
    ctx.lineTo(fx + crownW / 2, crBase - crownW * 0.3)
    ctx.lineTo(fx + crownW / 2, crBase)
    ctx.closePath()
    ctx.fill()

    // Crown gems
    ctx.fillStyle = '#ff0044'
    ctx.shadowColor = '#ff0044'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(fx, crBase - crownW * 0.25, crownW * 0.04, 0, Math.PI * 2)
    ctx.fill()

    // ─── Royal purple aura ───
    const t = Date.now() / 1000
    ctx.globalAlpha = 0.12 + Math.sin(t) * 0.05
    ctx.strokeStyle = '#9b59b6'
    ctx.lineWidth = 3
    ctx.shadowColor = '#9b59b6'
    ctx.shadowBlur = 20
    drawLandmarkPath(ctx, landmarks, FACE_OVAL, w, h, true)
    ctx.stroke()

    ctx.restore()
  }
}

const knightRider: MaskRenderer = {
  name: 'Knight Rider',
  type: 'knight_rider',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)
    const leCenter = eyeCenter(landmarks, LEFT_EYE, w, h)
    const reCenter = eyeCenter(landmarks, RIGHT_EYE, w, h)

    ctx.save()

    // ─── KITT Scanner effect across eyes ───
    const t = Date.now() / 1000
    const scanX = (Math.sin(t * 3) + 1) / 2 // 0 to 1
    const eyeLineY = (leCenter[1] + reCenter[1]) / 2
    const scanLeft = reCenter[0] - scale * 0.05
    const scanRight = leCenter[0] + scale * 0.05
    const currentX = scanLeft + (scanRight - scanLeft) * scanX

    // Scanner glow
    ctx.fillStyle = '#ff0000'
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 30
    ctx.beginPath()
    ctx.ellipse(currentX, eyeLineY, scale * 0.04, scale * 0.015, 0, 0, Math.PI * 2)
    ctx.fill()

    // Trail
    ctx.globalAlpha = 0.3
    ctx.shadowBlur = 15
    for (let i = 1; i <= 5; i++) {
      const trailX = currentX - (currentX - (scanLeft + (scanRight - scanLeft) * ((Math.sin(t * 3 - i * 0.15) + 1) / 2))) * 0.3 * i
      ctx.globalAlpha = 0.3 - i * 0.05
      ctx.beginPath()
      ctx.ellipse(trailX, eyeLineY, scale * 0.03 - i * 0.003, scale * 0.01, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // ─── Dark visor band across eyes ───
    ctx.globalAlpha = 0.6
    ctx.fillStyle = '#111'
    const visorH = scale * 0.06
    ctx.beginPath()
    roundRect(ctx, reCenter[0] - scale * 0.08, eyeLineY - visorH / 2, leCenter[0] - reCenter[0] + scale * 0.16, visorH, 4)
    ctx.fill()

    // ─── 80s hair volume (dark outline above head) ───
    ctx.globalAlpha = 0.5
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 4
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 10
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    ctx.beginPath()
    ctx.ellipse(fx, fy - scale * 0.18, scale * 0.32, scale * 0.15, 0, Math.PI, Math.PI * 2)
    ctx.stroke()

    // ─── Leather jacket collar suggestion ───
    ctx.globalAlpha = 0.4
    ctx.fillStyle = '#1a1a1a'
    const [chinX, chinY] = pt(landmarks, CHIN, w, h)
    ctx.beginPath()
    ctx.moveTo(chinX - scale * 0.35, chinY + scale * 0.08)
    ctx.lineTo(chinX - scale * 0.2, chinY + scale * 0.15)
    ctx.lineTo(chinX, chinY + scale * 0.05)
    ctx.lineTo(chinX + scale * 0.2, chinY + scale * 0.15)
    ctx.lineTo(chinX + scale * 0.35, chinY + scale * 0.08)
    ctx.stroke()

    ctx.restore()
  }
}

const jaspion: MaskRenderer = {
  name: 'Jaspion',
  type: 'jaspion',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    const angle = faceAngle(landmarks, w, h)
    const leCenter = eyeCenter(landmarks, LEFT_EYE, w, h)
    const reCenter = eyeCenter(landmarks, RIGHT_EYE, w, h)

    ctx.save()

    // ─── Helmet (silver/red) ───
    ctx.translate(fx, fy)
    ctx.rotate(angle)

    // Helmet dome
    const helmetW = scale * 0.55
    const helmetH = scale * 0.25
    const helmetGrad = ctx.createLinearGradient(-helmetW / 2, -helmetH * 2, helmetW / 2, 0)
    helmetGrad.addColorStop(0, '#c0c0c0')
    helmetGrad.addColorStop(0.4, '#e8e8e8')
    helmetGrad.addColorStop(0.6, '#c0c0c0')
    helmetGrad.addColorStop(1, '#888')

    ctx.fillStyle = helmetGrad
    ctx.beginPath()
    ctx.ellipse(0, -helmetH, helmetW / 2, helmetH, 0, Math.PI, Math.PI * 2)
    ctx.fill()

    // Red center stripe
    ctx.fillStyle = '#cc0000'
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.moveTo(-helmetW * 0.06, -helmetH * 2)
    ctx.lineTo(helmetW * 0.06, -helmetH * 2)
    ctx.lineTo(helmetW * 0.04, 0)
    ctx.lineTo(-helmetW * 0.04, 0)
    ctx.closePath()
    ctx.fill()

    ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform

    // ─── Visor (glowing blue) ───
    const t = Date.now() / 1000
    const visorY = (leCenter[1] + reCenter[1]) / 2
    const visorW = (leCenter[0] - reCenter[0]) + scale * 0.12
    const visorH = scale * 0.04

    ctx.fillStyle = `rgba(0, 180, 255, ${0.6 + Math.sin(t * 4) * 0.2})`
    ctx.shadowColor = '#00b4ff'
    ctx.shadowBlur = 20
    ctx.beginPath()
    roundRect(ctx, reCenter[0] - scale * 0.06, visorY - visorH, visorW, visorH * 2, 4)
    ctx.fill()

    // ─── Hero aura ───
    ctx.globalAlpha = 0.08 + Math.sin(t * 2) * 0.04
    ctx.strokeStyle = '#00b4ff'
    ctx.lineWidth = 3
    ctx.shadowColor = '#00b4ff'
    ctx.shadowBlur = 25
    drawLandmarkPath(ctx, landmarks, FACE_OVAL, w, h, true)
    ctx.stroke()

    ctx.restore()
  }
}

const sheRa: MaskRenderer = {
  name: 'She-Ra',
  type: 'she_ra',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    const t = Date.now() / 1000

    ctx.save()

    // ─── Golden Tiara ───
    const tiaraW = scale * 0.4
    const tiaraY = fy - scale * 0.15
    ctx.fillStyle = '#FFD700'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 15
    ctx.beginPath()
    // Tiara band
    roundRect(ctx, fx - tiaraW / 2, tiaraY, tiaraW, scale * 0.04, 3)
    ctx.fill()

    // Center gem (red)
    ctx.fillStyle = '#ff0044'
    ctx.shadowColor = '#ff0044'
    ctx.shadowBlur = 12
    ctx.beginPath()
    // Diamond shape
    const gemSize = scale * 0.04
    ctx.moveTo(fx, tiaraY - gemSize)
    ctx.lineTo(fx + gemSize * 0.7, tiaraY + scale * 0.02)
    ctx.lineTo(fx, tiaraY + scale * 0.04 + gemSize * 0.3)
    ctx.lineTo(fx - gemSize * 0.7, tiaraY + scale * 0.02)
    ctx.closePath()
    ctx.fill()

    // ─── Sparkles around head ───
    ctx.fillStyle = '#FFD700'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 8
    for (let i = 0; i < 8; i++) {
      const a = (t * 0.5 + i * 0.785) % (Math.PI * 2)
      const r = scale * 0.4 + Math.sin(t * 2 + i) * 8
      const sx = fx + Math.cos(a) * r
      const sy = fy - scale * 0.1 + Math.sin(a) * r * 0.5
      const sparkSize = 3 + Math.sin(t * 3 + i * 2) * 2
      if (sparkSize > 1) drawSparkle(ctx, sx, sy, sparkSize)
    }

    // ─── Power glow aura ───
    ctx.globalAlpha = 0.1 + Math.sin(t * 1.5) * 0.05
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 2
    ctx.shadowBlur = 20
    drawLandmarkPath(ctx, landmarks, FACE_OVAL, w, h, true)
    ctx.stroke()

    ctx.restore()
  }
}

const jem: MaskRenderer = {
  name: 'Jem',
  type: 'jem',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)
    const t = Date.now() / 1000

    ctx.save()

    // ─── Star earrings ───
    const [lex, ley] = pt(landmarks, 234, w, h) // left ear area
    const [rex, rey] = pt(landmarks, 454, w, h) // right ear area
    const starSize = scale * 0.05

    ctx.fillStyle = '#ff69b4'
    ctx.shadowColor = '#ff69b4'
    ctx.shadowBlur = 12

    drawStar(ctx, lex - starSize, ley + scale * 0.05, starSize)
    drawStar(ctx, rex + starSize, rey + scale * 0.05, starSize)

    // ─── Holographic hair glow ───
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    const hairGrad = ctx.createLinearGradient(fx - scale * 0.3, fy - scale * 0.3, fx + scale * 0.3, fy)
    const hue = (t * 30) % 360
    hairGrad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.3)`)
    hairGrad.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 100%, 70%, 0.3)`)
    hairGrad.addColorStop(1, `hsla(${(hue + 120) % 360}, 100%, 70%, 0.3)`)

    ctx.fillStyle = hairGrad
    ctx.beginPath()
    ctx.ellipse(fx, fy - scale * 0.15, scale * 0.35, scale * 0.2, 0, Math.PI, Math.PI * 2)
    ctx.fill()

    // ─── Glitter particles ───
    ctx.globalAlpha = 0.7
    for (let i = 0; i < 15; i++) {
      const gx = fx + Math.sin(t * 1.5 + i * 0.8) * scale * 0.45
      const gy = fy - scale * 0.1 + Math.cos(t + i * 1.2) * scale * 0.25
      const gs = 1.5 + Math.sin(t * 4 + i) * 1
      if (gs > 0.5) {
        ctx.fillStyle = `hsla(${(hue + i * 25) % 360}, 100%, 80%, ${0.5 + Math.sin(t * 5 + i) * 0.3})`
        ctx.beginPath()
        ctx.arc(gx, gy, gs, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const innerAngle = outerAngle + (2 * Math.PI) / 10
    ctx.lineTo(x + Math.cos(outerAngle) * size, y + Math.sin(outerAngle) * size)
    ctx.lineTo(x + Math.cos(innerAngle) * size * 0.4, y + Math.sin(innerAngle) * size * 0.4)
  }
  ctx.closePath()
  ctx.fill()
}

const wonderWoman: MaskRenderer = {
  name: 'Wonder Woman',
  type: 'wonder_woman',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    const t = Date.now() / 1000

    ctx.save()

    // ─── Golden Tiara with star ───
    const tiaraW = scale * 0.45
    const tiaraY = fy - scale * 0.14

    // Tiara band (golden W shape)
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = scale * 0.025
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.moveTo(fx - tiaraW / 2, tiaraY + scale * 0.02)
    ctx.lineTo(fx - tiaraW * 0.2, tiaraY - scale * 0.03)
    ctx.lineTo(fx, tiaraY + scale * 0.01)
    ctx.lineTo(fx + tiaraW * 0.2, tiaraY - scale * 0.03)
    ctx.lineTo(fx + tiaraW / 2, tiaraY + scale * 0.02)
    ctx.stroke()

    // Red star
    ctx.fillStyle = '#ff0000'
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 10
    drawStar(ctx, fx, tiaraY - scale * 0.01, scale * 0.035)

    // ─── Golden lasso glow (around face) ───
    ctx.globalAlpha = 0.15 + Math.sin(t * 2) * 0.08
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 2.5
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 20
    ctx.setLineDash([8, 4])
    drawLandmarkPath(ctx, landmarks, FACE_OVAL, w, h, true)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.restore()
  }
}

const madonna: MaskRenderer = {
  name: 'Madonna',
  type: 'madonna',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)
    const t = Date.now() / 1000

    ctx.save()

    // ─── Lace bow on top ───
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    const bowSize = scale * 0.12
    ctx.fillStyle = '#ff1493'
    ctx.shadowColor = '#ff1493'
    ctx.shadowBlur = 10

    // Left loop
    ctx.beginPath()
    ctx.ellipse(fx - bowSize * 0.8, fy - scale * 0.22, bowSize * 0.7, bowSize * 0.4, -0.3, 0, Math.PI * 2)
    ctx.fill()
    // Right loop
    ctx.beginPath()
    ctx.ellipse(fx + bowSize * 0.8, fy - scale * 0.22, bowSize * 0.7, bowSize * 0.4, 0.3, 0, Math.PI * 2)
    ctx.fill()
    // Center knot
    ctx.beginPath()
    ctx.arc(fx, fy - scale * 0.22, bowSize * 0.25, 0, Math.PI * 2)
    ctx.fill()

    // ─── Beauty mark ───
    const [lcx, lcy] = pt(landmarks, 61, w, h) // near left lip corner
    ctx.fillStyle = '#1a1a1a'
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(lcx - scale * 0.04, lcy - scale * 0.04, scale * 0.012, 0, Math.PI * 2)
    ctx.fill()

    // ─── Cross earrings ───
    const [lex, ley] = pt(landmarks, 234, w, h)
    const [rex, rey] = pt(landmarks, 454, w, h)
    const crossSize = scale * 0.04

    ctx.fillStyle = '#FFD700'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 8
    drawCross(ctx, lex - crossSize * 2, ley + scale * 0.06, crossSize)
    drawCross(ctx, rex + crossSize * 2, rey + scale * 0.06, crossSize)

    // ─── 80s neon glow ───
    ctx.globalAlpha = 0.1 + Math.sin(t * 1.5) * 0.05
    const hue = (t * 40) % 360
    ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`
    ctx.lineWidth = 2
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`
    ctx.shadowBlur = 15
    drawLandmarkPath(ctx, landmarks, FACE_OVAL, w, h, true)
    ctx.stroke()

    ctx.restore()
  }
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillRect(x - size * 0.15, y - size, size * 0.3, size * 2)
  ctx.fillRect(x - size * 0.6, y - size * 0.3, size * 1.2, size * 0.3)
}

const cheetara: MaskRenderer = {
  name: 'Cheetara',
  type: 'cheetara',
  render(ctx, landmarks, w, h) {
    const scale = faceScale(landmarks, w, h)
    const [fx, fy] = pt(landmarks, FOREHEAD, w, h)
    const t = Date.now() / 1000

    ctx.save()

    // ─── Cheetah spot pattern over face ───
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#8B4513'
    const spots = [
      [0.15, -0.1], [-0.15, -0.08], [0.2, 0.05], [-0.2, 0.03],
      [0.1, 0.12], [-0.12, 0.1], [0.08, -0.18], [-0.08, -0.15],
      [0.22, -0.02], [-0.22, 0.0],
    ]
    for (const [ox, oy] of spots) {
      ctx.beginPath()
      ctx.ellipse(fx + scale * ox, fy + scale * oy, scale * 0.025, scale * 0.02, Math.random() * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // ─── Cat ears ───
    ctx.globalAlpha = 1
    const [ltx, lty] = pt(landmarks, LEFT_EAR_TOP, w, h)
    const [rtx, rty] = pt(landmarks, RIGHT_EAR_TOP, w, h)
    const earSize = scale * 0.2

    // Orange ears
    ctx.fillStyle = '#FF8C00'
    ctx.beginPath()
    ctx.moveTo(ltx, lty)
    ctx.lineTo(ltx - earSize * 0.5, lty - earSize)
    ctx.lineTo(ltx + earSize * 0.3, lty - earSize * 0.6)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(rtx, rty)
    ctx.lineTo(rtx + earSize * 0.5, rty - earSize)
    ctx.lineTo(rtx - earSize * 0.3, rty - earSize * 0.6)
    ctx.closePath()
    ctx.fill()

    // ─── Cat eye effect (elongated eye liner) ───
    ctx.globalAlpha = 0.7
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2.5
    const wingLen = scale * 0.06

    // Left eye wing
    ctx.beginPath()
    const lOuter = pt(landmarks, 263, w, h)
    ctx.moveTo(lOuter[0], lOuter[1])
    ctx.lineTo(lOuter[0] + wingLen, lOuter[1] - wingLen * 0.8)
    ctx.stroke()

    // Right eye wing
    ctx.beginPath()
    const rOuter = pt(landmarks, 33, w, h)
    ctx.moveTo(rOuter[0], rOuter[1])
    ctx.lineTo(rOuter[0] - wingLen, rOuter[1] - wingLen * 0.8)
    ctx.stroke()

    // ─── Orange streaks from forehead ───
    ctx.globalAlpha = 0.25
    ctx.strokeStyle = '#FF8C00'
    ctx.lineWidth = 3
    ctx.shadowColor = '#FF8C00'
    ctx.shadowBlur = 8
    for (let i = 0; i < 5; i++) {
      const a = -0.4 + i * 0.2
      ctx.beginPath()
      ctx.moveTo(fx + Math.cos(a) * scale * 0.05, fy - scale * 0.1)
      ctx.lineTo(fx + Math.cos(a) * scale * 0.35, fy - scale * 0.3 + Math.sin(t + i) * 5)
      ctx.stroke()
    }

    ctx.restore()
  }
}

// ─── Utility ───
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// ═══════════════════════════════════════════════════════════════════════════
// BEAUTY FILTERS
// ═══════════════════════════════════════════════════════════════════════════

export function applyBeautySmoothSkin(ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmarkList, w: number, h: number) {
  // Get face bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const i of FACE_OVAL) {
    const [x, y] = pt(landmarks, i, w, h)
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  const pad = 5
  minX = Math.max(0, Math.floor(minX - pad))
  minY = Math.max(0, Math.floor(minY - pad))
  maxX = Math.min(w, Math.ceil(maxX + pad))
  maxY = Math.min(h, Math.ceil(maxY + pad))

  const faceW = maxX - minX
  const faceH = maxY - minY
  if (faceW <= 0 || faceH <= 0) return

  // Apply subtle blur to face region using temporary canvas
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = faceW
  tempCanvas.height = faceH
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCtx.filter = 'blur(3px)'
  tempCtx.drawImage(ctx.canvas, minX, minY, faceW, faceH, 0, 0, faceW, faceH)

  // Blend blurred face back with original (50% opacity for subtle effect)
  ctx.save()
  ctx.globalAlpha = 0.45
  ctx.drawImage(tempCanvas, minX, minY)
  ctx.restore()
}

export function applyBeautyBrighten(ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmarkList, w: number, h: number) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const i of FACE_OVAL) {
    const [x, y] = pt(landmarks, i, w, h)
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  minX = Math.max(0, Math.floor(minX))
  minY = Math.max(0, Math.floor(minY))
  maxX = Math.min(w, Math.ceil(maxX))
  maxY = Math.min(h, Math.ceil(maxY))

  const faceW = maxX - minX
  const faceH = maxY - minY
  if (faceW <= 0 || faceH <= 0) return

  // Brighten by overlaying a soft white with low opacity
  ctx.save()
  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#ffffff'

  // Clip to face oval
  ctx.beginPath()
  for (let i = 0; i < FACE_OVAL.length; i++) {
    const [x, y] = pt(landmarks, FACE_OVAL[i], w, h)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.clip()
  ctx.fillRect(minX, minY, faceW, faceH)
  ctx.restore()
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

export const MASK_RENDERERS: Record<string, MaskRenderer> = {
  neon_wireframe: neonWireframe,
  pixel_face: pixelFace,
  emoji_tracker: emojiTracker,
  cat_morph: catMorph,
  animal_morph: catMorph, // alias
  anime_style: animeStyle,
  he_man: heMan,
  optimus_prime: optimusPrime,
  freddie_mercury: freddieMercury,
  knight_rider: knightRider,
  jaspion: jaspion,
  she_ra: sheRa,
  jem: jem,
  wonder_woman: wonderWoman,
  madonna: madonna,
  cheetara: cheetara,
}

export function getMaskRenderer(maskId: string): MaskRenderer | null {
  // First try exact id match, then try type match
  return MASK_RENDERERS[maskId] || null
}
