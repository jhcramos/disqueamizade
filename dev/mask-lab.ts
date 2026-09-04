// Laboratório de máscaras: roda o Face Landmarker em fotos (ou webcam) e
// desenha cada máscara do catálogo. Só no `vite` dev: http://localhost:3000/dev/mask-lab.html
import { getFaceLandmarker, detectFrame, type FaceFrame } from '@/vision/faceTracker'
import { computePose, FACE_OVAL, LEFT_EYE, RIGHT_EYE } from '@/vision/facePose'
import { MASKS } from '@/masks'

declare global { interface Window { __done?: boolean; __errors: string[] } }
window.__errors = []
window.addEventListener('error', (e) => window.__errors.push(String(e.message)))
window.addEventListener('unhandledrejection', (e) => window.__errors.push(String((e as PromiseRejectionEvent).reason)))

const status = document.getElementById('status')!
const out = document.getElementById('out')!
const log = (s: string) => { status.textContent += '\n' + s; console.log(s) }

const params = new URLSearchParams(location.search)
const IMAGES = params.get('img') ? [params.get('img')!] : ['/dev/faces/face1.jpg', '/dev/faces/face2.jpg']

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img ' + src)); i.src = src })
}

function drawDebug(ctx: CanvasRenderingContext2D, frame: FaceFrame, w: number, h: number) {
  const pose = computePose(frame, w, h)
  ctx.fillStyle = 'rgba(0,255,180,.7)'
  for (const p of frame.landmarks) ctx.fillRect(p.x * w - 1, p.y * h - 1, 2, 2)
  const poly = (idx: number[], color: string) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath()
    idx.forEach((i, k) => { const p = frame.landmarks[i]; k ? ctx.lineTo(p.x * w, p.y * h) : ctx.moveTo(p.x * w, p.y * h) })
    ctx.closePath(); ctx.stroke()
  }
  poly(FACE_OVAL, '#ff0'); poly(LEFT_EYE, '#0ff'); poly(RIGHT_EYE, '#f0f')
  // âncora e eixos
  ctx.save(); ctx.translate(pose.cx, pose.cy); ctx.rotate(pose.roll)
  ctx.strokeStyle = '#f00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-pose.faceW / 2, 0); ctx.lineTo(pose.faceW / 2, 0); ctx.stroke()
  ctx.strokeStyle = '#0f0'; ctx.beginPath(); ctx.moveTo(0, -pose.faceH * 0.38); ctx.lineTo(0, pose.faceH * 0.62); ctx.stroke()
  ctx.restore()
  ctx.fillStyle = '#fff'; ctx.font = '12px monospace'
  ctx.fillText(`roll ${(pose.roll * 180 / Math.PI).toFixed(1)}°  yaw ${pose.yaw.toFixed(2)}  W ${pose.faceW.toFixed(0)} H ${pose.faceH.toFixed(0)}  jaw ${pose.mouthOpen.toFixed(2)} blink ${pose.blinkL.toFixed(2)}/${pose.blinkR.toFixed(2)}`, 6, 14)
}

async function runOnSource(label: string, src: CanvasImageSource, w: number, h: number) {
  const fl = await getFaceLandmarker()
  const frame = detectFrame(fl, src as HTMLImageElement, performance.now())
  const row = document.createElement('div'); row.className = 'row'; out.appendChild(row)
  const fig = (cap: string) => {
    const f = document.createElement('figure'); const c = document.createElement('canvas')
    c.width = w; c.height = h; c.style.width = Math.round(w * 0.5) + 'px'
    const fc = document.createElement('figcaption'); fc.textContent = cap
    f.append(c, fc); row.appendChild(f); return c.getContext('2d')!
  }
  const dctx = fig(`${label} — landmarks`)
  dctx.drawImage(src, 0, 0, w, h)
  if (!frame) { log(`${label}: NENHUM ROSTO detectado`); return }
  drawDebug(dctx, frame, w, h)
  const pose = computePose(frame, w, h)
  log(`${label}: rosto ok · W=${pose.faceW.toFixed(0)} H=${pose.faceH.toFixed(0)} roll=${(pose.roll * 180 / Math.PI).toFixed(1)}° yaw=${pose.yaw.toFixed(2)}`)
  await Promise.all(MASKS.map((m) => m.preload()))
  for (const m of MASKS) {
    const ctx = fig(`${label} — ${m.name}`)
    ctx.drawImage(src, 0, 0, w, h)
    m.render({ ctx, w, h, frame, pose, t: performance.now() })
  }
}

async function main() {
  try {
    log('carregando Face Landmarker…')
    const t0 = performance.now()
    await getFaceLandmarker()
    log(`landmarker pronto em ${(performance.now() - t0).toFixed(0)} ms`)
    for (const s of IMAGES) {
      const img = await loadImage(s)
      await runOnSource(s.split('/').pop()!, img, img.naturalWidth, img.naturalHeight)
    }
    log('concluído')
  } catch (e) {
    log('ERRO: ' + (e instanceof Error ? e.stack || e.message : String(e)))
    window.__errors.push(String(e))
  } finally {
    window.__done = true
  }
}

document.getElementById('cam')!.addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
  const video = document.createElement('video'); video.srcObject = stream; video.muted = true; video.playsInline = true
  await video.play()
  const fl = await getFaceLandmarker()
  await Promise.all(MASKS.map((m) => m.preload()))
  const row = document.createElement('div'); row.className = 'row'; out.prepend(row)
  const canvases = MASKS.map((m) => { const c = document.createElement('canvas'); c.width = 640; c.height = 480; c.style.width = '320px'; const f = document.createElement('figure'); const fc = document.createElement('figcaption'); fc.textContent = 'webcam — ' + m.name; f.append(c, fc); row.appendChild(f); return c })
  const loop = () => {
    const frame = detectFrame(fl, video, performance.now())
    canvases.forEach((c, i) => { const ctx = c.getContext('2d')!; ctx.drawImage(video, 0, 0, 640, 480); if (frame) MASKS[i].render({ ctx, w: 640, h: 480, frame, pose: computePose(frame, 640, 480), t: performance.now() }) })
    requestAnimationFrame(loop)
  }
  loop()
})

main()
