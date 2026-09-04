// ═══════════════════════════════════════════════════════════════════════════
// Sprite mask — arte SVG desenhada sobre o gabarito (1000×1000, ver
// vision/facePose TEMPLATE) e levada ao rosto real a cada frame:
//   translate(centro dos olhos) → rotate(roll) → scale(largura, altura)
// A escala é por eixo: quando a cabeça gira, a largura medida encolhe e a
// máscara "achata" junto (pseudo-3D barato e convincente).
//
// Camadas: cada uma é um SVG rasterizado uma vez; a opacidade pode depender
// da pose (boca aberta, piscada…), o que dá vida à máscara sem custo.
// ═══════════════════════════════════════════════════════════════════════════

import { TEMPLATE, type FacePose } from '@/vision/facePose'
import type { MaskContext, MaskDef } from './types'

export interface SpriteLayer {
  /** conteúdo SVG (sem o <svg> externo), no espaço 1000×1000 */
  svg: string
  /** opacidade 0..1 em função da pose; omitido = sempre visível */
  opacity?: (pose: FacePose, t: number) => number
}

export interface SpriteOptions {
  id: string
  name: string
  icon: string
  description: string
  /** <defs> compartilhados (gradientes, filtros, máscaras SVG) */
  defs?: string
  layers: SpriteLayer[]
}

const SVG_NS = 'http://www.w3.org/2000/svg'

function wrap(inner: string, defs?: string): string {
  return `<svg xmlns="${SVG_NS}" width="${TEMPLATE.size}" height="${TEMPLATE.size}" viewBox="0 0 ${TEMPLATE.size} ${TEMPLATE.size}">${defs ? `<defs>${defs}</defs>` : ''}${inner}</svg>`
}

export function svgDataUrl(inner: string, defs?: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(wrap(inner, defs))
}

function rasterize(inner: string, defs?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('falha ao rasterizar SVG da máscara'))
    img.src = svgDataUrl(inner, defs)
  })
}

/** suavização 0..1 entre dois limiares (para ligar camadas por expressão) */
export function smoothstep(v: number, lo: number, hi: number): number {
  const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo)))
  return t * t * (3 - 2 * t)
}

export function createSpriteMask(opt: SpriteOptions): MaskDef {
  let images: HTMLImageElement[] | null = null
  let loading: Promise<void> | null = null

  const preload = () => {
    if (images) return Promise.resolve()
    if (!loading) {
      loading = Promise.all(opt.layers.map((l) => rasterize(l.svg, opt.defs)))
        .then((imgs) => { images = imgs })
        .catch((e) => { loading = null; throw e })
    }
    return loading
  }

  const render = ({ ctx, pose, t }: MaskContext) => {
    if (!images) { void preload(); return }
    ctx.save()
    ctx.translate(pose.cx, pose.cy)
    ctx.rotate(pose.roll)
    ctx.scale(pose.sx, pose.sy)
    ctx.translate(-TEMPLATE.eyeMid.x, -TEMPLATE.eyeMid.y)
    for (let i = 0; i < opt.layers.length; i++) {
      const o = opt.layers[i].opacity ? opt.layers[i].opacity!(pose, t) : 1
      if (o <= 0.01) continue
      ctx.globalAlpha = Math.min(1, o)
      ctx.drawImage(images[i], 0, 0)
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }

  return {
    id: opt.id, name: opt.name, icon: opt.icon, description: opt.description,
    thumb: svgDataUrl(opt.layers[0].svg, opt.defs),
    preload, render,
  }
}
