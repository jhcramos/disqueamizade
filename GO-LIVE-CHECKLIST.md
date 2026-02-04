# 🚀 Go-Live Checklist — Disque Amizade

Tudo que o Juliano precisa fazer para colocar o Disque Amizade no ar com funcionalidade completa.

---

## 1. Backend Services (criar contas)

### Supabase (Banco de Dados + Auth + Realtime)
- [ ] Criar projeto no [Supabase](https://supabase.com) (free tier)
- [ ] Copiar **Project URL** → `VITE_SUPABASE_URL`
- [ ] Copiar **Anon Key** → `VITE_SUPABASE_ANON_KEY`
- [ ] Rodar as migrations SQL no SQL Editor:
  - `supabase/migrations/001_initial_schema.sql`
  - `supabase/migrations/002_rls_policies.sql`
  - `supabase/migrations/003_v2_fields_and_tables.sql`
  - `supabase/migrations/20240130_smart_rooms_system.sql`
- [ ] Ativar **Auth → Email/Password** no dashboard
- [ ] (Opcional) Ativar **Auth → Google OAuth**
- [ ] Deploy Edge Function: `supabase functions deploy livekit-token`

### LiveKit Cloud (Vídeo em Tempo Real)
- [ ] Criar conta no [LiveKit Cloud](https://livekit.io) (free tier = 10k min/mês)
- [ ] Copiar **WebSocket URL** → `VITE_LIVEKIT_URL` (formato: `wss://xxx.livekit.cloud`)
- [ ] Copiar **API Key** → `VITE_LIVEKIT_API_KEY`
- [ ] Copiar **API Secret** → `VITE_LIVEKIT_API_SECRET`
- [ ] Adicionar **LIVEKIT_API_KEY** e **LIVEKIT_API_SECRET** como secrets no Supabase Edge Functions

### Stripe (Pagamentos — Brasil)
- [ ] Criar conta no [Stripe](https://stripe.com) (modo teste primeiro)
- [ ] Copiar **Publishable Key** → `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Criar produtos: pacotes de fichas (50, 150, 500, 1200)
- [ ] Criar produtos: planos de assinatura (Basic R$19,90 / Premium R$49,90)
- [ ] Configurar webhooks para processar pagamentos

---

## 2. Variáveis de Ambiente

- [ ] Copiar `.env.example` para `.env`
- [ ] Preencher todas as variáveis:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LiveKit
VITE_LIVEKIT_URL=wss://xxxxx.livekit.cloud
VITE_LIVEKIT_API_KEY=APIxxxxx
VITE_LIVEKIT_API_SECRET=xxxxx

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

---

## 3. Domínio & Hospedagem

- [ ] Registrar domínio (ex: `disqueamizade.com.br`)
- [ ] **Opção A:** Deploy no Vercel (recomendado para produção)
  - `npx vercel --prod`
  - Configurar domínio custom
  - Env vars no dashboard do Vercel
- [ ] **Opção B:** Manter no GitHub Pages (ok para demo)
  - `npx gh-pages -d dist`
  - Configurar CNAME para domínio custom
- [ ] Configurar SSL (automático no Vercel/GitHub Pages)

---

## 4. O Que Já Está Pronto ✅

### Frontend Completo
- ✅ **25+ salas oficiais** configuradas (cidades, idades, hobbies, idiomas, especiais)
- ✅ **Câmera real** integrada (getUserMedia) nas salas e na roleta
- ✅ **Roleta 1:1** com câmera real + filtros de match
- ✅ **Chat em tempo real** nas salas (mock, ready for Supabase Realtime)
- ✅ **Sistema de fichas** (compra, envio, presentes ao vivo)
- ✅ **Modo Ostentação** (badges visuais para quem gasta fichas)
- ✅ **Salas VIP** com custo de entrada em fichas
- ✅ **Marketplace de serviços** (aulas, consultoria, entretenimento)
- ✅ **Stories/Reels** feature
- ✅ **Conteúdo exclusivo** com fichas
- ✅ **Jogo Casamento Atrás da Porta** nas salas
- ✅ **Speed Dating** mode
- ✅ **Video Filters** (MediaPipe face masks — 80s themes!)
- ✅ **Dashboard do Influencer/Criador**
- ✅ **Cabines Secretas**
- ✅ **Planos de assinatura** (Free/Basic/Premium)
- ✅ **Design mobile-first** (PWA ready)

### Integração LiveKit (pronta para ativar)
- ✅ Hook `useLiveKit` criado com connect/publish/subscribe
- ✅ Edge Function para gerar tokens LiveKit
- ✅ Fallback gracioso: câmera local funciona sem LiveKit
- ✅ Quando LiveKit configurado → vídeo P2P automático

### Banco de Dados (pronto para rodar)
- ✅ 4 arquivos de migration SQL completos
- ✅ Profiles com V2 fields (fichas, ostentação, creator)
- ✅ Rooms com V2 fields (tipo, categoria, custo de entrada)
- ✅ Roulette sessions & matches
- ✅ Live gifts catalog
- ✅ RLS policies em todas as tabelas
- ✅ Auto-scaling de salas oficiais

---

## 5. Custos Estimados (Início)

| Serviço | Plano | Custo |
|---------|-------|-------|
| Supabase | Free | R$ 0 |
| LiveKit Cloud | Free (10k min) | R$ 0 |
| Stripe | Pay-as-you-go | 3.49% + R$0.39 por transação |
| Domínio .com.br | Registro.br | ~R$ 40/ano |
| Vercel | Free (Hobby) | R$ 0 |
| **Total inicial** | | **~R$ 40/ano** |

---

## 6. Próximos Passos (Pós-Launch)

- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] PWA install prompt
- [ ] Analytics (Google Analytics / Mixpanel)
- [ ] Moderação automática (AI content filter)
- [ ] Email marketing (welcome + re-engagement)
- [ ] Landing page com SEO
- [ ] App stores (React Native ou PWA wrapper)

---

*Última atualização: Fevereiro 2026*
