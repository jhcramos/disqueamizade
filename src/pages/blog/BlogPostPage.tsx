import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Share2, Tag, ChevronRight } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { RelatedRooms } from '@/components/blog/RelatedRooms'
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
  const [related, setRelated] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/blog-posts/index.json')
      .then(r => r.json())
      .then((data: BlogPost[]) => {
        const found = data.find(p => p.slug === slug)
        setPost(found || null)
        if (found) {
          setRelated(
            data
              .filter(p => p.slug !== slug && (p.category === found.category || p.tags.some(t => found.tags.includes(t))))
              .slice(0, 3)
          )
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [slug])

  // Process content with CTA injection
  const processedContent = useMemo(() => {
    if (!post) return { html: '', count: 0 }
    return injectCTAPlaceholders(post.content)
  }, [post])

  // Render CTAs into placeholders after mount
  useEffect(() => {
    if (!post || processedContent.count === 0) return
    const placeholders = document.querySelectorAll('[data-blog-cta]')
    placeholders.forEach((el, i) => {
      const container = document.createElement('div')
      el.replaceWith(container)
      // We'll use a simpler approach: render via React portals would be complex,
      // so we just inject styled HTML directly
      const onlineCount = Math.floor(Math.random() * 66) + 15
      const gradients = [
        'from-pink-600/20 to-purple-600/20',
        'from-cyan-600/20 to-blue-600/20',
        'from-amber-600/20 to-orange-600/20',
      ]
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href })
    } else {
      navigator.clipboard?.writeText(window.location.href)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <nav className="flex items-center gap-2 text-sm text-dark-500">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-dark-300 truncate">{post.title}</span>
        </nav>
      </div>

      {/* 2-column layout: article + sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Main article column */}
        <article className="flex-1 min-w-0 max-w-4xl">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[post.category] || 'bg-dark-700 text-dark-300'}`}>
                {post.category}
              </span>
              <span className="text-dark-500 text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(post.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-dark-500 text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.readTime} min de leitura
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              {post.title}
            </h1>

            <p className="text-lg text-dark-400 leading-relaxed">{post.excerpt}</p>

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
              <button onClick={handleShare} className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Content with injected CTAs */}
          <div
            className="prose prose-invert prose-pink max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-dark-300 prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-pink-400 prose-a:no-underline hover:prose-a:text-pink-300
              prose-strong:text-white
              prose-ul:text-dark-300 prose-ol:text-dark-300
              prose-li:mb-2
              prose-blockquote:border-pink-500 prose-blockquote:text-dark-400
              prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: processedContent.html }}
          />

          {/* Tags */}
          <div className="mt-10 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-dark-500" />
              {post.tags.map(tag => (
                <Link
                  key={tag}
                  to={`/blog?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-dark-800 text-dark-400 rounded-full text-sm hover:bg-dark-700 hover:text-white transition-all"
                >
                  {tag}
                </Link>
              ))}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map(r => (
                  <Link key={r.slug} to={`/blog/${r.slug}`} className="group">
                    <div className="bg-dark-900 rounded-xl p-5 border border-white/5 hover:border-pink-500/30 transition-all">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[r.category] || 'bg-dark-700 text-dark-300'}`}>
                        {r.category}
                      </span>
                      <h4 className="text-white font-bold mt-2 group-hover:text-pink-400 transition-colors line-clamp-2">
                        {r.title}
                      </h4>
                      <p className="text-dark-500 text-sm mt-1 line-clamp-2">{r.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back */}
          <div className="mt-10 text-center">
            <Link to="/blog" className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Blog
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <RelatedRooms category={post.category} tags={post.tags} />
        </aside>
      </div>

      {/* Floating Room Picker */}
      <FloatingRoomPicker />

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            author: { '@type': 'Person', name: post.author },
            datePublished: post.date,
            publisher: {
              '@type': 'Organization',
              name: 'Disque Amizade',
              url: 'https://disqueamizade.com.br',
            },
            mainEntityOfPage: `https://disqueamizade.com.br/blog/${post.slug}`,
          }),
        }}
      />
    </div>
  )
}
