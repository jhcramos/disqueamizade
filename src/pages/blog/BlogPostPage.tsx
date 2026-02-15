import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowUp, Calendar, Clock, Tag, ChevronRight, Copy, Check } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { FloatingRoomPicker } from '@/components/blog/FloatingRoomPicker'
import type { BlogPost } from './BlogPage'

const CATEGORY_COLORS: Record<string, string> = {
  chat: 'bg-blue-500/20 text-blue-300',
  video: 'bg-purple-500/20 text-purple-300',
  dicas: 'bg-green-500/20 text-green-300',
  seguranca: 'bg-red-500/20 text-red-300',
  comparativo: 'bg-amber-500/20 text-amber-300',
  cidades: 'bg-cyan-500/20 text-cyan-300',
  relacionamento: 'bg-pink-500/20 text-pink-300',
}

interface TOCItem {
  id: string
  text: string
  level: number
}

function extractTOC(html: string): TOCItem[] {
  const items: TOCItem[] = []
  const regex = /<h([23])[^>]*>(.*?)<\/h\1>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '').trim()
    const id = text.toLowerCase().replace(/[^a-záàâãéèêíïóôõúç0-9\s-]/gi, '').replace(/\s+/g, '-').slice(0, 60)
    items.push({ id, text, level: parseInt(match[1]) })
  }
  return items
}

function injectHeadingIds(html: string, toc: TOCItem[]): string {
  let idx = 0
  return html.replace(/<h([23])([^>]*)>/gi, (match, level, attrs) => {
    if (idx < toc.length) {
      const id = toc[idx].id
      idx++
      return `<h${level}${attrs} id="${id}">`
    }
    return match
  })
}

// Inject "Leia também" boxes after every 3rd H2
function injectLeiaBoxes(html: string, relatedPosts: BlogPost[]): string {
  if (relatedPosts.length === 0) return html
  let h2Count = 0
  let relIdx = 0
  return html.replace(/<\/h2>/gi, (match) => {
    h2Count++
    if (h2Count % 3 === 0 && relIdx < relatedPosts.length) {
      const p1 = relatedPosts[relIdx]
      relIdx++
      const p2 = relIdx < relatedPosts.length ? relatedPosts[relIdx] : null
      if (p2) relIdx++
      const cards = [p1, p2].filter(Boolean).map(p => `
        <a href="/blog/${p!.slug}" class="block p-4 rounded-xl bg-dark-800/50 border border-white/5 hover:border-pink-500/30 transition-all no-underline group/card">
          <span class="text-xs text-pink-400 font-medium">📖 Leia também</span>
          <span class="block text-white font-semibold mt-1 group-hover/card:text-pink-400 transition-colors">${p!.title}</span>
          <span class="block text-dark-400 text-sm mt-1 line-clamp-2">${p!.excerpt}</span>
        </a>
      `).join('')
      return `${match}<div class="not-prose my-8 grid grid-cols-1 md:grid-cols-2 gap-4">${cards}</div>`
    }
    return match
  })
}

// Inject CTA placeholders after every 2nd H2
function injectCTAPlaceholders(html: string): { html: string; count: number } {
  let h2Count = 0
  let ctaIndex = 0
  const result = html.replace(/<\/h2>/gi, (match) => {
    h2Count++
    if (h2Count % 2 === 0) {
      return `${match}<div data-blog-cta="${ctaIndex++}"></div>`
    }
    return match
  })
  return { html: result, count: ctaIndex }
}

export const BlogPostPage = () => {
  const { slug } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [, setAllPosts] = useState<BlogPost[]>([])
  const [related, setRelated] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [readProgress, setReadProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [activeTocId, setActiveTocId] = useState('')
  const [copied, setCopied] = useState(false)
  const articleRef = useRef<HTMLElement>(null)

  useEffect(() => {
    fetch('/blog-posts/index.json')
      .then(r => r.json())
      .then((data: BlogPost[]) => {
        setAllPosts(data)
        const found = data.find(p => p.slug === slug)
        setPost(found || null)
        if (found) {
          // Use relatedSlugs if available, fallback to category/tag matching
          const relSlugs = found.relatedSlugs || []
          const relPosts = relSlugs.map(s => data.find(p => p.slug === s)).filter(Boolean) as BlogPost[]
          if (relPosts.length > 0) {
            setRelated(relPosts.slice(0, 5))
          } else {
            setRelated(
              data.filter(p => p.slug !== slug && (p.category === found.category || p.tags.some(t => found.tags.includes(t)))).slice(0, 5)
            )
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  useEffect(() => { window.scrollTo({ top: 0 }) }, [slug])

  // Reading progress + back to top
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setReadProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0)
      setShowBackToTop(scrollTop > 600)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // TOC
  const toc = useMemo(() => post ? extractTOC(post.content) : [], [post])

  // Active TOC tracking
  useEffect(() => {
    if (toc.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTocId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )
    toc.forEach(item => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [toc, post])

  // Process content
  const processedContent = useMemo(() => {
    if (!post) return { html: '', count: 0 }
    let html = post.content
    html = injectHeadingIds(html, toc)
    html = injectLeiaBoxes(html, related.slice(0, 4))
    const result = injectCTAPlaceholders(html)
    return result
  }, [post, toc, related])

  // Render CTAs into placeholders
  useEffect(() => {
    if (!post || processedContent.count === 0) return
    const placeholders = document.querySelectorAll('[data-blog-cta]')
    placeholders.forEach((el, i) => {
      const container = document.createElement('div')
      el.replaceWith(container)
      const onlineCount = Math.floor(Math.random() * 66) + 15
      const gradients = ['from-pink-600/20 to-purple-600/20', 'from-cyan-600/20 to-blue-600/20', 'from-amber-600/20 to-orange-600/20']
      const categoryMap: Record<string, { label: string; emoji: string; link: string; desc: string }> = {
        chat: { label: 'Sala Geral', emoji: '💬', link: '/rooms', desc: 'Bate-papo ao vivo com pessoas de todo o Brasil' },
        video: { label: 'Sala com Vídeo', emoji: '🎥', link: '/rooms', desc: 'Converse cara a cara com novas amizades' },
        cidades: { label: 'Salas por Cidade', emoji: '🏙️', link: '/rooms?category=cidade', desc: 'Encontre pessoas da sua cidade agora' },
        seguranca: { label: 'Sala Moderada', emoji: '🛡️', link: '/rooms', desc: 'Ambiente seguro e moderado para conversar' },
        dicas: { label: 'Sala Geral', emoji: '💡', link: '/rooms', desc: 'Coloque as dicas em prática agora' },
        relacionamento: { label: 'Sala Paquera', emoji: '💕', link: '/rooms', desc: 'Conheça pessoas especiais agora' },
        comparativo: { label: 'Salas Populares', emoji: '🔥', link: '/rooms', desc: 'Descubra por que somos a melhor opção' },
      }
      const room = categoryMap[post.category] || { label: 'Salas de Chat', emoji: '💬', link: '/rooms', desc: 'Entre e conheça pessoas incríveis agora' }
      const gradient = gradients[i % gradients.length]
      container.innerHTML = `
        <div class="my-8 p-6 rounded-2xl bg-gradient-to-br ${gradient} border border-white/10 not-prose">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-3xl">${room.emoji}</span>
            <div>
              <h4 class="text-lg font-bold text-white">${room.label}</h4>
              <p class="text-sm text-dark-400">${room.desc}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 mb-4">
            <span class="text-orange-400">🔥</span>
            <span class="text-sm text-orange-300 font-medium">${onlineCount} pessoas online agora</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
          </div>
          <a href="${room.link}" class="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-500/25 no-underline">
            Entrar na Sala →
          </a>
        </div>
      `
    })
  }, [post, processedContent])

  // SEO meta tags
  useEffect(() => {
    if (!post) return
    const url = `https://disqueamizade.com.br/blog/${post.slug}`
    const img = post.coverImage || post.image || ''
    document.title = `${post.title} | Disque Amizade`
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`)
      if (!el) {
        el = document.createElement('meta')
        if (property.startsWith('og:') || property.startsWith('article:')) {
          el.setAttribute('property', property)
        } else {
          el.setAttribute('name', property)
        }
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    setMeta('description', post.excerpt)
    setMeta('og:title', post.title)
    setMeta('og:description', post.excerpt)
    setMeta('og:image', img)
    setMeta('og:url', url)
    setMeta('og:type', 'article')
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', post.title)
    setMeta('twitter:description', post.excerpt)
    setMeta('twitter:image', img)
    setMeta('article:published_time', post.date)
    if (post.lastModified) setMeta('article:modified_time', post.lastModified)

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)

    return () => {
      document.title = 'Disque Amizade'
    }
  }, [post])

  const handleCopyLink = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const shareWhatsApp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(post?.title + ' ' + window.location.href)}`, '_blank')
  }, [post])

  const shareTwitter = useCallback(() => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post?.title || '')}&url=${encodeURIComponent(window.location.href)}`, '_blank')
  }, [post])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold mb-2">Artigo não encontrado</h2>
          <Link to="/blog" className="text-pink-400 hover:text-pink-300">← Voltar ao blog</Link>
        </div>
      </div>
    )
  }

  const coverImg = post.coverImage || post.image
  const pageUrl = `https://disqueamizade.com.br/blog/${post.slug}`

  // FAQ schema: detect Q&A patterns in content
  const faqItems: { question: string; answer: string }[] = []
  const faqRegex = /<h[23][^>]*>(.*?\?)<\/h[23]>\s*<p>(.*?)<\/p>/gi
  let faqMatch
  while ((faqMatch = faqRegex.exec(post.content)) !== null) {
    faqItems.push({
      question: faqMatch[1].replace(/<[^>]+>/g, ''),
      answer: faqMatch[2].replace(/<[^>]+>/g, ''),
    })
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-dark-900">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <Header />

      {/* Breadcrumb with schema.org */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <nav className="flex items-center gap-2 text-sm text-dark-500" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-dark-300 truncate max-w-xs">{post.title}</span>
        </nav>
      </div>

      {/* Cover image */}
      {coverImg && (
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="rounded-2xl overflow-hidden">
            <img src={coverImg} alt={post.title} className="w-full h-64 md:h-96 object-cover" loading="eager" />
          </div>
        </div>
      )}

      {/* 2-column layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Main article */}
        <article ref={articleRef} className="flex-1 min-w-0 max-w-4xl">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[post.category] || 'bg-dark-700 text-dark-300'}`}>
                {post.category}
              </span>
              <span className="text-dark-500 text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(post.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-dark-500 text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.readTime} min de leitura
              </span>
              {post.wordCount && (
                <span className="text-dark-500 text-sm">{post.wordCount.toLocaleString('pt-BR')} palavras</span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
              {post.title}
            </h1>

            <p className="text-lg md:text-xl text-dark-400 leading-relaxed">{post.excerpt}</p>

            {/* Share buttons */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  D
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{post.author}</p>
                  <p className="text-dark-500 text-xs">Equipe Disque Amizade</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={shareWhatsApp} className="p-2 rounded-lg bg-dark-800 text-green-400 hover:bg-green-500/20 transition-all" title="Compartilhar no WhatsApp">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </button>
                <button onClick={shareTwitter} className="p-2 rounded-lg bg-dark-800 text-sky-400 hover:bg-sky-500/20 transition-all" title="Compartilhar no Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>
                <button onClick={handleCopyLink} className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700 transition-all" title="Copiar link">
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </header>

          {/* Mobile TOC */}
          {toc.length > 2 && (
            <details className="lg:hidden mb-8 bg-dark-900 rounded-xl border border-white/5 p-4">
              <summary className="text-white font-semibold cursor-pointer">📑 Índice do Artigo</summary>
              <nav className="mt-3 space-y-1">
                {toc.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-sm py-1 transition-colors hover:text-pink-400 ${
                      item.level === 3 ? 'pl-4 text-dark-500' : 'text-dark-300'
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </details>
          )}

          {/* Content */}
          <div
            className="prose prose-lg prose-invert prose-pink max-w-none
              prose-headings:text-white prose-headings:font-bold prose-headings:scroll-mt-20
              prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-12 prose-h2:mb-5
              prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-10 prose-h3:mb-4
              prose-p:text-dark-300 prose-p:leading-relaxed prose-p:mb-5 prose-p:text-base prose-p:md:text-lg
              prose-a:text-pink-400 prose-a:no-underline hover:prose-a:text-pink-300 hover:prose-a:underline
              prose-strong:text-white
              prose-ul:text-dark-300 prose-ol:text-dark-300
              prose-li:mb-2 prose-li:text-base prose-li:md:text-lg
              prose-blockquote:border-l-4 prose-blockquote:border-pink-500 prose-blockquote:bg-dark-900/50 prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:text-dark-300 prose-blockquote:italic prose-blockquote:text-lg prose-blockquote:md:text-xl prose-blockquote:my-8
              prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: processedContent.html }}
          />

          {/* Tags */}
          <div className="mt-10 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-dark-500" />
              {post.tags.map(tag => (
                <Link key={tag} to={`/blog?q=${encodeURIComponent(tag)}`} className="px-3 py-1 bg-dark-800 text-dark-400 rounded-full text-sm hover:bg-dark-700 hover:text-white transition-all">
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Author box */}
          <div className="mt-10 p-6 rounded-2xl bg-dark-900 border border-white/5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                D
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{post.author}</h3>
                <p className="text-dark-500 text-sm mb-2">Equipe Disque Amizade</p>
                <p className="text-dark-400 text-sm leading-relaxed">
                  Especialista em comunicação digital e relacionamentos online. Nossa equipe cria conteúdo para ajudar brasileiros a se conectar de forma segura e divertida na internet.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-10 p-8 rounded-2xl bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/20 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Pronto pra conversar? 🎉</h3>
            <p className="text-dark-400 mb-6">Entre no Disque Amizade e conheça pessoas incríveis agora mesmo!</p>
            <Link to="/rooms" className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-xl transition-all">
              Entrar nas Salas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-bold text-white mb-6">Artigos Relacionados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {related.slice(0, 3).map(r => (
                  <Link key={r.slug} to={`/blog/${r.slug}`} className="group">
                    <div className="bg-dark-900 rounded-xl overflow-hidden border border-white/5 hover:border-pink-500/30 transition-all">
                      {(r.coverImage || r.image) && (
                        <img src={r.coverImage || r.image} alt={r.title} className="w-full h-32 object-cover" loading="lazy" />
                      )}
                      <div className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[r.category] || 'bg-dark-700 text-dark-300'}`}>
                          {r.category}
                        </span>
                        <h4 className="text-white font-bold mt-2 group-hover:text-pink-400 transition-colors line-clamp-2">
                          {r.title}
                        </h4>
                        <p className="text-dark-500 text-sm mt-1 line-clamp-2">{r.excerpt}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 text-center">
            <Link to="/blog" className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Blog
            </Link>
          </div>
        </article>

        {/* Sticky sidebar TOC */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-20">
            {toc.length > 2 && (
              <nav className="bg-dark-900 rounded-xl border border-white/5 p-5 mb-6">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">📑 Neste Artigo</h3>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {toc.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm py-1.5 border-l-2 transition-all ${
                        activeTocId === item.id
                          ? 'border-pink-500 text-pink-400 pl-3'
                          : 'border-transparent text-dark-500 hover:text-dark-300 hover:border-dark-600 pl-3'
                      } ${item.level === 3 ? 'pl-6' : ''}`}
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </nav>
            )}

            {/* Share sidebar */}
            <div className="bg-dark-900 rounded-xl border border-white/5 p-5">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Compartilhar</h3>
              <div className="flex gap-2">
                <button onClick={shareWhatsApp} className="flex-1 p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all text-center text-sm font-medium">
                  WhatsApp
                </button>
                <button onClick={shareTwitter} className="flex-1 p-2 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all text-center text-sm font-medium">
                  Twitter
                </button>
                <button onClick={handleCopyLink} className="flex-1 p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700 transition-all text-center text-sm font-medium">
                  {copied ? '✓' : 'Link'}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Floating Room Picker */}
      <FloatingRoomPicker />

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-6 z-40 p-3 rounded-full bg-pink-500 text-white shadow-lg shadow-pink-500/25 hover:bg-pink-600 transition-all"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* JSON-LD: BlogPosting */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: coverImg,
            author: { '@type': 'Person', name: post.author },
            datePublished: post.date,
            dateModified: post.lastModified || post.date,
            wordCount: post.wordCount,
            publisher: {
              '@type': 'Organization',
              name: 'Disque Amizade',
              url: 'https://disqueamizade.com.br',
              logo: { '@type': 'ImageObject', url: 'https://disqueamizade.com.br/logo.png' },
            },
            mainEntityOfPage: pageUrl,
          }),
        }}
      />

      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://disqueamizade.com.br/' },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://disqueamizade.com.br/blog' },
              { '@type': 'ListItem', position: 3, name: post.title, item: pageUrl },
            ],
          }),
        }}
      />

      {/* JSON-LD: FAQPage (if questions detected) */}
      {faqItems.length >= 2 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqItems.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            }),
          }}
        />
      )}
    </div>
  )
}
