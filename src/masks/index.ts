// ═══════════════════════════════════════════════════════════════════════════
// Catálogo de máscaras (v2). Todas seguem o rosto por pontos faciais.
// ═══════════════════════════════════════════════════════════════════════════

import type { MaskDef } from './types'
import { carnaval } from './carnaval'
import { raposa } from './raposa'
import { robo } from './robo'
import { heroi } from './heroi'
import { pixelado } from './pixelado'

export type { MaskDef, MaskContext } from './types'

export const MASKS: MaskDef[] = [raposa, carnaval, robo, heroi, pixelado]

const BY_ID = new Map(MASKS.map((m) => [m.id, m]))

export function getMask(id: string | null | undefined): MaskDef | null {
  return id ? BY_ID.get(id) ?? null : null
}
