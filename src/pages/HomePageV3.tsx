import { useNavigate } from 'react-router-dom'
import { Button, Badge, Avatar } from '../components/design-system'

export default function HomePageV3() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-noite-900">
      {/* Hero Section - Full screen */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-balada-500/20 via-noite-900 to-noite-900" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-balada-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-energia-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="w-2 h-2 bg-conquista-500 rounded-full animate-pulse" />
            <span className="text-sm text-noite-300">247 pessoas online agora</span>
          </div>

          {/* Main headline */}
          <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight">
            A balada que
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-balada-500 via-energia-500 to-festa-400">
              nunca acaba
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-noite-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Conheça gente nova ao vivo. A Roleta decide seu destino.
            <br className="hidden md:block" />
            Deixa a magia acontecer.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button 
              variant="balada" 
              size="xl"
              onClick={() => navigate('/pista')}
              className="text-lg px-10"
            >
              🎉 Entrar na Pista
            </Button>
            <Button 
              variant="ghost" 
              size="lg"
              onClick={() => navigate('/auth')}
            >
              Já tenho conta
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex -space-x-3">
              {['Maria', 'João', 'Ana', 'Pedro', 'Julia'].map((name, i) => (
                <Avatar key={i} name={name} size="md" className="ring-2 ring-noite-900" />
              ))}
            </div>
            <p className="text-sm text-noite-400">
              +2.847 pessoas conectaram essa semana
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-noite-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* How it works - Visual steps */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-noite-400">
              Em 3 passos simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-balada-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-balada-500/20 border border-balada-500/30 flex items-center justify-center text-4xl">
                  🎪
                </div>
                <div className="text-sm font-semibold text-balada-400 mb-2">PASSO 1</div>
                <h3 className="font-display font-bold text-xl text-white mb-3">
                  Entre na Pista
                </h3>
                <p className="text-noite-400">
                  Ligue sua câmera e entre na sala principal com até 30 pessoas ao vivo.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-energia-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-energia-500/20 border border-energia-500/30 flex items-center justify-center text-4xl">
                  ⚡
                </div>
                <div className="text-sm font-semibold text-energia-400 mb-2">PASSO 2</div>
                <h3 className="font-display font-bold text-xl text-white mb-3">
                  Mande Flash
                </h3>
                <p className="text-noite-400">
                  Viu alguém interessante? Manda um Flash. Se for mútuo, vocês têm match!
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-festa-400/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-festa-400/20 border border-festa-400/30 flex items-center justify-center text-4xl">
                  🎰
                </div>
                <div className="text-sm font-semibold text-festa-400 mb-2">PASSO 3</div>
                <h3 className="font-display font-bold text-xl text-white mb-3">
                  A Roleta Gira
                </h3>
                <p className="text-noite-400">
                  A cada 5 minutos, a Roleta forma grupos. Deixa o destino decidir!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-surface-light/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div>
              <Badge variant="balada" className="mb-4">Conversa Guiada</Badge>
              <h2 className="font-display font-bold text-4xl text-white mb-6">
                De desconhecido a amigo em 3 fases
              </h2>
              <p className="text-lg text-noite-400 mb-8">
                Nos Camarotes, a conversa é guiada por perguntas que vão do leve ao profundo. 
                Sem aquele silêncio constrangedor.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-festa-400/20 flex items-center justify-center text-2xl">
                    🍿
                  </div>
                  <div>
                    <div className="font-semibold text-white">Pipoca</div>
                    <div className="text-sm text-noite-400">Perguntas leves pra quebrar o gelo</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-balada-500/20 flex items-center justify-center text-2xl">
                    ☕
                  </div>
                  <div>
                    <div className="font-semibold text-white">Café</div>
                    <div className="text-sm text-noite-400">Histórias pessoais e sonhos</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">
                    🥃
                  </div>
                  <div>
                    <div className="font-semibold text-white">Cachaça</div>
                    <div className="text-sm text-noite-400">Conversas profundas e verdadeiras</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-noite-800 to-noite-900 border border-white/10 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">🛋️</div>
                  <div className="font-display font-bold text-2xl text-white">Camarote</div>
                  <div className="text-noite-400">Conversas que conectam</div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 px-4 py-2 rounded-xl bg-conquista-500 text-noite-900 font-semibold text-sm">
                +500 amizades feitas
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display font-bold text-4xl text-white mb-4">
            Grátis pra começar
          </h2>
          <p className="text-lg text-noite-400 mb-12">
            Entre na Pista, participe da Roleta, faça amigos. Tudo de graça.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="p-6 rounded-2xl bg-surface-card border border-white/10">
              <div className="text-3xl mb-3">🆓</div>
              <div className="font-display font-bold text-xl text-white mb-1">Grátis</div>
              <div className="text-noite-400 text-sm mb-4">Para sempre</div>
              <ul className="text-left text-sm text-noite-300 space-y-2">
                <li>✓ Entrar nas Pistas</li>
                <li>✓ Participar da Roleta</li>
                <li>✓ 5 Flashes por dia</li>
                <li>✓ Chat ilimitado</li>
              </ul>
            </div>

            {/* VIP */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-balada-500/10 to-transparent border border-balada-500/30">
              <div className="text-3xl mb-3">⭐</div>
              <div className="font-display font-bold text-xl text-white mb-1">VIP</div>
              <div className="text-balada-400 text-sm mb-4">R$ 29,90/mês</div>
              <ul className="text-left text-sm text-noite-300 space-y-2">
                <li>✓ Tudo do grátis</li>
                <li>✓ Flashes ilimitados</li>
                <li>✓ Ver quem te mandou Flash</li>
                <li>✓ 100 fichas/mês</li>
              </ul>
            </div>

            {/* Elite */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-elite/10 to-transparent border border-elite/30">
              <div className="text-3xl mb-3">👑</div>
              <div className="font-display font-bold text-xl text-white mb-1">Elite</div>
              <div className="text-elite-light text-sm mb-4">R$ 59,90/mês</div>
              <ul className="text-left text-sm text-noite-300 space-y-2">
                <li>✓ Tudo do VIP</li>
                <li>✓ Camarotes grátis</li>
                <li>✓ Destaque na Pista</li>
                <li>✓ 300 fichas/mês</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-6">
            Pronto pra conhecer gente nova?
          </h2>
          <p className="text-lg text-noite-400 mb-8">
            A Pista tá cheia. A Roleta vai girar. Você vem?
          </p>
          <Button 
            variant="balada" 
            size="xl"
            onClick={() => navigate('/pista')}
            className="text-lg px-12"
          >
            🎉 Entrar Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display font-bold text-xl">🎪 Disque Amizade</div>
          <p className="text-sm text-noite-500">
            © 2026 Disque Amizade. Feito com 💜 no Brasil.
          </p>
          <div className="flex gap-6">
            <a href="/design" className="text-sm text-noite-400 hover:text-white">Design</a>
            <a href="#" className="text-sm text-noite-400 hover:text-white">Termos</a>
            <a href="#" className="text-sm text-noite-400 hover:text-white">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
