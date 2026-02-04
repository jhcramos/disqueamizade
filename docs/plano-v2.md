# 📋 Disque Amizade V2 — Plano de Desenvolvimento

> **Data:** Junho 2026  
> **Status:** Em desenvolvimento  
> **Stack:** React 19 + TypeScript + Vite + TailwindCSS + Supabase + LiveKit  
> **Design:** Dark/Purple futurista (Tron/80s)

---

## 🎯 Visão Geral

O Disque Amizade V2 transforma a plataforma de um chat de vídeo em salas temáticas para um **ecossistema completo de entretenimento social**, incluindo:

- 🎥 Vídeo chat em grupo com até 30 pessoas
- 🎰 Roleta 1:1 (matching aleatório com filtros)
- 💰 Economia de Fichas com status "Ostentação"
- 🌟 Sistema de Influencers/Creators com monetização ao vivo
- 🎮 Gamificação (speed dating, casamento, mini-games)
- 📊 Rankings semanais e sistema de presentes ao vivo
- 📱 Stories/Reels internos

---

## 📦 Sistema de Tiers (Planos)

| Tier | Criar Salas | Entrar em Sala Cheia | Preço |
|------|-------------|---------------------|-------|
| **GRÁTIS** | 1 sala | ❌ | R$0 |
| **BÁSICO** | 3 salas | ✅ | R$19,90/mês |
| **PREMIUM** | Ilimitadas | ✅ | R$39,90/mês |

### Benefícios por Tier:

**GRÁTIS:**
- Acesso a salas públicas
- Chat de texto ilimitado
- Vídeo em grupo (broadcast)
- Criar 1 sala
- Perfil básico
- Roleta 1:1 (com anúncios)
- 50 fichas iniciais

**BÁSICO (R$19,90/mês):**
- Tudo do Grátis
- Criar até 3 salas
- Entrar em salas cheias
- Sem anúncios
- Filtros de vídeo (backgrounds, máscaras 2D)
- 200 fichas/mês bônus
- Badge Básico
- Roleta com filtros avançados

**PREMIUM (R$39,90/mês):**
- Tudo do Básico
- Salas ilimitadas
- Filtros premium (3D, AR, anonimato)
- Acesso a cabines secretas
- Jogos exclusivos (casamento, speed dating)
- 500 fichas/mês bônus
- Badge Premium 👑
- Prioridade no suporte
- Analytics de transmissão
- Conteúdo adulto 🔞
- Gravação de broadcasts
- Dashboard de creator (se influencer)

---

## 💎 Fichas (Moeda Virtual)

### Economia

- **Moeda:** Fichas (símbolo: fichas / ícone: moeda dourada)
- **Conversão:** 1 ficha ≈ R$0,10~0,20 dependendo do pacote
- **Comissão plataforma:** 20% em todas as transações
- **Saque mínimo:** 100 fichas (R$10,00) — taxa de 5%

### Status "Ostentação" 🏆

- Usuários com **300+ fichas** = **Ostentação**
- Badge dourado brilhante no perfil e nas salas
- Efeitos visuais exclusivos (borda dourada, partículas)
- Prioridade em filas de salas
- Nome destacado no chat
- Posição privilegiada no ranking

### Pacotes de Fichas

| Pacote | Fichas | Preço | Por Ficha | Bônus |
|--------|--------|-------|-----------|-------|
| Iniciante | 50 | R$9,90 | R$0,20 | — |
| Popular | 150 | R$24,90 | R$0,17 | — |
| **Destaque** | 500 | R$69,90 | R$0,14 | +50 bônus |
| Premium | 1.500 | R$179,90 | R$0,12 | +200 bônus |
| Elite | 3.000 | R$349,90 | R$0,12 | +500 bônus |
| VIP | 5.000 | R$499,90 | R$0,10 | +1000 bônus |
| Magnata | 10.000 | R$899,90 | R$0,09 | +2500 bônus |

### Uso das Fichas

- 🎁 Presentes em lives (animados, como TikTok)
- 💼 Contratar creators/influencers
- ⭐ Spotlight (destaque na home)
- 📚 Mini-cursos e eventos pagos
- 🎮 Jogos e apostas (speed dating, verdade ou desafio)
- 🚪 Entrada em salas VIP
- 🔞 Conteúdo exclusivo adulto
- 🏷️ Itens cosméticos (badges, efeitos)

---

## 🎥 Salas de Vídeo Chat

### Salas Fixas (Oficiais)

Salas permanentes mantidas pela plataforma:

**Por Cidade:**
- 🏙️ São Paulo, 🏖️ Rio de Janeiro, 🌆 Belo Horizonte, 🌴 Salvador, etc.

**Por Idade:**
- 🔥 18-25 anos, 💼 26-35 anos, 🍷 36-45 anos, ⭐ 46+ anos

**Por Hobby:**
- 💻 Tecnologia, ⚽ Futebol, 🎸 Música, 🎮 Games, 📺 Séries, etc.

**Por Idioma:**
- 🇺🇸 English, 🇪🇸 Español, 🇫🇷 Français, 🇩🇪 Deutsch

**Especiais:**
- 🎤 Karaokê, 🎧 DJ Room, 💃 Dança, 🍳 Culinária ao Vivo

### Salas da Comunidade

- Criadas por usuários conforme tier
- Limite de 30 participantes
- Podem ser públicas ou privadas
- Owner pode moderar (kick, mute)

### Salas VIP

- Entrada custa fichas (definido pelo dono)
- Ambientes exclusivos premium
- Eventos privados

---

## 🎰 Roleta 1:1

### Conceito
Matching aleatório como Omegle/Chatroulette, mas com filtros e qualidade. Uma pessoa conecta, o sistema encontra um match.

### Fluxo
1. Usuário entra na página /roulette
2. Seleciona filtros (opcional): idade, cidade, hobby, idioma
3. Clica "Encontrar Alguém"
4. Sistema busca match compatível
5. Conexão de vídeo 1:1
6. Botões: "Próximo" (next match) / "Adicionar" (amigo) / "Reportar"

### Filtros Disponíveis
- **Idade:** faixa etária (18-25, 26-35, 36-45, 46+)
- **Cidade:** filtrar por cidade
- **Hobby:** interesse em comum
- **Idioma:** idioma preferido

### Regras
- Grátis: roleta com anúncios, sem filtros avançados
- Básico: filtros de idade e cidade
- Premium: todos os filtros + prioridade no matching

---

## 🌟 Sistema de Influencers/Creators

### Como funciona
1. Qualquer usuário verificado pode se tornar creator
2. Creators aparecem destacados em salas e no carrossel da home
3. Podem oferecer serviços pagos (aulas, coaching, shows)
4. Dashboard com analytics de ganhos e viewers

### Monetização
- **Lives pagas:** viewers pagam fichas para assistir
- **Mini-cursos:** aulas agendadas com preço fixo
- **Sessões privadas:** 1:1 por fichas
- **Presentes ao vivo:** viewers enviam presentes animados
- **Conteúdo exclusivo:** posts/vídeos bloqueados por fichas
- **Spotlight:** pagar para aparecer no carrossel da home

### Dashboard do Creator
- 📊 Ganhos totais e por período
- 👥 Viewers ativos e histórico
- 📅 Agenda de sessões
- ⭐ Avaliações e feedback
- 💰 Saldo disponível para saque
- 📈 Gráficos de crescimento

### Área Adulta 🔞
- Conteúdo adulto disponível para Premium 18+
- Creators adultos com verificação de idade
- Conteúdo behind fichas paywall
- Salas dedicadas com moderação

---

## 🎁 Sistema de Presentes ao Vivo

### Conceito
Como TikTok Live — viewers enviam presentes animados durante transmissões.

### Presentes Disponíveis

| Presente | Fichas | Animação |
|----------|--------|----------|
| ❤️ Coração | 1 | Float up |
| 🌹 Rosa | 5 | Bloom |
| ⭐ Estrela | 10 | Sparkle spin |
| 🎆 Fogos | 25 | Fireworks |
| 💎 Diamante | 50 | Diamond rain |
| 🚀 Foguete | 100 | Launch + trail |
| 👑 Coroa | 250 | Crown ceremony |
| 🏆 Troféu | 500 | Trophy parade |
| 💰 Chuva de Fichas | 1000 | Raining coins |

### Funcionamento
- Presente aparece como overlay animado no vídeo
- 20% fica com a plataforma
- Nome do sender aparece em destaque
- Top gifters aparecem em ranking lateral

---

## 🎮 Gamificação

### Casamento Atrás da Porta
- Jogo de matchmaking divertido
- Participantes "se casam" atrás de portas aleatórias
- Quem combinar ganha fichas
- Sessões programadas (eventos especiais)

### Speed Dating
- Salas de speed dating com timer de 3 minutos
- Match com várias pessoas em sequência
- No final, escolhe quem quer conversar mais
- Timer visual com contagem regressiva

### Mini-Games
- **Verdade ou Desafio:** cartas aleatórias, opção de pagar fichas para pular
- **Quiz:** perguntas temáticas, quem acerta mais ganha fichas
- **Quem é Mais Provável:** votação entre participantes

### Karaokê / DJ Rooms
- Salas especiais com player de música
- Votação do público (fichas)
- Ranking de melhores performances

---

## 📊 Rankings Semanais

### Top Gastadores
Os 10 usuários que mais gastaram fichas na semana.
- Badge especial temporário
- Destaque na home
- Bonus fichas para o #1

### Top Creators (Ganhadores)
Os 10 creators que mais ganharam fichas.
- Destaque no carrossel
- Badge "Creator da Semana"
- Mais visibilidade no marketplace

---

## 📱 Stories/Reels Internos

- Conteúdo curto que expira em 24h
- Vídeos até 60 segundos
- Filtros e efeitos
- Viewers podem reagir com fichas
- Conteúdo exclusivo (bloqueado por fichas)

---

## 🗃️ Schema do Banco de Dados (Supabase)

### Tabelas Novas/Atualizadas

```sql
-- Atualização da tabela profiles
ALTER TABLE profiles ADD COLUMN fichas_balance INTEGER DEFAULT 50;
ALTER TABLE profiles ADD COLUMN is_ostentacao BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN is_creator BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN creator_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN total_earnings_fichas INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN total_spent_fichas INTEGER DEFAULT 0;

-- Tabela de transações de fichas
CREATE TABLE ficha_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(id),
  to_user_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'gift', 'purchase', 'service', 'vip_entry', 'game', 'withdrawal'
  related_id UUID, -- ID do item relacionado
  platform_fee INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de presentes ao vivo
CREATE TABLE live_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  room_id UUID REFERENCES rooms(id),
  gift_type TEXT NOT NULL,
  fichas_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de sessões de roleta
CREATE TABLE roulette_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES profiles(id),
  user2_id UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ended_by UUID, -- quem clicou "próximo"
  became_friends BOOLEAN DEFAULT FALSE
);

-- Tabela de speed dating
CREATE TABLE speed_dating_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  status TEXT DEFAULT 'waiting', -- 'waiting', 'in_progress', 'completed'
  round_duration_seconds INTEGER DEFAULT 180,
  current_round INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de rankings semanais
CREATE TABLE weekly_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  week_start DATE NOT NULL,
  fichas_spent INTEGER DEFAULT 0,
  fichas_earned INTEGER DEFAULT 0,
  ranking_type TEXT NOT NULL, -- 'spender', 'earner'
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de stories
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'video', -- 'video', 'image'
  caption TEXT,
  fichas_required INTEGER DEFAULT 0, -- 0 = grátis
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Atualização da tabela rooms
ALTER TABLE rooms ADD COLUMN room_type TEXT DEFAULT 'community'; -- 'official', 'community', 'vip', 'speed_dating', 'karaoke'
ALTER TABLE rooms ADD COLUMN entry_cost_fichas INTEGER DEFAULT 0;
ALTER TABLE rooms ADD COLUMN category TEXT; -- 'cidade', 'idade', 'hobby', 'idioma', 'gamer', 'adulta'
ALTER TABLE rooms ADD COLUMN is_fixed BOOLEAN DEFAULT FALSE;
```

---

## 🏗️ Fases de Implementação

### Fase 1 — Fundação V2 (Sprint atual)
- [x] Atualizar types com V2 (tiers, fichas, ostentação, influencer, roleta)
- [x] Atualizar config de planos com permissões corretas
- [x] Atualizar mock data (rooms + creators V2)
- [x] Atualizar stores (fichaStore, authStore com ostentação)
- [x] Componente de badge Ostentação
- [x] Atualizar Header com badge Ostentação
- [x] Atualizar HomePage com CTA roleta + stats V2
- [x] Atualizar PricingPage com tiers V2 + ostentação info

### Fase 2 — Interação Social
- [x] Página de Roleta 1:1 (/roulette)
- [x] Componente de presentes ao vivo (LiveGiftsOverlay)
- [x] Speed Dating room component
- [x] Atualizar RoomsPage com salas fixas e tier-based creation
- [x] Atualizar MarketplacePage com live sessions
- [x] Atualizar MobileNav com roleta
- [x] Rota /roulette no App.tsx

### Fase 3 — Creator Economy
- [x] Dashboard do Influencer
- [x] Sistema de ranking semanal
- [ ] Stories/Reels internos
- [ ] Conteúdo exclusivo com fichas

### Fase 4 — Backend Integration (Futuro)
- [ ] Supabase real-time para salas
- [ ] LiveKit integration para vídeo
- [ ] Stripe integration para pagamentos
- [ ] Sistema de matchmaking para roleta
- [ ] Push notifications
- [ ] Moderação e reports

---

## 🎨 Decisões de Arquitetura

### Frontend
- **State Management:** Zustand (já em uso)
- **Routing:** React Router v6
- **Styling:** TailwindCSS com design tokens custom
- **Icons:** Lucide React
- **Animações:** CSS animations + Tailwind animate

### Design System
- **Cores primárias:** Violet/Purple (#8b5cf6)
- **Cores secundárias:** Amber/Gold (#fbbf24)  
- **Background:** Dark (#0f0f0f, #1a1a2e)
- **Cards:** Semi-transparent com blur
- **Tipografia:** Plus Jakarta Sans
- **Estética:** Cyberpunk/Tron/80s retro-futurista

### Padrões
- Componentes funcionais com hooks
- Types centralizados em types/index.ts
- Mock data em data/*
- Stores em store/*
- Pages como containers, components como presentational
- Todas as fichas em formato "fichas" (não "estrelas")

---

## 📝 Notas Importantes

1. **V2 é frontend-only** — toda data é mock, sem backend real
2. **Fichas ≠ Estrelas** — sempre usar "fichas" como nome da moeda
3. **Ostentação = 300+ fichas** — badge dourado + efeitos visuais
4. **Comissão = 20%** — em todas as transações de fichas
5. **30 users/sala** — limite técnico do LiveKit para futuro
6. **Roleta** — feature principal diferenciadora (como Omegle mas melhor)
7. **Design** — manter estética dark/purple consistente

---

*Documento criado em Junho 2026 — Disque Amizade V2*
