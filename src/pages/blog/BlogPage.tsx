import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, Clock, ArrowRight, Tag } from 'lucide-react'
import { Header } from '@/components/common/Header'

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  author: string
  date: string
  readTime: number
  image?: string
}

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'chat', label: 'Chat Online' },
  { id: 'video', label: 'Vídeo Chat' },
  { id: 'dicas', label: 'Dicas' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'comparativo', label: 'Comparativos' },
  { id: 'cidades', label: 'Por Cidade' },
  { id: 'relacionamento', label: 'Relacionamento' },
]

const CATEGORY_COLORS: Record<string, string> = {
  chat: 'bg-blue-500/20 text-blue-300',
  video: 'bg-purple-500/20 text-purple-300',
  dicas: 'bg-green-500/20 text-green-300',
  seguranca: 'bg-red-500/20 text-red-300',
  comparativo: 'bg-amber-500/20 text-amber-300',
  cidades: 'bg-cyan-500/20 text-cyan-300',
  relacionamento: 'bg-pink-500/20 text-pink-300',
}

const GRADIENT_COVERS = [
  'from-pink-600 to-purple-700',
  'from-blue-600 to-cyan-700',
  'from-emerald-600 to-teal-700',
  'from-amber-600 to-orange-700',
  'from-violet-600 to-indigo-700',
  'from-rose-600 to-pink-700',
  'from-sky-600 to-blue-700',
  'from-lime-600 to-green-700',
]

function getGradient(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash)
  return GRADIENT_COVERS[Math.abs(hash) % GRADIENT_COVERS.length]
}

const CATEGORY_EMOJIS: Record<string, string> = {
  chat: '💬',
  video: '📹',
  dicas: '💡',
  seguranca: '🔒',
  comparativo: '⚖️',
  cidades: '🏙️',
  relacionamento: '❤️',
}

export const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 12

  useEffect(() => {
    fetch('/blog-posts/index.json')
      .then(r => r.json())
      .then((data: BlogPost[]) => {
        setPosts(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = posts.filter(p => {
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filtered.length / postsPerPage)
  const paginated = filtered.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)

  useEffect(() => { setCurrentPage(1) }, [search, activeCategory])

  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-pink-600/20 via-dark-950 to-purple-600/20 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Blog do <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Disque Amizade</span>
          </h1>
          <p className="text-dark-400 text-lg max-w-2xl mx-auto mb-8">
            Dicas, novidades e guias sobre chat online, vídeo chat e como conhecer pessoas no Brasil
          </p>

          {/* Search */}
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="text"
              placeholder="Buscar artigos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-900 border border-white/10 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-pink-500/50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-pink-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-dark-900 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhum artigo encontrado</h3>
            <p className="text-dark-500">Tente outra busca ou categoria</p>
          </div>
        ) : (
          <>
            {/* Featured post (first one) */}
            {currentPage === 1 && paginated.length > 0 && (
              <Link to={`/blog/${paginated[0].slug}`} className="block mb-8 group">
                <div className="relative rounded-2xl overflow-hidden bg-dark-900 border border-white/5 hover:border-pink-500/30 transition-all">
                  <div className={`h-64 bg-gradient-to-br ${getGradient(paginated[0].slug)} flex items-center justify-center relative overflow-hidden`}>
                    {paginated[0].image ? (
                      <img src={paginated[0].image} alt={paginated[0].title} className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <span className="text-8xl">{CATEGORY_EMOJIS[paginated[0].category] || '💬'}</span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[paginated[0].category] || 'bg-dark-700 text-dark-300'}`}>
                        {paginated[0].category}
                      </span>
                      <span className="text-dark-500 text-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(paginated[0].date).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-dark-500 text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {paginated[0].readTime} min
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white group-hover:text-pink-400 transition-colors mb-2">
                      {paginated[0].title}
                    </h2>
                    <p className="text-dark-400 line-clamp-2">{paginated[0].excerpt}</p>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(currentPage === 1 ? paginated.slice(1) : paginated).map(post => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
                  <div className="bg-dark-900 rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500/30 transition-all h-full flex flex-col">
                    <div className={`h-40 bg-gradient-to-br ${getGradient(post.slug)} flex items-center justify-center relative overflow-hidden`}>
                      {post.image ? (
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover absolute inset-0" />
                      ) : (
                        <span className="text-5xl">{CATEGORY_EMOJIS[post.category] || '💬'}</span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[post.category] || 'bg-dark-700 text-dark-300'}`}>
                          {post.category}
                        </span>
                        <span className="text-dark-500 text-xs">{new Date(post.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-pink-400 transition-colors mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-dark-500 text-sm line-clamp-3 flex-1">{post.excerpt}</p>
                      <div className="flex items-center gap-1 text-pink-400 text-sm font-medium mt-3">
                        Ler mais <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page ? 'bg-pink-500 text-white' : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* SEO footer */}
        <div className="mt-16 border-t border-white/5 pt-8 pb-4">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-pink-400" /> Tags Populares
          </h2>
          <div className="flex flex-wrap gap-2">
            {['chat online', 'bate-papo', 'video chat', 'chat grátis', 'conhecer pessoas', 'salas de chat',
              'chat Brasil', 'namoro online', 'fazer amigos', 'chat com câmera', 'paquera online',
              'chat por cidade', 'chat adulto', 'alternativa UOL chat'].map(tag => (
              <button
                key={tag}
                onClick={() => setSearch(tag)}
                className="px-3 py-1 bg-dark-800 text-dark-400 rounded-full text-sm hover:bg-dark-700 hover:text-white transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
