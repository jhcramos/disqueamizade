import { useNavigate } from 'react-router-dom'
import { Button, Card, Badge, AvatarGroup } from '../components/design-system'

export default function HomePageV3() {
  const navigate = useNavigate()

  const onlineUsers = [
    { name: 'Maria' },
    { name: 'João' },
    { name: 'Ana' },
    { name: 'Pedro' },
    { name: 'Julia' },
    { name: 'Lucas' },
    { name: 'Carla' },
    { name: 'Bruno' },
  ]

  return (
    <div className="min-h-screen bg-noite-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-balada-500/10 via-transparent to-transparent" />
        
        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <h1 className="font-display text-display-xl md:text-display-2xl text-white mb-4">
              🎪 Disque Amizade
            </h1>
            <p className="text-xl md:text-2xl text-noite-300 max-w-2xl mx-auto">
              A <span className="text-balada-400 font-semibold">balada digital</span> que nunca acaba.
              <br />
              Conheça gente nova, entre na Roleta, vá pro Camarote.
            </p>
          </div>

          {/* Online count */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-surface-light border border-white/10">
              <div className="status-online" />
              <AvatarGroup avatars={onlineUsers} max={5} size="xs" />
              <span className="text-sm text-noite-300">
                <span className="font-semibold text-white">247</span> pessoas online agora
              </span>
            </div>
          </div>

          {/* Main CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              variant="balada" 
              size="xl"
              onClick={() => navigate('/pista')}
            >
              🎉 Entrar na Pista
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => navigate('/auth')}
            >
              Criar Conta
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Card variant="interactive" className="text-center" onClick={() => navigate('/pista')}>
              <div className="text-4xl mb-3">🎪</div>
              <h3 className="font-display font-bold text-lg mb-2">A Pista</h3>
              <p className="text-sm text-noite-400">
                30 pessoas ao vivo. Mande Flash ⚡ pra quem te interessar.
              </p>
            </Card>
            
            <Card variant="interactive" className="text-center">
              <div className="text-4xl mb-3">🎰</div>
              <h3 className="font-display font-bold text-lg mb-2">A Roleta</h3>
              <p className="text-sm text-noite-400">
                A cada 5 minutos, a Roleta gira e forma grupos surpresa.
              </p>
            </Card>
            
            <Card variant="interactive" className="text-center">
              <div className="text-4xl mb-3">🛋️</div>
              <h3 className="font-display font-bold text-lg mb-2">Os Camarotes</h3>
              <p className="text-sm text-noite-400">
                Conversas guiadas: 🍿 Pipoca → ☕ Café → 🥃 Cachaça
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-display-md text-center mb-12">
            Como funciona
          </h2>
          
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-balada-500/20 border border-balada-500/40 flex items-center justify-center text-2xl">
                1
              </div>
              <div>
                <h3 className="font-display font-bold text-lg mb-1">Entre na Pista</h3>
                <p className="text-noite-400">
                  Ligue sua câmera e entre na sala principal. Você verá até 30 pessoas ao vivo.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-energia-500/20 border border-energia-500/40 flex items-center justify-center text-2xl">
                2
              </div>
              <div>
                <h3 className="font-display font-bold text-lg mb-1">Mande Flash ⚡</h3>
                <p className="text-noite-400">
                  Viu alguém interessante? Manda um Flash. Se for mútuo, vocês têm match!
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-festa-400/20 border border-festa-400/40 flex items-center justify-center text-2xl">
                3
              </div>
              <div>
                <h3 className="font-display font-bold text-lg mb-1">A Roleta Gira 🎰</h3>
                <p className="text-noite-400">
                  A cada 5 minutos, a Roleta forma grupos baseado nos Flashes. Deixa o destino decidir!
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-conquista-500/20 border border-conquista-500/40 flex items-center justify-center text-2xl">
                4
              </div>
              <div>
                <h3 className="font-display font-bold text-lg mb-1">Vá pro Camarote 🛋️</h3>
                <p className="text-noite-400">
                  Conversas guiadas em 3 fases: Pipoca (leve), Café (pessoal), Cachaça (profundo).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-16 border-t border-white/5 bg-surface-light/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-display-md mb-4">
            Grátis pra começar
          </h2>
          <p className="text-noite-400 mb-8 max-w-xl mx-auto">
            Entre na Pista, participe da Roleta, mande 5 Flashes por dia. 
            Tudo de graça. Quer mais? Vira VIP ou Elite.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="neutral">🆓 Grátis</Badge>
            <Badge variant="vip">⭐ VIP R$29,90/mês</Badge>
            <Badge variant="elite">👑 ELITE R$59,90/mês</Badge>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-noite-500">
            © 2026 Disque Amizade. Feito com 💜 no Brasil.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="/design" className="text-sm text-noite-400 hover:text-white transition-colors">
              Design System
            </a>
            <a href="#" className="text-sm text-noite-400 hover:text-white transition-colors">
              Termos
            </a>
            <a href="#" className="text-sm text-noite-400 hover:text-white transition-colors">
              Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
