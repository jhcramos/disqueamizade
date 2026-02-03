# Plano: Disque Amizade - Plataforma de Bate-papo com Vídeo

## Visão Geral
Criar uma plataforma web/mobile de bate-papo interativo com vídeo chamada em grupo, salas temáticas, gamificação e sistema de assinaturas. Design retro/nostálgico inspirado em plataformas sociais clássicas.

## Stack Tecnológico Escolhido

### Frontend
- **React 19** com TypeScript
- **Vite** (build tool - mais rápido que CRA)
- **TailwindCSS + DaisyUI** (design system retro)
- **Zustand** (gerenciamento de estado)
- **React Query** (cache e sincronização)
- **React Router v6** (navegação)

### Backend/Database
- **Supabase** (Auth, PostgreSQL, Realtime, Storage, Edge Functions)

### Vídeo
- **Agora.io** (escolhido por melhor performance: 23 FPS consistente, menor consumo de CPU/RAM, melhor custo-benefício)
- Alternativa considerada: Daily.co (APIs mais simples, mas mais caro)

### Pagamentos
- **Stripe** (padrão da indústria)

### Deploy
- **Vercel** (frontend + Edge Functions)
- **Supabase Cloud** (backend gerenciado)

### Monitoramento
- Vercel Analytics
- Sentry (error tracking)
- PostHog (analytics)

## Arquitetura do Banco de Dados

### Principais Tabelas

**profiles** (estende auth.users)
- Dados do usuário: username, avatar, bio, idade, cidade, idiomas
- Assinatura: subscription_tier (free/basic/premium), subscription_expires_at
- Status: is_online, last_seen_at, is_featured, featured_until
- Moeda virtual: coins

**rooms** (salas de chat)
- Dados: name, description, theme, sub_theme
- Configuração: max_users (30), is_private, password_hash
- Restrições: requires_subscription, owner_id

**room_participants**
- Relaciona usuários com salas
- Status: role (participant/moderator/owner)
- Configuração de mídia: is_broadcasting, video_enabled, audio_enabled

**chat_messages**
- Mensagens: content, message_type (text/image/emoji/system)
- Metadata para reações e emojis

**subscriptions**
- Integração Stripe: stripe_subscription_id, stripe_customer_id
- Status: tier, status (active/canceled/past_due)
- Períodos: current_period_start, current_period_end

**featured_profiles**
- Perfis em destaque no header (monetização)
- Duração: featured_from, featured_until
- Pagamento: payment_amount, stripe_payment_id

**broadcast_sessions**
- Transmissões ao vivo
- Canal Agora: agora_channel_name
- Métricas: max_viewers_reached

**broadcast_viewers**
- Espectadores da transmissão com timestamps

**gamification_sessions**
- Jogos: marriage_door, strip_poker
- Estado: participants (JSONB), game_state (JSONB)

**secret_cabins**
- Cabines premium para conversas 1:1 ou pequenos grupos
- Requer assinatura premium

**reports** (moderação)
- Denúncias de usuários
- Status: pending/reviewed/actioned

**notifications**
- Notificações em tempo real
- Tipo: room_invite, new_message, subscription_expiring

### Índices para Performance
- profiles: username, subscription_tier, is_online
- rooms: theme+sub_theme, is_active
- room_participants: room_id, user_id
- chat_messages: room_id+created_at
- broadcast_sessions: status

## Sistema de Presença em Tempo Real

**Tecnologia:** Supabase Realtime Presence

**Canais:**
1. **Global Presence** - rastreia todos usuários online
2. **Room Presence** - rastreia usuários em cada sala (max 30)

**Estado rastreado:**
- user_id, username, avatar_url
- room_id (se em sala)
- video_enabled, audio_enabled
- online_at timestamp

**Limites:**
- Supabase suporta 200 usuários/canal (bem acima do limite de 30 por sala)
- 100 canais por tenant (aumentável no plano Pro)

## Integração de Vídeo com Agora.io

### Por que Agora.io?
- Performance superior: 23 FPS consistente
- Melhor resiliência com packet loss (25%) e jitter (600ms)
- Custo mais baixo que Twilio (3x mais barato)
- Suporta até 1M espectadores simultâneos
- SDKs ricos para React, React Native, iOS, Android

### Arquitetura de Vídeo

**Configuração:**
- Mode: 'rtc' para comunicação em tempo real
- Codec: 'vp8' para melhor compatibilidade
- Encoder: 640x480, 15 FPS (otimizado para múltiplos participantes)
- Bitrate: 400-1000 kbps

**Fluxos:**
1. **Video Chat Regular:** Todos são publishers/subscribers
2. **Broadcast Mode:** Um host (publisher) + múltiplos audience (subscribers)

**Layout Responsivo:**
- 1-2 usuários: grid 1-2 colunas
- 3-4 usuários: grid 2x2
- 5-9 usuários: grid 3x3
- 10-16 usuários: grid 4x4
- 17-30 usuários: grid 5x6 com virtual scrolling (react-window)

**Geração de Tokens:**
- Supabase Edge Function gera tokens Agora.io
- Expiração: 1 hora (renovável)
- Roles: Publisher (broadcaster) ou Subscriber (viewer)

## Sistema de Planos e Monetização

### Planos de Assinatura

**FREE (R$ 0/mês)**
- Acesso a salas públicas
- Chat de texto ilimitado
- Visualizar até 9 vídeos simultâneos
- Perfil básico
- Limite: 5 salas simultâneas

**BASIC (R$ 19,90/mês)**
- Tudo do plano gratuito
- Criar até 3 salas temáticas
- Transmitir vídeo (broadcast)
- Visualizar até 30 vídeos simultâneos
- Sem anúncios
- Badge exclusivo

**PREMIUM (R$ 39,90/mês)**
- Tudo do plano básico
- Salas ilimitadas
- Acesso a cabines secretas
- Jogos exclusivos (strip poker)
- Prioridade no suporte
- Analytics de transmissão

### Feature Adicional: Perfil em Destaque

**Monetização tipo Badoo:**
- 1 dia: R$ 9,90
- 7 dias: R$ 49,90
- 30 dias: R$ 149,90

Perfil aparece rotacionando no header da página principal.

### Integração Stripe

**Fluxo de Pagamento:**
1. Usuário seleciona plano
2. Frontend chama Edge Function `create-checkout`
3. Edge Function cria sessão Stripe
4. Redirect para Stripe Checkout
5. Webhook processa pagamento
6. Atualiza `profiles.subscription_tier` e cria registro em `subscriptions`

**Webhook Events:**
- `checkout.session.completed` - ativa assinatura
- `customer.subscription.updated` - atualiza status
- `customer.subscription.deleted` - cancela assinatura
- `invoice.payment_failed` - notifica falha

## Funcionalidades de Gamificação

### 1. Casamento Atrás da Porta
**Mecânica:**
- Usuários na sala participam voluntariamente
- Sistema faz matching aleatório em pares
- Animação de "porta fechando" (3 segundos)
- Revela os pares formados
- Opção de chat privado entre o par

**Implementação:**
- Tabela: `gamification_sessions`
- Algoritmo: shuffle + pareamento sequencial
- Estado: waiting → matching → revealed

### 2. Strip Poker (18+)
**IMPORTANTE: Requer conformidade legal**

**Salvaguardas:**
- Verificação rigorosa de idade (18+)
- Consentimento explícito com checkboxes múltiplos
- Log de consentimento (compliance)
- Avisos de não gravar/screenshot
- Possibilidade de sair a qualquer momento

**Mecânica:**
- Jogo de poker clássico
- Cada rodida perdida = peça de roupa (opcional, escolha do jogador)
- Vídeo ativado apenas se consentido

### 3. Cabines Secretas (Premium)
**Conceito:**
- Salas privadas 1:1 ou pequenos grupos (max 2-4 pessoas)
- Acesso exclusivo para assinantes premium
- Status: occupied/available
- Auto-destruição após uso

**Implementação:**
- Monitoramento em tempo real de disponibilidade
- Criar sala temporária ao entrar
- Marcar cabine como ocupada
- Liberar ao sair

### 4. Sistema de Broadcast
**Transmissor:**
- Ativa modo broadcaster (Agora role: host)
- Vê lista de espectadores em tempo real
- Pode interagir via chat

**Espectadores:**
- Role: audience (Agora)
- Podem ativar câmera para interagir (com permissão)
- Lista visível para broadcaster

## Moderação e Segurança

### Sistema de Denúncias
**Motivos:**
- Assédio
- Spam
- Nudez não consensual
- Discurso de ódio
- Violência
- Outro (com descrição)

**Fluxo:**
- Usuário reporta via modal
- Registro em tabela `reports`
- Notificação para moderadores
- Status: pending → reviewed → actioned

### Filtro de Conteúdo
**Edge Function `moderate-content`:**
- Lista de palavras ofensivas (básico)
- Integração opcional com OpenAI Moderation API
- Bloqueia mensagens flagged

### Rate Limiting
**Upstash Redis + Ratelimit:**
- Chat: 10 mensagens / 10 segundos
- Criação de salas: 3 salas / hora
- Previne spam e abuso

### Row Level Security (RLS)
**Políticas principais:**
- Perfis: visíveis para todos (exceto banidos), editáveis apenas pelo dono
- Salas: públicas visíveis para todos, privadas só para membros
- Mensagens: visíveis apenas para membros da sala
- Assinaturas: usuário vê apenas suas próprias

### Segurança de Dados
- HTTPS obrigatório
- Headers de segurança (CSP, HSTS)
- Secrets em variáveis de ambiente
- Nunca armazenar dados de cartão (usar Stripe)
- Webhook signature verification
- Backups automáticos do banco

### LGPD/GDPR Compliance
- Política de privacidade clara
- Cookie consent
- Exportar dados do usuário
- Deletar conta e TODOS os dados
- Logs de consentimento (especialmente para conteúdo adulto)

## Design Retro/Nostálgico

### Paleta de Cores
- Primary: #FF6B9D (rosa retro)
- Secondary: #C06C84 (rosa escuro)
- Accent: #F67280
- Background: #F8B500 (amarelo)
- Border: #8B4513 (marrom)

### Tipografia
- Títulos: 'Press Start 2P' (pixel font)
- Secundário: 'VT323' (terminal font)
- Corpo: 'Courier New'

### Elementos Visuais
- Bordas tracejadas estilo anos 90
- Box-shadow com efeito 3D
- Gradientes lineares
- Padrões repetidos (stripes)
- Pixelated images
- Animação "farol" para status online (lighthouse-beam)

### Componentes
- Botões retro com efeito de pressionar
- Cards com header decorativo
- Efeito scanlines (CRT monitor)
- Indicadores pixelados

## Estrutura de Pastas

```
disqueamizade/
├── public/
│   ├── avatars/          # Avatares padrão
│   └── assets/
│       ├── sounds/       # Efeitos sonoros retro
│       └── images/
├── src/
│   ├── components/
│   │   ├── auth/         # Login, Register
│   │   ├── chat/         # ChatMessage, ChatInput
│   │   ├── video/        # VideoGrid, VideoTile, VideoControls
│   │   ├── rooms/        # RoomList, RoomCard, RoomCreate
│   │   ├── users/        # UserList, UserCard, UserProfile
│   │   ├── gamification/ # MarriageDoor, StripPoker, SecretCabin
│   │   ├── premium/      # PlanSelector, FeaturedProfile
│   │   ├── broadcast/    # BroadcastStudio, ViewerList
│   │   └── common/       # Button, Modal, Toast, Loading
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePresence.ts
│   │   ├── useVideoCall.ts
│   │   ├── useAgora.ts
│   │   └── useRoom.ts
│   ├── services/
│   │   ├── supabase/     # client, auth, database, realtime, presence
│   │   ├── agora/        # video.service, broadcast.service
│   │   ├── stripe/       # payment.service
│   │   └── analytics/    # tracking.service
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── roomStore.ts
│   │   └── videoStore.ts
│   ├── types/            # TypeScript types
│   ├── utils/            # validators, formatters, helpers, permissions
│   └── config/           # configurações
├── supabase/
│   ├── migrations/       # SQL migrations
│   └── functions/        # Edge Functions
│       ├── agora-token/
│       ├── stripe-webhook/
│       └── moderate-content/
└── [configs...]
```

## Roadmap de Implementação

### FASE 1: MVP (4-6 semanas)

**Semana 1-2: Fundação**
1. Setup Vite + React + TypeScript
2. Configurar Supabase (criar projeto, database)
3. Implementar schema inicial (migrations)
4. Sistema de autenticação (email/senha + Google OAuth)
5. RLS policies básicas
6. Layout responsivo base com tema retro

**Semana 3-4: Core Features**
1. Sistema de salas (criar, listar, entrar, sair)
2. Chat de texto em tempo real (Supabase Realtime)
3. Sistema de presença (usuários online, em sala)
4. Integração Agora.io básica (vídeo 1:1)
5. Controles de vídeo (mute, camera on/off)
6. Validação de limite de 30 usuários/sala

**Semana 5-6: Polimento MVP**
1. Vídeo grid responsivo (até 30 participantes)
2. Filtros temáticos (vinhos, idiomas, cidades, idades)
3. Perfis de usuário básicos
4. Sistema de notificações
5. Moderação básica (denúncias)
6. Deploy inicial na Vercel
7. Testes alfa com grupo fechado

### FASE 2: Monetização (3-4 semanas)

**Semana 7-8: Sistema de Planos**
1. Integração Stripe (checkout)
2. Edge Function para criar sessões de pagamento
3. Webhook Stripe para processar eventos
4. Lógica de permissões por tier
5. Upgrade/downgrade de planos
6. Página de pricing

**Semana 9-10: Features Premium**
1. Criar salas (plano basic+)
2. Sistema de broadcast (transmissão)
3. Visualizador de espectadores para broadcaster
4. Cabines secretas (premium only)
5. Perfil em destaque no header
6. Badges de assinante

### FASE 3: Gamificação (3-4 semanas)

**Semana 11-12: Jogos Básicos**
1. Casamento atrás da porta (algoritmo + UI)
2. Sistema de consentimento robusto
3. Animações de jogos
4. Sistema de moedas virtuais (futuro)

**Semana 13-14: Conteúdo Adulto (18+)**
1. **CRÍTICO: Consultar advogado especializado ANTES**
2. Verificação rigorosa de idade
3. Strip poker com todos disclaimers legais
4. Sistema de logs de consentimento
5. Compliance LGPD/GDPR extra

### FASE 4: Polimento e Escalabilidade (2-3 semanas)

**Semana 15-16: Performance**
1. Otimização de vídeo (adaptive bitrate)
2. Virtual scrolling (react-window) para salas grandes
3. Lazy loading de componentes
4. Cache strategies (React Query)
5. Analytics (PostHog)
6. Error tracking (Sentry)

**Semana 17: Launch Prep**
1. Testes de carga
2. Documentação completa
3. Políticas de privacidade e termos de uso
4. Material de marketing
5. Soft launch com grupo beta

### FASE 5: Pós-Launch (Contínuo)
- Monitoramento de métricas (DAU, MAU, churn)
- Feedback de usuários
- Iteração em features
- Expansão de temas de salas
- App mobile nativo (React Native)
- Internacionalização (i18n)

## Arquivos Críticos para Implementação

1. **supabase/migrations/001_initial_schema.sql**
   - Schema completo do banco de dados

2. **src/services/agora/video.service.ts**
   - Integração WebRTC com Agora.io

3. **src/services/supabase/presence.service.ts**
   - Sistema de presença em tempo real

4. **src/hooks/useRoom.ts**
   - Hook para gerenciar salas e participantes

5. **supabase/functions/agora-token/index.ts**
   - Geração segura de tokens Agora

6. **src/config/plans.config.ts**
   - Definição de planos e permissões

7. **supabase/migrations/003_rls_policies.sql**
   - Políticas de segurança RLS

## Estimativa de Custos (Mensal)

### Início (100-500 usuários)
- Supabase Pro: $25/mês
- Agora.io: $0-450/mês (10k min grátis, depois ~$0.99/1k min)
- Vercel Pro: $20/mês
- Upstash Redis: $10/mês
- **Total: ~$500-700/mês**

### Escala (1000+ usuários ativos)
- Supabase: $25-100/mês (upgrade conforme cresce)
- Agora.io: $450-1000/mês
- Vercel: $20-50/mês
- Stripe: 2.9% + $0.30 por transação (sem taxa fixa)
- **Total: ~$1500-2000/mês**

### Break-even
Com 100 assinantes (70% basic / 30% premium):
- Receita: (70 × R$19.90) + (30 × R$39.90) = **R$2.590/mês**
- Custos: ~R$700/mês
- **Lucro: ~R$1.890/mês**

## Considerações Legais IMPORTANTES

### ANTES de implementar Strip Poker:
1. **Consultar advogado especializado em direito digital**
2. Verificar legislação local sobre:
   - Conteúdo adulto online
   - Verificação de idade
   - Responsabilidade da plataforma
   - Armazenamento de consentimento
3. Implementar sistema robusto de age verification
4. Termos de uso e políticas de privacidade específicos
5. Sistema de moderação 24/7 (pelo menos monitoria automática)

### LGPD/GDPR:
- Política de privacidade clara e acessível
- Consentimento explícito para cookies e tracking
- Direito de exportar dados
- Direito de deletar conta e dados
- Data retention policies
- DPO (Data Protection Officer) se aplicável

## Verificação e Testes

### Testes End-to-End

**Fluxo 1: Cadastro e Primeira Sala**
1. Usuário se cadastra com email/senha
2. Preenche perfil (idade, cidade, interesses)
3. Vê lista de salas disponíveis
4. Entra em uma sala pública
5. Vê outros usuários online
6. Ativa vídeo e áudio
7. Envia mensagem no chat
8. Vê vídeos de outros participantes

**Fluxo 2: Criar Sala (Basic+)**
1. Usuário sem assinatura tenta criar sala → bloqueado
2. Faz upgrade para Basic
3. Webhook Stripe atualiza subscription_tier
4. Cria sala temática "Vinhos Franceses"
5. Define max_users = 15
6. Sala aparece na lista pública
7. Outros usuários podem entrar

**Fluxo 3: Broadcast**
1. Usuário Basic inicia broadcast
2. Edge Function gera token Agora (role: host)
3. Entra no canal como broadcaster
4. Outros usuários entram como audience
5. Broadcaster vê lista de espectadores em tempo real
6. Espectador pode ativar câmera (com permissão)
7. Métricas atualizadas (max_viewers_reached)

**Fluxo 4: Cabine Secreta (Premium)**
1. Usuário Free tenta acessar → bloqueado
2. Usuário Premium vê cabines disponíveis
3. Entra em cabine livre
4. Status atualiza para "occupied"
5. Sala temporária 1:1 criada
6. Ao sair, cabine liberada

**Fluxo 5: Gamificação**
1. Usuários na sala votam iniciar "Casamento Atrás da Porta"
2. Mínimo 4 participantes aceitam
3. Animação de porta (3 segundos)
4. Pares revelados
5. Opção de chat privado entre pares

### Testes de Performance
- Load testing com 30 usuários simultâneos em vídeo
- 100 salas simultâneas com 10 usuários cada
- 1000 mensagens de chat/segundo
- Latência de presença (<1 segundo)
- Qualidade de vídeo sob packet loss

### Testes de Segurança
- SQL injection attempts
- XSS attempts
- CSRF protection
- Rate limiting effectiveness
- RLS policy validation
- Webhook signature verification

## Próximos Passos Imediatos

1. **Validar viabilidade** - Criar protótipo de vídeo com Agora.io (2-3 dias)
2. **Setup inicial** - Criar projeto Supabase e Vercel (1 dia)
3. **Consulta legal** - Agendar com advogado sobre features adultas (ANTES de implementar)
4. **Implementar MVP** - Focar Fase 1 (Semanas 1-6)
5. **Testes alfa** - Grupo fechado de 20-30 pessoas
6. **Iterar** - Ajustar baseado em feedback real

## Recomendações Finais

1. **Começar enxuto** - Implementar MVP antes de adicionar gamificação
2. **Validar cedo** - Testar com usuários reais na Semana 4
3. **Priorizar segurança** - Nunca comprometer em moderação e privacidade
4. **Legalidade primeiro** - Consultar advogado ANTES de features adultas
5. **Métricas desde o início** - Rastrear DAU, retention, conversão
6. **Comunicação clara** - Termos de uso, políticas, consentimentos explícitos
7. **Escalabilidade gradual** - Não otimizar prematuramente, crescer conforme demanda

---

**Total de Arquivos a Criar:** ~150-200 arquivos
**Linhas de Código Estimadas:** 15.000-20.000 LOC
**Tempo Estimado MVP:** 4-6 semanas (1 dev full-time)
**Tempo Estimado Completo:** 14-17 semanas (3-4 meses)
