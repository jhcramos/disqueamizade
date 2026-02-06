import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Badge, Avatar } from '../components/design-system'

// Animated counter hook
function useCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return count
}

// Live online count that fluctuates
function useLiveCount(base: number) {
  const [count, setCount] = useState(base)
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 5) - 2)
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  return Math.max(0, count)
}

// Mock testimonials
const testimonials = [
  { name: 'Fernanda M.', city: 'São Paulo', text: 'Conheci minha melhor amiga aqui! A Roleta nos colocou juntas e desde então a gente conversa todo dia 💕', avatar: 'https://i.pravatar.cc/100?img=5' },
  { name: 'Lucas P.', city: 'Rio de Janeiro', text: 'Muito melhor que os apps de dating. Aqui você conhece a pessoa de verdade, ao vivo!', avatar: 'https://i.pravatar.cc/100?img=12' },
  { name: 'Marina S.', city: 'Belo Horizonte', text: 'O Camarote com Conversa Guiada é genial. Sem aquele silêncio constrangedor!', avatar: 'https://i.pravatar.cc/100?img=9' },
  { name: 'Gabriel R.', city: 'Curitiba', text: 'Tô na Pista todo dia depois do trabalho. Virou meu happy hour digital 🍻', avatar: 'https://i.pravatar.cc/100?img=15' },
]

// Features data
const features = [
  {
    icon: '🎪',
    title: 'Pista',
    subtitle: 'Até 30 pessoas',
    description: 'Entre na sala principal com até 30 pessoas ao vivo. Veja todo mundo, escolha quem te interessa.',
    color: 'balada',
  },
  {
    icon: '🎰',
    title: 'Roleta',
    subtitle: 'A cada 5 minutos',
    description: 'A Roleta gira e forma grupos aleatórios. O destino decide quem vai pro Camarote junto!',
    color: 'energia',
  },
  {
    icon: '🛋️',
    title: 'Camarotes',
    subtitle: 'Conversas reais',
    description: 'Salas menores com perguntas guiadas que levam do leve ao profundo. De desconhecido a amigo.',
    color: 'festa',
  },
]

export default function HomePageV3() {
  const navigate = useNavigate()
  const onlineNow = useLiveCount(247)
  const weeklyConnections = useCounter(2847)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(t => (t + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-noite-900 overflow-hidden">
      {/* Hero Section - Full screen with animated background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-balada-500/20 via-noite-900 to-noite-900" />
          
          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-balada-500/15 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-energia-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-festa-400/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
          
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Live indicator */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm animate-fade-in">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-conquista-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-conquista-500"></span>
            </span>
            <span className="text-sm text-noite-200 font-medium">
              <span className="font-bold text-conquista-400">{onlineNow}</span> pessoas online agora
            </span>
          </div>

          {/* Main headline */}
          <h1 className="font-display font-extrabold text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-[0.95] tracking-tight animate-slide-up">
            A balada que
            <br />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-balada-500 via-energia-500 to-festa-400">
                nunca fecha
              </span>
              {/* Underline accent */}
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-balada-500/50" viewBox="0 0 200 8" fill="none">
                <path d="M2 6C50 2 150 2 198 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-noite-300 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Conheça gente nova ao vivo. A Roleta decide seu destino.
            <br className="hidden md:block" />
            <span className="text-noite-400">Deixa a magia acontecer. ✨</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button 
              variant="balada" 
              size="xl"
              onClick={() => navigate('/pista')}
              className="text-lg px-10 shadow-glow-balada hover:shadow-[0_0_50px_rgba(255,107,53,0.4)] transition-shadow duration-300"
            >
              🎉 Entrar na Pista
            </Button>
            <Button 
              variant="ghost" 
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-noite-300 hover:text-white"
            >
              Já tenho conta →
            </Button>
          </div>

          {/* Social proof avatars */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex -space-x-3">
              {['Maria', 'João', 'Ana', 'Pedro', 'Julia', 'Lucas'].map((name, i) => (
                <Avatar 
                  key={i} 
                  name={name} 
                  size="md" 
                  className="ring-2 ring-noite-900 hover:ring-balada-500 transition-all hover:-translate-y-1 cursor-pointer" 
                />
              ))}
            </div>
            <p className="text-sm text-noite-400">
              +<span className="text-conquista-400 font-semibold">{weeklyConnections.toLocaleString()}</span> conexões essa semana
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle">
          <div className="flex flex-col items-center gap-2 text-noite-500">
            <span className="text-xs">Descubra mais</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section - The Experience */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="balada" className="mb-4">Como funciona</Badge>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
              Uma jornada em 3 atos
            </h2>
            <p className="text-lg text-noite-400 max-w-xl mx-auto">
              Da Pista ao Camarote, cada passo te leva mais perto de conexões reais
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={feature.title}
                className="group relative"
              >
                {/* Connection line */}
                {idx < features.length - 1 && (
                  <div className="hidden md:block absolute top-24 -right-4 w-8 h-0.5 bg-gradient-to-r from-white/10 to-transparent" />
                )}
                
                <div className={`relative p-8 rounded-3xl bg-surface-light/50 border border-white/5 hover:border-${feature.color}-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl`}>
                  {/* Step number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-noite-900 border-2 border-white/10 flex items-center justify-center text-sm font-bold text-noite-400">
                    {idx + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-${feature.color}-500/10 border border-${feature.color}-500/20 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <h3 className="font-display font-bold text-2xl text-white mb-1">{feature.title}</h3>
                    <p className={`text-sm text-${feature.color}-400 mb-3`}>{feature.subtitle}</p>
                    <p className="text-noite-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => navigate('/pista')}
            >
              Ver a Pista ao vivo →
            </Button>
          </div>
        </div>
      </section>

      {/* Conversa Guiada Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-surface-light/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: Visual */}
            <div className="relative order-2 md:order-1">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-noite-800 to-noite-900 border border-white/10 p-8 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-festa-400/5 via-transparent to-balada-500/5" />
                
                {/* Floating emoji cards */}
                <div className="absolute top-8 left-8 p-4 rounded-2xl bg-festa-400/10 border border-festa-400/20 backdrop-blur-sm animate-bounce-subtle">
                  <span className="text-3xl">🍿</span>
                  <p className="text-xs text-festa-400 mt-1">Pipoca</p>
                </div>
                <div className="absolute top-1/2 right-8 -translate-y-1/2 p-4 rounded-2xl bg-balada-500/10 border border-balada-500/20 backdrop-blur-sm animate-bounce-subtle" style={{ animationDelay: '0.5s' }}>
                  <span className="text-3xl">☕</span>
                  <p className="text-xs text-balada-400 mt-1">Café</p>
                </div>
                <div className="absolute bottom-8 left-1/3 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm animate-bounce-subtle" style={{ animationDelay: '1s' }}>
                  <span className="text-3xl">🥃</span>
                  <p className="text-xs text-purple-400 mt-1">Cachaça</p>
                </div>
                
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-7xl mb-2">🛋️</div>
                    <p className="text-white/80 font-display font-bold text-xl">Camarote</p>
                  </div>
                </div>
              </div>
              
              {/* Badge */}
              <div className="absolute -bottom-4 -right-4 px-5 py-2.5 rounded-xl bg-conquista-500 text-noite-900 font-bold text-sm shadow-glow-conquista">
                +500 amizades feitas 💚
              </div>
            </div>

            {/* Right: Text */}
            <div className="order-1 md:order-2">
              <Badge variant="festa" className="mb-4">Conversa Guiada™</Badge>
              <h2 className="font-display font-bold text-4xl text-white mb-6">
                De desconhecido a amigo em 3 fases
              </h2>
              <p className="text-lg text-noite-400 mb-8">
                Nos Camarotes, a conversa é guiada por perguntas que vão do leve ao profundo. 
                Sem aquele silêncio constrangedor.
              </p>
              
              <div className="space-y-5">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-festa-400/5 border border-festa-400/10">
                  <div className="w-12 h-12 rounded-xl bg-festa-400/20 flex items-center justify-center text-2xl flex-shrink-0">
                    🍿
                  </div>
                  <div>
                    <div className="font-semibold text-white text-lg">Pipoca</div>
                    <div className="text-sm text-noite-400">Perguntas leves pra quebrar o gelo. "Qual seu filme favorito?"</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-balada-500/5 border border-balada-500/10">
                  <div className="w-12 h-12 rounded-xl bg-balada-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                    ☕
                  </div>
                  <div>
                    <div className="font-semibold text-white text-lg">Café</div>
                    <div className="text-sm text-noite-400">Histórias pessoais e sonhos. "Qual foi a maior loucura que você já fez?"</div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                    🥃
                  </div>
                  <div>
                    <div className="font-semibold text-white text-lg">Cachaça</div>
                    <div className="text-sm text-noite-400">Conversas profundas e verdadeiras. "O que você mais valoriza em uma amizade?"</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="conquista" className="mb-4">O que dizem</Badge>
          <h2 className="font-display font-bold text-4xl text-white mb-12">
            Conexões reais, histórias reais
          </h2>

          {/* Testimonial card */}
          <div className="relative">
            <div className="p-8 rounded-3xl bg-surface-light/50 border border-white/5">
              <div className="text-6xl mb-6 opacity-20">"</div>
              <p className="text-xl md:text-2xl text-white leading-relaxed mb-8 min-h-[80px]">
                {testimonials[currentTestimonial].text}
              </p>
              <div className="flex items-center justify-center gap-4">
                <img 
                  src={testimonials[currentTestimonial].avatar} 
                  alt={testimonials[currentTestimonial].name}
                  className="w-14 h-14 rounded-full border-2 border-conquista-500"
                />
                <div className="text-left">
                  <p className="font-semibold text-white">{testimonials[currentTestimonial].name}</p>
                  <p className="text-sm text-noite-400">{testimonials[currentTestimonial].city}</p>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentTestimonial 
                      ? 'bg-conquista-500 w-6' 
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Camarotes VIP Section - LIVE */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-elite/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-elite/20 text-elite-light border-elite/30">🛋️ Ao Vivo</Badge>
            <h2 className="font-display font-bold text-4xl text-white mb-4">
              Camarotes VIP abertos agora
            </h2>
            <p className="text-lg text-noite-400 max-w-xl mx-auto">
              Conversas rolando neste momento. Entra num que combina com você!
            </p>
          </div>

          {/* Camarotes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {[
              { name: 'Cantinho da Ana', participants: 3, max: 6, avatars: [5, 9, 1], topic: '🎬 Filmes', active: true },
              { name: 'Gamers BR', participants: 5, max: 6, avatars: [3, 7, 12, 20, 25], topic: '🎮 Games', active: true },
              { name: 'Papo de Madrugada', participants: 4, max: 6, avatars: [8, 15, 22, 31], topic: '☕ Café', active: true },
              { name: 'Só os Cria', participants: 6, max: 6, avatars: [2, 6, 11, 18, 24, 30], topic: '🔥 Esquenta', full: true },
              { name: 'Tech Talk', participants: 2, max: 6, avatars: [4, 13], topic: '💻 Tech', active: true },
              { name: 'Novos Amigos', participants: 3, max: 6, avatars: [10, 17, 28], topic: '🍿 Pipoca', active: true },
              { name: 'Carnaval 24h', participants: 5, max: 6, avatars: [14, 19, 23, 27, 33], topic: '🎉 Festa', active: true },
              { name: 'Duo Romântico', participants: 2, max: 2, avatars: [16, 21], topic: '💕 Duo', private: true },
            ].map((camarote, i) => (
              <button
                key={i}
                onClick={() => !camarote.full && navigate(`/camarote/vip-${i + 1}`)}
                disabled={camarote.full}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  camarote.full 
                    ? 'bg-noite-800/50 border-white/5 opacity-60 cursor-not-allowed'
                    : camarote.private
                    ? 'bg-energia-500/10 border-energia-500/30 hover:border-energia-500/50 hover:-translate-y-1'
                    : 'bg-elite/5 border-elite/20 hover:border-elite/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-elite/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-elite-light">{camarote.topic}</span>
                  <span className={`text-[10px] ${camarote.full ? 'text-red-400' : 'text-noite-400'}`}>
                    {camarote.participants}/{camarote.max}
                  </span>
                </div>
                <h4 className="font-semibold text-white text-sm mb-2 truncate">{camarote.name}</h4>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {camarote.avatars.slice(0, 4).map((img, j) => (
                      <img 
                        key={j}
                        src={`https://i.pravatar.cc/150?img=${img}`} 
                        alt="" 
                        className="w-6 h-6 rounded-full border-2 border-noite-900" 
                      />
                    ))}
                    {camarote.avatars.length > 4 && (
                      <div className="w-6 h-6 rounded-full border-2 border-noite-900 bg-noite-700 flex items-center justify-center text-[10px] text-noite-300">
                        +{camarote.avatars.length - 4}
                      </div>
                    )}
                  </div>
                  {camarote.full ? (
                    <span className="text-[10px] text-red-400">Lotado</span>
                  ) : camarote.private ? (
                    <span className="text-[10px] text-energia-400">🔒 Privado</span>
                  ) : (
                    <span className="text-[10px] text-conquista-400">Entrar →</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Create Camarote CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => navigate('/rooms')}
              className="border-elite/30 hover:border-elite/50"
            >
              🛋️ Ver todos os Camarotes
            </Button>
            <Button 
              onClick={() => navigate('/pista?create=true')}
              className="bg-gradient-to-r from-elite-dark via-elite to-elite-light text-noite-900 font-bold hover:shadow-glow-elite"
            >
              ✨ Criar meu Camarote (20💎)
            </Button>
          </div>

          <p className="text-center text-sm text-noite-500 mt-6">
            💡 Assinantes <span className="text-elite-light font-semibold">Elite</span> criam Camarotes de graça!
          </p>
        </div>
      </section>

      {/* Dark Room Teaser */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-darkroom/10 to-transparent" />
        
        <div className="max-w-4xl mx-auto relative">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-darkroom/20 to-noite-900 border border-darkroom/30 text-center relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-darkroom-light to-transparent" />
            
            <div className="relative z-10">
              <Badge className="mb-4 bg-darkroom/20 text-red-400 border-red-500/30">
                🔥 Em breve
              </Badge>
              <h2 className="font-display font-bold text-4xl text-white mb-4">
                Dark Room
              </h2>
              <p className="text-lg text-noite-400 mb-6 max-w-xl mx-auto">
                Espaço exclusivo 18+ para quem quer ir além. 
                Verificação de idade obrigatória. 
                <span className="text-red-400"> O que acontece na Dark Room, fica na Dark Room.</span>
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-noite-400 text-sm">
                <span className="w-2 h-2 bg-darkroom-light rounded-full animate-pulse"></span>
                Lançamento: Março 2026
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="balada" className="mb-4">Preços</Badge>
            <h2 className="font-display font-bold text-4xl text-white mb-4">
              Grátis pra começar, incrível pra ficar
            </h2>
            <p className="text-lg text-noite-400">
              Entre na Pista, participe da Roleta, faça amigos. Tudo de graça.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="p-6 rounded-3xl bg-surface-light/50 border border-white/10 hover:border-white/20 transition-all">
              <div className="text-4xl mb-4">🆓</div>
              <div className="font-display font-bold text-2xl text-white mb-1">Grátis</div>
              <div className="text-noite-400 text-sm mb-6">Para sempre</div>
              <ul className="text-left text-sm text-noite-300 space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-conquista-500">✓</span> Entrar nas Pistas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-conquista-500">✓</span> Participar da Roleta
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-conquista-500">✓</span> 5 Flashes por dia
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-conquista-500">✓</span> Chat e DMs ilimitados
                </li>
              </ul>
              <Button variant="secondary" className="w-full" onClick={() => navigate('/auth')}>
                Começar grátis
              </Button>
            </div>

            {/* VIP - Popular */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-balada-500/10 to-transparent border-2 border-balada-500/30 relative transform hover:-translate-y-1 transition-all">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-balada-500 text-white text-xs font-bold">
                POPULAR
              </div>
              <div className="text-4xl mb-4">⭐</div>
              <div className="font-display font-bold text-2xl text-white mb-1">VIP</div>
              <div className="mb-6">
                <span className="text-3xl font-bold text-balada-400">R$ 29,90</span>
                <span className="text-noite-400 text-sm">/mês</span>
              </div>
              <ul className="text-left text-sm text-noite-300 space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-balada-500">✓</span> Tudo do grátis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-balada-500">✓</span> Flashes ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-balada-500">✓</span> Ver quem te mandou Flash
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-balada-500">✓</span> Badge VIP no perfil
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-balada-500">✓</span> 100 fichas/mês de bônus
                </li>
              </ul>
              <Button variant="balada" className="w-full shadow-glow-balada" onClick={() => navigate('/pricing')}>
                Assinar VIP
              </Button>
            </div>

            {/* Elite */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-elite/10 to-transparent border border-elite/30 relative overflow-hidden hover:-translate-y-1 transition-all">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-shimmer-gold animate-shimmer opacity-30" />
              
              <div className="relative z-10">
                <div className="text-4xl mb-4">👑</div>
                <div className="font-display font-bold text-2xl text-white mb-1">Elite</div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-elite-light">R$ 59,90</span>
                  <span className="text-noite-400 text-sm">/mês</span>
                </div>
                <ul className="text-left text-sm text-noite-300 space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-elite">✓</span> Tudo do VIP
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-elite">✓</span> Criar Camarotes grátis
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-elite">✓</span> Destaque na Pista
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-elite">✓</span> Moldura dourada 👑
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-elite">✓</span> 300 fichas/mês de bônus
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-elite-dark via-elite to-elite-light text-noite-900 font-bold hover:shadow-glow-elite" onClick={() => navigate('/pricing')}>
                  Ser Elite
                </Button>
              </div>
            </div>
          </div>

          {/* Fichas info */}
          <div className="text-center mt-8">
            <p className="text-sm text-noite-500">
              💎 Precisa de mais fichas? Compre avulso a partir de <span className="text-white">R$ 9,90</span>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 relative">
        {/* Background glow */}
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[300px] bg-balada-500/20 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-6">
            Pronto pra conhecer gente nova?
          </h2>
          <p className="text-lg text-noite-400 mb-8">
            A Pista tá cheia. A Roleta vai girar em breve. Você vem?
          </p>
          <Button 
            variant="balada" 
            size="xl"
            onClick={() => navigate('/pista')}
            className="text-lg px-12 shadow-glow-balada hover:shadow-[0_0_60px_rgba(255,107,53,0.5)] transition-all duration-300 hover:scale-105"
          >
            🎉 Entrar na Balada
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎪</span>
              <span className="font-display font-bold text-xl text-white">Disque Amizade</span>
            </div>
            
            <p className="text-sm text-noite-500">
              © 2026 Disque Amizade. Feito com 💜 no Brasil.
            </p>
            
            <div className="flex gap-6">
              <a href="/design" className="text-sm text-noite-400 hover:text-white transition-colors">Design</a>
              <a href="#" className="text-sm text-noite-400 hover:text-white transition-colors">Termos</a>
              <a href="#" className="text-sm text-noite-400 hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="text-sm text-noite-400 hover:text-white transition-colors">Contato</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
