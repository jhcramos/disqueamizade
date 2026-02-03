import { Link } from 'react-router-dom'
import { Header } from '@/components/common/Header'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'

export const HomePage = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold text-glow-cyan mb-6 leading-tight">
            CONECTE-SE COM O
            <br />
            <span className="text-glow-magenta">FUTURO</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-rajdhani mb-8 max-w-2xl mx-auto">
            Plataforma de bate-papo com vídeo em grupo, salas temáticas e marketplace de talentos
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/rooms">
                  <Button variant="primary" size="lg">
                    Entrar nas Salas
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button variant="outline" size="lg">
                    Explorar Marketplace
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="primary" size="lg">
                    Começar Agora
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" size="lg">
                    Ver Planos
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card p-8 hover:border-neon-cyan transition-all group">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-2xl mb-3 text-neon-cyan group-hover:text-glow-cyan transition-all">
              Salas de Chat
            </h3>
            <p className="text-gray-400">
              Entre em salas temáticas e conheça pessoas com interesses similares.
              Vinhos, idiomas, cidades, idades - temos de tudo!
            </p>
          </div>

          <div className="glass-card p-8 hover:border-neon-magenta transition-all group">
            <div className="text-4xl mb-4">📹</div>
            <h3 className="text-2xl mb-3 text-neon-magenta group-hover:text-glow-magenta transition-all">
              Vídeo em Grupo
            </h3>
            <p className="text-gray-400">
              Até 30 pessoas simultaneamente com vídeo em alta qualidade.
              Clique para assistir qualquer câmera ligada!
            </p>
          </div>

          <div className="glass-card p-8 hover:border-neon-yellow transition-all group">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-2xl mb-3 text-neon-yellow group-hover:text-glow-cyan transition-all">
              Marketplace
            </h3>
            <p className="text-gray-400">
              Ofereça ou contrate serviços: conversas, música, ensino, tarot e muito mais.
              Ganhe Estrelas sendo prestador!
            </p>
          </div>
        </section>

        {/* Premium Features */}
        <section className="glass-card p-12 mb-20">
          <h2 className="text-4xl font-bold text-center text-glow-cyan mb-12">
            Recursos Premium
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="text-2xl">🎭</div>
              <div>
                <h4 className="text-lg font-bold text-neon-cyan mb-2">
                  Máscaras Virtuais
                </h4>
                <p className="text-gray-400 text-sm">
                  Filtros 2D, máscaras 3D, modo anonimato e efeitos especiais
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="text-2xl">🎨</div>
              <div>
                <h4 className="text-lg font-bold text-neon-cyan mb-2">
                  Backgrounds Personalizados
                </h4>
                <p className="text-gray-400 text-sm">
                  Imagens estáticas ou vídeos em loop para seu fundo
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="text-2xl">🏠</div>
              <div>
                <h4 className="text-lg font-bold text-neon-cyan mb-2">
                  Criar Salas
                </h4>
                <p className="text-gray-400 text-sm">
                  Basic: até 3 salas | Premium: ilimitadas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="text-2xl">🔒</div>
              <div>
                <h4 className="text-lg font-bold text-neon-magenta mb-2">
                  Cabines Secretas
                </h4>
                <p className="text-gray-400 text-sm">
                  Conversas privadas 1:1 ou pequenos grupos (Premium)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="text-2xl">🎮</div>
              <div>
                <h4 className="text-lg font-bold text-neon-magenta mb-2">
                  Jogos Exclusivos
                </h4>
                <p className="text-gray-400 text-sm">
                  Casamento Atrás da Porta e mais (Premium)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="text-2xl">📊</div>
              <div>
                <h4 className="text-lg font-bold text-neon-magenta mb-2">
                  Analytics
                </h4>
                <p className="text-gray-400 text-sm">
                  Estatísticas de transmissão e gravação (Premium)
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/pricing">
              <Button variant="secondary" size="lg">
                Ver Todos os Planos
              </Button>
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="glass-card p-12 border-2 border-neon-cyan">
            <h2 className="text-4xl font-bold text-glow-cyan mb-4">
              Pronto para Começar?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Junte-se a milhares de pessoas conectadas ao futuro
            </p>

            {!isAuthenticated && (
              <Link to="/auth">
                <Button variant="primary" size="lg">
                  Criar Conta Grátis
                </Button>
              </Link>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-neon-cyan/30 bg-dark-surface/50 backdrop-blur-lg mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-neon-cyan mb-4">
                Disque Amizade
              </h3>
              <p className="text-gray-400 text-sm">
                Plataforma de bate-papo com vídeo, salas temáticas e marketplace de talentos.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">
                Produto
              </h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/rooms" className="text-gray-500 hover:text-neon-cyan">Salas</Link></li>
                <li><Link to="/marketplace" className="text-gray-500 hover:text-neon-cyan">Marketplace</Link></li>
                <li><Link to="/pricing" className="text-gray-500 hover:text-neon-cyan">Planos</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">
                Legal
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/terms" className="text-gray-500 hover:text-neon-cyan">Termos de Serviço</a></li>
                <li><a href="/privacy" className="text-gray-500 hover:text-neon-cyan">Política de Privacidade</a></li>
                <li><a href="/lgpd" className="text-gray-500 hover:text-neon-cyan">LGPD</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">
                Suporte
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/help" className="text-gray-500 hover:text-neon-cyan">Central de Ajuda</a></li>
                <li><a href="/contact" className="text-gray-500 hover:text-neon-cyan">Contato</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            <p>© 2024 Disque Amizade. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
