import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Share2, Tag, ChevronRight } from 'lucide-react'
import { Header } from '@/components/common/Header'
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
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <nav className="flex items-center gap-2 text-sm text-dark-500">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-dark-300 truncate">{post.title}</span>
        </nav>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 py-8">
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

        {/* Content */}
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
          dangerouslySetInnerHTML={{ __html: post.content }}
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

        {/* CTA */}
        <div className="mt-10 p-8 rounded-2xl bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/20 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Pronto pra conversar? 🎉</h3>
          <p className="text-dark-400 mb-6">Entre no Disque Amizade e conheça pessoas incríveis agora mesmo!</p>
          <Link to="/rooms" className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-xl transition-all">
            Entrar nas Salas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Related */}
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
