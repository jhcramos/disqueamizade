import { Link } from 'react-router-dom'
import { Heart, Phone } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-surface/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-lg">
                DA
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-none">DISQUE</h3>
                <h3 className="text-lg font-bold text-primary-light leading-none">AMIZADE</h3>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              A evolução do clássico serviço de amizade por telefone. Agora com vídeo, salas temáticas e muito mais.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3 h-3" />
              <span className="font-mono">145-AMIZADE — nostalgia.mode</span>
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="font-bold text-primary-light mb-4">Plataforma</h4>
            <ul className="space-y-2">
              <li><Link to="/rooms" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Salas de Chat</Link></li>
              <li><Link to="/marketplace" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Marketplace</Link></li>
              <li><Link to="/hobbies" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Hobbies</Link></li>
              <li><Link to="/pricing" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Planos & Fichas</Link></li>
              <li><Link to="/cabines" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Cabines Secretas</Link></li>
              <li><Link to="/filtros" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Filtros de Vídeo</Link></li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h4 className="font-bold text-primary-light mb-4">Suporte</h4>
            <ul className="space-y-2">
              <li><Link to="/auth" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Entrar / Cadastrar</Link></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Segurança</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Denunciar Abuso</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Contato</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-primary-light mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-primary-light transition-colors">Diretrizes da Comunidade</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-primary-light transition-colors">LGPD</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © 2025 Disque Amizade. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-primary-light" /> no Brasil 🇧🇷
          </p>
        </div>
      </div>
    </footer>
  )
}
