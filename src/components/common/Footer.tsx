import { Link } from 'react-router-dom'
import { Heart, Phone } from 'lucide-react'
import { BrandLogo } from './BrandLogo'

export const Footer = () => {
  return (
    <footer className="site-footer border-t border-white/5 bg-surface/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-flex mb-4" aria-label="Disque Amizade — início"><BrandLogo /></Link>
            <p className="text-sm text-gray-500 mb-4">
              Um lugar para conhecer pessoas e deixar a conversa acontecer. Ao vivo, do seu jeito.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3 h-3" />
              <span>Inspirado nas boas conversas do 145.</span>
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="font-bold text-primary-light mb-4">Plataforma</h4>
            <ul className="space-y-2">
              <li><Link to="/rooms" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Salas de Chat</Link></li>
              <li><Link to="/blog" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Blog</Link></li>
              <li><Link to="/sobre" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Sobre</Link></li>
              <li><Link to="/filtros" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Filtros de Vídeo</Link></li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h4 className="font-bold text-primary-light mb-4">Suporte</h4>
            <ul className="space-y-2">
              <li><Link to="/auth" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Entrar / Cadastrar</Link></li>
              <li><Link to="/diretrizes" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Central de Ajuda</Link></li>
              <li><Link to="/diretrizes" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Segurança</Link></li>
              <li><Link to="/diretrizes" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Denunciar Abuso</Link></li>
              <li><Link to="/privacidade" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Contato</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-primary-light mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/termos" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/diretrizes" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Diretrizes da Comunidade</Link></li>
              <li><Link to="/lgpd" className="text-sm text-gray-400 hover:text-primary-light transition-colors">LGPD</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Disque Amizade. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-primary-light" /> no Brasil 🇧🇷
          </p>
        </div>
      </div>
    </footer>
  )
}
