// ═══════════════════════════════════════════════════════════════════════════
// Pixelado — efeito visual: pixeliza só a região do rosto, seguindo
// o oval facial (posição, tamanho e inclinação) frame a frame.
// ═══════════════════════════════════════════════════════════════════════════

import type { MaskDef, MaskContext } from './types'

let tiny: HTMLCanvasElement | null = null

function render({ ctx, pose, w, h }: MaskContext) {
  const { box, roll } = pose
  // margem generosa: cobre testa/cabelo e queixo
  const rx = box.w * 0.74
  const ry = box.h * 0.8
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2 - box.h * 0.04
  const x = Math.max(0, Math.floor(cx - rx)), y = Math.max(0, Math.floor(cy - ry))
  const ww = Math.min(w - x, Math.ceil(rx * 2)), hh = Math.min(h - y, Math.ceil(ry * 2))
  if (ww < 4 || hh < 4) return

  const block = Math.max(6, Math.round(Math.max(ww, hh) / 12))
  if (!tiny) tiny = document.createElement('canvas')
  const tw = Math.max(1, Math.ceil(ww / block)), th = Math.max(1, Math.ceil(hh / block))
  if (tiny.width !== tw || tiny.height !== th) { tiny.width = tw; tiny.height = th }
  const tctx = tiny.getContext('2d')!
  tctx.imageSmoothingEnabled = true
  // a fonte é o próprio canvas composto (já com filtro de cor aplicado)
  tctx.drawImage(ctx.canvas, x, y, ww, hh, 0, 0, tw, th)

  ctx.save()
  ctx.beginPath()
  ctx.translate(cx, cy)
  ctx.rotate(roll)
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.rotate(-roll)
  ctx.translate(-cx, -cy)
  ctx.clip()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tiny, 0, 0, tw, th, x, y, ww, hh)
  ctx.restore()
}

export const pixelado: MaskDef = {
  id: 'pixelado',
  name: 'Pixelado',
  icon: '👾',
  description: 'Rosto pixelado, seguindo você',
  preload: () => Promise.resolve(),
  render,
}
