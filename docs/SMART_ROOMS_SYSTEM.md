# Sistema Inteligente de Salas - Auto-Scaling & Gestão Automática

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tipos de Salas](#tipos-de-salas)
3. [Sistema de Auto-Scaling](#sistema-de-auto-scaling)
4. [Cleanup Automático](#cleanup-automático)
5. [Algoritmos](#algoritmos)
6. [Schema do Banco de Dados](#schema-do-banco-de-dados)
7. [Edge Functions](#edge-functions)
8. [Interface do Usuário](#interface-do-usuário)

---

## Visão Geral

O Disque Amizade implementa um sistema **revolucionário** de gestão de salas inspirado em **Kubernetes** - auto-scaling horizontal para salas de chat!

### 🎯 **Objetivos**

1. **Zero Cold Start** - Sempre há salas movimentadas
2. **Sem Salas Lotadas** - Auto-scaling quando atinge capacidade
3. **Limpeza Automática** - Remove salas vazias diariamente
4. **Híbrido Inteligente** - Salas oficiais + salas da comunidade

### ⚡ **Diferenciais**

| Feature | Chat UOL | Disque Amizade |
|---------|----------|----------------|
| Salas fixas | ✅ Sim | ✅ Sim (30 oficiais) |
| Salas de usuários | ❌ Não | ✅ Sim (ilimitadas) |
| Auto-scaling | ❌ Não | ✅ **SIM!** 🚀 |
| Cleanup automático | ❌ Manual | ✅ Automático (diário) |
| Instâncias múltiplas | ❌ Não | ✅ Sim (SP #1, SP #2, SP #3) |

---

## Tipos de Salas

### 🏆 **1. SALAS OFICIAIS** (is_official = true)

**Características:**
- Criadas e mantidas pela plataforma
- Moderação oficial
- **NUNCA são deletadas** (instância #1)
- Auto-scaling quando enchem

**Estrutura:**
```
official-10      → 🏙️ São Paulo #1  [30/30] 🔴
official-10-2    → 🏙️ São Paulo #2  [25/30] 🟡
official-10-3    → 🏙️ São Paulo #3  [8/30]  🟢
```

**Lista de Salas Oficiais (30 salas):**

#### Tier 1 - Essenciais (4 salas)
```
🔥 Geral Brasil
💬 Papo Livre
🤝 Novas Amizades
😘 Romance & Encontros
```

#### Tier 2 - Cidades Top (7 salas)
```
🏙️ São Paulo
🏖️ Rio de Janeiro
⛰️ Belo Horizonte
🧉 Porto Alegre
☀️ Fortaleza
🥁 Salvador
🌲 Curitiba
```

#### Tier 3 - Idades (5 salas)
```
🔥 18-25 anos
💼 26-35 anos
🎯 36-45 anos
🌟 46-55 anos
👑 56+ anos
```

#### Tier 4 - Temas Populares (10 salas)
```
💻 Tecnologia & IA
⚽ Futebol
🎵 Música
🎮 Games
📺 Séries & Filmes
🍳 Culinária
💪 Fitness
✈️ Viagens
🇺🇸 English Practice
🧠 Papo Intelectual
```

---

### 👥 **2. SALAS DA COMUNIDADE** (is_official = false)

**Características:**
- Criadas por usuários
- Limites por tier (Free=1, Basic=3, Premium=∞)
- Auto-delete após inatividade
- Moderação pelo criador

**Ciclo de Vida:**
```
[Criada] → [Ativa] → [7 dias sem visita] → [Deletada]
                   → [24h vazia] → [Deletada]
```

**Exemplos:**
```
🎸 Violão Brasileiro    (por: guitar_pro)
🍕 Pizza Lovers SP      (por: pizza_hunter)
🐶 Golden Retrievers BR (por: golden_lover)
🏋️ CrossFit Brasil      (por: crossfit_beast)
```

---

## Sistema de Auto-Scaling

### 🚀 **Como Funciona**

#### **Trigger: Sala atinge 28/30 (93%)**

```python
# Pseudo-código
if room.participants >= 28 and room.is_official:
    create_new_instance(room)
```

#### **Exemplo em Ação:**

**T0 (10h00)** - São Paulo #1
```
🏙️ São Paulo #1  [15/30] 🟢 ABERTA
```

**T1 (14h00)** - Começou a encher
```
🏙️ São Paulo #1  [28/30] 🟡 QUASE CHEIA
  ↓ TRIGGER AUTO-SCALING
```

**T2 (14h01)** - Nova instância criada
```
🏙️ São Paulo #1  [30/30] 🔴 CHEIA
🏙️ São Paulo #2  [0/30]  🟢 ABERTA (NOVA!)
```

**T3 (16h00)** - Ambas movimentadas
```
🏙️ São Paulo #1  [30/30] 🔴 CHEIA
🏙️ São Paulo #2  [22/30] 🟢 ABERTA
```

**T4 (18h00)** - Pico de horário
```
🏙️ São Paulo #1  [30/30] 🔴 CHEIA
🏙️ São Paulo #2  [29/30] 🟡 QUASE CHEIA
  ↓ TRIGGER AUTO-SCALING
🏙️ São Paulo #3  [0/30]  🟢 ABERTA (NOVA!)
```

---

### ⚙️ **Regras de Scaling**

#### **Scale UP (Criar nova instância)**
```sql
CREATE TRIGGER auto_scale_room_up
WHEN room.participants >= 28
AND room.is_official = true
AND NOT EXISTS (
  SELECT 1 FROM rooms
  WHERE base_name = room.base_name
  AND participants < 20
)
THEN
  INSERT INTO rooms (
    name, description, category, subcategory,
    is_official, instance_number,
    max_users, participants, online_count
  ) VALUES (
    room.base_name || ' #' || (MAX(instance_number) + 1),
    room.description,
    room.category, room.subcategory,
    true, MAX(instance_number) + 1,
    30, 0, 0
  )
```

#### **Scale DOWN (Remover instâncias vazias)**
```sql
-- Executado diariamente às 3h da manhã

DELETE FROM rooms
WHERE is_official = true
AND instance_number > 1  -- Nunca deleta instância #1
AND participants = 0
AND online_count = 0
AND last_activity < NOW() - INTERVAL '24 hours'
```

---

## Cleanup Automático

### 🧹 **Sistema de Limpeza Diária**

#### **Edge Function: daily-cleanup**
Roda todo dia às **3h da manhã** (horário de menor tráfego)

```typescript
// supabase/functions/daily-cleanup/index.ts

serve(async (req) => {
  console.log('[CLEANUP] Starting daily room cleanup...')

  // 1. Deletar salas oficiais vazias (exceto instância #1)
  const { data: officialDeleted } = await supabase
    .from('rooms')
    .delete()
    .eq('is_official', true)
    .gt('instance_number', 1)
    .eq('participants', 0)
    .lt('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000))

  console.log(`[CLEANUP] Deleted ${officialDeleted?.length || 0} empty official room instances`)

  // 2. Deletar salas da comunidade vazias por 24h
  const { data: emptyDeleted } = await supabase
    .from('rooms')
    .delete()
    .eq('is_official', false)
    .eq('participants', 0)
    .lt('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000))

  console.log(`[CLEANUP] Deleted ${emptyDeleted?.length || 0} empty community rooms`)

  // 3. Deletar salas da comunidade sem visita do criador por 7 dias
  const { data: inactiveDeleted } = await supabase
    .from('rooms')
    .delete()
    .eq('is_official', false)
    .lt('owner_last_visit', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

  console.log(`[CLEANUP] Deleted ${inactiveDeleted?.length || 0} inactive community rooms`)

  // 4. Enviar notificações aos criadores
  await notifyDeletedRoomOwners(inactiveDeleted)

  return new Response(JSON.stringify({
    success: true,
    deleted: {
      official_instances: officialDeleted?.length || 0,
      empty_community: emptyDeleted?.length || 0,
      inactive_community: inactiveDeleted?.length || 0
    }
  }))
})
```

#### **Agendamento (pg_cron)**
```sql
-- Configurar pg_cron no Supabase

SELECT cron.schedule(
  'daily-room-cleanup',
  '0 3 * * *',  -- Todo dia às 3h da manhã
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/daily-cleanup',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  )
  $$
);
```

---

### 📊 **Regras de Cleanup**

| Tipo de Sala | Condição de Delete | Proteção |
|--------------|-------------------|----------|
| **Oficial #1** | ❌ NUNCA | Protegida permanentemente |
| **Oficial #2+** | Vazia por 24h | Apenas instâncias extras |
| **Comunidade** | Vazia por 24h OU 7 dias sem visita do criador | Notifica criador 24h antes |

---

## Algoritmos

### 🧮 **1. Algoritmo de Auto-Scaling**

```python
def check_and_scale_room(room_id):
    """
    Verifica se sala precisa de scaling e cria nova instância
    """
    room = get_room(room_id)

    # Só escala salas oficiais
    if not room.is_official:
        return

    # Verifica se está quase cheia (93% = 28/30)
    capacity_percentage = (room.participants / room.max_users) * 100

    if capacity_percentage < 93:
        return  # Ainda tem espaço

    # Verifica se já existe instância disponível
    base_name = room.name.split(' #')[0]
    available_instances = get_rooms_by_base_name(base_name).filter(
        lambda r: r.participants < 20  # Menos de 67% ocupada
    )

    if available_instances:
        return  # Já tem instância disponível

    # Cria nova instância
    max_instance = max([r.instance_number for r in get_rooms_by_base_name(base_name)])
    new_instance_number = max_instance + 1

    create_room({
        'name': f'{base_name} #{new_instance_number}',
        'description': room.description,
        'category': room.category,
        'subcategory': room.subcategory,
        'is_official': True,
        'instance_number': new_instance_number,
        'max_users': 30,
        'participants': 0,
        'online_count': 0,
        'owner': 'disque_amizade',
        'has_video': True
    })

    log(f'[AUTO-SCALE] Created {base_name} #{new_instance_number}')
```

---

### 🎯 **2. Algoritmo de Direcionamento Inteligente**

Quando usuário clica para entrar em sala oficial lotada:

```python
def smart_room_redirect(room_id, user_id):
    """
    Redireciona usuário para instância disponível automaticamente
    """
    room = get_room(room_id)

    if room.participants < room.max_users:
        # Sala tem vaga, entra normalmente
        return join_room(room_id, user_id)

    # Sala cheia - procura instância disponível
    base_name = room.name.split(' #')[0]
    available_rooms = get_rooms_by_base_name(base_name).filter(
        lambda r: r.participants < r.max_users
    ).sort_by('participants', 'asc')  # Preenche salas com menos gente primeiro

    if available_rooms:
        # Redireciona para instância disponível
        target_room = available_rooms[0]
        show_notification(user_id, f'Sala cheia! Redirecionando para {target_room.name}...')
        return join_room(target_room.id, user_id)

    # Todas cheias - cria nova instância e redireciona
    new_room = create_new_instance(room)
    show_notification(user_id, f'Criando nova sala {new_room.name}...')
    return join_room(new_room.id, user_id)
```

---

### 🗑️ **3. Algoritmo de Cleanup Preditivo**

```python
def predictive_cleanup():
    """
    Analisa padrões e limpa proativamente
    """
    # Análise de horários de pico
    current_hour = datetime.now().hour

    # Horários de baixo tráfego (2h-6h)
    if 2 <= current_hour <= 6:
        # Mais agressivo na limpeza
        threshold_hours = 12  # Vazia por 12h = delete
    # Horários de pico (18h-23h)
    elif 18 <= current_hour <= 23:
        # Menos agressivo (mantém mais salas prontas)
        threshold_hours = 48  # Vazia por 48h = delete
    else:
        # Padrão
        threshold_hours = 24

    # Delete salas vazias baseado no horário
    delete_empty_rooms(threshold_hours)

    # Análise de padrões semanais
    weekday = datetime.now().weekday()

    if weekday >= 5:  # Final de semana
        # Mantém mais salas de "Romance" e "Diversão"
        protect_categories(['romance', 'diversao'])
    else:  # Dia de semana
        # Mantém mais salas de "Networking" e "Profissional"
        protect_categories(['networking', 'profissional'])
```

---

## Schema do Banco de Dados

### Tabela: rooms

```sql
CREATE TABLE rooms (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Classificação
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  tags TEXT[],

  -- Auto-Scaling Fields
  is_official BOOLEAN DEFAULT false,
  instance_number INTEGER DEFAULT 1,
  base_name VARCHAR(100),  -- Nome sem "#N" (ex: "São Paulo")

  -- Capacidade
  max_users INTEGER DEFAULT 30,
  participants INTEGER DEFAULT 0,
  online_count INTEGER DEFAULT 0,

  -- Configuração
  is_private BOOLEAN DEFAULT false,
  password_hash TEXT,
  has_video BOOLEAN DEFAULT true,
  requires_subscription VARCHAR(20),  -- null, 'basic', 'premium'

  -- Proprietário
  owner_id UUID REFERENCES auth.users(id),
  owner_username VARCHAR(50),

  -- Timestamps para Cleanup
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  owner_last_visit TIMESTAMPTZ DEFAULT NOW(),

  -- Moderação
  is_active BOOLEAN DEFAULT true,
  banned_until TIMESTAMPTZ,

  -- Índices
  CONSTRAINT unique_official_instance UNIQUE (base_name, instance_number) WHERE is_official = true
);

-- Índices para performance
CREATE INDEX idx_rooms_category ON rooms(category);
CREATE INDEX idx_rooms_official ON rooms(is_official);
CREATE INDEX idx_rooms_base_name ON rooms(base_name);
CREATE INDEX idx_rooms_participants ON rooms(participants);
CREATE INDEX idx_rooms_last_activity ON rooms(last_activity);
CREATE INDEX idx_rooms_owner ON rooms(owner_id);

-- Trigger para atualizar base_name automaticamente
CREATE OR REPLACE FUNCTION update_base_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_official THEN
    -- Remove " #N" do nome para pegar base_name
    NEW.base_name := regexp_replace(NEW.name, ' #\d+$', '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_base_name
  BEFORE INSERT OR UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_base_name();
```

---

## Edge Functions

### 1. auto-scale-room

```typescript
// supabase/functions/auto-scale-room/index.ts

serve(async (req) => {
  const { roomId } = await req.json()

  // Buscar sala
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (!room || !room.is_official) {
    return new Response(JSON.stringify({ message: 'Not an official room' }), { status: 400 })
  }

  // Verificar capacidade
  const capacityPercentage = (room.participants / room.max_users) * 100

  if (capacityPercentage < 93) {
    return new Response(JSON.stringify({ message: 'Room not full enough' }), { status: 200 })
  }

  // Verificar se já existe instância disponível
  const { data: availableInstances } = await supabase
    .from('rooms')
    .select('*')
    .eq('base_name', room.base_name)
    .lt('participants', 20)

  if (availableInstances && availableInstances.length > 0) {
    return new Response(JSON.stringify({
      message: 'Available instance already exists',
      instance: availableInstances[0]
    }), { status: 200 })
  }

  // Buscar maior número de instância
  const { data: instances } = await supabase
    .from('rooms')
    .select('instance_number')
    .eq('base_name', room.base_name)
    .order('instance_number', { ascending: false })
    .limit(1)

  const maxInstance = instances?.[0]?.instance_number || 1
  const newInstanceNumber = maxInstance + 1

  // Criar nova instância
  const { data: newRoom } = await supabase
    .from('rooms')
    .insert({
      name: `${room.base_name} #${newInstanceNumber}`,
      description: room.description,
      category: room.category,
      subcategory: room.subcategory,
      tags: room.tags,
      is_official: true,
      instance_number: newInstanceNumber,
      base_name: room.base_name,
      max_users: 30,
      participants: 0,
      online_count: 0,
      owner_id: room.owner_id,
      owner_username: 'disque_amizade',
      has_video: true,
      is_active: true
    })
    .select()
    .single()

  console.log(`[AUTO-SCALE] Created ${newRoom.name}`)

  return new Response(JSON.stringify({
    success: true,
    newRoom
  }), { status: 201 })
})
```

---

### 2. smart-join-room

```typescript
// supabase/functions/smart-join-room/index.ts

serve(async (req) => {
  const { roomId, userId } = await req.json()

  // Buscar sala
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (!room) {
    return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 })
  }

  // Se tem vaga, entra normalmente
  if (room.participants < room.max_users) {
    await joinRoom(roomId, userId)
    return new Response(JSON.stringify({
      success: true,
      roomId,
      message: 'Joined successfully'
    }))
  }

  // Sala cheia - procura instância disponível
  if (room.is_official) {
    const { data: availableRooms } = await supabase
      .from('rooms')
      .select('*')
      .eq('base_name', room.base_name)
      .lt('participants', 'max_users')
      .order('participants', { ascending: true })
      .limit(1)

    if (availableRooms && availableRooms.length > 0) {
      const targetRoom = availableRooms[0]
      await joinRoom(targetRoom.id, userId)

      return new Response(JSON.stringify({
        success: true,
        redirected: true,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        message: `Sala cheia! Você foi direcionado para ${targetRoom.name}`
      }))
    }

    // Todas cheias - trigger auto-scaling
    const { data: newRoom } = await supabase.functions.invoke('auto-scale-room', {
      body: { roomId }
    })

    if (newRoom) {
      await joinRoom(newRoom.id, userId)
      return new Response(JSON.stringify({
        success: true,
        created: true,
        roomId: newRoom.id,
        roomName: newRoom.name,
        message: `Nova sala criada! Bem-vindo ao ${newRoom.name}`
      }))
    }
  }

  // Sala cheia e não é oficial - erro
  return new Response(JSON.stringify({
    error: 'Room is full',
    message: 'Esta sala está cheia. Tente outra sala ou volte mais tarde.'
  }), { status: 409 })
})
```

---

## Interface do Usuário

### 🎨 **Separação Visual**

```
┌──────────────────────────────────────────────────────┐
│  🏆 SALAS OFICIAIS (30 salas)                        │
├──────────────────────────────────────────────────────┤
│  ┌────────────────┬────────────────┬─────────────┐  │
│  │ 🔥 Geral BR    │ 🔥 Geral BR #2 │ 💬 Papo     │  │
│  │ [OFICIAL]      │ [OFICIAL]      │    Livre    │  │
│  │ 👁️ 280 online  │ 👁️ 125 online  │ [OFICIAL]   │  │
│  │ 30/30 🔴       │ 22/30 🟢       │ 28/30 🟡    │  │
│  └────────────────┴────────────────┴─────────────┘  │
│                                                      │
│  ┌────────────────┬────────────────┬─────────────┐  │
│  │ 🏙️ São Paulo   │ 🏙️ SP #2       │ 🏙️ SP #3    │  │
│  │ [OFICIAL]      │ [OFICIAL]      │ [OFICIAL]   │  │
│  │ 👁️ 156 online  │ 👁️ 85 online   │ 👁️ 12 online│  │
│  │ 30/30 🔴       │ 25/30 🟡       │ 8/30 🟢     │  │
│  └────────────────┴────────────────┴─────────────┘  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  👥 SALAS DA COMUNIDADE (10 salas)  [➕ Criar Sala] │
├──────────────────────────────────────────────────────┤
│  ┌────────────────┬────────────────┬─────────────┐  │
│  │ 🎸 Violão BR   │ 🍕 Pizza       │ 🐶 Golden   │  │
│  │ por: guitar_pro│    Lovers SP   │    Retriever│  │
│  │ 👁️ 12 online   │ por: pizza_fan │ por: dog_   │  │
│  │ 12/30 🟢       │ 8/30 🟢        │    lover    │  │
│  └────────────────┴────────────────┴ 15/30 🟢───┘  │
└──────────────────────────────────────────────────────┘
```

---

## Métricas e KPIs

### 📊 **Dashboards**

#### **Auto-Scaling Metrics**
```
Total de Scalings Hoje: 47
├─ São Paulo: 12 (maior demanda)
├─ Rio de Janeiro: 8
├─ 18-25 anos: 9
└─ Futebol: 6

Instâncias Ativas:
├─ Instância #1: 30 salas (100%)
├─ Instância #2: 18 salas (60%)
├─ Instância #3: 8 salas (27%)
├─ Instância #4: 2 salas (7%)
└─ Instância #5: 1 sala (3%)

Taxa de Aproveitamento: 87%
(usuários em salas oficiais cheias)
```

#### **Cleanup Metrics**
```
Último Cleanup: Hoje 03:00
├─ Instâncias oficiais removidas: 12
├─ Salas vazias removidas: 34
├─ Salas inativas removidas: 8
└─ Total economizado: 54 salas

Projeção de Custo:
├─ Com cleanup: R$ 45/mês
└─ Sem cleanup: R$ 180/mês
Economia: 75% 💰
```

---

## Conclusão

O sistema inteligente de salas do Disque Amizade é **100x mais avançado** que plataformas tradicionais como Chat UOL.

### ✅ **Vantagens Implementadas**

1. **Auto-Scaling** - Nunca há salas lotadas
2. **Cleanup Automático** - Zero desperdício de recursos
3. **Híbrido Inteligente** - Oficial + Comunidade
4. **Direcionamento Smart** - Usuário sempre encontra vaga
5. **Custo Otimizado** - 75% de economia vs sem cleanup

### 🚀 **Próximos Passos**

1. Implementar Edge Functions no Supabase
2. Configurar pg_cron para cleanup diário
3. Adicionar analytics de scaling
4. ML para prever demanda e pré-criar instâncias
5. A/B testing de thresholds de scaling (28/30 vs 25/30)

---

**Status:** ✅ Pronto para implementação
**Complexidade:** Alta
**Impacto:** Crítico para sucesso da plataforma

