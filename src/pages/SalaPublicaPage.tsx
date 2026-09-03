// ═══════════════════════════════════════════════════════════════════════════
// SalaPublicaPage — página pública e indexável de uma sala (/sala/:slug)
//
// Serve ao Google e ao visitante que chega pelo buscador: H1, descrição, FAQ
// com schema, contagem real de pessoas e CTA "Entrar" (convidado + 18+ → sala).
// Não exige login. (Plano V4, item 2.3)
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Video, Users, ShieldCheck, ChevronRight } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { useAuthStore } from '@/store/authStore'
import { useAgeVerification } from '@/components/common/AgeVerificationModal'
import { supabase } from '@/services/supabase/client'
import { track } from '@/services/analytics'
import { getSalaPublica } from '@/data/salasPublicas'

const SITE = 'https://disqueamizade.com.br'

export const SalaPublicaPage = () => {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const signInAsGuest = useAuthStore((s) => s.signInAsGuest)
  const { verifyAge } = useAgeVerification()
  const sala = getSalaPublica(slug)
  const [online, setOnline] = useState<number | null>(null)

  // Contagem real de pessoas na sala (sem números inventados).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase.from('rooms').select('current_participants').eq('slug', slug).maybeSingle()
        if (!cancelled) setOnline(data?.current_participants ?? 0)
      } catch { if (!cancelled) setOnline(0) }
    })()
    return () => { cancelled = true }
  }, [slug])

  // SEO: título, description, canonical, OG e JSON-LD (WebPage + FAQPage).
  useEffect(() => {
    const url = `${SITE}/sala/${slug}`
    document.title = `${sala.h1} | Disque Amizade`
    const setMeta = (key: string, val: string, prop = false) => {
      const sel = prop ? `meta[property="${key}"]` : `meta[name="${key}"]`
      let el = document.querySelector(sel)
      if (!el) { el = document.createElement('meta'); el.setAttribute(prop ? 'property' : 'name', key); document.head.appendChild(el) }
      el.setAttribute('content', val)
    }
    setMeta('description', sala.descricao)
    setMeta('og:title', sala.h1, true)
    setMeta('og:description', sala.descricao, true)
    setMeta('og:url', url, true)
    setMeta('og:type', 'website', true)
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon) }
    canon.href = url

    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', name: sala.h1, description: sala.descricao, url },
        {
          '@type': 'FAQPage',
          mainEntity: sala.faq.map((f) => ({
            '@type': 'Question', name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'sala-jsonld'
    script.textContent = JSON.stringify(ld)
    document.getElementById('sala-jsonld')?.remove()
    document.head.appendChild(script)

    return () => { document.getElementById('sala-jsonld')?.remove(); document.title = 'Disque Amizade' }
  }, [slug, sala])

  const entrar = () => {
    track('cta_enter_click', { cta: 'sala_publica', sala: slug })
    verifyAge(() => { signInAsGuest(); navigate(`/room/${slug}`) })
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Breadcrumb */}
        <nav className="text-xs text-dark-500 mb-4 flex items-center gap-1.5">
          <Link to="/" className="hover:text-dark-300">Início</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/rooms" className="hover:text-dark-300">Salas</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-dark-300">{sala.nome}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-black mb-3">{sala.h1}</h1>
        <p className="text-dark-300 text-lg leading-relaxed mb-6">{sala.intro}</p>

        {/* Status real + CTA */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${online && online > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-dark-600'}`} />
            <span className="text-dark-300">
              {online === null ? 'Verificando…' : online > 0 ? `${online} ${online === 1 ? 'pessoa' : 'pessoas'} na sala agora` : 'Sala aberta — seja o primeiro a entrar'}
            </span>
          </div>
          <button
            onClick={entrar}
            className="sm:ml-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold hover:scale-[1.02] transition-transform"
          >
            <Video className="w-5 h-5" /> Entrar na sala
          </button>
        </div>

        {/* Como funciona */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Users, t: 'Sem cadastro', d: 'Entra como convidado e escolhe um apelido.' },
            { icon: Video, t: 'Vídeo ao vivo', d: 'Assiste, conversa e liga a câmera quando quiser.' },
            { icon: ShieldCheck, t: 'Anônimo e 18+', d: 'Use máscaras; denuncie ou bloqueie quem incomodar.' },
          ].map((c) => {
            const Icon = c.icon
            return (
              <div key={c.t} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <Icon className="w-5 h-5 text-primary-400 mb-2" />
                <h3 className="font-bold text-sm mb-1">{c.t}</h3>
                <p className="text-xs text-dark-400">{c.d}</p>
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-bold mb-4">Perguntas frequentes</h2>
        <div className="space-y-3 mb-10">
          {sala.faq.map((f) => (
            <details key={f.q} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <summary className="font-semibold text-sm cursor-pointer">{f.q}</summary>
              <p className="text-sm text-dark-400 mt-2">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="text-center">
          <button onClick={entrar} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold hover:scale-[1.02] transition-transform">
            <Video className="w-5 h-5" /> Entrar na sala {sala.nome}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default SalaPublicaPage
