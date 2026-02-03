# Analytics & Error Tracking - Sistema de Monitoramento

## 📋 Visão Geral

Sistema completo de analytics e error tracking para monitorar o uso da plataforma, rastrear eventos de usuários e capturar erros em produção.

**Status:** ✅ IMPLEMENTADO (Task #34)

---

## 🎯 Funcionalidades

### 1. **Analytics Service** - Rastreamento de Eventos

Sistema para rastrear comportamento de usuários e métricas da plataforma.

#### Tipos de Eventos Rastreados

| Evento | Descrição | Quando Dispara |
|--------|-----------|----------------|
| **page_view** | Visualização de página | Toda vez que usuário acessa uma página |
| **user_signup** | Novo cadastro | Quando usuário completa registro |
| **user_login** | Login | Quando usuário faz login |
| **room_join** | Entrou na sala | Usuário entra em sala de chat |
| **room_create** | Criou sala | Usuário cria nova sala |
| **message_send** | Mensagem enviada | Usuário envia mensagem no chat |
| **video_start** | Vídeo iniciado | Usuário ativa câmera |
| **video_stop** | Vídeo parado | Usuário desativa câmera |
| **star_purchase** | Compra de Estrelas | Compra pacote de Estrelas concluída |
| **service_request** | Solicitação de serviço | Usuário solicita conversa paga |
| **service_complete** | Serviço completo | Sessão paga finalizada |
| **subscription_start** | Assinatura iniciada | Nova assinatura Premium/Basic |
| **subscription_cancel** | Assinatura cancelada | Usuário cancela assinatura |
| **game_start** | Jogo iniciado | Inicia "Casamento Atrás da Porta" |
| **game_complete** | Jogo completo | Jogo finaliza |
| **cabin_enter** | Entrou na cabine | Entra em Cabine Secreta |
| **cabin_leave** | Saiu da cabine | Sai de Cabine Secreta |
| **filter_apply** | Filtro aplicado | Aplica filtro de vídeo |
| **report_create** | Denúncia criada | Cria denúncia de usuário |
| **error_occurred** | Erro ocorrido | Erro acontece na aplicação |

### 2. **Error Logger Service** - Monitoramento de Erros

Sistema para capturar, logar e gerenciar erros.

#### Tipos de Erros

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **javascript_error** | Erro JavaScript | `TypeError`, `ReferenceError` |
| **network_error** | Erro de rede | Falha em fetch API |
| **api_error** | Erro de API | Resposta 400/500 do servidor |
| **render_error** | Erro de renderização | Erro capturado por ErrorBoundary |

#### Níveis de Severidade

- **low**: Erro menor, não afeta UX (ex: imagem não carrega)
- **medium**: Erro moderado, afeta parte da funcionalidade
- **high**: Erro grave, funcionalidade crítica quebrada
- **critical**: Erro crítico, aplicação inutilizável

### 3. **Error Boundary** - Captura de Erros React

Componente que captura erros de renderização e previne crash total da aplicação.

---

## 🏗️ Arquitetura Técnica

### Interfaces TypeScript

```typescript
interface AnalyticsEvent {
  id: string
  type: AnalyticsEventType
  user_id?: string
  timestamp: Date
  properties: Record<string, any>
  session_id?: string
  page_url?: string
  user_agent?: string
}

interface ErrorLog {
  id: string
  error_type: 'javascript_error' | 'network_error' | 'api_error' | 'render_error'
  message: string
  stack?: string
  component?: string
  user_id?: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, any>
  resolved: boolean
}

interface UserSession {
  session_id: string
  user_id?: string
  started_at: Date
  last_active_at: Date
  page_views: number
  events_count: number
  device_info: {
    browser: string
    os: string
    screen_width: number
    screen_height: number
  }
}
```

### AnalyticsService Class

```typescript
class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private enabled: boolean = true

  // Track an event
  track(type: AnalyticsEventType, properties: Record<string, any> = {}, userId?: string): void

  // Track page view
  pageView(page: string, userId?: string): void

  // Identify user (set user properties)
  identify(userId: string, properties: Record<string, any> = {}): void

  // Get all events (for analytics dashboard)
  getEvents(): AnalyticsEvent[]

  // Get events by type
  getEventsByType(type: AnalyticsEventType): AnalyticsEvent[]

  // Get events in time range
  getEventsInRange(startDate: Date, endDate: Date): AnalyticsEvent[]

  // Get event count by type
  getEventStats(): Record<AnalyticsEventType, number>

  // Enable/disable tracking
  setEnabled(enabled: boolean): void
}
```

### ErrorLoggerService Class

```typescript
class ErrorLoggerService {
  private errors: ErrorLog[] = []

  // Log an error
  logError(
    errorType: ErrorLog['error_type'],
    message: string,
    options: {
      stack?: string
      component?: string
      userId?: string
      severity?: ErrorLog['severity']
      context?: Record<string, any>
    } = {}
  ): void

  // Get all errors
  getErrors(): ErrorLog[]

  // Get unresolved errors
  getUnresolvedErrors(): ErrorLog[]

  // Get errors by severity
  getErrorsBySeverity(severity: ErrorLog['severity']): ErrorLog[]

  // Mark error as resolved
  resolveError(errorId: string): void
}
```

---

## 🔧 Como Usar

### 1. Hook: useAnalytics

```typescript
const MyComponent = () => {
  const { track, pageView, identify } = useAnalytics()

  // Track page view
  useEffect(() => {
    pageView('/my-page', userId)
  }, [pageView])

  // Track custom event
  const handleButtonClick = () => {
    track('button_clicked', {
      button_name: 'Subscribe',
      location: 'pricing_page'
    }, userId)
  }

  // Identify user
  useEffect(() => {
    identify(userId, {
      name: 'João Silva',
      email: 'joao@example.com',
      plan: 'premium'
    })
  }, [identify, userId])

  return <button onClick={handleButtonClick}>Subscribe</button>
}
```

### 2. Global Analytics Instance

```typescript
import { analytics } from './analytics'

// Track event directly
analytics.track('video_start', {
  room_id: 'room_1',
  quality: '720p'
}, userId)

// Track page view
analytics.pageView('/rooms', userId)

// Get event statistics
const stats = analytics.getEventStats()
console.log(stats) // { page_view: 150, video_start: 45, ... }
```

### 3. Error Logging

```typescript
import { errorLogger } from './errorLogger'

try {
  // Some code that might throw
  const data = await fetchUserData()
} catch (error) {
  errorLogger.logError('network_error', error.message, {
    severity: 'medium',
    context: { endpoint: '/api/user', userId }
  })
}
```

### 4. Error Boundary

```typescript
// Wrap your app or specific sections
function App() {
  return (
    <ErrorBoundary fallback={<CustomErrorPage />}>
      <YourApp />
    </ErrorBoundary>
  )
}

// Custom fallback UI (optional)
<ErrorBoundary
  fallback={
    <div>
      <h1>Something went wrong</h1>
      <button onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  }
>
  <RiskyComponent />
</ErrorBoundary>
```

---

## 📊 Analytics Dashboard

### Como Acessar

```
http://localhost:3005/analytics
```

### Features

#### 1. **Cards de Resumo**
- Total de Eventos
- Erros Não Resolvidos
- Erros Críticos
- Taxa de Erro (%)

#### 2. **Aba: Estatísticas**
- Grid com contagem de cada tipo de evento
- Visual rápido das métricas principais

#### 3. **Aba: Eventos**
- Lista dos últimos 50 eventos
- Filtro por tipo
- Detalhes JSON de propriedades

#### 4. **Aba: Erros**
- Lista de erros não resolvidos
- Badges de severidade e tipo
- Stack trace expandível
- Contexto JSON expandível
- Botão "Resolver" para marcar como resolvido

---

## 🔌 Integração com Serviços Externos

### PostHog (Recomendado)

```typescript
// Install
npm install posthog-js

// Setup
import posthog from 'posthog-js'

posthog.init('YOUR_API_KEY', {
  api_host: 'https://app.posthog.com'
})

// Modify AnalyticsService
track(type: AnalyticsEventType, properties: Record<string, any>, userId?: string) {
  // ... existing code

  // Send to PostHog
  posthog.capture(type, properties)
}

identify(userId: string, properties: Record<string, any>) {
  posthog.identify(userId, properties)
}
```

### Google Analytics 4

```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

```typescript
// Modify AnalyticsService
track(type: AnalyticsEventType, properties: Record<string, any>, userId?: string) {
  // ... existing code

  // Send to GA4
  if (window.gtag) {
    window.gtag('event', type, properties)
  }
}
```

### Sentry (Error Tracking)

```typescript
// Install
npm install @sentry/react

// Setup
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: 'production',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
})

// Modify ErrorLoggerService
logError(errorType, message, options) {
  // ... existing code

  // Send to Sentry
  Sentry.captureException(new Error(message), {
    tags: {
      error_type: errorType,
      component: options.component,
      severity: options.severity
    },
    extra: options.context
  })
}

// Wrap App with Sentry ErrorBoundary
export default Sentry.withErrorBoundary(App, {
  fallback: <ErrorFallback />,
  showDialog: true
})
```

---

## 📈 Métricas Importantes

### KPIs para Monitorar

1. **Engajamento**
   - DAU (Daily Active Users)
   - MAU (Monthly Active Users)
   - Session Duration
   - Pages per Session

2. **Conversão**
   - Signup Rate
   - Free → Premium Conversion
   - Star Purchase Rate
   - Service Completion Rate

3. **Retenção**
   - Day 1 Retention
   - Day 7 Retention
   - Day 30 Retention
   - Churn Rate

4. **Performance**
   - Page Load Time
   - Error Rate
   - API Response Time
   - Video Connection Success Rate

5. **Monetização**
   - ARPU (Average Revenue Per User)
   - LTV (Lifetime Value)
   - CAC (Customer Acquisition Cost)
   - MRR (Monthly Recurring Revenue)

### Queries Úteis

```typescript
// DAU - Daily Active Users
const getDAU = (date: Date) => {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0))
  const endOfDay = new Date(date.setHours(23, 59, 59, 999))

  const events = analytics.getEventsInRange(startOfDay, endOfDay)
  const uniqueUsers = new Set(events.map(e => e.user_id))

  return uniqueUsers.size
}

// Error Rate
const getErrorRate = () => {
  const totalEvents = analytics.getEvents().length
  const errors = errorLogger.getErrors().length

  return (errors / totalEvents) * 100
}

// Most Popular Features
const getPopularFeatures = () => {
  const stats = analytics.getEventStats()

  return Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
}

// Critical Errors
const getCriticalErrors = () => {
  return errorLogger.getErrorsBySeverity('critical')
}
```

---

## 🗄️ Banco de Dados (Supabase)

### Tabela: analytics_events

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  properties JSONB,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
```

### Tabela: error_logs

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  component VARCHAR(100),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  context JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved) WHERE resolved = FALSE;
CREATE INDEX idx_error_logs_created ON error_logs(created_at);
```

### Tabela: user_sessions

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  page_views INT DEFAULT 0,
  events_count INT DEFAULT 0,
  device_info JSONB,
  ended_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_started ON user_sessions(started_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(last_active_at) WHERE ended_at IS NULL;
```

### Row Level Security (RLS)

```sql
-- Analytics Events: Apenas admins podem ver todos
CREATE POLICY "Admins can view all events"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Error Logs: Apenas admins podem ver
CREATE POLICY "Admins can view all errors"
  ON error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins podem resolver erros
CREATE POLICY "Admins can resolve errors"
  ON error_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

---

## ⚙️ Edge Functions

### 1. track-event

Salva evento no banco de dados.

**Endpoint:** `supabase/functions/track-event`

**Input:**
```json
{
  "type": "star_purchase",
  "userId": "user_uuid",
  "properties": {
    "package_id": "pack_4",
    "stars": 1400,
    "amount_brl": 100
  }
}
```

**Logic:**
1. Validar tipo de evento
2. Inserir em analytics_events
3. Atualizar session (page_views++, events_count++)
4. Retornar sucesso

### 2. log-error

Salva erro no banco de dados.

**Endpoint:** `supabase/functions/log-error`

**Input:**
```json
{
  "errorType": "javascript_error",
  "message": "Cannot read property 'map' of undefined",
  "stack": "TypeError: Cannot read...",
  "component": "VideoGrid",
  "userId": "user_uuid",
  "severity": "medium",
  "context": {
    "room_id": "room_1"
  }
}
```

**Logic:**
1. Inserir em error_logs
2. Se severity = 'critical', enviar notificação para admins
3. Enviar para Sentry/LogRocket se configurado
4. Retornar sucesso

### 3. get-analytics-stats (Scheduled)

Gera estatísticas agregadas diárias.

**Schedule:** Roda todo dia às 00:00

**Logic:**
```sql
-- Calcular DAU, MAU, eventos por tipo, etc
INSERT INTO analytics_stats_daily (date, dau, mau, events_by_type, ...)
SELECT
  CURRENT_DATE,
  COUNT(DISTINCT user_id) as dau,
  ...
FROM analytics_events
WHERE created_at >= CURRENT_DATE;
```

---

## 🧪 Testes

### Testar Analytics

```typescript
// Test event tracking
test('should track page view', () => {
  analytics.track('page_view', { page: '/rooms' }, 'user_1')
  const events = analytics.getEvents()

  expect(events).toHaveLength(1)
  expect(events[0].type).toBe('page_view')
  expect(events[0].properties.page).toBe('/rooms')
})

// Test event stats
test('should calculate event stats', () => {
  analytics.track('page_view', {}, 'user_1')
  analytics.track('page_view', {}, 'user_2')
  analytics.track('video_start', {}, 'user_1')

  const stats = analytics.getEventStats()

  expect(stats.page_view).toBe(2)
  expect(stats.video_start).toBe(1)
})
```

### Testar Error Logging

```typescript
test('should log error', () => {
  errorLogger.logError('javascript_error', 'Test error', {
    severity: 'medium',
    component: 'TestComponent'
  })

  const errors = errorLogger.getErrors()

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toBe('Test error')
  expect(errors[0].severity).toBe('medium')
})

test('should mark error as resolved', () => {
  errorLogger.logError('javascript_error', 'Test error')
  const errors = errorLogger.getErrors()
  const errorId = errors[0].id

  errorLogger.resolveError(errorId)

  const resolvedError = errorLogger.getErrors().find(e => e.id === errorId)
  expect(resolvedError?.resolved).toBe(true)
})
```

### Testar Error Boundary

```typescript
import { render, screen } from '@testing-library/react'

const ThrowError = () => {
  throw new Error('Test error')
}

test('should catch error and show fallback', () => {
  render(
    <ErrorBoundary fallback={<div>Error occurred</div>}>
      <ThrowError />
    </ErrorBoundary>
  )

  expect(screen.getByText('Error occurred')).toBeInTheDocument()
})
```

---

## 📋 Checklist de Implementação

### Frontend
- [x] AnalyticsService class
- [x] ErrorLoggerService class
- [x] Hook useAnalytics
- [x] ErrorBoundary component
- [x] AnalyticsDashboard component
- [x] Integração em RoomsPage (page_view)
- [ ] Integração em todas as páginas (page_view)
- [ ] Integração em ações de usuário (track)
- [x] Rota /analytics

### Backend (Produção)
- [ ] Criar tabela analytics_events
- [ ] Criar tabela error_logs
- [ ] Criar tabela user_sessions
- [ ] Configurar RLS policies
- [ ] Implementar Edge Function track-event
- [ ] Implementar Edge Function log-error
- [ ] Implementar scheduled job get-analytics-stats
- [ ] Integração com PostHog/GA4
- [ ] Integração com Sentry

### Documentação
- [x] Criar /docs/ANALYTICS_ERROR_TRACKING.md
- [x] Documentar tipos de eventos
- [x] Documentar uso do hook useAnalytics
- [x] Documentar integração com serviços externos

---

## 🎉 Conclusão

O sistema de Analytics e Error Tracking está implementado com:

✅ **20 tipos de eventos** rastreados
✅ **4 tipos de erros** capturados
✅ **4 níveis de severidade** para erros
✅ **Dashboard completo** para visualização
✅ **Error Boundary** para prevenir crashes
✅ **Hook useAnalytics** para fácil uso
✅ **Integração pronta** para PostHog, GA4, Sentry

### Próximos Passos

1. **Integrar tracking** em todos os componentes
2. **Configurar Supabase** (tabelas e Edge Functions)
3. **Integrar serviço externo** (PostHog recomendado)
4. **Monitorar métricas** em produção
5. **Iterar** com base em dados reais

---

**Documentação por:** Claude Code Assistant
**Data:** 2026-01-30
**Versão:** 1.0
