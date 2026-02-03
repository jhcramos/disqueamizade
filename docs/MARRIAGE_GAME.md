# Casamento Atrás da Porta - Jogo de Gamificação

## 📋 Visão Geral

O **Casamento Atrás da Porta** é um jogo de gamificação divertido onde usuários em uma sala são pareados aleatoriamente em "casamentos". Após o pareamento, os participantes podem aceitar ou recusar o match. Se ambos aceitarem, um chat privado é criado para conversa.

**Status:** ✅ IMPLEMENTADO (Task #32)

---

## 🎯 Funcionalidades

### 1. Mecânica do Jogo

O jogo funciona em 4 fases:

#### **Fase 1: Waiting (Aguardando)**
- Usuários entram voluntariamente no jogo
- Mínimo de 4 participantes necessários
- Máximo de 20 participantes
- Exibe lista de todos os participantes
- Apenas host/moderador pode iniciar o pareamento

#### **Fase 2: Matching (Pareando)**
- Animação de "porta girando" (3 segundos)
- Sistema embaralha todos os participantes
- Cria pares aleatórios (2 pessoas por par)
- Se número ímpar, última pessoa fica sem par

#### **Fase 3: Revealing (Revelando)**
- Pares são revelados para todos
- Cada participante vê com quem foi pareado
- Botão "Aceitar Pareamento" disponível
- Status: ⏳ Aguardando / ✓ Aceitou / 💚 Match Confirmado

#### **Fase 4: Completed (Finalizado)**
- Jogo completa automaticamente após 30 segundos
- Pares que aceitaram mutuamente têm chat privado criado
- Opção de "Iniciar Novo Jogo"

### 2. Sistema de Aceitação

**Aceitação Individual:**
- Participante clica "❤️ Aceitar Pareamento"
- Status muda para "✓ Aceitou"
- Aguarda o parceiro aceitar

**Match Confirmado (ambos aceitaram):**
- Status muda para "💚 Match Confirmado!"
- Chat privado é criado: `private_{pair_id}_{timestamp}`
- Botão "💬 Abrir Chat Privado" aparece
- Par pode conversar em sala exclusiva

### 3. Participação Voluntária

- **Opt-in**: Usuários devem clicar "🎮 Participar do Jogo"
- Modal de confirmação explica as regras
- Podem sair do jogo a qualquer momento (antes do pareamento)
- Não há penalidade por recusar um par

### 4. Limites

- **Mínimo**: 4 participantes (para ter pelo menos 2 pares)
- **Máximo**: 20 participantes (10 pares no máximo)
- **Timeout**: Jogo completa automaticamente em 30 segundos após revelar pares

---

## 🏗️ Arquitetura Técnica

### Interfaces TypeScript

```typescript
type GameStatus = 'waiting' | 'matching' | 'revealing' | 'completed'

interface GameParticipant {
  user_id: string
  username: string
  avatar_url: string
  age?: number
  city?: string
  bio?: string
  joined_at: Date
}

interface MarriagePair {
  id: string
  participant1: GameParticipant
  participant2: GameParticipant
  matched_at: Date
  chat_room_id?: string // Created when both accept
  accepted_by_both: boolean
  accepted_by_p1?: boolean
  accepted_by_p2?: boolean
}

interface MarriageGameSession {
  id: string
  room_id: string // Room where game is happening
  status: GameStatus
  participants: GameParticipant[]
  pairs: MarriagePair[]
  created_at: Date
  started_at?: Date
  completed_at?: Date
  min_participants: number // Default: 4
  max_participants: number // Default: 20
}
```

### Hook: useMarriageGame

```typescript
const {
  gameSession,        // Current game session data
  isParticipating,    // Is current user participating?
  joinGame,           // Join the game
  leaveGame,          // Leave the game
  startMatching,      // Start matching (host only)
  acceptMatch,        // Accept your pair
  getUserPair,        // Get user's pair
  canStartGame,       // Check if user can start (is host/moderator)
} = useMarriageGame(roomId)
```

#### Métodos

**joinGame(participant)**
```typescript
// User joins the game
const result = await joinGame({
  user_id: 'user123',
  username: 'João Silva',
  avatar_url: 'https://...',
  age: 28,
  city: 'São Paulo',
  bio: 'Gamer e músico',
  joined_at: new Date()
})
// result: { success: boolean, error?: string }
```

**leaveGame(userId)**
```typescript
// User leaves before matching starts
const result = await leaveGame('user123')
// result: { success: boolean }
```

**startMatching()**
```typescript
// Host/moderator starts the matching process
const result = await startMatching()
// result: { success: boolean, pairs?: MarriagePair[], error?: string }

// Process:
// 1. Check minimum participants (>= 4)
// 2. Change status to 'matching'
// 3. Animate for 3 seconds
// 4. Shuffle participants randomly
// 5. Create pairs sequentially
// 6. Change status to 'revealing'
// 7. Auto-complete after 30 seconds
```

**acceptMatch(pairId, userId)**
```typescript
// User accepts their pair
const result = await acceptMatch('pair_1', 'user123')
// result: { success: boolean }

// Logic:
// - Updates accepted_by_p1 or accepted_by_p2 to true
// - If both true, sets accepted_by_both = true
// - Creates chat_room_id: `private_${pairId}_${timestamp}`
```

**getUserPair(userId)**
```typescript
// Get the pair for a specific user
const pair = getUserPair('user123')
// Returns: MarriagePair | null
```

### Componentes React

#### 1. MarriageGamePage
Página principal do jogo.

**Rota:** `/marriage-game/:roomId`

**Features:**
- Header com status do jogo
- Stats: Participantes / Mínimo / Máximo
- Fase Waiting: Lista de participantes + botões Join/Start
- Fase Matching: Animação de "porta girando"
- Fase Revealing: Grid de pares + botões de aceitação
- Destaque especial para "Seu Par"
- Modal de confirmação ao entrar

#### 2. ParticipantCard
Card mostrando um participante do jogo.

**Props:**
- `participant`: GameParticipant

**Features:**
- Avatar, nome, idade, cidade
- Bio do usuário
- Hover effect

#### 3. PairCard
Card mostrando um par formado.

**Props:**
- `pair`: MarriagePair
- `currentUserId`: string
- `onAccept`: (pairId) => void

**Features:**
- Emoji de porta 🚪
- Fotos dos dois participantes
- Status de aceitação (✓ Aceitou)
- Botão "❤️ Aceitar Pareamento" (se for seu par)
- Botão "💬 Abrir Chat Privado" (se match confirmado)
- Destaque especial (border magenta) se for seu par

---

## 🗄️ Banco de Dados (Supabase)

### Tabela: marriage_game_sessions

```sql
CREATE TABLE marriage_game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'matching', 'revealing', 'completed')),
  min_participants INT DEFAULT 4,
  max_participants INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id)
);

-- Index para busca por sala
CREATE INDEX idx_game_sessions_room ON marriage_game_sessions(room_id);

-- Index para jogos ativos
CREATE INDEX idx_game_sessions_status ON marriage_game_sessions(status) WHERE status IN ('waiting', 'matching', 'revealing');
```

### Tabela: game_participants

```sql
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES marriage_game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  age INT,
  city VARCHAR(100),
  bio TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, user_id)
);

-- Index para busca por sessão
CREATE INDEX idx_participants_session ON game_participants(session_id);
```

### Tabela: marriage_pairs

```sql
CREATE TABLE marriage_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES marriage_game_sessions(id) ON DELETE CASCADE,
  participant1_id UUID NOT NULL REFERENCES game_participants(id),
  participant2_id UUID NOT NULL REFERENCES game_participants(id),
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_by_p1 BOOLEAN DEFAULT FALSE,
  accepted_by_p2 BOOLEAN DEFAULT FALSE,
  accepted_by_both BOOLEAN GENERATED ALWAYS AS (accepted_by_p1 AND accepted_by_p2) STORED,
  chat_room_id UUID REFERENCES rooms(id), -- Created when both accept

  CONSTRAINT different_participants CHECK (participant1_id != participant2_id)
);

-- Index para busca por sessão
CREATE INDEX idx_pairs_session ON marriage_pairs(session_id);

-- Index para matches confirmados
CREATE INDEX idx_pairs_accepted ON marriage_pairs(accepted_by_both) WHERE accepted_by_both = TRUE;
```

### Row Level Security (RLS)

```sql
-- Sessões: Todos podem ver sessões da sua sala
CREATE POLICY "Users can view sessions in their room"
  ON marriage_game_sessions FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM room_participants
      WHERE user_id = auth.uid()
    )
  );

-- Participantes: Ver participantes de sessões visíveis
CREATE POLICY "Users can view participants"
  ON game_participants FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM marriage_game_sessions
      WHERE room_id IN (
        SELECT room_id FROM room_participants
        WHERE user_id = auth.uid()
      )
    )
  );

-- Pares: Ver pares de sessões visíveis
CREATE POLICY "Users can view pairs"
  ON marriage_pairs FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM marriage_game_sessions
      WHERE room_id IN (
        SELECT room_id FROM room_participants
        WHERE user_id = auth.uid()
      )
    )
  );

-- Pares: Apenas participantes podem aceitar
CREATE POLICY "Participants can accept their pair"
  ON marriage_pairs FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM game_participants
      WHERE id IN (participant1_id, participant2_id)
    )
  );
```

---

## ⚙️ Edge Functions

### 1. create-marriage-game

Cria uma nova sessão de jogo.

**Endpoint:** `supabase/functions/create-marriage-game`

**Input:**
```json
{
  "roomId": "room_uuid",
  "createdBy": "user_uuid"
}
```

**Logic:**
1. Verificar se usuário está na sala
2. Verificar se já existe jogo ativo na sala
3. Criar nova sessão com status 'waiting'
4. Retornar session_id

**Output:**
```json
{
  "success": true,
  "sessionId": "session_uuid"
}
```

### 2. join-marriage-game

Adiciona participante ao jogo.

**Endpoint:** `supabase/functions/join-marriage-game`

**Input:**
```json
{
  "sessionId": "session_uuid",
  "userId": "user_uuid",
  "username": "João Silva",
  "avatarUrl": "https://...",
  "age": 28,
  "city": "São Paulo",
  "bio": "Gamer e músico"
}
```

**Logic:**
1. Verificar se sessão está em 'waiting'
2. Verificar se não atingiu max_participants
3. Verificar se usuário já não está participando
4. Inserir em game_participants
5. Broadcast evento via Supabase Realtime

**Output:**
```json
{
  "success": true
}
```

### 3. start-matching

Inicia o pareamento aleatório.

**Endpoint:** `supabase/functions/start-matching`

**Input:**
```json
{
  "sessionId": "session_uuid",
  "userId": "user_uuid"
}
```

**Logic:**
1. Verificar se usuário é host/moderador
2. Verificar se tem mínimo de participantes
3. Atualizar status para 'matching'
4. Buscar todos participantes
5. Embaralhar aleatoriamente
6. Criar pares (2 em 2)
7. Inserir em marriage_pairs
8. Atualizar status para 'revealing'
9. Agendar auto-complete em 30 segundos (via scheduled job)

**Output:**
```json
{
  "success": true,
  "pairsCount": 5,
  "unpaired": 1
}
```

### 4. accept-match

Usuário aceita seu par.

**Endpoint:** `supabase/functions/accept-match`

**Input:**
```json
{
  "pairId": "pair_uuid",
  "userId": "user_uuid"
}
```

**Logic:**
1. Buscar pair
2. Verificar se userId é participant1 ou participant2
3. Atualizar accepted_by_p1 ou accepted_by_p2
4. Se ambos aceitaram:
   - Criar sala privada (room)
   - Atualizar chat_room_id
   - Adicionar ambos participantes à sala
5. Broadcast evento via Realtime

**Output:**
```json
{
  "success": true,
  "matchConfirmed": true,
  "chatRoomId": "room_uuid"
}
```

### 5. complete-game (Scheduled Job)

Auto-completa jogo após timeout.

**Trigger:** 30 segundos após status = 'revealing'

**Logic:**
```sql
UPDATE marriage_game_sessions
SET
  status = 'completed',
  completed_at = NOW()
WHERE
  status = 'revealing'
  AND started_at < NOW() - INTERVAL '30 seconds';
```

---

## 🎨 Design

### Cores e Temas

- **Primary Color**: Neon Magenta (`#FF00FF`)
- **Accent Color**: Neon Cyan (`#00F0FF`)
- **Success Color**: Green (`#00FF00`)
- **Warning Color**: Yellow (`#FFFF00`)

### Emojis

- 🚪 Porta (ícone principal)
- 💕 Match confirmado
- 🎲 Pareamento aleatório
- ❤️ Aceitar pareamento
- 💬 Chat privado
- 👥 Participantes
- ⏳ Aguardando
- ✓ Aceitou
- 💚 Match confirmado

### Animações

**Matching Phase:**
```css
.spinning-door {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

**Pair Highlight:**
```css
.my-pair {
  border: 2px solid #FF00FF;
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.6);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 255, 0.6); }
  50% { box-shadow: 0 0 30px rgba(255, 0, 255, 1); }
}
```

---

## 🚀 Fluxo de Uso

### Fluxo 1: Jogo Completo (Match Confirmado)

1. 6 usuários estão em uma sala de chat
2. Moderador cria jogo: "🚪 Casamento Atrás da Porta"
3. Usuários clicam "🎮 Participar do Jogo"
4. 6 participantes entram (João, Maria, Pedro, Ana, Carlos, Julia)
5. Moderador clica "🎲 Iniciar Pareamento"
6. Animação de porta girando (3 segundos)
7. Sistema cria 3 pares:
   - Par 1: João + Ana
   - Par 2: Maria + Carlos
   - Par 3: Pedro + Julia
8. Pares são revelados
9. João clica "❤️ Aceitar Pareamento" (com Ana)
10. Ana também clica "❤️ Aceitar Pareamento" (com João)
11. Match confirmado! 💚
12. Chat privado criado: `private_pair1_1738280400`
13. João e Ana podem conversar em sala exclusiva

### Fluxo 2: Um Lado Recusa

1. Par formado: Maria + Carlos
2. Maria clica "❤️ Aceitar Pareamento"
3. Carlos decide não aceitar
4. Status permanece: "⏳ Aguardando Carlos aceitar..."
5. Após 30 segundos, jogo completa
6. Par não confirmado, chat privado não criado

### Fluxo 3: Número Ímpar de Participantes

1. 5 usuários participam
2. Moderador inicia pareamento
3. Sistema cria 2 pares:
   - Par 1: João + Maria
   - Par 2: Pedro + Ana
4. Carlos fica sem par 💔
5. Mensagem: "Carlos ficou sem par nesta rodada"
6. Carlos pode participar do próximo jogo

### Fluxo 4: Insuficientes Participantes

1. Apenas 3 usuários participam
2. Moderador tenta iniciar
3. Sistema bloqueia: "❌ Mínimo de 4 participantes necessários"
4. Aguarda mais pessoas entrarem

---

## 🧪 Testes

### Teste 1: Criar Sessão
```typescript
const { joinGame } = useMarriageGame('room_1')
const result = await joinGame({
  user_id: 'user123',
  username: 'João',
  avatar_url: 'avatar.jpg',
  joined_at: new Date()
})

expect(result.success).toBe(true)
expect(gameSession.participants.length).toBe(1)
```

### Teste 2: Pareamento Aleatório
```typescript
// Add 4 participants
for (let i = 0; i < 4; i++) {
  await joinGame({ user_id: `user${i}`, ... })
}

const result = await startMatching()

expect(result.success).toBe(true)
expect(result.pairs.length).toBe(2)
```

### Teste 3: Aceitação Mútua
```typescript
// Create pair
await startMatching()
const pair = gameSession.pairs[0]

// Participant 1 accepts
await acceptMatch(pair.id, pair.participant1.user_id)
expect(pair.accepted_by_p1).toBe(true)
expect(pair.accepted_by_both).toBe(false)

// Participant 2 accepts
await acceptMatch(pair.id, pair.participant2.user_id)
expect(pair.accepted_by_p2).toBe(true)
expect(pair.accepted_by_both).toBe(true)
expect(pair.chat_room_id).toBeDefined()
```

### Teste 4: Mínimo de Participantes
```typescript
// Only 2 participants
await joinGame({ user_id: 'user1', ... })
await joinGame({ user_id: 'user2', ... })

const result = await startMatching()

expect(result.success).toBe(false)
expect(result.error).toContain('Mínimo de 4 participantes')
```

---

## 📊 Métricas

### KPIs para Monitorar

1. **Taxa de Participação**
   - % de usuários da sala que entram no jogo
   - Meta: 60-80%

2. **Taxa de Aceitação**
   - % de pares que aceitam mutuamente
   - Meta: 40-60%

3. **Engajamento em Chats Privados**
   - Duração média das conversas privadas
   - Meta: 10+ minutos

4. **Retenção**
   - Quantos jogos um usuário participa por semana
   - Meta: 2-3 jogos

5. **Horários de Pico**
   - Quando o jogo é mais jogado
   - Otimizar moderação nesses horários

### Queries SQL

**Jogos por dia:**
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as games_count
FROM marriage_game_sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Taxa de aceitação:**
```sql
SELECT
  COUNT(*) as total_pairs,
  SUM(CASE WHEN accepted_by_both THEN 1 ELSE 0 END) as confirmed_pairs,
  ROUND(100.0 * SUM(CASE WHEN accepted_by_both THEN 1 ELSE 0 END) / COUNT(*), 2) as acceptance_rate
FROM marriage_pairs
WHERE matched_at > NOW() - INTERVAL '30 days';
```

**Usuários mais ativos:**
```sql
SELECT
  user_id,
  username,
  COUNT(DISTINCT session_id) as games_played,
  SUM(CASE WHEN mp.accepted_by_both THEN 1 ELSE 0 END) as matches_confirmed
FROM game_participants gp
LEFT JOIN marriage_pairs mp ON (
  mp.participant1_id = gp.id OR mp.participant2_id = gp.id
)
WHERE gp.joined_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, username
ORDER BY games_played DESC
LIMIT 10;
```

---

## 💡 Melhorias Futuras

### Fase 2: Gamificação Avançada

1. **Badges de Conquistas**
   - "Casamenteiro" - participou de 10 jogos
   - "Match Perfeito" - 5 matches confirmados
   - "Cupido" - iniciou 3 jogos como host

2. **Perfil de Compatibilidade**
   - Tags de interesses (música, games, filmes)
   - Algoritmo de pareamento por compatibilidade (opcional)

3. **Histórico de Matches**
   - Ver todos seus pares anteriores
   - Reencontrar matches antigos

4. **Modos Especiais**
   - "Modo Velocidade" - apenas 10 segundos para aceitar
   - "Modo Mistério" - avatares ocultos até aceitação
   - "Modo Grupo" - pares de 3 ou 4 pessoas

### Fase 3: Monetização

1. **Boost de Visibilidade** (Estrelas)
   - 10⭐ para aparecer primeiro na lista de participantes
   - Aumenta chance de ser pareado com alguém específico

2. **Re-matching** (Estrelas)
   - 20⭐ para forçar novo pareamento
   - Se não gostou do par, pode sortear novamente

3. **Temas Premium**
   - Backgrounds personalizados para a página do jogo
   - Animações especiais de pareamento

---

## 📝 Checklist de Implementação

### Frontend
- [x] Criar interfaces TypeScript (GameParticipant, MarriagePair, MarriageGameSession)
- [x] Criar mock data (sessões e pares)
- [x] Implementar hook useMarriageGame
- [x] Criar componente MarriageGamePage
- [x] Criar componente ParticipantCard
- [x] Criar componente PairCard
- [x] Adicionar rota /marriage-game/:roomId
- [x] Adicionar botão na RoomPage
- [x] Implementar sistema de aceitação
- [x] Auto-complete após 30 segundos
- [x] Modal de confirmação ao entrar

### Backend (Produção)
- [ ] Criar tabela marriage_game_sessions
- [ ] Criar tabela game_participants
- [ ] Criar tabela marriage_pairs
- [ ] Configurar RLS policies
- [ ] Implementar Edge Function create-marriage-game
- [ ] Implementar Edge Function join-marriage-game
- [ ] Implementar Edge Function start-matching
- [ ] Implementar Edge Function accept-match
- [ ] Implementar scheduled job complete-game
- [ ] Supabase Realtime para atualizações live
- [ ] Criar salas privadas para matches confirmados

### Documentação
- [x] Criar /docs/MARRIAGE_GAME.md
- [x] Documentar fluxos de uso
- [x] Documentar schema do banco
- [x] Documentar Edge Functions

---

## 🎉 Conclusão

O jogo **Casamento Atrás da Porta** está totalmente implementado no frontend com mock data.

### Características Principais:

✅ **Pareamento Aleatório** - Algoritmo shuffle para sorteio justo
✅ **Sistema de Aceitação** - Apenas matches mútuos criam chats
✅ **Participação Voluntária** - Opt-in, sem obrigatoriedade
✅ **Auto-Complete** - Jogo finaliza em 30 segundos
✅ **Visual Futurista** - Design Tron com neon magenta
✅ **Responsivo** - Funciona em mobile e desktop

### Próximos Passos:

1. **Testar no navegador** - Acessar `/marriage-game/room_1`
2. **Integração Supabase** - Criar tabelas e Edge Functions
3. **Supabase Realtime** - Atualizações ao vivo para todos participantes
4. **Deploy** - Publicar na Vercel

**Status:** ✅ MVP COMPLETO - Pronto para integração com backend

---

**Documentação por:** Claude Code Assistant
**Data:** 2026-01-30
**Versão:** 1.0
