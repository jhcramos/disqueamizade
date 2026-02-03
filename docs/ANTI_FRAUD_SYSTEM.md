# Sistema de Proteção Anti-Fraude

## Data de Implementação: 2026-01-30

## 📋 Visão Geral

Sistema completo de detecção e prevenção de fraudes para proteger a plataforma, usuários e transações financeiras.

## 🎯 Objetivos

1. **Proteger Transações**: Prevenir fraudes em compras de Estrelas e saques
2. **Detectar Padrões**: Identificar comportamentos suspeitos automaticamente
3. **Rate Limiting**: Prevenir abuso através de limitação de ações
4. **Trust Score**: Sistema de pontuação de confiança para usuários
5. **Múltiplas Contas**: Detectar e prevenir operações com contas falsas

## 🔧 Componentes Implementados

### 1. Trust Score (Pontuação de Confiança)

Sistema que calcula um score de 0-100 para cada usuário baseado em múltiplos fatores.

#### Estrutura
```typescript
interface TrustScore {
  user_id: string
  score: number              // 0-100
  level: 'new' | 'low' | 'medium' | 'high' | 'trusted'
  factors: {
    account_age_days: number
    verified_email: boolean
    verified_phone: boolean
    completed_services: number
    positive_reviews: number
    chargebacks: number
    reports_against: number
    reports_made: number
  }
  last_calculated: Date
}
```

#### Níveis de Confiança
- **new** (0-20): Conta nova, sem histórico
- **low** (21-40): Pouco histórico ou sinais negativos
- **medium** (41-60): Usuário comum
- **high** (61-80): Usuário confiável
- **trusted** (81-100): Usuário altamente confiável

#### Fatores que Aumentam o Score
- ✅ Idade da conta (1 ponto por dia até 90 dias)
- ✅ Email verificado (+10 pontos)
- ✅ Telefone verificado (+10 pontos)
- ✅ Serviços completados (+1 ponto cada)
- ✅ Avaliações positivas (+2 pontos cada)

#### Fatores que Diminuem o Score
- ❌ Chargebacks (-20 pontos cada)
- ❌ Denúncias recebidas (-10 pontos cada)
- ❌ Muitas denúncias feitas sem fundamento (-5 pontos cada)

### 2. Rate Limiting

Sistema que limita ações sensíveis para prevenir abuso.

#### Configurações

| Ação | Limite | Janela | Bloqueio |
|------|--------|--------|----------|
| **create_service** | 3 tentativas | 60 min | 60 min |
| **request_session** | 10 tentativas | 60 min | 60 min |
| **buy_stars** | 5 tentativas | 60 min | 60 min |
| **withdraw_stars** | 3 tentativas | 24 horas | 24 horas |
| **send_message** | 50 tentativas | 10 min | 10 min |
| **create_report** | 5 tentativas | 60 min | 60 min |
| **cancel_session** | 3 tentativas | 24 horas | 24 horas |

#### Como Funciona

```typescript
const { checkRateLimit } = useFraudDetection()

// Antes de executar ação sensível
const check = checkRateLimit(userId, 'buy_stars')

if (!check.allowed) {
  alert(check.reason) // "Limite excedido. Tente novamente em X minuto(s)."
  return
}

// Proceder com ação
await buyStars()
```

### 3. Alertas de Fraude

Sistema automatizado que detecta e alerta sobre atividades suspeitas.

#### Tipos de Alerta

1. **multiple_accounts** (Múltiplas Contas)
   - Mesmo IP/Device criando várias contas
   - Detectado via device fingerprinting

2. **rapid_transactions** (Transações Rápidas)
   - Múltiplas compras em curto espaço de tempo
   - Possível fraude de cartão

3. **chargeback_risk** (Risco de Chargeback)
   - Padrão histórico de chargebacks
   - Cartões diferentes, mesmo endereço

4. **unusual_activity** (Atividade Incomum)
   - Ações fora do padrão do usuário
   - Detectado por ML/regras

5. **vpn_detected** (VPN Detectado)
   - Acesso via VPN suspeito
   - Especialmente em transações

6. **fake_profile** (Perfil Falso)
   - Perfil com informações inconsistentes
   - Foto de stock, dados genéricos

7. **refund_abuse** (Abuso de Reembolso)
   - Padrão de solicitar reembolso após usar serviço
   - Múltiplos reembolsos em curto período

8. **service_fraud** (Fraude em Serviço)
   - Prestador aceita sessões mas não comparece
   - Cliente solicita serviço e não paga

9. **star_manipulation** (Manipulação de Estrelas)
   - Transferências suspeitas entre contas
   - Lavagem de Estrelas

#### Níveis de Risco

```typescript
type FraudRiskLevel = 'low' | 'medium' | 'high' | 'critical'
```

- **low**: Monitorar, sem ação imediata
- **medium**: Investigar quando possível
- **high**: Investigar prioritariamente
- **critical**: Ação imediata requerida

### 4. Painel de Detecção de Fraudes

Dashboard completo para admins gerenciarem alertas.

#### Features

**Abas:**
- 🆕 **Novos**: Alertas não investigados
- 🔍 **Investigando**: Em análise
- 🚨 **Críticos**: Risco alto/crítico
- ✅ **Resolvidos**: Já tratados

**Estatísticas:**
- Total de alertas novos
- Alertas em investigação
- Alertas críticos
- Resolvidos nas últimas 24h

**Ações Disponíveis:**
- Marcar como "Investigando"
- Marcar como "Falso Positivo"
- Resolver com notas
- Banir/Suspender conta
- Reembolsar vítimas

**Evidências Exibidas:**
- IPs utilizados
- Device fingerprints
- Transações relacionadas
- Contas relacionadas
- Padrões detectados

## 🎨 Interface Visual

### Cores

**FraudDetectionDashboard:**
- Border laranja (`border-orange-500/30`)
- Alertas com cores por risco:
  - Low: Azul (`text-blue-400`)
  - Medium: Amarelo (`text-yellow-400`)
  - High: Laranja (`text-orange-400`)
  - Critical: Vermelho (`text-red-400`)

### Componentes

**Cards de Alerta:**
```
┌─────────────────────────────────────┐
│ 👤 SuspiciousUser123                │
│                                     │
│ [HIGH] [NEW]                        │
│                                     │
│ Múltiplas Contas                    │
│ Possível operação de múltiplas      │
│ contas do mesmo IP                  │
│                                     │
│ Há 30 minutos                       │
└─────────────────────────────────────┘
```

**Painel de Detalhes:**
- Info do usuário suspeito
- Tipo de alerta e risco
- Descrição detalhada
- Evidências estruturadas
- Ações disponíveis
- Notas de resolução

## 📊 Fluxo de Uso

### Para o Sistema (Automatizado)

1. **Monitoramento Contínuo**
   - Sistema monitora todas as ações sensíveis
   - Aplica rate limiting automaticamente
   - Calcula trust scores em tempo real

2. **Detecção de Padrões**
   - Algoritmos detectam padrões suspeitos
   - Alertas são criados automaticamente
   - Admins são notificados

3. **Bloqueio Preventivo**
   - Ações bloqueadas se exceder rate limit
   - Trust score baixo = restrições automáticas
   - Transações de alto risco = verificação manual

### Para Admins

1. **Acessar Dashboard**
   - Ir para `/fraud-detection`
   - Ver estatísticas em tempo real

2. **Priorizar Alertas**
   - Começar pelos críticos
   - Depois novos
   - Por último, revisar resolvidos

3. **Investigar Alerta**
   - Selecionar alerta da lista
   - Analisar evidências
   - Verificar trust score do usuário
   - Consultar histórico

4. **Tomar Decisão**
   - Falso positivo: Marcar e arquivar
   - Suspeito: Marcar como "Investigando"
   - Confirmado: Resolver com ação

5. **Aplicar Ação**
   - Adicionar notas de resolução
   - Especificar ação tomada
   - Resolver alerta

## 🔒 Proteções Implementadas

### 1. Rate Limiting na Compra de Estrelas

```typescript
// Em BuyStarsModal
const { checkRateLimit } = useFraudDetection()

const handlePurchase = async () => {
  // Check rate limit
  const check = checkRateLimit(userId, 'buy_stars')
  if (!check.allowed) {
    alert(`🚫 ${check.reason}`)
    return
  }

  // Proceder com compra
  await createStarsCheckout(package, userId)
}
```

**Proteção:**
- Máximo 5 compras por hora
- Após limite: bloqueio de 1 hora
- Previne: Fraude de cartão, lavagem de dinheiro

### 2. Detecção de Trust Score Baixo

```typescript
const { detectSuspiciousActivity } = useFraudDetection()

// Ao tentar ação sensível
if (detectSuspiciousActivity(userId, 'withdraw_stars')) {
  // Alerta criado automaticamente
  // Admin notificado
  // Ação pode ser bloqueada
}
```

**Proteção:**
- Usuários novos têm restrições
- Trust score < 40 = ações sensíveis bloqueadas
- Verificação adicional requerida

### 3. Device Fingerprinting (Futuro)

```typescript
// A ser implementado
const fingerprint = await getDeviceFingerprint()

// Detecta múltiplas contas
if (hasSameFingerprint(fingerprint, userId)) {
  createFraudAlert({
    type: 'multiple_accounts',
    risk: 'high',
    evidence: { device_fingerprints: [fingerprint] }
  })
}
```

### 4. Análise de Padrões de Reembolso

```typescript
// Verifica histórico de reembolsos
const refundHistory = await getRefundHistory(userId)

if (refundHistory.length >= 3 && refundHistory.all_after_90_percent_use) {
  createFraudAlert({
    type: 'refund_abuse',
    risk: 'critical',
    evidence: {
      patterns: [
        `${refundHistory.length} reembolsos em 30 dias`,
        'Sempre após consumir 90%+ do serviço'
      ]
    }
  })
}
```

## 🚀 Integração em Produção

### 1. Database Schema

```sql
-- Tabela de trust scores
CREATE TABLE trust_scores (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  level VARCHAR(20) CHECK (level IN ('new', 'low', 'medium', 'high', 'trusted')),
  account_age_days INTEGER DEFAULT 0,
  verified_email BOOLEAN DEFAULT FALSE,
  verified_phone BOOLEAN DEFAULT FALSE,
  completed_services INTEGER DEFAULT 0,
  positive_reviews INTEGER DEFAULT 0,
  chargebacks INTEGER DEFAULT 0,
  reports_against INTEGER DEFAULT 0,
  reports_made INTEGER DEFAULT 0,
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trust_scores_score ON trust_scores(score);
CREATE INDEX idx_trust_scores_level ON trust_scores(level);

-- Tabela de fraud alerts
CREATE TABLE fraud_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  alert_type VARCHAR(50) NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  ip_addresses TEXT[],
  device_fingerprints TEXT[],
  transaction_ids TEXT[],
  related_accounts TEXT[],
  patterns TEXT[],
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  investigated_at TIMESTAMPTZ,
  investigated_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  action_taken VARCHAR(50),

  CONSTRAINT alert_type_check CHECK (
    alert_type IN (
      'multiple_accounts', 'rapid_transactions', 'chargeback_risk',
      'unusual_activity', 'vpn_detected', 'fake_profile',
      'refund_abuse', 'service_fraud', 'star_manipulation'
    )
  ),
  CONSTRAINT risk_level_check CHECK (
    risk_level IN ('low', 'medium', 'high', 'critical')
  ),
  CONSTRAINT status_check CHECK (
    status IN ('new', 'investigating', 'resolved', 'false_positive')
  )
);

CREATE INDEX idx_fraud_alerts_user ON fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_risk ON fraud_alerts(risk_level);
CREATE INDEX idx_fraud_alerts_created ON fraud_alerts(created_at DESC);

-- Tabela de rate limiting
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL,
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, action)
);

CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action);
CREATE INDEX idx_rate_limits_blocked ON rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;
```

### 2. Cálculo Automático de Trust Score

```typescript
// Supabase Edge Function: calculate-trust-score
serve(async (req) => {
  const { user_id } = await req.json()

  // Buscar dados do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user_id)
    .single()

  // Calcular idade da conta
  const account_age_days = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Buscar métricas
  const { data: services } = await supabase
    .from('paid_sessions')
    .select('*')
    .eq('provider_id', user_id)
    .eq('status', 'completed')

  const { data: reviews } = await supabase
    .from('service_reviews')
    .select('rating')
    .eq('reviewed_user_id', user_id)

  const { data: chargebacks } = await supabase
    .from('star_purchases')
    .select('*')
    .eq('user_id', user_id)
    .eq('status', 'chargeback')

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('reported_user_id', user_id)

  // Calcular score
  let score = 50 // Base score

  // Fatores positivos
  score += Math.min(account_age_days, 90) // +1 por dia até 90
  if (profile.email_verified) score += 10
  if (profile.phone_verified) score += 10
  score += services.length * 1 // +1 por serviço
  score += reviews.filter(r => r.rating >= 4).length * 2 // +2 por review positivo

  // Fatores negativos
  score -= chargebacks.length * 20 // -20 por chargeback
  score -= reports.length * 10 // -10 por denúncia

  // Limitar entre 0-100
  score = Math.max(0, Math.min(100, score))

  // Determinar nível
  let level: string
  if (score >= 81) level = 'trusted'
  else if (score >= 61) level = 'high'
  else if (score >= 41) level = 'medium'
  else if (score >= 21) level = 'low'
  else level = 'new'

  // Salvar no banco
  await supabase
    .from('trust_scores')
    .upsert({
      user_id,
      score,
      level,
      account_age_days,
      verified_email: profile.email_verified || false,
      verified_phone: profile.phone_verified || false,
      completed_services: services.length,
      positive_reviews: reviews.filter(r => r.rating >= 4).length,
      chargebacks: chargebacks.length,
      reports_against: reports.length,
      last_calculated: new Date(),
    })

  return new Response(JSON.stringify({ score, level }))
})
```

### 3. Detector de Padrões Suspeitos

```typescript
// Supabase Edge Function: detect-fraud-patterns
serve(async (req) => {
  // Executar periodicamente (cron job)

  // 1. Detectar múltiplas contas do mesmo IP
  const { data: sameIP } = await supabase.rpc('find_same_ip_accounts')

  for (const group of sameIP) {
    if (group.account_count >= 3) {
      await supabase.from('fraud_alerts').insert({
        user_id: group.user_ids[0],
        alert_type: 'multiple_accounts',
        risk_level: 'high',
        description: `${group.account_count} contas detectadas do mesmo IP`,
        ip_addresses: [group.ip],
        related_accounts: group.user_ids,
      })
    }
  }

  // 2. Detectar transações rápidas
  const { data: rapidTxns } = await supabase.rpc('find_rapid_transactions')

  for (const user of rapidTxns) {
    if (user.txn_count >= 5 && user.time_window_minutes <= 10) {
      await supabase.from('fraud_alerts').insert({
        user_id: user.user_id,
        alert_type: 'rapid_transactions',
        risk_level: 'medium',
        description: `${user.txn_count} compras em ${user.time_window_minutes} minutos`,
        transaction_ids: user.txn_ids,
      })
    }
  }

  // 3. Detectar abuso de reembolso
  const { data: refundAbuse } = await supabase.rpc('find_refund_abuse')

  for (const user of refundAbuse) {
    if (user.refund_count >= 3) {
      await supabase.from('fraud_alerts').insert({
        user_id: user.user_id,
        alert_type: 'refund_abuse',
        risk_level: 'critical',
        description: `${user.refund_count} reembolsos solicitados`,
        patterns: user.patterns,
      })
    }
  }

  return new Response(JSON.stringify({ success: true }))
})
```

### 4. Middleware de Verificação

```typescript
// Antes de processar transações
const checkFraudRisk = async (userId: string, action: string) => {
  // 1. Verificar trust score
  const { data: trustScore } = await supabase
    .from('trust_scores')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!trustScore || trustScore.score < 40) {
    // Usuário com baixo score = verificação adicional
    if (['buy_stars', 'withdraw_stars'].includes(action)) {
      throw new Error('Verificação adicional requerida. Entre em contato com suporte.')
    }
  }

  // 2. Verificar rate limit
  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('action', action)
    .single()

  if (rateLimit && rateLimit.blocked_until && new Date(rateLimit.blocked_until) > new Date()) {
    throw new Error('Limite excedido. Tente novamente mais tarde.')
  }

  // 3. Verificar alertas ativos
  const { data: activeAlerts } = await supabase
    .from('fraud_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'new')
    .eq('risk_level', 'critical')

  if (activeAlerts && activeAlerts.length > 0) {
    throw new Error('Conta sob investigação. Entre em contato com suporte.')
  }

  return { allowed: true }
}
```

## 📈 Métricas e KPIs

### Indicadores de Fraude

- **Taxa de Fraude**: (Alertas confirmados / Total de transações) * 100
- **Falsos Positivos**: (Alertas falsos / Total de alertas) * 100
- **Tempo Médio de Investigação**: Tempo entre criação e resolução
- **Valor Protegido**: Soma de transações bloqueadas
- **Chargebacks Evitados**: Número de chargebacks prevenidos

### Dashboard Sugerido

```typescript
// Queries para dashboard
const getFraudMetrics = async () => {
  // Alertas por tipo (últimos 30 dias)
  const { data: byType } = await supabase
    .from('fraud_alerts')
    .select('alert_type, count')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .group('alert_type')

  // Distribuição de trust scores
  const { data: trustDistribution } = await supabase
    .from('trust_scores')
    .select('level, count')
    .group('level')

  // Taxa de resolução
  const { data: resolutionRate } = await supabase.rpc('calculate_resolution_rate')

  // Valor bloqueado (últimos 7 dias)
  const { data: blockedValue } = await supabase.rpc('calculate_blocked_value', {
    days: 7
  })

  return { byType, trustDistribution, resolutionRate, blockedValue }
}
```

## ✅ Checklist de Implementação

### Fase 1: MVP (Concluído)
- [x] Tipos e interfaces de dados
- [x] Mock data de alertas e trust scores
- [x] Hook useFraudDetection
- [x] Sistema de rate limiting
- [x] Cálculo de trust score
- [x] Componente FraudDetectionDashboard
- [x] Integração com BuyStarsModal
- [x] Rota /fraud-detection
- [x] Link no header
- [x] Compilação sem erros

### Fase 2: Database (Pendente)
- [ ] Criar tabelas no Supabase
- [ ] Configurar RLS policies
- [ ] Migrar de mock para dados reais
- [ ] Testes de integração

### Fase 3: Automação (Pendente)
- [ ] Edge Function: calculate-trust-score
- [ ] Edge Function: detect-fraud-patterns
- [ ] Cron job para recálculo de scores
- [ ] Middleware de verificação
- [ ] Notificações para admins

### Fase 4: Detecção Avançada (Pendente)
- [ ] Device fingerprinting
- [ ] IP geolocation
- [ ] Machine Learning para padrões
- [ ] Integração com serviços externos (MaxMind, Sift)

## 🛡️ Boas Práticas

### Para Admins

1. **Priorização**
   - Críticos primeiro
   - Novos em segundo
   - Falsos positivos por último

2. **Investigação**
   - Sempre verificar evidências
   - Consultar histórico do usuário
   - Não confiar apenas em um indicador

3. **Documentação**
   - Sempre adicionar notas de resolução
   - Explicar raciocínio
   - Facilita auditorias

4. **Ações Proporcionais**
   - Primeiro alerta: Monitorar
   - Segundo alerta: Advertir
   - Terceiro alerta: Suspender
   - Confirmado: Banir

### Para Desenvolvedores

1. **Sempre Aplicar Rate Limiting**
   ```typescript
   const check = checkRateLimit(userId, action)
   if (!check.allowed) return
   ```

2. **Verificar Trust Score em Ações Sensíveis**
   ```typescript
   const trustScore = getUserTrustScore(userId)
   if (trustScore.score < 40 && isSensitiveAction) {
     // Requerer verificação adicional
   }
   ```

3. **Logar Atividades Suspeitas**
   ```typescript
   if (detectSuspiciousActivity(userId, action)) {
     console.warn('[FRAUD] Suspicious activity detected')
     // Alerta criado automaticamente
   }
   ```

## 🎯 Casos de Uso

### Caso 1: Compra Rápida de Estrelas

**Cenário:**
Usuário tenta comprar 5 pacotes de R$ 500 em 10 minutos.

**Proteção:**
1. Rate limit bloqueia após 5ª tentativa
2. Alerta de "rapid_transactions" criado
3. Admin investiga
4. Se confirmado fraude: reembolsa e bane

### Caso 2: Múltiplas Contas

**Cenário:**
Mesmo IP cria 3 contas em 1 dia.

**Proteção:**
1. Device fingerprinting detecta similaridade
2. Alerta de "multiple_accounts" criado (risco high)
3. Admin investiga
4. Se confirmado: bane todas as contas

### Caso 3: Abuso de Reembolso

**Cenário:**
Usuário solicita 4 sessões pagas, usa 90% do tempo, sempre pede reembolso.

**Proteção:**
1. Padrão detectado automaticamente
2. Alerta de "refund_abuse" criado (risco critical)
3. Reembolsos futuros bloqueados
4. Admin analisa e bane

### Caso 4: Trust Score Baixo

**Cenário:**
Conta nova (2 dias) tenta sacar R$ 1000.

**Proteção:**
1. Trust score = 25 (low)
2. Ação sensível bloqueada
3. Mensagem: "Verificação adicional requerida"
4. Usuário deve contactar suporte

## 🌐 Integrações Futuras

### Device Fingerprinting
- **Fingerprintjs**: Identificação única de dispositivos
- **Custo**: ~$199/mês (50k identificações)

### IP Intelligence
- **MaxMind GeoIP2**: Geolocalização e detecção de proxy/VPN
- **Custo**: ~$200/mês

### Fraud Detection as a Service
- **Sift**: ML para detecção de fraude
- **Custo**: ~$500/mês (startup plan)

## 📊 ROI Estimado

### Investimento
- **Desenvolvimento**: Já implementado (R$ 0 adicional)
- **Manutenção**: 2h/semana (admin)
- **Ferramentas**: R$ 0-500/mês (inicialmente sem)

### Retorno
- **Chargebacks evitados**: ~R$ 2.000/mês (estimado)
- **Fraudes bloqueadas**: ~R$ 5.000/mês (estimado)
- **Reputação protegida**: Valor inestimável

**ROI:** Positivo desde o primeiro mês!

## 🎉 Conclusão

O sistema anti-fraude está **totalmente funcional** em modo demo e pronto para integração com produção.

**Próximos passos:**
1. Integrar com Supabase (database + Edge Functions)
2. Implementar device fingerprinting
3. Configurar alertas automáticos para admins
4. Treinar equipe de fraude
5. Monitorar métricas

**Acesso:**
- Painel Anti-Fraude: http://localhost:3004/fraud-detection
- Proteção já ativa em: Compra de Estrelas

---

**Documentação criada por:** Claude Code Assistant
**Última atualização:** 2026-01-30
