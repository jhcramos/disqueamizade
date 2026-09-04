import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function harness({ face = null, maskId = 'robo', maskThrows = false } = {}) {
  const video = { paused: false, ended: false, readyState: 4, currentTime: 2, videoWidth: 640, videoHeight: 480 }
  let rawDraws = 0, snapshotDraws = 0, clears = 0, raf, stream
  if (face) face = { ...face, source: { width: 640, height: 480 } }
  const tracks = [{ enabled: true, stop() {} }]
  const ctx = { drawImage(source) { if (source === video) rawDraws++; else if (source === face?.source) snapshotDraws++ }, fillRect() { clears++ }, fillText() {}, save() {}, restore() {}, clearRect() {} }
  const canvas = { width: 640, height: 480, getContext: () => ctx, captureStream: () => ({ getVideoTracks: () => tracks, getTracks: () => tracks, addTrack() {} }) }
  const code = ts.transpileModule(readFileSync(new URL('../src/hooks/useCompositeStream.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  runInNewContext(code, { exports, require: name => name === 'react' ? {
    useRef: value => ({ current: value }), useCallback: f => f,
    useState: value => [value, next => { if (next?.getVideoTracks) stream = next }], useEffect: f => f(),
  } : { getMask: id => id ? { preload: async () => {}, render: () => { if (maskThrows) throw Error('failed') } } : null },
  document: { createElement: () => canvas }, requestAnimationFrame: callback => { raf = callback; return 1 }, cancelAnimationFrame() {}, performance: { now: () => 100 }, console,
  })
  exports.useCompositeStream({ current: video }, { getAudioTracks: () => [] }, 'none', maskId, { current: face }, false, false)
  return { render: () => raf(), counts: () => ({ rawDraws, snapshotDraws, clears }), stream: () => stream }
}

test('selected mask must not reveal camera while face tracking is unavailable', async () => {
  const h = harness(); await Promise.resolve(); h.render()
  assert.equal(h.counts().rawDraws, 0)
  assert(h.counts().clears > 0)
})
test('no mask remains an explicit supported camera choice', async () => {
  const h = harness({ maskId: null }); await Promise.resolve(); h.render()
  assert.equal(h.counts().rawDraws, 1)
})

test('stale tracking never paints a new unprotected camera frame', async () => {
  const h = harness({ face: { frame: { ts: -1000 }, videoTime: 2 } }); await Promise.resolve(); h.render()
  assert.equal(h.counts().rawDraws, 0)
})
test('mask render failure overwrites the camera before the canvas frame is emitted', async () => {
  const h = harness({ face: { frame: { ts: 100 }, videoTime: 2 }, maskThrows: true }); await Promise.resolve(); h.render()
  assert.equal(h.counts().snapshotDraws, 1)
  assert(h.counts().clears >= 2)
})
test('different frame cadences use the detected snapshot, never a newer raw frame', async () => {
  const h = harness({ face: { frame: { ts: 100 }, videoTime: 1 } }); await Promise.resolve(); h.render()
  assert.equal(h.counts().rawDraws, 0)
  assert.equal(h.counts().snapshotDraws, 1)
})
function publicationClass() {
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL('../src/rooms/stagePublication.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  runInNewContext(code, { exports })
  return exports.StagePublication
}
test('connection plus camera stream cannot publish without explicit approval', async () => {
  const StagePublication = publicationClass(); let calls = 0
  const publisher = new StagePublication({ publishTrack: async () => { calls++; return {} }, unpublishTrack() {} })
  assert.equal(await publisher.start({ getVideoTracks: () => [{ enabled: true }] }, undefined, false), false)
  assert.equal(calls, 0)
})
test('cancel during publish mutes immediately and cleans up the late publication', async () => {
  const StagePublication = publicationClass(); let resolve, unpublishes = 0, publishes = 0
  const video = { enabled: true, readyState: 'live' }, audio = { enabled: false }
  const publisher = new StagePublication({ publishTrack: () => { publishes++; return new Promise(r => { resolve = r }) }, unpublishTrack: () => { unpublishes++ } })
  const pending = publisher.start({ getVideoTracks: () => [video] }, audio, true)
  publisher.cancel(); assert.equal(video.enabled, false); assert.equal(audio.enabled, false)
  resolve({ track: video }); assert.equal(await pending, false)
  assert.equal(unpublishes, 1); assert.equal(publishes, 1)
})

function captureHarness() {
  let resolveCapture, attached = 0, stopped = 0
  const audio = { enabled: true, stop() { stopped++ } }, video = { enabled: true, stop() { stopped++ } }
  const stream = { getTracks: () => [video, audio], getAudioTracks: () => [audio] }
  const code = ts.transpileModule(readFileSync(new URL('../src/hooks/useCamera.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  runInNewContext(code, { exports, console, require: () => ({
    useRef: value => ({ current: value }), useCallback: f => f, useEffect: f => f(),
    useState: value => [value, next => { if (next === stream) attached++ }],
  }), navigator: { mediaDevices: { getUserMedia: () => new Promise(resolve => { resolveCapture = resolve }) } } })
  return { camera: exports.useCamera({ startMuted: true }), resolve: () => resolveCapture(stream), audio, counts: () => ({ attached, stopped }) }
}
test('a private preview starts with the microphone disabled', async () => {
  const h = captureHarness(), pending = h.camera.startCamera()
  h.resolve(); await pending
  assert.equal(h.audio.enabled, false)
  assert.equal(h.counts().attached, 1)
})
test('leaving while permission is pending stops late tracks without attaching the camera', async () => {
  const h = captureHarness(), pending = h.camera.startCamera()
  h.camera.stopCamera(); h.resolve(); await pending
  assert.equal(h.counts().attached, 0)
  assert.equal(h.counts().stopped, 2)
})
test('effect cleanup can be followed by a fresh approved publication without enabling audio', async () => {
  const StagePublication = publicationClass(), video = { enabled: true, readyState: 'live' }, audio = { enabled: false }
  const participant = { publishTrack: async track => ({ track }), unpublishTrack() {} }
  const first = new StagePublication(participant)
  await first.start({ getVideoTracks: () => [video] }, audio, true); first.cancel()
  const replay = new StagePublication(participant)
  assert.equal(await replay.start({ getVideoTracks: () => [video] }, audio, true), true)
  assert.equal(video.enabled, true); assert.equal(audio.enabled, false)
})
