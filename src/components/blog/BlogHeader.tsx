import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/common/BrandLogo'

export function BlogHeader() {
  return <header className="sticky top-0 z-40 border-b border-white/10 bg-dark-950/95 backdrop-blur">
    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
      <Link to="/" aria-label="Disque Amizade — início"><BrandLogo /></Link>
      <nav aria-label="Menu do blog" className="flex flex-wrap items-center gap-5 text-sm text-white">
        <Link to="/">Início</Link>
        <Link to="/garagem">A Casa</Link>
        <Link to="/rooms">Salas de bate-papo</Link>
        <Link to="/blog" aria-current="page">Blog</Link>
        <Link to="/rooms" className="rounded-xl bg-orange-700 px-4 py-2 font-semibold">Entrar no bate-papo</Link>
      </nav>
    </div>
  </header>
}
