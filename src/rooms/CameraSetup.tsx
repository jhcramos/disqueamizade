import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { useVideoFilter } from '@/hooks/useVideoFilter'
import { useCompositeStream } from '@/hooks/useCompositeStream'
import { FILTER_CSS, CameraMasksButton } from '@/components/camera/CameraMasks'
import { MASKS } from '@/masks'

function useSetup() {
  const media = useCamera({ startMuted: true })
  const [activeMask, chooseMask] = useState<string | null>('pixelado')
  const [activeFilter, setActiveFilter] = useState('normal')
  const [beautySmooth, setBeautySmooth] = useState(false)
  const [beautyBrighten, setBeautyBrighten] = useState(false)
  const [approved, setApproved] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const tracker = useVideoFilter(media.videoRef, media.stream)
  useEffect(() => {
    if (activeMask) tracker.enableFilter(activeMask)
    else tracker.disableFilter()
  }, [activeMask, tracker.enableFilter, tracker.disableFilter])
  const { compositeStream, previewReady } = useCompositeStream(media.videoRef, media.stream,
    FILTER_CSS[activeFilter] || 'none', activeMask, tracker.faceRef, beautySmooth, beautyBrighten)
  const outputRef = useRef(compositeStream)
  outputRef.current = compositeStream
  const stop = useCallback(() => {
    // Desabilita imediatamente: unpublish é assíncrono.
    outputRef.current?.getTracks().forEach(track => { track.enabled = false })
    setApproved(false)
    media.stopCamera()
  }, [media.stopCamera])
  const openPreview = useCallback(async () => { stop(); setPreviewOpen(true) }, [stop])
  const prepare = useCallback(async () => {
    setStarting(true)
    try { await media.startCamera() } finally { setStarting(false) }
  }, [media.startCamera])
  const confirm = useCallback(() => {
    if (!previewReady || !media.isCameraOn || !compositeStream) return false
    setApproved(true); setPreviewOpen(false); return true
  }, [previewReady, media.isCameraOn, compositeStream])
  const setActiveMask = useCallback((id: string | null) => {
    if (approved) { stop(); setPreviewOpen(true) }
    chooseMask(id)
  }, [approved, stop])
  return { ...media, ...tracker, activeMask, setActiveMask, activeFilter, setActiveFilter,
    beautySmooth, setBeautySmooth, beautyBrighten, setBeautyBrighten,
    previewStream: compositeStream, previewReady, approved, previewOpen, setPreviewOpen,
    starting, prepare, confirm, stop, openPreview }
}
const Context = createContext<ReturnType<typeof useSetup> | null>(null)
export function useCameraSetup() {
  const value = useContext(Context)
  if (!value) throw new Error('CameraSetupProvider required')
  return value
}
export function CameraSetupProvider({ children }: { children: ReactNode }) {
  const camera = useSetup()
  return <Context.Provider value={camera}>
    {/* Fonte de processamento permanente; nunca é usada como autovisualização. */}
    <video ref={camera.videoRef} autoPlay playsInline muted aria-hidden="true" className="fixed top-0 left-0 w-px h-px opacity-0 pointer-events-none -z-10" />
    {children}
    {camera.previewOpen && <div className="fixed inset-0 z-[60] bg-dark-950/95 overflow-y-auto"><CameraPreview onContinue={() => {}} onSkip={() => camera.setPreviewOpen(false)} onCancel={() => { camera.stop(); camera.setPreviewOpen(false) }} /></div>}
  </Context.Provider>
}
export function ProcessedPreview({ stream, className = '' }: { stream: MediaStream | null; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const video = ref.current
    if (!video) return
    video.srcObject = stream
    if (stream) void video.play().catch(() => {})
    return () => { video.srcObject = null }
  }, [stream])
  return <video ref={ref} autoPlay playsInline muted className={className} />
}
export function CameraPreview({ onContinue, onSkip, onCancel }: { onContinue: () => void; onSkip: () => void; onCancel: () => void }) {
  const camera = useCameraSetup()
  return <main className="min-h-screen bg-dark-950 text-white flex items-center justify-center px-4 py-8">
    <section aria-label="Prévia privada da câmera" className="w-full max-w-2xl rounded-2xl border border-white/10 bg-dark-900 p-5 sm:p-7">
      <p className="text-xs font-semibold text-emerald-300 mb-2">PRÉVIA PRIVADA · SÓ VOCÊ VÊ</p>
      <h1 className="text-2xl font-bold">Escolha como quer aparecer</h1>
      <p className="text-sm text-dark-300 mt-2 mb-5">Teste sua máscara antes de entrar. Câmera e microfone só serão compartilhados após sua escolha; o microfone começa desligado.</p>
      <div className="relative aspect-video bg-dark-950 rounded-xl overflow-hidden border border-white/10">
        <ProcessedPreview stream={camera.previewStream} className="w-full h-full object-contain" />
        {!camera.stream && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <span className="text-4xl">🎭</span>
          <p className="text-sm font-semibold text-dark-200">Sua prévia aparecerá aqui</p>
          <p className="text-xs text-dark-400">Ative pelo botão verde abaixo. Isso ainda não transmite seu vídeo.</p>
        </div>}
      </div>
      <div className="flex flex-wrap gap-2 mt-4" aria-label="Escolher máscara">
        {MASKS.map(mask => <button key={mask.id} aria-pressed={camera.activeMask === mask.id} onClick={() => camera.setActiveMask(mask.id)} className={`px-3 py-2 rounded-xl border text-sm ${camera.activeMask === mask.id ? 'border-primary-400 bg-primary-500/20' : 'border-white/10 bg-white/5'}`}>{mask.icon} {mask.name}</button>)}
        <button aria-pressed={!camera.activeMask} onClick={() => camera.setActiveMask(null)} className={`px-3 py-2 rounded-xl border text-sm ${!camera.activeMask ? 'border-primary-400 bg-primary-500/20' : 'border-white/10'}`}>Sem máscara</button>
        <CameraMasksButton activeFilter={camera.activeFilter} onFilterChange={camera.setActiveFilter} activeMask={camera.activeMask} onMaskChange={camera.setActiveMask} beautySmooth={camera.beautySmooth} onBeautySmoothChange={camera.setBeautySmooth} beautyBrighten={camera.beautyBrighten} onBeautyBrightenChange={camera.setBeautyBrighten} />
      </div>
      {camera.stream && !camera.previewReady && <p role="status" className="text-sm text-amber-200 mt-3">{camera.trackingStatus === 'error' ? 'Não foi possível preparar a máscara. Tente novamente ou entre sem câmera.' : 'Preparando a prévia. Posicione o rosto em frente à câmera.'}</p>}
      {camera.error && <p role="alert" className="text-sm text-red-300 mt-3">{camera.error}</p>}
      <p className="text-xs text-dark-400 mt-4">Máscaras decorativas e pixelização não garantem anonimato. Para não mostrar seu rosto nem o ambiente, entre sem câmera.</p>
      <div className="mt-5 space-y-3">
        {!camera.stream ? (
          <button
            onClick={camera.prepare}
            disabled={camera.starting}
            className="group w-full min-h-16 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-left text-white shadow-[0_0_0_4px_rgba(52,211,153,0.12),0_14px_35px_rgba(16,185,129,0.28)] transition hover:-translate-y-0.5 hover:from-emerald-400 hover:to-teal-400 hover:shadow-[0_0_0_5px_rgba(52,211,153,0.17),0_18px_40px_rgba(16,185,129,0.34)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/60 disabled:cursor-wait disabled:opacity-70"
          >
            <span className="flex items-center justify-between gap-4">
              <span><span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-950/70">Etapa 1 · prévia privada</span><span className="mt-0.5 block text-base font-extrabold sm:text-lg">{camera.starting ? 'Abrindo sua câmera…' : 'Ativar câmera e ver minha máscara'}</span></span>
              <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-xl text-emerald-700 shadow-md transition group-hover:translate-x-0.5">{camera.starting ? '…' : '→'}</span>
            </span>
          </button>
        ) : (
          <button
            disabled={!camera.previewReady || !camera.isCameraOn || camera.starting}
            onClick={() => { if (camera.confirm()) onContinue() }}
            className="group w-full min-h-16 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-left text-white shadow-[0_0_0_4px_rgba(52,211,153,0.12),0_14px_35px_rgba(16,185,129,0.28)] transition hover:-translate-y-0.5 hover:from-emerald-400 hover:to-teal-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/60 disabled:translate-y-0 disabled:cursor-wait disabled:border-white/20 disabled:from-dark-700 disabled:to-dark-700 disabled:text-dark-300 disabled:shadow-none"
          >
            <span className="flex items-center justify-between gap-4">
              <span><span className="block text-[11px] font-bold uppercase tracking-[0.16em] opacity-75">Etapa 2 · entrar na sala</span><span className="mt-0.5 block text-base font-extrabold sm:text-lg">{camera.previewReady ? `Confirmar ${camera.activeMask ? 'máscara' : 'câmera'} e entrar` : 'Preparando sua máscara…'}</span></span>
              <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-xl text-emerald-700 shadow-md">{camera.previewReady ? '✓' : '…'}</span>
            </span>
          </button>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button onClick={() => { camera.stop(); onSkip() }} className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold text-dark-100 transition hover:border-white/35 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">Entrar sem câmera</button>
          <button onClick={onCancel} className="rounded-xl px-5 py-3 text-dark-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30">Voltar</button>
        </div>
      </div>
    </section>
  </main>
}
