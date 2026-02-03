# Setup Guide - Disque Amizade

## Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (https://supabase.com)
- Conta no LiveKit Cloud (https://livekit.io)
- Conta no Stripe (https://stripe.com)

## 1. Configurar Supabase

### 1.1. Criar Projeto

1. Acesse https://app.supabase.com
2. Clique em "New Project"
3. Preencha os dados:
   - Name: disque-amizade
   - Database Password: [gere uma senha forte]
   - Region: South America (São Paulo) - para menor latência
4. Aguarde a criação do projeto (~2 minutos)

### 1.2. Executar Migrations

1. Acesse o SQL Editor no painel do Supabase
2. Execute os arquivos de migration na ordem:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`

### 1.3. Configurar Authentication

1. Vá em Authentication > Providers
2. Habilite "Email" (já vem habilitado por padrão)
3. Configure Google OAuth:
   - Enable Google provider
   - Adicione Client ID e Secret do Google Cloud Console
   - Configure redirect URL: `https://[seu-projeto].supabase.co/auth/v1/callback`

### 1.4. Obter Credenciais

1. Vá em Project Settings > API
2. Copie:
   - Project URL: `VITE_SUPABASE_URL`
   - anon public key: `VITE_SUPABASE_ANON_KEY`

## 2. Configurar LiveKit

### 2.1. Criar Conta

1. Acesse https://cloud.livekit.io
2. Sign up com Google ou GitHub
3. Crie um novo projeto: "disque-amizade"

### 2.2. Obter Credenciais

1. No dashboard, vá em Settings
2. Copie:
   - WebSocket URL: `VITE_LIVEKIT_URL` (ex: wss://disque-amizade-xxxxx.livekit.cloud)
   - API Key: `VITE_LIVEKIT_API_KEY`
   - API Secret: `VITE_LIVEKIT_API_SECRET`

### 2.3. Configurar Limites (Free Tier)

- Free tier: 10.000 minutos/mês
- Após exceder: ~$0.006/minuto
- Para auto-hospedagem: consulte https://docs.livekit.io/oss/deployment/

## 3. Configurar Stripe

### 3.1. Criar Conta

1. Acesse https://stripe.com
2. Crie conta para Brasil
3. Ative modo de teste

### 3.2. Criar Produtos

1. Vá em Products > Add Product
2. Crie 3 produtos:

**Produto 1: Assinatura Basic**
- Name: Disque Amizade - Plano Basic
- Price: R$ 19,90/mês (recurring)
- ID do preço: copie o price_id

**Produto 2: Assinatura Premium**
- Name: Disque Amizade - Plano Premium
- Price: R$ 39,90/mês (recurring)
- ID do preço: copie o price_id

**Produto 3: Perfil em Destaque**
- Name: Perfil em Destaque
- Prices:
  - R$ 9,90 (one-time) - 1 dia
  - R$ 49,90 (one-time) - 7 dias
  - R$ 149,90 (one-time) - 30 dias

### 3.3. Obter Chaves

1. Vá em Developers > API Keys
2. Copie:
   - Publishable key (test mode): `VITE_STRIPE_PUBLISHABLE_KEY`
   - Secret key (test mode): guardar para Edge Functions

### 3.4. Configurar Webhook

1. Vá em Developers > Webhooks
2. Add endpoint
3. URL: `https://[seu-projeto].supabase.co/functions/v1/stripe-webhook`
4. Events to send:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_failed
5. Copie o Webhook signing secret

## 4. Configurar Variáveis de Ambiente

1. Copie `.env.example` para `.env`
2. Preencha todas as variáveis:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# LiveKit
VITE_LIVEKIT_URL=wss://disque-amizade-xxxxx.livekit.cloud
VITE_LIVEKIT_API_KEY=APIxxxxx
VITE_LIVEKIT_API_SECRET=secret...

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 5. Instalar Dependências

```bash
npm install
```

## 6. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000

## 7. Próximos Passos

- [ ] Implementar Edge Functions do Supabase
- [ ] Configurar MediaPipe para filtros de vídeo
- [ ] Implementar integração completa com Stripe
- [ ] Deploy na Vercel

## Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env` existe
- Verifique se as variáveis estão corretas
- Reinicie o servidor de desenvolvimento

### Erro de CORS no Supabase
- Vá em Project Settings > API
- Em CORS, adicione `http://localhost:3000`

### LiveKit não conecta
- Verifique se o WebSocket URL está correto (deve começar com wss://)
- Verifique se API Key e Secret estão corretos
- Teste a conexão em https://livekit.io/cloud

### Stripe checkout não abre
- Verifique se a chave publishable está correta
- Verifique se está usando chave de test mode
- Abra console do navegador para ver erros
