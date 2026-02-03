# Sistema de Moderação e Denúncias

## Data de Implementação: 2026-01-30

## 📋 Visão Geral

Sistema completo de moderação para manter a plataforma segura, permitindo que usuários denunciem comportamentos inadequados e que moderadores tomem ações apropriadas.

## 🎯 Objetivos

1. **Segurança da Comunidade**: Proteger usuários de assédio, spam, e conteúdo inadequado
2. **Transparência**: Processo claro de denúncia e ação
3. **Eficiência**: Interface intuitiva para moderadores revisarem denúncias
4. **Compliance**: Preparação para LGPD/GDPR com logs de ações

## 🔧 Componentes Implementados

### 1. Sistema de Denúncias (Reports)

#### Tipos de Denúncia (ReportReason)
```typescript
type ReportReason =
  | 'harassment'              // Assédio
  | 'spam'                    // Spam
  | 'nudity'                  // Nudez/Conteúdo Sexual
  | 'hate_speech'             // Discurso de Ódio
  | 'violence'                // Violência
  | 'impersonation'           // Personificação
  | 'inappropriate_content'   // Conteúdo Inapropriado
  | 'other'                   // Outro
```

#### Status de Denúncia
```typescript
type ReportStatus =
  | 'pending'    // Aguardando análise
  | 'reviewing'  // Em análise por moderador
  | 'resolved'   // Resolvida com ação tomada
  | 'dismissed'  // Arquivada sem ação
```

#### Estrutura de Dados
```typescript
interface Report {
  id: string
  reporter_id: string           // Quem denunciou
  reporter_username: string
  reported_user_id: string       // Quem foi denunciado
  reported_username: string
  reported_user_avatar: string
  reason: ReportReason
  description: string            // Descrição detalhada (min 20 chars)
  context?: {
    room_id?: string
    room_name?: string
    message_id?: string
    message_content?: string     // Mensagem denunciada
  }
  status: ReportStatus
  created_at: Date
  reviewed_at?: Date
  reviewed_by?: string           // ID do moderador
  moderator_notes?: string
  action_taken?: ModerationActionType
}
```

### 2. Ações de Moderação

#### Tipos de Ação
```typescript
type ModerationActionType =
  | 'warn'            // ⚠️ Advertência (apenas aviso)
  | 'mute'            // 🔇 Silenciar (24h)
  | 'kick'            // 👢 Expulsar da sala atual
  | 'ban_1day'        // 🚫 Banir 1 dia
  | 'ban_7days'       // 🚫 Banir 7 dias
  | 'ban_permanent'   // ⛔ Banimento Permanente
  | 'none'            // Nenhuma ação (apenas arquivar)
```

#### Estrutura de Ação
```typescript
interface ModerationAction {
  id: string
  user_id: string
  username: string
  action: ModerationActionType
  reason: string
  moderator_id: string
  moderator_name: string
  duration?: number              // Duração em horas (mute, bans temporários)
  expires_at?: Date
  created_at: Date
}
```

### 3. Filtro de Conteúdo

#### Hook useContentFilter
```typescript
const { filterMessage } = useContentFilter()

const result = filterMessage("mensagem com palavrão1")
// result = {
//   clean: "mensagem com ***",
//   flagged: true,
//   matched: ["palavrão1"]
// }
```

**Features:**
- Lista de palavras ofensivas (BAD_WORDS)
- Substituição automática por "***"
- Retorna palavras detectadas
- Case insensitive
- Em produção: carregar de database

### 4. Componentes UI

#### ReportModal

Modal para usuários denunciarem outros usuários.

**Features:**
- 8 categorias de denúncia com ícones
- Descrição detalhada obrigatória (min 20 chars)
- Aviso sobre denúncias falsas
- Preview do usuário denunciado
- Validação antes de envio

**Como Abrir:**
```typescript
const [reportModalOpen, setReportModalOpen] = useState(false)
const [userToReport, setUserToReport] = useState(null)

// Ao clicar em "Denunciar"
setUserToReport({
  id: user.id,
  username: user.username,
  avatar_url: user.avatar_url
})
setReportModalOpen(true)

// Renderizar
<ReportModal
  isOpen={reportModalOpen}
  onClose={() => {
    setReportModalOpen(false)
    setUserToReport(null)
  }}
  reportedUser={userToReport}
/>
```

#### ModerationDashboard

Painel completo para administradores/moderadores.

**Abas:**
- ⏳ **Pendentes**: Denúncias aguardando análise
- 🔍 **Em Análise**: Denúncias sendo revisadas
- ✅ **Resolvidas**: Denúncias com ação tomada
- ⚔️ **Ações Aplicadas**: Histórico de ações ativas

**Funcionalidades:**
- Dashboard com estatísticas em tempo real
- Lista de denúncias filtráveis por status
- Painel de detalhes da denúncia selecionada
- Seleção de ação (warn, mute, kick, ban)
- Campo para notas do moderador
- Botões: Arquivar ou Aplicar Ação
- Histórico de ações com data de expiração

**Acessar:**
```
http://localhost:3002/moderation
```

Também disponível via botão no header:
```
🛡️ Moderação (no RoomsPage header)
```

## 🎨 UI/UX

### Cores e Estilos

**ReportModal:**
- Border vermelho (`border-red-500/50`)
- Background vermelho no header (`bg-red-500/10`)
- Botão de denúncia vermelho
- Aviso em amarelo sobre denúncias falsas

**ModerationDashboard:**
- Border vermelho no header (`border-red-500/30`)
- Stats com cores:
  - Pendentes: `text-red-400`
  - Em Análise: `text-yellow-400`
  - Resolvidas: `text-green-400`
  - Ações Ativas: `text-neon-cyan`
- Glassmorphism em cards
- Hover effects suaves

### Acessibilidade

- Mínimo 20 caracteres na descrição (garante contexto)
- Labels claros em português
- Feedback visual (borders, cores)
- Modais com backdrop escuro
- Botões com cores semânticas

## 📊 Fluxo de Uso

### Para Usuários

1. **Identificar Comportamento Inadequado**
   - Usuário vê outro usuário agindo de forma inapropriada

2. **Abrir Modal de Denúncia**
   - Clica no botão "🚨 Denunciar" no perfil do usuário
   - Exemplo: na lista de usuários online, no modal de vídeo

3. **Preencher Denúncia**
   - Seleciona motivo (8 opções)
   - Escreve descrição detalhada (min 20 chars)
   - Lê aviso sobre denúncias falsas

4. **Enviar Denúncia**
   - Clica "🚨 Enviar Denúncia"
   - Recebe confirmação
   - Denúncia vai para fila de moderação

### Para Moderadores

1. **Acessar Painel**
   - Vai para `/moderation`
   - Vê dashboard com estatísticas

2. **Revisar Denúncias Pendentes**
   - Clica na aba "⏳ Pendentes"
   - Vê lista de denúncias

3. **Selecionar Denúncia**
   - Clica em uma denúncia
   - Painel de detalhes abre à direita

4. **Analisar Contexto**
   - Lê descrição do denunciante
   - Vê contexto (sala, mensagem se aplicável)
   - Verifica histórico do usuário denunciado (futuro)

5. **Decidir Ação**
   - Seleciona ação apropriada:
     - `none` - apenas arquivar (denúncia falsa/duplicada)
     - `warn` - advertência
     - `mute` - silenciar 24h
     - `kick` - expulsar da sala
     - `ban_1day` - banir 1 dia
     - `ban_7days` - banir 7 dias
     - `ban_permanent` - banimento permanente

6. **Adicionar Notas**
   - Escreve justificativa da ação
   - Documenta para auditoria

7. **Aplicar Ação**
   - Clica "Aplicar Ação"
   - Sistema:
     - Cria registro de ação
     - Marca denúncia como resolvida
     - Aplica punição ao usuário (em produção)
     - Mostra confirmação

## 🔒 Segurança e Compliance

### Proteções Anti-Abuso

**Denúncias Falsas:**
- Aviso explícito no modal
- Log de todas as denúncias por usuário
- Futura implementação: limite de denúncias por dia
- Futura implementação: punição para denunciantes abusivos

**Ações de Moderação:**
- Todas as ações são logadas com timestamp
- ID do moderador sempre registrado
- Notas obrigatórias para ações severas (futuro)
- Ações reversíveis (futuro: appeals)

### LGPD/GDPR

**Dados Armazenados:**
- ID dos usuários (denunciante e denunciado)
- Timestamps de criação e revisão
- Motivo e descrição
- Contexto (sala, mensagem)
- Notas do moderador

**Conformidade:**
- ✅ Dados mínimos necessários
- ✅ Logs para auditoria
- ✅ Transparência (usuário sabe que pode ser denunciado)
- 🔜 Exportação de dados (direito LGPD)
- 🔜 Exclusão de dados (direito ao esquecimento)
- 🔜 Política de retenção (180 dias para denúncias resolvidas)

## 🚀 Integração em Produção

### 1. Database Schema (Supabase)

```sql
-- Tabela de denúncias
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reported_user_id UUID NOT NULL REFERENCES profiles(id),
  reason VARCHAR(50) NOT NULL,
  description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
  room_id UUID REFERENCES rooms(id),
  message_id UUID,
  message_content TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  moderator_notes TEXT,
  action_taken VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Índices
  CONSTRAINT status_check CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  CONSTRAINT reason_check CHECK (reason IN ('harassment', 'spam', 'nudity', 'hate_speech', 'violence', 'impersonation', 'inappropriate_content', 'other'))
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- Tabela de ações de moderação
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action VARCHAR(20) NOT NULL,
  reason TEXT NOT NULL,
  moderator_id UUID NOT NULL REFERENCES profiles(id),
  duration_hours INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT action_check CHECK (action IN ('warn', 'mute', 'kick', 'ban_1day', 'ban_7days', 'ban_permanent', 'none'))
);

CREATE INDEX idx_moderation_user ON moderation_actions(user_id);
CREATE INDEX idx_moderation_expires ON moderation_actions(expires_at) WHERE expires_at IS NOT NULL;

-- Tabela de palavras ofensivas (filtro de conteúdo)
CREATE TABLE bad_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word VARCHAR(100) NOT NULL UNIQUE,
  severity VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bad_words_word ON bad_words(LOWER(word));
```

### 2. Row Level Security (RLS)

```sql
-- Qualquer usuário pode criar denúncia
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Apenas moderadores podem ver denúncias
CREATE POLICY "Moderators can view reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Apenas moderadores podem atualizar denúncias
CREATE POLICY "Moderators can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Ações de moderação: apenas moderadores
CREATE POLICY "Moderators can view actions"
  ON moderation_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can create actions"
  ON moderation_actions FOR INSERT
  WITH CHECK (
    auth.uid() = moderator_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );
```

### 3. Edge Functions

#### /functions/moderate-content
Filtro de conteúdo em tempo real para mensagens de chat.

```typescript
// Supabase Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { message } = await req.json()

  // Buscar palavras ofensivas do banco
  const { data: badWords } = await supabase
    .from('bad_words')
    .select('word')

  let cleanMessage = message
  const matched = []

  badWords?.forEach(({ word }) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    if (regex.test(cleanMessage)) {
      matched.push(word)
      cleanMessage = cleanMessage.replace(regex, '***')
    }
  })

  return new Response(JSON.stringify({
    clean: cleanMessage,
    flagged: matched.length > 0,
    matched
  }))
})
```

#### /functions/apply-moderation-action
Aplica ação de moderação ao usuário.

```typescript
serve(async (req) => {
  const { user_id, action, duration_hours } = await req.json()

  // Verificar se requisitante é moderador
  const moderatorId = req.headers.get('user-id')
  const { data: moderator } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', moderatorId)
    .single()

  if (!moderator || !['admin', 'moderator'].includes(moderator.role)) {
    return new Response('Unauthorized', { status: 403 })
  }

  // Aplicar ação
  switch (action) {
    case 'mute':
      await supabase
        .from('profiles')
        .update({
          is_muted: true,
          muted_until: new Date(Date.now() + duration_hours * 60 * 60 * 1000)
        })
        .eq('id', user_id)
      break

    case 'ban_1day':
    case 'ban_7days':
    case 'ban_permanent':
      const banDuration = action === 'ban_permanent'
        ? null
        : new Date(Date.now() + duration_hours * 60 * 60 * 1000)

      await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_until: banDuration
        })
        .eq('id', user_id)
      break

    case 'kick':
      // Remover de todas as salas atuais
      await supabase
        .from('room_participants')
        .delete()
        .eq('user_id', user_id)
      break
  }

  return new Response(JSON.stringify({ success: true }))
})
```

### 4. Middleware de Verificação

Adicionar ao backend para verificar se usuário está banido/silenciado:

```typescript
// Antes de processar mensagens de chat
const checkUserStatus = async (userId: string) => {
  const { data: user } = await supabase
    .from('profiles')
    .select('is_banned, banned_until, is_muted, muted_until')
    .eq('id', userId)
    .single()

  // Verificar ban
  if (user.is_banned) {
    if (!user.banned_until || user.banned_until > new Date()) {
      throw new Error('Usuário banido')
    } else {
      // Ban expirou, remover
      await supabase
        .from('profiles')
        .update({ is_banned: false, banned_until: null })
        .eq('id', userId)
    }
  }

  // Verificar mute
  if (user.is_muted) {
    if (!user.muted_until || user.muted_until > new Date()) {
      throw new Error('Usuário silenciado')
    } else {
      // Mute expirou, remover
      await supabase
        .from('profiles')
        .update({ is_muted: false, muted_until: null })
        .eq('id', userId)
    }
  }
}
```

## 📈 Métricas e Analytics

### KPIs de Moderação

- Total de denúncias (por dia/semana/mês)
- Denúncias pendentes
- Tempo médio de resposta
- Taxa de resolução
- Distribuição por motivo
- Usuários com múltiplas denúncias
- Efetividade das ações (reincidência)

### Dashboard Sugerido

```typescript
// Queries para dashboard
const getModerationStats = async () => {
  // Denúncias por status
  const { data: byStatus } = await supabase
    .from('reports')
    .select('status, count')
    .group('status')

  // Denúncias por motivo (últimos 30 dias)
  const { data: byReason } = await supabase
    .from('reports')
    .select('reason, count')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .group('reason')

  // Tempo médio de resolução
  const { data: avgTime } = await supabase
    .rpc('avg_resolution_time')

  // Top usuários denunciados
  const { data: topReported } = await supabase
    .from('reports')
    .select('reported_user_id, reported_username, count')
    .group('reported_user_id, reported_username')
    .order('count', { ascending: false })
    .limit(10)

  return { byStatus, byReason, avgTime, topReported }
}
```

## ✅ Checklist de Implementação

### Fase 1: MVP (Concluído)
- [x] Tipos e interfaces de dados
- [x] Mock data de denúncias e ações
- [x] Hook useModeration
- [x] Hook useContentFilter
- [x] Componente ReportModal
- [x] Componente ModerationDashboard
- [x] Integração com OnlineUsersList
- [x] Rota /moderation
- [x] Link no header para moderação
- [x] Compilação sem erros

### Fase 2: Database (Pendente)
- [ ] Criar tabelas no Supabase
- [ ] Configurar RLS policies
- [ ] Migrar de mock para dados reais
- [ ] Testes de integração

### Fase 3: Automação (Pendente)
- [ ] Edge Function: moderate-content
- [ ] Edge Function: apply-moderation-action
- [ ] Middleware de verificação de status
- [ ] Cron job para expirar bans/mutes
- [ ] Notificações para moderadores (denúncias novas)

### Fase 4: Analytics (Pendente)
- [ ] Dashboard de métricas
- [ ] Relatórios automáticos
- [ ] Alertas para padrões suspeitos

### Fase 5: Features Avançadas (Futuro)
- [ ] Appeals (usuários contestarem ações)
- [ ] Histórico de infrações no perfil
- [ ] Detecção automática (ML para conteúdo)
- [ ] Moderação distribuída (votação da comunidade)
- [ ] Integração com serviços externos (Perspective API)

## 🎓 Guia para Moderadores

### Boas Práticas

1. **Revisar Rapidamente**
   - Denúncias devem ser revisadas em até 24h
   - Priorizar casos de assédio e violência

2. **Contextualizar**
   - Sempre ler a descrição completa
   - Verificar histórico do usuário
   - Considerar contexto da sala/conversa

3. **Ações Proporcionais**
   - Primeira infração leve: Advertência
   - Spam/publicidade: Mute 24h
   - Assédio: Ban 1-7 dias
   - Conteúdo ilegal: Ban permanente + denúncia às autoridades

4. **Documentar**
   - Sempre adicionar notas do moderador
   - Explicar raciocínio da decisão
   - Facilita auditorias e appeals

5. **Consistência**
   - Tratar casos similares de forma similar
   - Seguir diretrizes da plataforma
   - Consultar outros moderadores em casos complexos

### Situações Comuns

| Situação | Ação Recomendada |
|----------|------------------|
| Primeira vez enviando spam | Advertência + Mute 24h |
| Spam recorrente | Ban 7 dias |
| Assédio sexual | Ban 7 dias (primeira vez) |
| Assédio sexual recorrente | Ban permanente |
| Discurso de ódio | Ban 7 dias |
| Violência/ameaças | Ban permanente |
| Nudez não consensual | Ban permanente |
| Personificação | Advertência + forçar mudança de nome |
| Denúncia claramente falsa | Arquivar + advertência ao denunciante |

## 🌐 Internacionalização

Para expansão futura, considerar:

```typescript
// i18n para motivos de denúncia
const reportReasonLabels = {
  'pt-BR': {
    harassment: 'Assédio',
    spam: 'Spam',
    // ...
  },
  'en-US': {
    harassment: 'Harassment',
    spam: 'Spam',
    // ...
  },
  'es-ES': {
    harassment: 'Acoso',
    spam: 'Correo no deseado',
    // ...
  }
}
```

## 📞 Suporte e Escalação

### Quando Escalar

- Ameaças de violência real
- Conteúdo ilegal (CSAM, terrorismo)
- Violações legais (LGPD, direitos autorais)
- Casos complexos sem precedente

### Canais de Escalação

1. **Suporte Nível 2**: moderadores@disqueamizade.com
2. **Legal**: legal@disqueamizade.com
3. **Autoridades**:
   - Polícia Civil (crimes cibernéticos)
   - SaferNet Brasil
   - Ministério Público

## 🎉 Conclusão

O sistema de moderação está **totalmente funcional** em modo demo e pronto para integração com produção.

**Próximos passos:**
1. Integrar com Supabase (database + Edge Functions)
2. Adicionar sistema de notificações para moderadores
3. Implementar analytics e métricas
4. Treinar equipe de moderação
5. Criar guidelines detalhadas

**Acesso:**
- Painel de Moderação: http://localhost:3002/moderation
- Denunciar usuário: Botão "🚨 Denunciar" em qualquer perfil de usuário

---

**Documentação criada por:** Claude Code Assistant
**Última atualização:** 2026-01-30
