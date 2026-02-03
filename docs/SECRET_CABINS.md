# Cabines Secretas - Sistema de Salas Premium

## 📋 Visão Geral

As **Cabines Secretas** são salas privadas exclusivas para assinantes **Premium**. Elas permitem conversas íntimas em pequenos grupos (2-4 pessoas) com total privacidade e qualidade superior.

**Status:** ✅ IMPLEMENTADO (Task #31)

---

## 🎯 Funcionalidades

### 1. Tipos de Cabines

Existem 10 cabines diferentes com capacidades variadas:

| Número | Nome | Capacidade | Icon | Tema |
|--------|------|------------|------|------|
| 1 | Cabine Rosa | 2 pessoas | 💗 | Romântica |
| 2 | Cabine Azul | 2 pessoas | 💙 | Tranquila |
| 3 | Cabine Verde | 3 pessoas | 💚 | Acolhedora |
| 4 | Cabine Roxa | 4 pessoas | 💜 | Reunião |
| 5 | Cabine Dourada | 2 pessoas | 💛 | VIP |
| 6 | Cabine Prateada | 2 pessoas | 🤍 | Elegante |
| 7 | Cabine Laranja | 3 pessoas | 🧡 | Energética |
| 8 | Cabine Turquesa | 4 pessoas | 🩵 | Conversação |
| 9 | Cabine Coral | 2 pessoas | 🩷 | Aconchegante |
| 10 | Cabine Esmeralda | 3 pessoas | 💎 | Encontros |

### 2. Status das Cabines

Cada cabine pode ter 3 status:

- **🟢 Disponível (available)**: Livre para entrar
- **🔴 Ocupada (occupied)**: Com usuários, mas pode ter vagas
- **🟡 Reservada (reserved)**: Reservada por alguém (expira em 5 min)

### 3. Controle de Acesso

**Apenas assinantes Premium podem:**
- Ver a página de Cabines Secretas
- Entrar em cabines
- Reservar cabines

**Usuários Free/Basic verão:**
- Mensagem de upgrade para Premium
- Explicação do que são as Cabines
- Botão para página de pricing

### 4. Reserva de Cabines

- Usuário Premium pode reservar uma cabine por **5 minutos**
- Durante a reserva, ninguém mais pode entrar
- Timer automático expira a reserva
- Usuário pode cancelar reserva a qualquer momento

### 5. Entrar em Cabine

Quando um usuário entra:
1. Sistema verifica se é Premium
2. Verifica se cabine tem vaga (capacidade)
3. Cria sala LiveKit (se primeira pessoa)
4. Adiciona usuário aos ocupantes
5. Marca cabine como "ocupada"

### 6. Auto-Destruição

Quando o **último usuário sai**:
- Status volta para "disponível"
- Sala LiveKit é destruída
- Histórico de ocupantes é limpo
- Cabine fica pronta para novo uso

---

## 🏗️ Arquitetura Técnica

### Interfaces TypeScript

```typescript
type CabinStatus = 'available' | 'occupied' | 'reserved'
type CabinCapacity = 2 | 3 | 4

interface CabinOccupant {
  user_id: string
  username: string
  avatar_url: string
  joined_at: Date
  is_broadcasting: boolean
}

interface SecretCabin {
  id: string
  number: number // 1-10
  name: string
  description: string
  capacity: CabinCapacity
  status: CabinStatus
  occupants: CabinOccupant[]
  room_id?: string // LiveKit room ID
  reserved_by?: string
  reserved_until?: Date
  occupied_since?: Date
  icon: string
}
```

### Hook: useSecretCabins

```typescript
const {
  cabins,                    // Array de todas as cabines
  currentCabin,              // Cabine atual do usuário
  getAvailableCabins,        // Retorna cabines disponíveis
  getOccupiedCabins,         // Retorna cabines ocupadas
  getReservedCabins,         // Retorna cabines reservadas
  getCabinById,              // Busca cabine por ID
  canAccessCabins,           // Verifica se usuário é Premium
  reserveCabin,              // Reserva uma cabine
  enterCabin,                // Entra em uma cabine
  leaveCabin,                // Sai de uma cabine
  cancelReservation,         // Cancela reserva
} = useSecretCabins(userTier)
```

#### Métodos

**reserveCabin(cabinId, userId, durationMinutes)**
```typescript
// Reserva uma cabine por N minutos (padrão: 5)
const result = await reserveCabin('cabin_1', 'user123', 5)
// result: { success: boolean, cabin?: SecretCabin, error?: string }
```

**enterCabin(cabinId, userId, username, avatarUrl)**
```typescript
// Entra em uma cabine
const result = await enterCabin('cabin_1', 'user123', 'João', 'avatar.jpg')
// result: { success: boolean, cabin?: SecretCabin, roomId?: string, error?: string }
```

**leaveCabin(cabinId, userId)**
```typescript
// Sai de uma cabine
const result = await leaveCabin('cabin_1', 'user123')
// result: { success: boolean }
```

**cancelReservation(cabinId, userId)**
```typescript
// Cancela reserva de uma cabine
const result = await cancelReservation('cabin_1', 'user123')
// result: { success: boolean, error?: string }
```

### Componentes React

#### 1. SecretCabinsPage
Página principal que lista todas as cabines.

**Features:**
- Filtros: Todas / Disponíveis / Ocupadas
- Stats: Contadores de cabines por status
- Grid responsivo de CabinCard
- Proteção: Redireciona Free/Basic para upgrade

**Rota:** `/secret-cabins`

#### 2. CabinCard
Card individual de cada cabine.

**Props:**
- `cabin`: SecretCabin
- `onEnter`: (cabinId) => void
- `onReserve`: (cabinId) => void
- `userTier`: SubscriptionTier

**Features:**
- Status visual (border color + shadow)
- Lista de ocupantes atuais
- Timer de reserva (se reservada)
- Botões: "Entrar Agora" / "Reservar" / "🔒 Premium Only"

#### 3. CabinRoomPage
Página dentro da cabine (vídeo chamada).

**Features:**
- Header com nome da cabine e ocupantes
- Grid de vídeos dos participantes
- Controles: Mute, Câmera, Filtros
- Chat da cabine
- Botão "Sair da Cabine"

**Rota:** `/cabin/:cabinId`

---

## 🗄️ Banco de Dados (Supabase)

### Tabela: secret_cabins

```sql
CREATE TABLE secret_cabins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INT NOT NULL UNIQUE CHECK (number BETWEEN 1 AND 10),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  capacity INT NOT NULL CHECK (capacity IN (2, 3, 4)),
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  room_id VARCHAR(255), -- LiveKit room ID
  reserved_by UUID REFERENCES profiles(id),
  reserved_until TIMESTAMPTZ,
  occupied_since TIMESTAMPTZ,
  icon VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida por status
CREATE INDEX idx_cabins_status ON secret_cabins(status);

-- Index para reservas expiradas
CREATE INDEX idx_cabins_reserved_until ON secret_cabins(reserved_until) WHERE status = 'reserved';
```

### Tabela: cabin_occupants

```sql
CREATE TABLE cabin_occupants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabin_id UUID NOT NULL REFERENCES secret_cabins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_broadcasting BOOLEAN DEFAULT FALSE,

  UNIQUE(cabin_id, user_id)
);

-- Index para busca por cabine
CREATE INDEX idx_occupants_cabin ON cabin_occupants(cabin_id);

-- Index para busca por usuário
CREATE INDEX idx_occupants_user ON cabin_occupants(user_id);
```

### Row Level Security (RLS)

```sql
-- Cabines: Premium users podem ver todas
CREATE POLICY "Premium users can view all cabins"
  ON secret_cabins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.subscription_tier = 'premium'
    )
  );

-- Ocupantes: Usuários podem ver ocupantes de qualquer cabine
CREATE POLICY "Users can view occupants"
  ON cabin_occupants FOR SELECT
  USING (true);

-- Ocupantes: Apenas o próprio usuário pode se adicionar
CREATE POLICY "Users can insert themselves"
  ON cabin_occupants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ocupantes: Apenas o próprio usuário pode se remover
CREATE POLICY "Users can delete themselves"
  ON cabin_occupants FOR DELETE
  USING (auth.uid() = user_id);
```

---

## ⚙️ Edge Functions

### 1. reserve-cabin

Reserva uma cabine por N minutos.

**Endpoint:** `supabase/functions/reserve-cabin`

**Input:**
```json
{
  "cabinId": "cabin_1",
  "userId": "uuid",
  "durationMinutes": 5
}
```

**Logic:**
1. Verificar se usuário é Premium
2. Verificar se cabine está disponível
3. Atualizar status para "reserved"
4. Definir reserved_by e reserved_until
5. Retornar sucesso

**Output:**
```json
{
  "success": true,
  "cabin": { ...cabinData }
}
```

### 2. enter-cabin

Entra em uma cabine e cria sala LiveKit.

**Endpoint:** `supabase/functions/enter-cabin`

**Input:**
```json
{
  "cabinId": "cabin_1",
  "userId": "uuid",
  "username": "João Silva",
  "avatarUrl": "https://..."
}
```

**Logic:**
1. Verificar se usuário é Premium
2. Verificar se cabine tem vaga
3. Criar sala LiveKit (se primeira pessoa)
4. Inserir em cabin_occupants
5. Atualizar status cabine para "occupied"
6. Gerar token LiveKit
7. Retornar token e room_id

**Output:**
```json
{
  "success": true,
  "cabin": { ...cabinData },
  "roomId": "livekit_cabin_1",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. leave-cabin

Sai de uma cabine.

**Endpoint:** `supabase/functions/leave-cabin`

**Input:**
```json
{
  "cabinId": "cabin_1",
  "userId": "uuid"
}
```

**Logic:**
1. Remover usuário de cabin_occupants
2. Contar ocupantes restantes
3. Se 0 ocupantes:
   - Marcar status como "available"
   - Destruir sala LiveKit
   - Limpar room_id
4. Retornar sucesso

**Output:**
```json
{
  "success": true
}
```

### 4. expire-cabin-reservations (Cron Job)

Roda a cada 1 minuto para expirar reservas antigas.

**Logic:**
```sql
UPDATE secret_cabins
SET
  status = 'available',
  reserved_by = NULL,
  reserved_until = NULL
WHERE
  status = 'reserved'
  AND reserved_until < NOW();
```

---

## 🎨 Design

### Cores por Status

- **Disponível**: Verde (`border-green-500`, `shadow-[0_0_15px_rgba(0,255,0,0.5)]`)
- **Ocupada**: Vermelho (`border-red-500`, `shadow-[0_0_15px_rgba(255,0,0,0.5)]`)
- **Reservada**: Amarelo (`border-yellow-500`, `shadow-[0_0_15px_rgba(255,255,0,0.5)]`)

### Botões

**Entrar Agora:**
```html
<button className="bg-gradient-to-r from-neon-cyan to-neon-magenta">
  Entrar Agora
</button>
```

**Reservar:**
```html
<button className="border border-neon-cyan text-neon-cyan">
  Reservar (5 min)
</button>
```

**Premium Only (disabled):**
```html
<button disabled className="bg-gray-700 text-gray-400 cursor-not-allowed">
  🔒 Premium Only
</button>
```

### Grid Responsivo

```css
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

- Mobile: 1 coluna
- Tablet: 2 colunas
- Desktop: 3 colunas

---

## 🚀 Fluxo de Uso

### Fluxo 1: Usuário Premium Entra em Cabine Disponível

1. Usuário acessa `/secret-cabins`
2. Vê 10 cabines, algumas disponíveis (🟢)
3. Clica "Entrar Agora" na Cabine Rosa
4. Sistema chama `enterCabin()`
5. Hook atualiza estado e marca cabine como ocupada
6. Sala LiveKit é criada
7. Usuário é redirecionado para `/cabin/cabin_1`
8. Vídeo chamada inicia

### Fluxo 2: Usuário Reserva Cabine

1. Usuário clica "Reservar (5 min)" na Cabine Azul
2. Sistema chama `reserveCabin()`
3. Cabine fica amarela (🟡 Reservada)
4. Timer de 5 minutos inicia
5. Usuário pode entrar a qualquer momento
6. Após 5 min, reserva expira automaticamente

### Fluxo 3: Segunda Pessoa Entra em Cabine Ocupada

1. Cabine Roxa está ocupada (1/4 pessoas)
2. Usuário clica "Entrar Agora"
3. Sistema verifica capacidade (ainda há vaga)
4. Usuário é adicionado aos ocupantes
5. Agora mostra: Ocupada (2/4)
6. Ambos veem vídeo um do outro

### Fluxo 4: Última Pessoa Sai (Auto-Destruição)

1. Cabine Verde tem 2 pessoas
2. Primeira pessoa sai → Cabine agora com 1 pessoa
3. Segunda pessoa sai → Cabine vazia
4. Sistema automaticamente:
   - Marca status como "disponível"
   - Destrói sala LiveKit
   - Limpa room_id e occupants
5. Cabine volta ao estado original (🟢)

### Fluxo 5: Usuário Free Tenta Acessar

1. Usuário Free acessa `/secret-cabins`
2. Vê mensagem: "🔒 Cabines Secretas são exclusivas para Premium"
3. Explicação do que são as cabines
4. Botão "Assinar Premium" → redireciona para `/pricing`

---

## 🧪 Testes

### Teste 1: Verificar Proteção de Tier
```typescript
// User FREE
const { canAccessCabins } = useSecretCabins('free')
expect(canAccessCabins()).toBe(false)

// User PREMIUM
const { canAccessCabins } = useSecretCabins('premium')
expect(canAccessCabins()).toBe(true)
```

### Teste 2: Reservar Cabine
```typescript
const { reserveCabin } = useSecretCabins('premium')
const result = await reserveCabin('cabin_1', 'user123', 5)

expect(result.success).toBe(true)
expect(result.cabin.status).toBe('reserved')
expect(result.cabin.reserved_by).toBe('user123')
```

### Teste 3: Entrar em Cabine Cheia
```typescript
// Cabine com capacidade 2, já com 2 pessoas
const result = await enterCabin('cabin_1', 'user123', 'João', 'avatar.jpg')

expect(result.success).toBe(false)
expect(result.error).toBe('Cabine está cheia')
```

### Teste 4: Auto-Expiração de Reserva
```typescript
// Reserva com duração de 1 segundo
await reserveCabin('cabin_1', 'user123', 0.0167) // ~1 segundo

// Aguardar 2 segundos
await new Promise(resolve => setTimeout(resolve, 2000))

// Verificar que cabine voltou a disponível
const cabin = getCabinById('cabin_1')
expect(cabin.status).toBe('available')
```

---

## 📊 Métricas

### KPIs para Monitorar

1. **Taxa de Ocupação de Cabines**
   - Quantas cabines estão ocupadas em média
   - Meta: 30-50% durante horário de pico

2. **Duração Média de Uso**
   - Tempo médio que usuários passam em cabines
   - Meta: 15-30 minutos

3. **Taxa de Reserva vs Entrada**
   - Quantos % de reservas viram entradas efetivas
   - Meta: >80%

4. **Capacidade por Cabine**
   - Distribuição: Quantos usam cabines 2p vs 3p vs 4p
   - Otimizar mix de capacidades

5. **Conversão Free → Premium**
   - Quantos usuários Free tentam acessar e depois assinam Premium
   - Meta: 10-15%

### Queries SQL

**Ocupação atual:**
```sql
SELECT
  status,
  COUNT(*) as count
FROM secret_cabins
GROUP BY status;
```

**Tempo médio de uso:**
```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (NOW() - occupied_since)) / 60) as avg_minutes
FROM secret_cabins
WHERE status = 'occupied';
```

**Top cabines mais usadas:**
```sql
SELECT
  name,
  COUNT(*) as times_used
FROM cabin_occupants
JOIN secret_cabins ON secret_cabins.id = cabin_occupants.cabin_id
GROUP BY name
ORDER BY times_used DESC;
```

---

## 💡 Melhorias Futuras

### Fase 2: Funcionalidades Avançadas

1. **Convites Diretos**
   - Premium pode convidar usuários específicos para uma cabine
   - Convite por link temporário

2. **Temas Personalizados**
   - Usuário pode escolher tema da cabine (cores, música de fundo)

3. **Gravação de Sessões** (com consentimento)
   - Gravar conversas para revisão posterior
   - Apenas com consentimento de TODOS os participantes

4. **Cabines Agendadas**
   - Agendar uso de cabine para um horário específico
   - Sistema de calendário

5. **Cabines VIP**
   - Cabines especiais com recursos extras
   - Apenas para top Premium ou pagamento extra

6. **Analytics Pessoais**
   - Usuário vê histórico de cabines usadas
   - Tempo total de uso
   - Pessoas com quem conversou

### Fase 3: Monetização Adicional

1. **Aluguel de Cabine**
   - Usuário paga Estrelas para reserva garantida por 1 hora
   - Ex: 50⭐ para reserva de 1h

2. **Cabines Temáticas Premium**
   - Cabines com backgrounds 3D
   - Música ambiente
   - Iluminação especial

3. **Host de Eventos**
   - Usuários podem criar eventos privados em cabines
   - Cobrar ingressos em Estrelas

---

## 📝 Checklist de Implementação

### Frontend
- [x] Criar interfaces TypeScript (SecretCabin, CabinOccupant)
- [x] Criar mock data (10 cabines)
- [x] Implementar hook useSecretCabins
- [x] Criar componente SecretCabinsPage
- [x] Criar componente CabinCard
- [x] Criar componente CabinRoomPage
- [x] Adicionar rotas /secret-cabins e /cabin/:cabinId
- [x] Adicionar link no header de RoomsPage
- [x] Implementar proteção de tier (Premium only)
- [x] Auto-expiração de reservas (useEffect)

### Backend (Produção)
- [ ] Criar tabela secret_cabins no Supabase
- [ ] Criar tabela cabin_occupants
- [ ] Configurar RLS policies
- [ ] Implementar Edge Function reserve-cabin
- [ ] Implementar Edge Function enter-cabin
- [ ] Implementar Edge Function leave-cabin
- [ ] Implementar Cron Job expire-cabin-reservations
- [ ] Integração LiveKit (criar/destruir rooms)
- [ ] Testes E2E

### Documentação
- [x] Criar /docs/SECRET_CABINS.md
- [x] Documentar fluxos de uso
- [x] Documentar schema do banco
- [x] Documentar Edge Functions

---

## 🎉 Conclusão

O sistema de **Cabines Secretas** está totalmente implementado no frontend com mock data.

### Próximos Passos:

1. **Testar no navegador** - Acessar `/secret-cabins` e testar funcionalidades
2. **Integração com Supabase** - Criar tabelas e Edge Functions
3. **Integração com LiveKit** - Criar salas reais de vídeo
4. **Deploy** - Publicar na Vercel

**Status:** ✅ MVP COMPLETO - Pronto para integração com backend

---

**Documentação por:** Claude Code Assistant
**Data:** 2026-01-30
**Versão:** 1.0
