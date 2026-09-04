// ═══════════════════════════════════════════════════════════════════════════
// facePose — deriva, a partir dos 478 pontos, o que uma máscara precisa:
// centro (entre os olhos), rotação (roll), giro (yaw), largura/altura reais
// do rosto, pontos-chave e o polígono do oval do rosto. Tudo em pixels.
// ═══════════════════════════════════════════════════════════════════════════

import type { FaceFrame, Landmarks } from './faceTracker'

export interface Pt { x: number; y: number }

/** Índices canônicos do Face Mesh (mesmos 468 primeiros do Face Landmarker). */
export const LM = {
  NOSE_TIP: 1,
  FOREHEAD: 10,     // topo da testa (linha do cabelo)
  CHIN: 152,
  LEFT_CHEEK: 234,  // "left" = esquerda DA PESSOA (aparece à direita na imagem)
  RIGHT_CHEEK: 454,
  LIP_TOP: 13,
  LIP_BOTTOM: 14,
  MOUTH_L: 61,
  MOUTH_R: 291,
} as const

export const FACE_OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
export const LEFT_EYE = [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398]
export const RIGHT_EYE = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246]
export const LIPS_OUTER = [61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185]

/**
 * Gabarito das máscaras (viewBox 1000×1000). As artes SVG são desenhadas
 * sobre este rosto padrão; em runtime a arte é levada ao rosto real por
 * translação + rotação + escala não-uniforme (largura e altura separadas).
 */
export const TEMPLATE = {
  size: 1000,
  eyeMid: { x: 500, y: 420 },  // ponto entre os olhos (âncora)
  eyeL: { x: 617, y: 420 },    // olho esquerdo da pessoa (direita da imagem)
  eyeR: { x: 383, y: 420 },
  nose: { x: 500, y: 585 },
  mouth: { x: 500, y: 696 },
  chin: { x: 500, y: 840 },
  forehead: { x: 500, y: 160 },
  faceW: 520,                   // distância entre as bochechas (234↔454)
  faceH: 680,                   // testa (10) → queixo (152)
} as const

export interface FacePose {
  cx: number; cy: number       // centro entre os olhos (px)
  roll: number                 // inclinação da cabeça (rad)
  yaw: number                  // giro: -1 (esq. da imagem) .. +1 (dir. da imagem)
  faceW: number; faceH: number // medidas reais (px)
  sx: number; sy: number       // escala gabarito→real, por eixo
  eyeL: Pt; eyeR: Pt; nose: Pt; mouth: Pt; chin: Pt; forehead: Pt
  mouthOpen: number            // 0..1 (blendshape jawOpen)
  blinkL: number; blinkR: number
  smile: number
  box: { x: number; y: number; w: number; h: number }
  oval: Pt[]
}

function pt(lm: Landmarks, i: number, w: number, h: number): Pt {
  return { x: lm[i].x * w, y: lm[i].y * h }
}
function centroid(lm: Landmarks, idx: readonly number[], w: number, h: number): Pt {
  let sx = 0, sy = 0
  for (const i of idx) { sx += lm[i].x; sy += lm[i].y }
  return { x: (sx / idx.length) * w, y: (sy / idx.length) * h }
}
const d = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function computePose(frame: FaceFrame, w: number, h: number): FacePose {
  const lm = frame.landmarks
  const eyeL = centroid(lm, LEFT_EYE, w, h)
  const eyeR = centroid(lm, RIGHT_EYE, w, h)
  const cheekL = pt(lm, LM.LEFT_CHEEK, w, h)
  const cheekR = pt(lm, LM.RIGHT_CHEEK, w, h)
  const nose = pt(lm, LM.NOSE_TIP, w, h)
  const chin = pt(lm, LM.CHIN, w, h)
  const forehead = pt(lm, LM.FOREHEAD, w, h)
  const mouth = { x: (lm[LM.LIP_TOP].x + lm[LM.LIP_BOTTOM].x) / 2 * w, y: (lm[LM.LIP_TOP].y + lm[LM.LIP_BOTTOM].y) / 2 * h }

  const cx = (eyeL.x + eyeR.x) / 2
  const cy = (eyeL.y + eyeR.y) / 2
  const roll = Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x)
  const faceW = Math.max(1, d(cheekL, cheekR))
  const faceH = Math.max(1, d(forehead, chin))
  const midCheek = { x: (cheekL.x + cheekR.x) / 2, y: (cheekL.y + cheekR.y) / 2 }
  const yaw = clamp((nose.x - midCheek.x) / (faceW / 2), -1, 1)

  const oval = FACE_OVAL.map((i) => pt(lm, i, w, h))
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of oval) { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y }

  const b = frame.blend
  return {
    cx, cy, roll, yaw, faceW, faceH,
    sx: faceW / TEMPLATE.faceW,
    sy: faceH / TEMPLATE.faceH,
    eyeL, eyeR, nose, mouth, chin, forehead,
    mouthOpen: b.jawOpen ?? 0,
    blinkL: b.eyeBlinkLeft ?? 0,
    blinkR: b.eyeBlinkRight ?? 0,
    smile: ((b.mouthSmileLeft ?? 0) + (b.mouthSmileRight ?? 0)) / 2,
    box: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
    oval,
  }
}
