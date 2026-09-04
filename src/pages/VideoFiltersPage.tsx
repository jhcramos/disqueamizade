// ═══════════════════════════════════════════════════════════════════════════
// /filtros — vitrine das máscaras com rastreamento facial.
//
// Mostra só o que existe de verdade: as máscaras do catálogo (src/masks) e os
// filtros de cor. Prévia ao vivo usa o MESMO pipeline da sala (rastreador +
// composição), então o que se vê aqui é o que os outros veem lá.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Camera, VideoOff, Video, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { useVideoFilter } from '@/hooks/useVideoFilter'
import { useCompositeStream } from '@/hooks/useCompositeStream'
import { FILTERS, FILTER_CSS } from '@/components/camera/CameraMasks'
import { MASKS } from '@/masks'

const STATUS_LABEL: Record<string, string> = {
  loading: 'Carregando rastreador…',
  tracking: 'Rosto encontrado',
  'no-face': 'Procurando seu rosto…',
  error: 'Rastreador indisponível neste navegador',
}

export const VideoFiltersPage = () => {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [camError, setCamError] = useState<string | null>(null)
  const [camLoading, setCamLoading] = useState(false)
  const [activeMask, setActiveMask] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('normal')
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)

  const { enableFilter, disableFilter, faceRef, trackingStatus } = useVideoFilter(videoRef, stream)
  const { compositeStream } = useCompositeStream(videoRef, stream, FILTER_CSS[activeFilter] || 'none', activeMask, faceRef, false, false)

  useEffect(() => {
    if (activeMask) enableFilter(activeMask)
    else disableFilter()
  }, [activeMask, enableFilter, disableFilter])

  // fonte oculta recebe a câmera; a prévia mostra o composto
  useEffect(() => {
    if (videoRef.current && stream) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}) }
  }, [stream])
  useEffect(() => {
    const el = previewRef.current
    const src = compositeStream || stream
    if (el && src && el.srcObject !== src) { el.srcObject = src; el.play().catch(() => {}) }
  }, [compositeStream, stream])

  const startCamera = useCallback(async () => {
    setCamLoading(true); setCamError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
      setStream(s)
    } catch (err) {
      setCamError(err instanceof Error ? err.message : 'Não foi possível acessar a câmera')
    } finally { setCamLoading(false) }
  }, [])

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null); setActiveMask(null)
  }, [stream])

  useEffect(() => () => { stream?.getTracks().forEach((t) => t.stop()) }, [stream])

  const pick = (id: string) => {
    setActiveMask((cur) => (cur === id ? null : id))
    if (!stream && !camLoading) startCamera()
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full pb-24 md:pb-10">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black mb-2">Máscaras com rastreamento facial</h1>
          <p className="text-dark-300 max-w-2xl">
            Seguem seu rosto em tempo real: giram com a cabeça, abrem a boca quando você fala e piscam com você.
            Tudo roda no seu navegador e aparece igual para quem está na sala. Ideal para conversar sem mostrar o rosto.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Prévia */}
          <div className="lg:col-span-3">
            <div className="relative rounded-2xl overflow-hidden bg-dark-900 border border-white/10 aspect-[4/3]">
              {/* fonte oculta (não display:none, senão o canvas sai preto) */}
              <video ref={videoRef} autoPlay playsInline muted className="fixed top-0 left-0 w-px h-px opacity-[0.01] pointer-events-none -z-10" />
              <video ref={previewRef} autoPlay playsInline muted className={`w-full h-full object-cover ${stream ? '' : 'hidden'}`} style={{ transform: 'scaleX(-1)' }} />
              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-xs px-4">
                    <Camera className="w-12 h-12 mx-auto mb-3 text-primary-400" />
                    <p className="text-sm text-dark-300 mb-4">Ligue a câmera para testar as máscaras. Nada é gravado.</p>
                    <button onClick={startCamera} disabled={camLoading} className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 mx-auto disabled:opacity-50">
                      <Video className="w-5 h-5" /> {camLoading ? 'Ligando…' : 'Ligar câmera'}
                    </button>
                    {camError && <p className="text-xs text-red-400 mt-3">{camError}</p>}
                  </div>
                </div>
              )}
              {stream && (
                <>
                  {activeMask && STATUS_LABEL[trackingStatus] && (
                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold backdrop-blur-sm ${trackingStatus === 'tracking' ? 'bg-emerald-500/30 text-emerald-100' : trackingStatus === 'error' ? 'bg-red-500/30 text-red-100' : 'bg-black/50 text-white'}`}>
                      {STATUS_LABEL[trackingStatus]}
                    </div>
                  )}
                  <button onClick={stopCamera} className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 hover:bg-red-500/60 backdrop-blur-sm" title="Desligar câmera">
                    <VideoOff className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Filtros de cor */}
            <div className="mt-4 flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button key={f.id} onClick={() => setActiveFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activeFilter === f.id ? 'bg-primary-500/20 border-primary-500/40 text-primary-300' : 'bg-white/[0.03] border-white/5 text-dark-300 hover:bg-white/[0.08]'}`}>
                  {f.emoji} {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Catálogo */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
              {MASKS.map((m) => {
                const selected = activeMask === m.id
                return (
                  <button key={m.id} onClick={() => pick(m.id)} className={`text-left rounded-2xl p-3 border transition-all ${selected ? 'bg-primary-500/15 border-primary-500/50 scale-[1.02]' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07]'}`}>
                    <div className="w-full aspect-square rounded-xl bg-dark-800 flex items-center justify-center overflow-hidden mb-2">
                      {m.thumb ? <img src={m.thumb} alt={m.name} className="w-full h-full object-contain scale-[1.3] translate-y-1" /> : <span className="text-5xl">{m.icon}</span>}
                    </div>
                    <div className="font-bold text-sm">{m.icon} {m.name}</div>
                    <div className="text-[11px] text-dark-400 leading-snug">{m.description}</div>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2 text-xs text-dark-300">
              <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Processado no seu aparelho — o vídeo sem máscara nunca sai dele.</p>
              <p className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary-400" /> Grátis para todo mundo, inclusive convidados.</p>
            </div>

            <Link to="/sala/geral-brasil" className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold hover:scale-[1.02] transition-transform">
              Entrar numa sala com máscara <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default VideoFiltersPage
