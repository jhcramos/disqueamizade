// ═══════════════════════════════════════════════════════════════════════════
// Copia o runtime WASM do MediaPipe Tasks Vision para public/mediapipe/wasm.
//
// O rastreador facial (src/vision/faceTracker.ts) carrega o WASM do próprio
// site em vez de um CDN externo: sem dependência de terceiros em runtime e
// sem surpresa de CORS/bloqueio. A pasta é gerada no build (gitignored).
// ═══════════════════════════════════════════════════════════════════════════

import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
const DEST = join(ROOT, 'public', 'mediapipe', 'wasm')

if (!existsSync(SRC)) {
  console.error('[mediapipe] pacote @mediapipe/tasks-vision não encontrado — rode npm install')
  process.exit(1)
}
mkdirSync(DEST, { recursive: true })
cpSync(SRC, DEST, { recursive: true })
console.log(`[mediapipe] ${readdirSync(DEST).length} arquivos WASM copiados para public/mediapipe/wasm`)
