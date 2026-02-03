# Integração Stripe - Disque Amizade

## 📋 Visão Geral

Este documento descreve a implementação completa da integração Stripe para pagamentos de:
- ✅ Assinaturas (Basic/Premium)
- ✅ Pacotes de Estrelas (moeda virtual)
- ✅ Perfil em Destaque (Featured Profiles)

## 🔑 Configuração Inicial

### 1. Criar Conta Stripe

1. Acesse [https://stripe.com](https://stripe.com) e crie uma conta
2. Ative o modo de produção após testes
3. Configure informações bancárias para receber pagamentos

### 2. Obter Chaves API

No Dashboard do Stripe:
- **Publishable Key**: `pk_test_...` (frontend)
- **Secret Key**: `sk_test_...` (backend apenas!)
- **Webhook Secret**: `whsec_...` (validação de webhooks)

### 3. Adicionar ao .env

```env
# Frontend
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Backend (Supabase Edge Functions)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

⚠️ **IMPORTANTE**: Nunca exponha a Secret Key no frontend!

## 💳 Produtos e Preços no Stripe

### Criar Produtos no Dashboard

#### 1. Assinaturas

**Produto: Assinatura Basic**
- Nome: `Disque Amizade - Basic`
- Descrição: `Plano mensal com filtros 2D, criar salas e mais`
- Preço: R$ 19,90/mês (recorrente)
- ID do Preço: `price_basic_monthly_1990`

**Produto: Assinatura Premium**
- Nome: `Disque Amizade - Premium`
- Descrição: `Plano mensal completo com filtros 3D, comissão reduzida e mais`
- Preço: R$ 39,90/mês (recorrente)
- ID do Preço: `price_premium_monthly_3990`

#### 2. Pacotes de Estrelas (One-time)

| Estrelas | Preço | ID do Preço |
|----------|-------|-------------|
| 50⭐ | R$ 5,00 | `price_stars_50_500` |
| 120⭐ (+20%) | R$ 10,00 | `price_stars_120_1000` |
| 250⭐ | R$ 20,00 | `price_stars_250_2000` |
| 300⭐ (+20%) | R$ 25,00 | `price_stars_300_2500` |
| 500⭐ | R$ 40,00 | `price_stars_500_4000` |
| 650⭐ (+30%) | R$ 50,00 | `price_stars_650_5000` |
| 1000⭐ | R$ 80,00 | `price_stars_1000_8000` |
| 1500⭐ (+50%) | R$ 100,00 | `price_stars_1500_10000` |

#### 3. Perfil em Destaque (One-time)

| Duração | Preço | ID do Preço |
|---------|-------|-------------|
| 1 dia | R$ 9,90 | `price_featured_1day_990` |
| 7 dias | R$ 49,90 | `price_featured_7days_4990` |
| 30 dias | R$ 149,90 | `price_featured_30days_14990` |

## 🔧 Implementação Backend

### Supabase Edge Function: create-checkout

```typescript
// supabase/functions/create-checkout/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productType, priceId, userId, metadata } = await req.json()

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: productType === 'subscription' ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        productType,
        ...metadata,
      },
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

### Deploy Edge Function

```bash
npx supabase functions deploy create-checkout
```

### Atualizar Frontend para Chamar Edge Function

```typescript
const createSubscriptionCheckout = async (tier: 'basic' | 'premium', userId: string) => {
  const priceId = tier === 'basic'
    ? STRIPE_PRICES.basic_monthly
    : STRIPE_PRICES.premium_monthly

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        productType: 'subscription',
        priceId,
        userId,
        metadata: { tier },
      }),
    }
  )

  const { sessionId } = await response.json()

  // Redirect to Stripe Checkout
  const stripe = getStripe()
  const { error } = await stripe.redirectToCheckout({ sessionId })

  if (error) {
    console.error('Stripe error:', error)
    throw error
  }
}
```

## 🪝 Webhooks do Stripe

### 1. Configurar Webhook no Stripe Dashboard

1. Vá em **Developers → Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://<seu-projeto>.supabase.co/functions/v1/stripe-webhook`
4. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### 2. Supabase Edge Function: stripe-webhook

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, {
      status: 400,
    })
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionUpdated(subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionCancelled(subscription)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await handlePaymentFailed(invoice)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata!.userId
  const productType = session.metadata!.productType

  if (productType === 'subscription') {
    const tier = session.metadata!.tier as 'basic' | 'premium'

    // Update user subscription
    await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .eq('id', userId)

    // Create subscription record
    await supabase.from('subscriptions').insert({
      user_id: userId,
      tier,
      stripe_subscription_id: session.subscription,
      stripe_customer_id: session.customer,
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    // Send notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'subscription_activated',
      title: `Plano ${tier.toUpperCase()} Ativado!`,
      message: `Seu plano ${tier} está ativo. Aproveite todos os benefícios!`,
    })
  } else if (productType === 'stars') {
    const starsAmount = parseInt(session.metadata!.starsAmount)

    // Add stars to balance
    await supabase.rpc('add_stars', {
      user_id: userId,
      amount: starsAmount,
    })

    // Create purchase record
    await supabase.from('star_purchases').insert({
      user_id: userId,
      stars_amount: starsAmount,
      paid_amount_brl: (session.amount_total || 0) / 100,
      stripe_payment_intent_id: session.payment_intent,
      status: 'completed',
    })

    // Send notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'star_purchase',
      title: 'Estrelas Recebidas!',
      message: `Você recebeu ${starsAmount}⭐ em sua conta.`,
    })
  } else if (productType === 'featured') {
    const duration = session.metadata!.duration
    const durationDays = duration === '1day' ? 1 : duration === '7days' ? 7 : 30

    // Create featured profile record
    await supabase.from('featured_profiles').insert({
      user_id: userId,
      featured_type: duration,
      featured_from: new Date(),
      featured_until: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      payment_amount: (session.amount_total || 0) / 100,
      stripe_payment_id: session.payment_intent,
    })

    // Send notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'featured_activated',
      title: 'Perfil em Destaque!',
      message: `Seu perfil está em destaque por ${durationDays} dias.`,
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Update subscription status in database
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId

  // Downgrade to free
  await supabase
    .from('profiles')
    .update({ subscription_tier: 'free' })
    .eq('id', userId)

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id)

  // Send notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'subscription_cancelled',
    title: 'Assinatura Cancelada',
    message: 'Sua assinatura foi cancelada. Você voltou ao plano FREE.',
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Find user by customer ID
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (subscription) {
    // Send notification
    await supabase.from('notifications').insert({
      user_id: subscription.user_id,
      type: 'payment_failed',
      title: 'Falha no Pagamento',
      message: 'Houve um problema com seu pagamento. Atualize seu método de pagamento.',
    })
  }
}
```

### Deploy Webhook Function

```bash
npx supabase functions deploy stripe-webhook
```

## 🧪 Testes

### 1. Modo de Teste

Use cartões de teste do Stripe:
- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- CVC: qualquer 3 dígitos
- Data: qualquer data futura

### 2. Testar Webhooks Localmente

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks para local
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Em outro terminal, trigger eventos
stripe trigger checkout.session.completed
```

## 📊 Monitoramento

### Dashboard Stripe

Monitore em tempo real:
- Pagamentos bem-sucedidos
- Pagamentos falhados
- Assinaturas ativas
- Cancelamentos
- Disputas (chargebacks)

### Logs Supabase

Verifique logs das Edge Functions:
```bash
npx supabase functions logs stripe-webhook --tail
```

## 🔒 Segurança

### Checklist

- ✅ Nunca expor Secret Key no frontend
- ✅ Sempre validar assinatura de webhook
- ✅ Usar HTTPS em produção
- ✅ Verificar metadata antes de processar
- ✅ Implementar idempotência (evitar duplicatas)
- ✅ Rate limiting em endpoints
- ✅ Logs de auditoria

## 💰 Taxas Stripe

- **Transações nacionais**: 4.99% + R$ 0,39
- **Transações internacionais**: 5.99% + R$ 0,39
- **Sem taxa mensal ou setup**
- **Saque imediato sem custo adicional**

## 🚀 Go Live Checklist

Antes de ativar modo produção:

1. ✅ Testar todos os fluxos em modo test
2. ✅ Verificar webhooks funcionando
3. ✅ Configurar email de notificações
4. ✅ Adicionar política de reembolso
5. ✅ Configurar taxes (se aplicável)
6. ✅ Ativar modo produção no Stripe
7. ✅ Trocar chaves para production
8. ✅ Configurar webhook de produção
9. ✅ Testar com compra real de R$ 1,00
10. ✅ Monitorar primeiras transações

## 📞 Suporte

- Documentação: https://stripe.com/docs
- Suporte Stripe: https://support.stripe.com
- Community: https://stripe.com/community

---

**Status de Implementação**: ✅ Frontend integrado | ⏳ Backend (Edge Functions) pendente

**Última atualização**: 2026-01-30
