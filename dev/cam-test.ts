// Valida que a fonte de vídeo para o canvas produz frames (não preto).
// Compara: (A) display:none + sem play()  vs  (B) off-screen + play()
declare global { interface Window { __result: any } }
const out = document.getElementById('out')!

function meanLuma(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const d = ctx.getImageData(0, 0, w, h).data
  let s = 0
  for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]
  return s / (d.length / 4) / 3
}

async function grab(mode: 'broken' | 'fixed'): Promise<number> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
  const v = document.createElement('video')
  v.muted = true; v.playsInline = true; (v as any).autoplay = true
  if (mode === 'broken') {
    v.style.display = 'none'
    document.body.appendChild(v)
    v.srcObject = stream
    // sem play() — como estava antes
  } else {
    v.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-10'
    document.body.appendChild(v)
    v.srcObject = stream
    v.muted = true
    await v.play().catch(() => {})
  }
  // espera alguns frames
  await new Promise((r) => setTimeout(r, 1500))
  const c = document.createElement('canvas'); c.width = 640; c.height = 480
  const ctx = c.getContext('2d')!
  let luma = 0
  for (let i = 0; i < 5; i++) {
    if (!v.paused && !v.ended && v.videoWidth) ctx.drawImage(v, 0, 0, 640, 480)
    luma = meanLuma(ctx, 640, 480)
    await new Promise((r) => setTimeout(r, 120))
  }
  stream.getTracks().forEach((t) => t.stop())
  return luma
}

;(async () => {
  const res: any = {}
  try { res.broken = await grab('broken') } catch (e) { res.brokenErr = String(e) }
  try { res.fixed = await grab('fixed') } catch (e) { res.fixedErr = String(e) }
  res.brokenBlack = (res.broken ?? 0) < 3
  res.fixedHasImage = (res.fixed ?? 0) >= 8
  window.__result = res
  out.textContent = JSON.stringify(res, null, 2)
})()
