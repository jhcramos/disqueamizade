import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/common/Header'
import { Button } from '@/components/common/Button'
import { Check, Sparkles } from 'lucide-react'
import { PLANS } from '@/config/plans.config'

export const PricingPage = () => {
  const [annual, setAnnual] = useState(false)

  const plans = [
    {
      key: 'free' as const,
      name: 'Free',
      description: 'Para começar a explorar',
      price: 0,
      features: PLANS.free.features,
      cta: 'Começar Grátis',
      highlighted: false,
    },
    {
      key: 'basic' as const,
      name: 'Basic',
      description: 'Para quem quer mais',
      price: annual ? PLANS.basic.price * 10 : PLANS.basic.price,
      features: PLANS.basic.features,
      cta: 'Assinar Basic',
      highlighted: false,
    },
    {
      key: 'premium' as const,
      name: 'Premium',
      description: 'A experiência completa',
      price: annual ? PLANS.premium.price * 10 : PLANS.premium.price,
      features: PLANS.premium.features,
      cta: 'Assinar Premium',
      highlighted: true,
    },
  ]

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-50 mb-4">
            Planos e Preços
          </h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Escolha o plano ideal para a sua experiência
          </p>

          {/* Toggle mensal/anual */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm ${!annual ? 'text-zinc-50' : 'text-zinc-500'}`}>
              Mensal
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                annual ? 'bg-violet-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  annual ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${annual ? 'text-zinc-50' : 'text-zinc-500'}`}>
              Anual
            </span>
            {annual && (
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                2 meses grátis
              </span>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-2xl p-8 transition-all ${
                plan.highlighted
                  ? 'gradient-border bg-zinc-900 shadow-glow-violet relative'
                  : 'bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Mais popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-zinc-50 mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-zinc-500">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-zinc-50">
                    {plan.price === 0 ? 'Grátis' : `R$${plan.price.toFixed(2).replace('.', ',')}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-zinc-500">
                      /{annual ? 'ano' : 'mês'}
                    </span>
                  )}
                </div>
              </div>

              <Link to={plan.key === 'free' ? '/auth' : '/auth'}>
                <Button
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  fullWidth
                  className="mb-8"
                >
                  {plan.cta}
                </Button>
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      plan.highlighted
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-zinc-400">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
