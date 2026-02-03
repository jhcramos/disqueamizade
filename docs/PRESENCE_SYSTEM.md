# Sistema de Presença em Tempo Real

## 📋 Visão Geral

O sistema de presença rastreia usuários online em tempo real, mostrando:
- ✅ Quem está online globalmente
- ✅ Quem está em cada sala específica
- ✅ Status de vídeo/áudio (câmera ligada/desligada)
- ✅ Se o usuário está transmitindo (broadcasting)
- ✅ Tier de assinatura (Free/Basic/Premium)

## 🏗️ Arquitetura

### Tecnologia: Supabase Realtime Presence

**Por que Supabase Presence?**
- ✅ Sincronização em tempo real (<1 segundo de latência)
- ✅ Suporta até 200 usuários por canal (muito acima do limite de 30 por sala)
- ✅ Detecção automática de desconexão
- ✅ Estado sincronizado entre todos os clientes
- ✅ Sem necessidade de polling ou WebSockets manuais

### Canais de Presença

**1. Canal Global**
- Nome: `global-presence`
- Propósito: Rastrear todos os usuários online na plataforma
- Usado em: HomePage, RoomsPage (sidebar de usuários online)

**2. Canais de Sala**
- Nome: `room:{roomId}` (ex: `room:1`, `room:2`)
- Propósito: Rastrear usuários em uma sala específica
- Usado em: RoomPage, PaidSessionRoomPage

## 🔧 Implementação

### Hook: `usePresence`

```typescript
const usePresence = (roomId?: string) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [isTracking, setIsTracking] = useState(false)

  // Se roomId fornecido, rastreia apenas usuários naquela sala
  // Se não, rastreia todos os usuários online globalmente

  return {
    onlineUsers,      // Lista de usuários online
    isTracking,       // Se está rastreando presença
    updatePresence,   // Atualizar status do usuário atual
    getRoomUserCount, // Contar usuários em sala específica
    getOnlineUserCount, // Contar usuários online totais
  }
}
```

**Uso:**

```typescript
// Global presence (todos os usuários)
const { onlineUsers, getOnlineUserCount } = usePresence()

// Room-specific presence
const { onlineUsers, getRoomUserCount } = usePresence('room-123')
```

### Interface: `PresenceUser`

```typescript
interface PresenceUser {
  id: string                    // User ID
  username: string              // Nome de exibição
  avatar_url: string            // URL do avatar
  subscription_tier: 'free' | 'basic' | 'premium'
  room_id?: string              // ID da sala (se em alguma sala)
  video_enabled?: boolean       // Câmera ligada?
  audio_enabled?: boolean       // Microfone ligado?
  is_broadcasting?: boolean     // Está transmitindo ao vivo?
  online_at: Date               // Timestamp de quando entrou online
}
```

### Componente: `OnlineUsersList`

Lista visual de usuários online com status em tempo real.

**Props:**
- `roomId?: string` - Se fornecido, mostra apenas usuários naquela sala

**Features:**
- ✅ Indicador visual de status (verde = online)
- ✅ Badge de tier (👑 Premium, ⭐ Basic)
- ✅ Ícones de status de mídia (📹 vídeo, 🎤 áudio)
- ✅ Badge "LIVE" para quem está transmitindo
- ✅ Botão "Assistir" para usuários com vídeo ligado
- ✅ Modal para visualizar stream de vídeo (integração LiveKit)

**Uso:**

```tsx
// Global presence
<OnlineUsersList />

// Room-specific
<OnlineUsersList roomId="room-123" />
```

### Componente: `PresenceIndicator`

Indicador compacto mostrando contador de usuários online.

**Props:**
- `roomId?: string` - Se fornecido, conta apenas usuários naquela sala

**Visual:**
```
🟢 12 online
```

**Uso:**

```tsx
// Global
<PresenceIndicator />

// Room-specific
<PresenceIndicator roomId="room-123" />
```

## 🔌 Integração Supabase (Produção)

### Setup do Canal

```typescript
const channel = supabase.channel(roomId ? `room:${roomId}` : 'global-presence')

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    const users = Object.values(state).flat() as PresenceUser[]
    setOnlineUsers(users)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', newPresences)
    // Opcional: Mostrar notificação "X entrou na sala"
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', leftPresences)
    // Opcional: Mostrar notificação "X saiu da sala"
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      // Registrar presença do usuário atual
      await channel.track({
        user_id: currentUser.id,
        username: currentUser.username,
        avatar_url: currentUser.avatar_url,
        subscription_tier: currentUser.subscription_tier,
        room_id: roomId,
        video_enabled: false,
        audio_enabled: false,
        is_broadcasting: false,
        online_at: new Date().toISOString(),
      })
    }
  })
```

### Atualizar Status de Mídia

Quando usuário liga/desliga câmera ou microfone:

```typescript
const updatePresence = async (updates: Partial<PresenceUser>) => {
  await channel.track(updates)
}

// Exemplo: Usuário ligou câmera
updatePresence({ video_enabled: true })

// Exemplo: Usuário começou a transmitir
updatePresence({ is_broadcasting: true, video_enabled: true, audio_enabled: true })
```

### Cleanup

Sempre fazer untrack ao sair da sala ou desmontar componente:

```typescript
useEffect(() => {
  // Setup channel...

  return () => {
    channel.untrack()      // Remove presença do usuário
    channel.unsubscribe()  // Desconecta do canal
  }
}, [roomId])
```

## 🎯 Casos de Uso

### 1. RoomPage - Usuários na Sala

```tsx
const RoomPage = () => {
  const { roomId } = useParams()

  return (
    <div className="flex">
      {/* Sidebar com usuários na sala */}
      <aside className="w-80">
        <OnlineUsersList roomId={roomId} />
      </aside>

      {/* Chat area */}
      <main className="flex-1">
        {/* ... */}
      </main>
    </div>
  )
}
```

### 2. RoomsPage - Usuários Online Globalmente

```tsx
const RoomsPage = () => {
  return (
    <div className="flex">
      {/* Lista de salas */}
      <main className="flex-1">
        {/* ... */}
      </main>

      {/* Sidebar com todos os usuários online */}
      <aside className="w-80">
        <OnlineUsersList />
      </aside>
    </div>
  )
}
```

### 3. Header - Contador Compacto

```tsx
const RoomHeader = ({ roomId }) => {
  return (
    <header>
      <h1>Sala de Chat</h1>
      <PresenceIndicator roomId={roomId} />
    </header>
  )
}
```

### 4. Integração com LiveKit

Quando usuário entra em chamada de vídeo:

```typescript
import { useLocalParticipant } from '@livekit/components-react'

const VideoRoom = ({ roomId }) => {
  const { localParticipant } = useLocalParticipant()
  const { updatePresence } = usePresence(roomId)

  useEffect(() => {
    // Atualizar presença baseado no estado do LiveKit
    const videoEnabled = localParticipant.isCameraEnabled
    const audioEnabled = localParticipant.isMicrophoneEnabled

    updatePresence({
      video_enabled: videoEnabled,
      audio_enabled: audioEnabled,
      is_broadcasting: videoEnabled || audioEnabled,
    })
  }, [localParticipant.isCameraEnabled, localParticipant.isMicrophoneEnabled])

  return <div>{/* LiveKit components */}</div>
}
```

## 📊 Limites e Performance

### Limites do Supabase Realtime

**Por Canal:**
- Máximo de 200 usuários conectados simultaneamente
- Bem acima do limite de 30 usuários por sala

**Por Projeto:**
- Free tier: 100 canais simultâneos
- Pro tier: 500+ canais (aumentável)
- Isso permite 100-500 salas ativas simultaneamente

### Performance

**Latência:**
- Sincronização de presença: <1 segundo
- Evento de join/leave: instantâneo
- Atualização de status: <500ms

**Bandwidth:**
- Presença é transmitida via WebSocket
- ~1-2 KB por atualização de usuário
- Batching automático para múltiplas atualizações

**Battery (Mobile):**
- WebSocket mantido aberto
- Heartbeat a cada 30 segundos
- Reconexão automática em caso de perda

## 🔒 Segurança

### RLS Policies

Não é necessário RLS para Realtime Presence, pois:
- Dados são transmitidos via WebSocket (não via REST API)
- Presença é efêmera (não persistida no banco)
- Dados são públicos (todos podem ver quem está online)

### Validação de Dados

```typescript
// Backend pode validar dados de presença antes de broadcast
channel.track({
  user_id: validateUserId(currentUser.id),
  username: sanitize(currentUser.username),
  // ... outros campos
})
```

## 🧪 Testes

### Teste Local

```typescript
// Mock presence data para desenvolvimento
const mockOnlineUsers: PresenceUser[] = [
  {
    id: 'user-1',
    username: 'Ana Silva',
    avatar_url: 'https://i.pravatar.cc/150?img=1',
    subscription_tier: 'premium',
    room_id: '1',
    video_enabled: true,
    audio_enabled: true,
    is_broadcasting: true,
    online_at: new Date(),
  },
  // ... mais usuários
]
```

### Teste de Stress

```bash
# Simular 100 usuários conectados
for i in {1..100}; do
  node scripts/simulate-presence.js &
done
```

### Teste de Desconexão

1. Abrir sala em múltiplas abas
2. Fechar uma aba abruptamente (sem cleanup)
3. Verificar se usuário é removido após timeout (30s)

## 🚀 Roadmap

### Fase 1 ✅ (Implementado)
- [x] Hook usePresence
- [x] Componente OnlineUsersList
- [x] Componente PresenceIndicator
- [x] Mock data para desenvolvimento
- [x] Integração em RoomPage
- [x] Integração em RoomsPage

### Fase 2 (Próximos Passos)
- [ ] Conectar com Supabase Realtime
- [ ] Persistir última vez online no banco
- [ ] Integração completa com LiveKit
- [ ] Notificações de join/leave
- [ ] Histórico de presença (quem esteve online hoje)

### Fase 3 (Futuro)
- [ ] Status customizado ("Disponível", "Ocupado", "Ausente")
- [ ] Modo invisível (Premium)
- [ ] Ver quem está assistindo meu vídeo
- [ ] Typing indicators no chat
- [ ] Reaction emojis em tempo real

## 📞 Troubleshooting

**Problema:** Usuários não aparecem online
- Verificar se canal está subscribed
- Verificar se `.track()` foi chamado
- Checar logs do Supabase no Dashboard

**Problema:** Latência alta (>2 segundos)
- Verificar conexão de internet
- Checar region do Supabase (preferir região mais próxima)
- Considerar auto-hospedagem do Supabase

**Problema:** Usuário fica "fantasma" após desconexão
- Supabase automaticamente remove após 30s
- Forçar untrack() no beforeunload:
  ```js
  window.addEventListener('beforeunload', () => {
    channel.untrack()
  })
  ```

## 📚 Recursos

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Presence Guide](https://supabase.com/docs/guides/realtime/presence)
- [LiveKit Presence Integration](https://docs.livekit.io/)

---

**Status de Implementação**: ✅ Frontend completo | ⏳ Integração Supabase pendente

**Última atualização**: 2026-01-30
