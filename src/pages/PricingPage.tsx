import { useState } from 'react'
import { Check, X, Coins, ChevronDown, ChevronUp, Crown, Zap, Gift, Star, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import { spotlightPricing } from '../data/mockCreators'

const plans = [
  {
    id: 'free',
    name: 'Grátis',
    price: 'R$0',
    period: '',
    badge: '',
    features: [
      { text: 'Até 3 salas simultâneas', included: true },
      { text: 'Chat por texto ilimitado', included: true },
      { text: 'Vídeo até 10 min/sessão', included: true },
      { text: '50 fichas iniciais', included: true },
      { text: 'Perfil básico', included: true },
      { text: 'Criar salas', included: false },
      { text: 'Filtros de vídeo premium', included: false },
      { text: 'Selo VIP', included: false },
      { text: 'Prioridade em salas cheias', included: false },
      { text: 'Conteúdo adulto', included: false },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 'R$19,90',
    period: '/mês',
    badge: 'Popular',
    features: [
      { text: 'Salas ilimitadas', included: true },
      { text: 'Chat por texto ilimitado', included: true },
      { text: 'Vídeo ilimitado em HD', included: true },
      { text: '200 fichas/mês bônus', included: true },
      { text: 'Perfil personalizado', included: true },
      { text: 'Criar até 3 salas', included: true },
      { text: '5 filtros de vídeo', included: true },
      { text: 'Selo VIP', included: false },
      { text: 'Prioridade em salas cheias', included: false },
      { text: 'Conteúdo adulto', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$39,90',
    period: '/mês',
    badge: 'Completo',
    features: [
      { text: 'Tudo do Basic +', included: true },
      { text: 'Vídeo em 4K', included: true },
      { text: '500 fichas/mês bônus', included: true },
      { text: 'Salas ilimitadas', included: true },
      { text: 'Perfil destaque', included: true },
      { text: 'Criar salas ilimitadas', included: true },
      { text: 'Todos os filtros de vídeo', included: true },
      { text: 'Selo VIP Premium 👑', included: true },
      { text: 'Prioridade em salas cheias', included: true },
      { text: 'Conteúdo adulto', included: true },
    ],
  },
]

const fichaPackages = [
  { id: 'f1', amount: 50, price: 'R$9,90', perFicha: 'R$0,20' },
  { id: 'f2', amount: 150, price: 'R$24,90', perFicha: 'R$0,17' },
  { id: 'f3', amount: 500, price: 'R$69,90', perFicha: 'R$0,14', popular: true, bonus: '+50 bônus' },
  { id: 'f4', amount: 1500, price: 'R$179,90', perFicha: 'R$0,12', bonus: '+200 bônus' },
  { id: 'f5', amount: 3000, price: 'R$349,90', perFicha: 'R$0,12', bonus: '+500 bônus' },
  { id: 'f6', amount: 5000, price: 'R$499,90', perFicha: 'R$0,10', bonus: '+1000 bônus' },
  { id: 'f7', amount: 10000, price: 'R$899,90', perFicha: 'R$0,09', bonus: '+2500 bônus' },
]

const faqs = [
  {
    q: 'O que são fichas?',
    a: 'Fichas são a moeda virtual da plataforma. Use para contratar creators no marketplace, enviar presentes em salas ao vivo, participar de mini-cursos e eventos especiais.',
  },
  {
    q: 'Posso cancelar meu plano a qualquer momento?',
    a: 'Sim! Você pode cancelar quando quiser. Seu plano fica ativo até o final do período pago. Sem multa, sem complicação.',
  },
  {
    q: 'As fichas expiram?',
    a: 'Não! Suas fichas nunca expiram. Use quando quiser, no seu ritmo. As fichas bônus dos planos mensais são creditadas automaticamente.',
  },
  {
    q: 'Como funciona o conteúdo adulto?',
    a: 'O conteúdo adulto é restrito a maiores de 18 anos com verificação de idade. Apenas disponível no plano Premium. Todas as salas adultas são moderadas.',
  },
  {
    q: 'Posso ser um creator no marketplace?',
    a: 'Sim! Qualquer usuário com conta verificada pode oferecer serviços. Cadastre seu perfil de creator, defina suas habilidades e preços, e comece a ganhar fichas.',
  },
  {
    q: 'Como funciona o Perfil em Destaque?',
    a: 'Você paga fichas para ter seu perfil exibido no carrossel da página principal. Quanto mais tempo, menor o custo por dia. É a melhor forma de atrair clientes e ganhar visibilidade.',
  },
  {
    q: 'Quais formas de pagamento vocês aceitam?',
    a: 'Aceitamos cartão de crédito, débito, PIX e boleto bancário. Pagamentos processados de forma segura via Stripe.',
  },
]

export const PricingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
            Planos & Fichas
          </h1>
          <p className="text-dark-400 max-w-lg mx-auto leading-relaxed">
            Escolha o plano ideal e compre fichas para aproveitar tudo que a plataforma oferece.
          </p>
        </section>

        {/* ═══ Plans ═══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isPremium = plan.id === 'premium'

              return (
                <div
                  key={plan.id}
                  className={`card p-6 flex flex-col relative ${
                    isPremium ? 'ring-1 ring-primary-500/30 border-primary-500/20' : ''
                  }`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold ${
                      isPremium ? 'bg-primary-600 text-white' : 'bg-white/10 text-dark-300'
                    }`}>
                      {plan.badge}
                    </div>
                  )}

                  <div className="text-center mb-6 pt-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                      isPremium ? 'bg-primary-500/15' : 'bg-white/[0.06]'
                    }`}>
                      {isPremium ? <Crown className="w-6 h-6 text-primary-400" /> : <Zap className="w-6 h-6 text-dark-400" />}
                    </div>
                    <h3 className={`text-xl font-bold ${isPremium ? 'text-primary-400' : 'text-white'}`}>{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-dark-500 text-sm">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-dark-700 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-dark-300' : 'text-dark-600'}`}>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      plan.id === 'free'
                        ? 'btn-secondary'
                        : isPremium
                        ? 'btn-primary'
                        : 'bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.06]'
                    }`}
                  >
                    {plan.id === 'free' ? 'Começar Grátis' : 'Assinar Agora'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <div className="divider max-w-7xl mx-auto" />

        {/* ═══ Fichas ═══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-semibold text-sm">Fichas</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Compre Fichas</h2>
            <p className="text-dark-400 max-w-md mx-auto text-sm leading-relaxed">
              Use fichas para contratar creators, enviar presentes, participar de eventos e desbloquear conteúdo exclusivo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {fichaPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`card p-5 transition-all hover:border-amber-500/20 cursor-pointer group ${
                  pkg.popular ? 'ring-1 ring-amber-500/20 relative' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full bg-amber-500 text-dark-950 text-[11px] font-bold">
                    Mais Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-amber-400">{pkg.amount.toLocaleString('pt-BR')}</div>
                    <div className="text-[11px] text-dark-500">fichas</div>
                  </div>
                </div>

                {pkg.bonus && (
                  <div className="flex items-center gap-1 mb-3 px-2 py-1 rounded-md bg-success/10 border border-success/15 w-fit">
                    <Gift className="w-3 h-3 text-success" />
                    <span className="text-[11px] text-success font-semibold">{pkg.bonus}</span>
                  </div>
                )}

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-lg font-bold text-white">{pkg.price}</div>
                    <div className="text-[11px] text-dark-500">{pkg.perFicha}/ficha</div>
                  </div>
                  <button className="btn-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-dark-950 rounded-lg font-semibold text-xs transition-all">
                    Comprar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="divider max-w-7xl mx-auto" />

        {/* ═══ ⭐ DESTACAR MEU PERFIL — Spotlight Pricing ═══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
              <Star className="w-4 h-4 text-primary-400" />
              <span className="text-primary-400 font-semibold text-sm">Destaque</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Destacar Meu Perfil</h2>
            <p className="text-dark-400 max-w-lg mx-auto text-sm leading-relaxed">
              Tenha seu perfil em rotação no carrossel da página principal. 
              A melhor forma de atrair clientes e ganhar visibilidade na plataforma.
            </p>
          </div>

          {/* How it works */}
          <div className="card p-6 mb-8 max-w-2xl mx-auto">
            <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary-400" />
              Como funciona
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center shrink-0 text-primary-400 font-bold text-xs">1</div>
                <div>
                  <p className="text-sm font-medium text-white">Escolha o período</p>
                  <p className="text-[11px] text-dark-500 mt-0.5">De 1 dia a 30 dias</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center shrink-0 text-primary-400 font-bold text-xs">2</div>
                <div>
                  <p className="text-sm font-medium text-white">Pague com fichas</p>
                  <p className="text-[11px] text-dark-500 mt-0.5">Direto do seu saldo</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center shrink-0 text-primary-400 font-bold text-xs">3</div>
                <div>
                  <p className="text-sm font-medium text-white">Apareça na home</p>
                  <p className="text-[11px] text-dark-500 mt-0.5">Carrossel rotativo 24/7</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {spotlightPricing.map((tier, i) => {
              const isPopular = i === 1
              return (
                <div
                  key={tier.id}
                  className={`card p-6 text-center transition-all hover:border-primary-500/20 ${
                    isPopular ? 'ring-1 ring-primary-500/25 relative' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-600 text-white text-[11px] font-semibold">
                      Recomendado
                    </div>
                  )}

                  <div className="text-3xl mb-3">{tier.emoji}</div>
                  <h3 className="font-semibold text-white text-lg mb-1">{tier.label}</h3>

                  <div className="my-4">
                    <span className="text-3xl font-bold text-amber-400">{tier.fichas}</span>
                    <span className="text-sm text-dark-500 ml-1">fichas</span>
                  </div>

                  {tier.discount && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 border border-success/15 mb-4">
                      <span className="text-xs text-success font-semibold">{tier.discount}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-dark-500 mb-4">
                    {tier.fichas === 50 && '50 fichas/dia'}
                    {tier.fichas === 250 && '≈ 36 fichas/dia'}
                    {tier.fichas === 800 && '≈ 27 fichas/dia'}
                  </div>

                  <button
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      isPopular
                        ? 'btn-primary'
                        : 'bg-white/[0.06] text-white hover:bg-white/[0.10] border border-white/[0.08]'
                    }`}
                  >
                    Destacar Agora
                  </button>
                </div>
              )
            })}
          </div>

          {/* Social proof */}
          <p className="text-center text-xs text-dark-500 mt-6">
            ⭐ Creators em destaque recebem em média <span className="text-primary-400 font-semibold">3x mais visualizações</span> no perfil
          </p>
        </section>

        <div className="divider max-w-7xl mx-auto" />

        {/* ═══ FAQ ═══ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-10">
            Perguntas Frequentes
          </h2>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-semibold text-sm text-white pr-4">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-primary-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-dark-500 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-dark-400 leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="card p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/[0.05] to-transparent" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-3">Ainda tem dúvidas?</h2>
              <p className="text-dark-400 mb-6 text-sm">Entre em contato com nosso time de suporte.</p>
              <Link to="/" className="btn-secondary inline-block">Falar com Suporte</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
