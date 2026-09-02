import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'

/**
 * 404 real: não redireciona para a home (soft 404 no Google).
 * Marca a página como noindex enquanto o servidor não devolve status 404.
 */
export const NotFoundPage = () => {
  useEffect(() => {
    document.title = 'Página não encontrada | Disque Amizade'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => { meta.remove() }
  }, [])

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📞</div>
          <h1 className="text-3xl font-black mb-3">Esse número não existe</h1>
          <p className="text-dark-400 mb-8">
            A página que você procurou não está aqui. A sala principal está sempre aberta.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/rooms" className="btn-primary px-6 py-3 rounded-xl font-bold">Entrar na sala</Link>
            <Link to="/blog" className="px-6 py-3 rounded-xl border border-white/10 text-dark-200 hover:bg-white/5">Ver o blog</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
