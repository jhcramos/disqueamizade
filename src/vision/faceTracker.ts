// ═══════════════════════════════════════════════════════════════════════════
// faceTracker — rastreamento facial com MediaPipe Face Landmarker
//
// Substitui o face-api.js (abandonado, só caixa grosseira a 5 fps). Entrega
// 478 pontos do rosto + 52 "blendshapes" de expressão (boca aberta, piscada,
// sorriso…) a ~30 fps, 100% no navegador (WASM + GPU, com fallback CPU).
//
// O runtime WASM e o modelo são servidos do próprio site:
//   /mediapipe/wasm  ← scripts/copy-mediapipe.mjs (no build)
//   /models/face_landmarker.task
// Tudo é carregado sob demanda: só quando alguém escolhe uma máscara.
// ═══════════════════════════════════════════════════════════════════════════

import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'

export type Landmarks = NormalizedLandmark[]

export interface FaceFrame {
  /** 478 pontos normalizados (0..1 na imagem; z relativo à profundidade). */
  landmarks: Landmarks
  /** Blendshapes (0..1): jawOpen, eyeBlinkLeft, eyeBlinkRight, mouthSmileLeft… */
  blend: Record<string, number>
  ts: number
}

export type TrackerSource = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement

const WASM_PATH = '/mediapipe/wasm'
const MODEL_PATH = '/models/face_landmarker.task'

let landmarkerPromise: Promise<FaceLandmarker> | null = null
let ready = false

export function isFaceTrackerReady(): boolean { return ready }

/** Carrega (uma vez) o Face Landmarker. GPU primeiro; cai para CPU se falhar. */
export function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH)
      const create = (delegate: 'GPU' | 'CPU') => FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_PATH, delegate },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      })
      let fl: FaceLandmarker
      try {
        fl = await create('GPU')
      } catch (e) {
        console.warn('[face] GPU indisponível, usando CPU', e)
        fl = await create('CPU')
      }
      ready = true
      return fl
    })()
    landmarkerPromise.catch(() => { landmarkerPromise = null })
  }
  return landmarkerPromise
}

let lastTs = 0

/**
 * Roda a detecção num frame. `ts` precisa ser crescente (exigência do modo
 * VIDEO); a função garante isso mesmo se o chamador repetir o timestamp.
 */
export function detectFrame(fl: FaceLandmarker, source: TrackerSource, ts: number): FaceFrame | null {
  if (ts <= lastTs) ts = lastTs + 1
  lastTs = ts
  const res = fl.detectForVideo(source, ts)
  const lm = res.faceLandmarks?.[0]
  if (!lm || lm.length < 468) return null
  const blend: Record<string, number> = {}
  const cats = res.faceBlendshapes?.[0]?.categories
  if (cats) for (const c of cats) blend[c.categoryName] = c.score
  return { landmarks: lm, blend, ts }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Suavizador temporal: mata o tremor quando a cabeça está parada e acompanha
 * rápido quando ela se move (alpha adaptativo). Segura o último rosto por
 * alguns frames quando a detecção falha, para a máscara não piscar.
 */
export class FaceSmoother {
  private prev: FaceFrame | null = null
  private misses = 0

  constructor(
    private readonly baseAlpha = 0.45,
    private readonly blendAlpha = 0.5,
    private readonly holdFrames = 10,
  ) {}

  push(frame: FaceFrame | null): FaceFrame | null {
    if (!frame) {
      if (this.prev && this.misses++ < this.holdFrames) return this.prev
      this.prev = null
      return null
    }
    this.misses = 0
    if (!this.prev) {
      this.prev = {
        landmarks: frame.landmarks.map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility })),
        blend: { ...frame.blend },
        ts: frame.ts,
      }
      return this.prev
    }
    const p = this.prev.landmarks
    const n = frame.landmarks
    // movimento da ponta do nariz (normalizado) decide o quão rápido seguir
    const motion = Math.hypot(n[1].x - p[1].x, n[1].y - p[1].y)
    const a = clamp(this.baseAlpha + motion * 25, 0.3, 0.95)
    for (let i = 0; i < n.length && i < p.length; i++) {
      p[i].x += (n[i].x - p[i].x) * a
      p[i].y += (n[i].y - p[i].y) * a
      p[i].z += (n[i].z - p[i].z) * a
    }
    const b = this.prev.blend
    const ab = this.blendAlpha
    for (const k in frame.blend) b[k] = (b[k] ?? frame.blend[k]) * (1 - ab) + frame.blend[k] * ab
    this.prev.ts = frame.ts
    return this.prev
  }

  reset() { this.prev = null; this.misses = 0 }
}
