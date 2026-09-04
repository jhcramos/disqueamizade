// ═══════════════════════════════════════════════════════════════════════════
// Tipos do motor de máscaras (v2 — rastreamento por pontos faciais)
// ═══════════════════════════════════════════════════════════════════════════

import type { FaceFrame } from '@/vision/faceTracker'
import type { FacePose } from '@/vision/facePose'

export interface MaskContext {
  ctx: CanvasRenderingContext2D
  w: number
  h: number
  frame: FaceFrame
  pose: FacePose
  /** tempo em ms (para animações) */
  t: number
}

export interface MaskDef {
  id: string
  name: string
  /** emoji para a UI quando não há thumbnail */
  icon: string
  description: string
  /** data-URL de prévia (SVG) para o seletor, quando existir */
  thumb?: string
  /** carrega assets (idempotente). Render é no-op até resolver. */
  preload: () => Promise<void>
  render: (mc: MaskContext) => void
}
