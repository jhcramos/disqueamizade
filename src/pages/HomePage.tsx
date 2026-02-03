import { Link } from 'react-router-dom'
import { Header } from '@/components/common/Header'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'
import { MessageCircle, Video, Star, Sparkles, Lock, Gamepad2, BarChart3, Palette, Home, ArrowRight } from 'lucide-react'

export const HomePage = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Mesh gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-rose-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Onde amizades{' '}
              <span className="text-gradient">ganham vida</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Plataforma de bate-papo com vídeo em grupo, salas temáticas e marketplace de talentos
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/rooms">
                    <Button variant="primary" size="lg">
                      Entrar nas Salas
                      <ArrowRight className="w-5 h-5 ml-2 inline" />
                    </Button>
                  </Link>
                  <Link to="/marketplace">
                    <Button variant="ghost" size="lg">
                      Explorar Marketplace
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="primary" size="lg">
                      Começar Agora
                      <ArrowRight className="w-5 h-5 ml-2 inline" />
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button variant="ghost" size="lg">
                      Ver Planos
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Large card */}
          <div className="md:col-span-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mb-5">
              <MessageCircle className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-zinc-50">
              Salas de Chat
            </h3>
            <p className="text-zinc-400 leading-relaxed max-w-lg">
              Entre em salas temáticas e conheça pessoas com interesses similares.
              Vinhos, idiomas, cidades, idades — temos de tudo!
            </p>
          </div>

          {/* Small card 1 */}
          <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center mb-5">
              <Video className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-50">
              Vídeo em Grupo
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Até 30 pessoas simultaneamente com vídeo em alta qualidade.
            </p>
          </div>

          {/* Small card 2 */}
          <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-5">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-50">
              Marketplace
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Ofereça ou contrate serviços: conversas, música, ensino e mais.
            </p>
          </div>

          {/* Wide card */}
          <div className="md:col-span-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-50">
              Sistema de Estrelas
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-lg">
              Ganhe estrelas sendo prestador de serviços. Use-as para contratar outros talentos ou destacar seu perfil na plataforma.
            </p>
          </div>
        </div>
      </section>

      {/* Premium Features */}
      <section className="container mx-auto px-4 pb-20">
        <div className="gradient-border p-10 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-zinc-50 mb-12">
            Recursos Premium
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, title: 'Máscaras Virtuais', desc: 'Filtros 2D, máscaras 3D, modo anonimato e efeitos especiais', color: 'text-violet-400' },
              { icon: Palette, title: 'Backgrounds Personalizados', desc: 'Imagens estáticas ou vídeos em loop para seu fundo', color: 'text-indigo-400' },
              { icon: Home, title: 'Criar Salas', desc: 'Basic: até 3 salas | Premium: ilimitadas', color: 'text-emerald-400' },
              { icon: Lock, title: 'Cabines Secretas', desc: 'Conversas privadas 1:1 ou pequenos grupos', color: 'text-rose-400' },
              { icon: Gamepad2, title: 'Jogos Exclusivos', desc: 'Casamento Atrás da Porta e mais', color: 'text-amber-400' },
              { icon: BarChart3, title: 'Analytics', desc: 'Estatísticas de transmissão e gravação', color: 'text-indigo-400' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                    {title}
                  </h4>
                  <p className="text-zinc-500 text-sm">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/pricing">
              <Button variant="secondary" size="lg">
                Ver Todos os Planos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-12 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para Começar?
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
            Junte-se a milhares de pessoas conectadas
          </p>

          {!isAuthenticated && (
            <Link to="/auth">
              <Button variant="outline" size="lg" className="!border-white/30 !text-white hover:!bg-white/10">
                Criar Conta Grátis
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 bg-zinc-900/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-zinc-50 mb-4">
                Disque Amizade
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Plataforma de bate-papo com vídeo, salas temáticas e marketplace de talentos.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Produto
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/rooms" className="text-zinc-500 hover:text-zinc-50 transition-colors">Salas</Link></li>
                <li><Link to="/marketplace" className="text-zinc-500 hover:text-zinc-50 transition-colors">Marketplace</Link></li>
                <li><Link to="/pricing" className="text-zinc-500 hover:text-zinc-50 transition-colors">Planos</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/terms" className="text-zinc-500 hover:text-zinc-50 transition-colors">Termos de Serviço</a></li>
                <li><a href="/privacy" className="text-zinc-500 hover:text-zinc-50 transition-colors">Política de Privacidade</a></li>
                <li><a href="/lgpd" className="text-zinc-500 hover:text-zinc-50 transition-colors">LGPD</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Suporte
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/help" className="text-zinc-500 hover:text-zinc-50 transition-colors">Central de Ajuda</a></li>
                <li><a href="/contact" className="text-zinc-500 hover:text-zinc-50 transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-6 text-center text-xs text-zinc-600">
            <p>© 2025 Disque Amizade. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
