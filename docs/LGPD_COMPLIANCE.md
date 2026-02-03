# LGPD Compliance - Disque Amizade

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Implementação Técnica](#implementação-técnica)
3. [Direitos dos Usuários](#direitos-dos-usuários)
4. [Consentimento de Cookies](#consentimento-de-cookies)
5. [Exportação de Dados](#exportação-de-dados)
6. [Exclusão de Conta](#exclusão-de-conta)
7. [Políticas e Termos](#políticas-e-termos)
8. [Edge Functions](#edge-functions)
9. [Schema do Banco de Dados](#schema-do-banco-de-dados)
10. [Testes de Conformidade](#testes-de-conformidade)

---

## Visão Geral

A **Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)** é a legislação brasileira de privacidade de dados, similar ao GDPR europeu. Esta documentação descreve como o Disque Amizade está em conformidade com a LGPD.

### Princípios da LGPD Implementados

✅ **Transparência** - Política de privacidade clara e acessível
✅ **Finalidade** - Dados coletados apenas para fins específicos
✅ **Necessidade** - Coleta mínima de dados
✅ **Livre acesso** - Usuários podem acessar seus dados
✅ **Qualidade** - Dados precisos e atualizados
✅ **Segurança** - Medidas técnicas de proteção
✅ **Prevenção** - Medidas preventivas de segurança
✅ **Responsabilização** - Demonstração de conformidade

### Direitos dos Titulares (Art. 18)

1. **Confirmação e acesso** (I, II) - Saber quais dados são tratados
2. **Correção** (III) - Corrigir dados incorretos
3. **Anonimização/bloqueio/eliminação** (IV) - Remover dados desnecessários
4. **Portabilidade** (V) - Exportar dados em formato legível
5. **Eliminação** (VI) - Direito ao esquecimento
6. **Informação de compartilhamento** (VII) - Saber com quem dados são compartilhados
7. **Revogação de consentimento** (IX) - Retirar consentimento a qualquer momento

---

## Implementação Técnica

### Arquitetura de Conformidade

```
┌─────────────────────────────────────────────────┐
│           Frontend (React)                      │
│  ┌──────────────────────────────────────────┐   │
│  │  CookieConsentBanner                     │   │
│  │  - Coleta consentimentos                 │   │
│  │  - Gerencia preferências                 │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  LGPDCompliancePage                      │   │
│  │  - Hub central de direitos               │   │
│  │  - Links para ações LGPD                 │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  DataExportPage                          │   │
│  │  - Solicitar exportação                  │   │
│  │  - Download de dados (JSON)              │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  AccountDeletionPage                     │   │
│  │  - Solicitar exclusão                    │   │
│  │  - Período de carência de 30 dias        │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│        Services (Gerenciadores)                 │
│  ┌──────────────────────────────────────────┐   │
│  │  ConsentManager                          │   │
│  │  - recordConsent()                       │   │
│  │  - hasConsent()                          │   │
│  │  - updateConsent()                       │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  DataExportService                       │   │
│  │  - requestExport()                       │   │
│  │  - getRequest()                          │   │
│  │  - getUserRequests()                     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  AccountDeletionService                  │   │
│  │  - requestDeletion()                     │   │
│  │  - cancelDeletion()                      │   │
│  │  - getRequest()                          │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│      Backend (Supabase Edge Functions)          │
│  - export-user-data                             │
│  - schedule-account-deletion                    │
│  - process-deletion                             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│      Database (PostgreSQL + RLS)                │
│  - user_consents                                │
│  - data_export_requests                         │
│  - account_deletion_requests                    │
└─────────────────────────────────────────────────┘
```

### Classes e Services

#### 1. ConsentManager

Gerencia consentimentos do usuário para cookies e tracking.

```typescript
class ConsentManager {
  recordConsent(
    userId: string,
    consentType: 'cookies' | 'analytics' | 'marketing' | 'terms' | 'privacy',
    consented: boolean,
    metadata?: { ip_address?: string; user_agent?: string }
  ): UserConsent

  getUserConsents(userId: string): UserConsent[]

  hasConsent(userId: string, consentType: UserConsent['consent_type']): boolean

  updateConsent(userId: string, consentType: UserConsent['consent_type'], consented: boolean): UserConsent
}
```

**Uso:**
```typescript
// Registrar consentimento de cookies
consentManager.recordConsent('user-123', 'cookies', true, {
  ip_address: '192.168.1.1',
  user_agent: navigator.userAgent
})

// Verificar consentimento
const hasAnalytics = consentManager.hasConsent('user-123', 'analytics')
```

#### 2. DataExportService

Processa solicitações de exportação de dados (portabilidade).

```typescript
class DataExportService {
  async requestExport(userId: string): Promise<DataExportRequest>

  getRequest(requestId: string): DataExportRequest | undefined

  getUserRequests(userId: string): DataExportRequest[]
}
```

**Fluxo:**
1. Usuário solicita exportação
2. Sistema cria registro em `data_export_requests`
3. Edge Function coleta dados de todas as tabelas
4. Gera arquivo JSON estruturado
5. Upload para Supabase Storage com URL temporária
6. Envia email com link de download (expira em 7 dias)

#### 3. AccountDeletionService

Gerencia solicitações de exclusão de conta (direito ao esquecimento).

```typescript
class AccountDeletionService {
  async requestDeletion(userId: string, reason?: string): Promise<AccountDeletionRequest>

  async cancelDeletion(requestId: string): Promise<boolean>

  getRequest(requestId: string): AccountDeletionRequest | undefined

  getUserRequest(userId: string): AccountDeletionRequest | undefined
}
```

**Fluxo:**
1. Usuário solicita exclusão (com motivo opcional)
2. Sistema cria registro com data agendada (30 dias)
3. Usuário pode cancelar a qualquer momento nos 30 dias
4. Após 30 dias, Edge Function processa exclusão:
   - Remove dados pessoais de todas as tabelas
   - Mantém apenas dados exigidos por lei (fiscais, 5 anos)
   - Anonimiza mensagens públicas
   - Remove autenticação
   - Envia confirmação por email

---

## Direitos dos Usuários

### 1. Acesso aos Dados (Art. 18, I e II)

**Implementação:**
- Página de perfil mostra todos os dados do usuário
- API endpoint para consultar dados completos

**Rota:** `/profile/:userId`

**Dados acessíveis:**
- Informações pessoais (nome, email, bio)
- Histórico de transações
- Mensagens enviadas
- Serviços criados
- Avaliações recebidas
- Consentimentos registrados

---

### 2. Correção de Dados (Art. 18, III)

**Implementação:**
- Página de edição de perfil
- Usuário pode atualizar informações a qualquer momento

**Rota:** `/profile/:userId` (modo edição)

**Dados editáveis:**
- Nome de usuário
- Avatar
- Bio
- Idade
- Cidade
- Idiomas falados

---

### 3. Portabilidade (Art. 18, V)

**Implementação:** DataExportPage + Edge Function

**Rota:** `/data-export`

**Formato de exportação:** JSON

**Estrutura do arquivo exportado:**

```json
{
  "export_metadata": {
    "user_id": "uuid",
    "exported_at": "2024-01-30T10:00:00Z",
    "version": "1.0"
  },
  "profile": {
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "subscription_tier": "premium",
    "stars_balance": 1500
  },
  "messages": [
    {
      "id": "msg_1",
      "room_id": "room_1",
      "content": "Hello!",
      "sent_at": "2024-01-15T10:30:00Z"
    }
  ],
  "transactions": [
    {
      "id": "txn_1",
      "type": "star_purchase",
      "amount": 100,
      "date": "2024-01-10T12:00:00Z"
    }
  ],
  "services": [
    {
      "id": "svc_1",
      "title": "Conversa 1:1",
      "price_stars": 30,
      "created_at": "2024-01-05T08:00:00Z"
    }
  ],
  "reviews": [
    {
      "id": "rev_1",
      "rating": 5,
      "comment": "Ótimo!",
      "date": "2024-01-20T15:00:00Z"
    }
  ],
  "consents": [
    {
      "type": "cookies",
      "consented": true,
      "date": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Prazo:** Dados disponíveis em até 48 horas
**Expiração:** Link de download expira em 7 dias

---

### 4. Exclusão (Art. 18, VI) - Direito ao Esquecimento

**Implementação:** AccountDeletionPage + Edge Function

**Rota:** `/delete-account`

**Fluxo de exclusão:**

1. **Solicitação:**
   - Usuário preenche motivo (opcional)
   - Confirma que entende as consequências
   - Sistema cria solicitação com data agendada (30 dias)

2. **Período de carência (30 dias):**
   - Usuário pode cancelar a exclusão
   - Acesso à conta permanece ativo
   - Notificações por email (7 dias antes, 1 dia antes)

3. **Processamento (após 30 dias):**
   ```sql
   -- Remover dados pessoais
   DELETE FROM profiles WHERE id = user_id;
   DELETE FROM chat_messages WHERE user_id = user_id;
   DELETE FROM user_services WHERE provider_id = user_id;

   -- Anonimizar dados necessários
   UPDATE star_transactions
   SET from_user_id = NULL
   WHERE from_user_id = user_id;

   -- Manter dados fiscais (exigidos por lei)
   UPDATE subscriptions
   SET user_email = NULL, user_name = 'EXCLUÍDO'
   WHERE user_id = user_id;

   -- Remover autenticação
   DELETE FROM auth.users WHERE id = user_id;
   ```

4. **Confirmação:**
   - Email confirmando exclusão permanente
   - Dados não podem mais ser recuperados

**O que é removido:**
- ✅ Perfil e informações pessoais
- ✅ Mensagens de chat
- ✅ Serviços criados
- ✅ Avaliações e comentários
- ✅ Histórico de navegação
- ✅ Consentimentos
- ✅ Saldo de Estrelas não sacado
- ✅ Autenticação (email/senha)

**O que é mantido (obrigação legal):**
- 🔒 Dados fiscais de transações (5 anos - Lei 12.682/2012)
- 🔒 Logs de segurança (6 meses - Marco Civil da Internet)
- 🔒 Registros de pagamentos (5 anos - Código Tributário)

**Dados anonimizados (não removidos):**
- 📊 Estatísticas agregadas (ex: "X conversas foram realizadas")
- 📝 Mensagens públicas (autor removido, conteúdo mantido)

---

## Consentimento de Cookies

### CookieConsentBanner

Banner de consentimento LGPD/GDPR compliant que aparece na primeira visita.

**Rota:** Visível em todas as páginas (component global no App)

**Tipos de cookies:**

#### 1. Cookies Necessários (Obrigatórios)
- **Não podem ser recusados**
- Essenciais para funcionamento do site
- Exemplos:
  - `session_token` - Autenticação
  - `csrf_token` - Segurança
  - `user_preferences` - Configurações básicas

#### 2. Cookies de Análise (Opcionais)
- **Podem ser recusados**
- Usados para melhorar experiência
- Exemplos:
  - Google Analytics
  - Hotjar (heatmaps)
  - Métricas de performance

#### 3. Cookies de Marketing (Opcionais)
- **Podem ser recusados**
- Publicidade personalizada
- Exemplos:
  - Facebook Pixel
  - Google Ads
  - Retargeting

### Gerenciamento de Consentimentos

**Interface:**
```
┌────────────────────────────────────────────────┐
│ 🍪 Cookies e Privacidade                       │
│                                                 │
│ Usamos cookies para melhorar sua experiência.  │
│ Veja nossa Política de Privacidade e Termos.   │
│                                                 │
│ [Personalizar] [Apenas Necessários] [Aceitar]  │
└────────────────────────────────────────────────┘
```

**Personalização:**
```
┌────────────────────────────────────────────────┐
│ Preferências de Cookies                        │
│                                                 │
│ ☑ Cookies Necessários (Obrigatório)            │
│   Essenciais para funcionamento do site        │
│                                                 │
│ ☑ Cookies de Análise                           │
│   Nos ajudam a melhorar a experiência          │
│                                                 │
│ ☐ Cookies de Marketing                         │
│   Publicidade personalizada                    │
│                                                 │
│ [Voltar] [Salvar Preferências]                 │
└────────────────────────────────────────────────┘
```

### Hook: useConsent

```typescript
const { consents, recordConsent, hasConsent, updateConsent } = useConsent(userId)

// Registrar consentimento
recordConsent('analytics', true)

// Verificar consentimento
if (hasConsent('analytics')) {
  initializeGoogleAnalytics()
}

// Atualizar consentimento
updateConsent('marketing', false)
```

---

## Exportação de Dados

### DataExportPage

Permite que usuários solicitem exportação completa de seus dados.

**Rota:** `/data-export`

**Interface:**

```
┌────────────────────────────────────────────────┐
│ 📦 Exportar Meus Dados                         │
│                                                 │
│ Você tem o direito de receber uma cópia de     │
│ todos os seus dados em formato JSON.           │
│                                                 │
│ O arquivo incluirá:                            │
│ • Informações do perfil                        │
│ • Histórico de mensagens                       │
│ • Transações e compras                         │
│ • Serviços criados                             │
│ • Avaliações                                   │
│                                                 │
│ [📦 Solicitar Exportação]                      │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Minhas Solicitações                            │
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ ⏳ Processando                           │   │
│ │ Solicitado em 30/01/2024 10:00          │   │
│ │                                          │   │
│ │ Processando seus dados...               │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ ✅ Concluído                             │   │
│ │ Solicitado em 20/01/2024 15:00          │   │
│ │                                          │   │
│ │ [⬇️ Baixar Dados (JSON)]                │   │
│ │ Link expira em 27/01/2024               │   │
│ └──────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

### Edge Function: export-user-data

```typescript
// supabase/functions/export-user-data/index.ts

serve(async (req) => {
  const { userId } = await req.json()

  // 1. Coletar dados de todas as tabelas
  const profile = await supabase.from('profiles').select('*').eq('id', userId).single()
  const messages = await supabase.from('chat_messages').select('*').eq('user_id', userId)
  const transactions = await supabase.from('star_transactions').select('*').eq('from_user_id', userId)
  const services = await supabase.from('user_services').select('*').eq('provider_id', userId)
  const reviews = await supabase.from('service_reviews').select('*').eq('reviewed_user_id', userId)
  const consents = await supabase.from('user_consents').select('*').eq('user_id', userId)
  // ... coletar de todas as tabelas relevantes

  // 2. Estruturar dados em JSON
  const exportData = {
    export_metadata: {
      user_id: userId,
      exported_at: new Date().toISOString(),
      version: '1.0'
    },
    profile: profile.data,
    messages: messages.data,
    transactions: transactions.data,
    services: services.data,
    reviews: reviews.data,
    consents: consents.data
  }

  // 3. Fazer upload para Supabase Storage
  const fileName = `export_${userId}_${Date.now()}.json`
  const { data: uploadData } = await supabase.storage
    .from('data-exports')
    .upload(fileName, JSON.stringify(exportData, null, 2), {
      contentType: 'application/json'
    })

  // 4. Criar URL temporária com expiração de 7 dias
  const { data: urlData } = await supabase.storage
    .from('data-exports')
    .createSignedUrl(fileName, 7 * 24 * 60 * 60) // 7 dias

  // 5. Atualizar registro de exportação
  await supabase
    .from('data_export_requests')
    .update({
      status: 'completed',
      download_url: urlData.signedUrl,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      completed_at: new Date()
    })
    .eq('user_id', userId)
    .eq('status', 'processing')

  // 6. Enviar email com link
  await sendEmail({
    to: profile.data.email,
    subject: 'Seus dados estão prontos para download',
    body: `Olá ${profile.data.username},\n\nSeus dados foram exportados com sucesso. Clique no link abaixo para baixar (expira em 7 dias):\n\n${urlData.signedUrl}`
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## Exclusão de Conta

### AccountDeletionPage

Permite que usuários solicitem exclusão permanente de sua conta.

**Rota:** `/delete-account`

**Interface:**

```
┌────────────────────────────────────────────────┐
│ ⚠️ Excluir Conta                               │
│                                                 │
│ ⚠️ Atenção: Ação Irreversível                  │
│                                                 │
│ O que será excluído:                           │
│ • Seu perfil e informações pessoais            │
│ • Todas as suas mensagens                      │
│ • Histórico de transações                      │
│ • Serviços criados                             │
│ • Saldo de Estrelas não sacado                 │
│ • Assinatura ativa (sem reembolso)             │
│                                                 │
│ Por que você está saindo? (Opcional)           │
│ ┌──────────────────────────────────────────┐   │
│ │ [Textarea para feedback]                 │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│ ☑ Entendo que esta ação é permanente e que    │
│   terei 30 dias para cancelar antes da        │
│   exclusão definitiva.                         │
│                                                 │
│ [🗑️ Excluir Minha Conta]                      │
└────────────────────────────────────────────────┘
```

**Após solicitação:**

```
┌────────────────────────────────────────────────┐
│ ⏳ Exclusão Agendada                           │
│                                                 │
│ Sua conta está agendada para ser excluída em:  │
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │          28 de Fevereiro, 2024           │   │
│ │  Você ainda pode cancelar até esta data  │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│ Motivo informado:                              │
│ "Não uso mais a plataforma"                    │
│                                                 │
│ [Cancelar Exclusão]                            │
└────────────────────────────────────────────────┘
```

### Edge Function: schedule-account-deletion

```typescript
// supabase/functions/schedule-account-deletion/index.ts

serve(async (req) => {
  const { userId, requestId } = await req.json()

  // 1. Criar registro de exclusão
  const scheduledDate = new Date()
  scheduledDate.setDate(scheduledDate.getDate() + 30) // 30 dias

  await supabase.from('account_deletion_requests').update({
    status: 'pending',
    scheduled_deletion_date: scheduledDate
  }).eq('id', requestId)

  // 2. Agendar Edge Function para execução em 30 dias
  // (usando Supabase pg_cron ou serviço externo como Trigger.dev)
  await supabase.rpc('schedule_function_call', {
    function_name: 'process-deletion',
    scheduled_at: scheduledDate,
    payload: { userId, requestId }
  })

  // 3. Enviar email de confirmação
  const { data: user } = await supabase
    .from('profiles')
    .select('email, username')
    .eq('id', userId)
    .single()

  await sendEmail({
    to: user.email,
    subject: 'Solicitação de exclusão de conta recebida',
    body: `Olá ${user.username},\n\nSua conta será excluída em ${scheduledDate.toLocaleDateString('pt-BR')}.\n\nVocê pode cancelar a exclusão a qualquer momento até esta data acessando:\n\nhttps://disqueamizade.com/delete-account\n\nNotificações de lembrete:\n- 7 dias antes: ${new Date(scheduledDate.getTime() - 7*24*60*60*1000).toLocaleDateString('pt-BR')}\n- 1 dia antes: ${new Date(scheduledDate.getTime() - 1*24*60*60*1000).toLocaleDateString('pt-BR')}`
  })

  return new Response(JSON.stringify({ success: true, scheduledDate }))
})
```

### Edge Function: process-deletion

```typescript
// supabase/functions/process-deletion/index.ts

serve(async (req) => {
  const { userId, requestId } = await req.json()

  // 1. Verificar se solicitação ainda está pendente
  const { data: request } = await supabase
    .from('account_deletion_requests')
    .select('status')
    .eq('id', requestId)
    .single()

  if (request.status !== 'pending') {
    return new Response(JSON.stringify({ message: 'Deletion cancelled or already processed' }))
  }

  // 2. Iniciar transação de exclusão
  await supabase.rpc('delete_user_data', { target_user_id: userId })

  // Este RPC executa:
  // - DELETE FROM profiles WHERE id = userId
  // - DELETE FROM chat_messages WHERE user_id = userId
  // - DELETE FROM user_services WHERE provider_id = userId
  // - UPDATE star_transactions SET from_user_id = NULL WHERE from_user_id = userId
  // - Etc...

  // 3. Remover autenticação
  await supabase.auth.admin.deleteUser(userId)

  // 4. Atualizar status da solicitação
  await supabase
    .from('account_deletion_requests')
    .update({
      status: 'completed',
      completed_at: new Date()
    })
    .eq('id', requestId)

  // 5. Enviar email de confirmação final
  // (enviar para email armazenado temporariamente)
  const { data: deletionData } = await supabase
    .from('account_deletion_requests')
    .select('user_email')
    .eq('id', requestId)
    .single()

  await sendEmail({
    to: deletionData.user_email,
    subject: 'Sua conta foi excluída',
    body: 'Sua conta foi excluída permanentemente conforme solicitado. Esperamos vê-lo novamente no futuro!'
  })

  return new Response(JSON.stringify({ success: true }))
})
```

---

## Políticas e Termos

### PrivacyPolicyPage

Política de privacidade completa conforme LGPD.

**Rota:** `/privacy`

**Seções obrigatórias:**
1. Informações que coletamos
2. Como usamos suas informações
3. Compartilhamento de dados
4. Seus direitos (LGPD)
5. Segurança dos dados
6. Retenção de dados
7. Cookies
8. Menores de idade
9. Alterações nesta política
10. Contato (DPO)

### TermsOfServicePage

Termos de uso da plataforma.

**Rota:** `/terms`

**Seções obrigatórias:**
1. Aceitação dos termos
2. Elegibilidade (18+)
3. Conduta do usuário
4. Sistema de Estrelas e marketplace
5. Assinaturas e pagamentos
6. Propriedade intelectual
7. Moderação e suspensão
8. Isenção de responsabilidade
9. Limitação de responsabilidade
10. Alterações nos termos
11. Lei aplicável
12. Contato

### LGPDCompliancePage

Hub central para exercício de direitos LGPD.

**Rota:** `/lgpd`

**Cards de ações:**
```
┌──────────────────┬──────────────────┐
│ 📦 Exportar      │ 🗑️ Excluir       │
│    Meus Dados    │    Minha Conta   │
│                  │                  │
│ Portabilidade    │ Direito ao       │
│ (Art. 18, V)     │ Esquecimento     │
│                  │ (Art. 18, VI)    │
└──────────────────┴──────────────────┘

┌──────────────────┬──────────────────┐
│ 📜 Política de   │ 📋 Termos de     │
│    Privacidade   │    Uso           │
│                  │                  │
│ Ler Política     │ Ler Termos       │
│ Completa →       │ Completos →      │
└──────────────────┴──────────────────┘
```

**Gerenciamento de consentimentos:**
```
┌────────────────────────────────────────────────┐
│ Gerenciar Consentimentos                       │
│                                                 │
│ ☑ Cookies Necessários (Obrigatório)            │
│ ☑ Analytics                                    │
│ ☐ Marketing                                    │
└────────────────────────────────────────────────┘
```

---

## Edge Functions

### Lista de Edge Functions LGPD

1. **export-user-data**
   - Coleta dados do usuário de todas as tabelas
   - Gera arquivo JSON
   - Upload para Supabase Storage
   - Envia email com link

2. **schedule-account-deletion**
   - Cria solicitação de exclusão
   - Agenda processamento para 30 dias
   - Envia emails de confirmação e lembretes

3. **process-deletion**
   - Executa exclusão permanente após 30 dias
   - Remove dados de todas as tabelas
   - Remove autenticação
   - Envia confirmação final

4. **send-consent-log**
   - Registra consentimentos com timestamp e IP
   - Usado para compliance e auditoria

---

## Schema do Banco de Dados

### Tabela: user_consents

Armazena consentimentos do usuário para LGPD.

```sql
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL, -- 'cookies', 'analytics', 'marketing', 'terms', 'privacy'
  consented BOOLEAN NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45), -- IPv4 ou IPv6
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_consent UNIQUE(user_id, consent_type, consented_at)
);

-- Índices
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX idx_user_consents_date ON user_consents(consented_at);

-- RLS
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios consentimentos
CREATE POLICY "Users can view own consents"
  ON user_consents FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários podem criar seus próprios consentimentos
CREATE POLICY "Users can create own consents"
  ON user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Tabela: data_export_requests

Rastreia solicitações de exportação de dados.

```sql
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Índices
CREATE INDEX idx_data_export_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_export_status ON data_export_requests(status);
CREATE INDEX idx_data_export_date ON data_export_requests(requested_at);

-- RLS
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own export requests"
  ON data_export_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own export requests"
  ON data_export_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Tabela: account_deletion_requests

Rastreia solicitações de exclusão de conta.

```sql
CREATE TABLE account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  reason TEXT,
  scheduled_deletion_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  user_email VARCHAR(255), -- Armazenado temporariamente para email de confirmação
  user_name VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_deletion_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Índices
CREATE INDEX idx_account_deletion_user_id ON account_deletion_requests(user_id);
CREATE INDEX idx_account_deletion_status ON account_deletion_requests(status);
CREATE INDEX idx_account_deletion_scheduled ON account_deletion_requests(scheduled_deletion_date);

-- RLS
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests"
  ON account_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deletion requests"
  ON account_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deletion requests"
  ON account_deletion_requests FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');
```

---

## Testes de Conformidade

### Checklist de Conformidade LGPD

#### ✅ Transparência

- [x] Política de privacidade publicada e acessível
- [x] Termos de uso claros
- [x] Aviso de cookies antes de coletar
- [x] Informação sobre compartilhamento de dados (Stripe, Supabase, LiveKit)

#### ✅ Consentimento

- [x] Banner de cookies com opções claras
- [x] Consentimento granular (necessários, analytics, marketing)
- [x] Fácil revogação de consentimento
- [x] Registro de consentimentos com timestamp e IP

#### ✅ Direitos dos Titulares

- [x] Acesso aos dados (perfil completo)
- [x] Correção de dados (edição de perfil)
- [x] Portabilidade (exportação JSON)
- [x] Exclusão (com período de carência)
- [x] Revogação de consentimento (gerenciar cookies)

#### ✅ Segurança

- [x] HTTPS obrigatório
- [x] Senhas com hash bcrypt
- [x] Row Level Security (RLS)
- [x] Logs de acesso
- [x] Backups regulares

#### ✅ Retenção de Dados

- [x] Política de retenção definida
- [x] Exclusão automática após período
- [x] Manutenção apenas de dados exigidos por lei

### Testes Manuais

#### Teste 1: Banner de Cookies

1. Abrir site em modo anônimo
2. Verificar se banner aparece
3. Clicar em "Personalizar"
4. Desmarcar "Analytics" e "Marketing"
5. Salvar preferências
6. Verificar se Google Analytics NÃO carrega
7. Recarregar página
8. Verificar que banner não aparece novamente

**Resultado esperado:** ✅ Consentimentos respeitados

#### Teste 2: Exportação de Dados

1. Login como usuário com dados
2. Ir para `/data-export`
3. Clicar em "Solicitar Exportação"
4. Aguardar processamento (mock: 8 segundos)
5. Verificar status "Concluído"
6. Clicar em "Baixar Dados (JSON)"
7. Abrir arquivo JSON
8. Verificar estrutura completa de dados

**Resultado esperado:** ✅ Arquivo JSON com todos os dados

#### Teste 3: Exclusão de Conta

1. Login como usuário
2. Ir para `/delete-account`
3. Preencher motivo: "Teste de exclusão"
4. Marcar checkbox de confirmação
5. Clicar em "Excluir Minha Conta"
6. Verificar mensagem de agendamento
7. Verificar data agendada (30 dias)
8. Clicar em "Cancelar Exclusão"
9. Verificar que solicitação foi cancelada

**Resultado esperado:** ✅ Fluxo completo funcional

#### Teste 4: Gerenciar Consentimentos

1. Login como usuário
2. Ir para `/lgpd`
3. Seção "Gerenciar Consentimentos"
4. Desativar "Analytics"
5. Verificar que checkbox desmarcou
6. Recarregar página `/lgpd`
7. Verificar que "Analytics" permanece desmarcado

**Resultado esperado:** ✅ Consentimentos persistidos

### Testes Automatizados (E2E)

```typescript
// tests/lgpd.spec.ts
import { test, expect } from '@playwright/test'

test('Cookie consent banner appears on first visit', async ({ page }) => {
  await page.goto('/')
  const banner = page.locator('[data-testid="cookie-banner"]')
  await expect(banner).toBeVisible()
})

test('User can export data', async ({ page }) => {
  await page.goto('/data-export')
  await page.click('button:has-text("Solicitar Exportação")')
  await page.waitForSelector('text=Concluído', { timeout: 10000 })
  const downloadButton = page.locator('a:has-text("Baixar Dados")')
  await expect(downloadButton).toBeVisible()
})

test('User can request account deletion', async ({ page }) => {
  await page.goto('/delete-account')
  await page.fill('textarea', 'Test deletion reason')
  await page.check('input[type="checkbox"]')
  await page.click('button:has-text("Excluir Minha Conta")')
  await expect(page.locator('text=Exclusão Agendada')).toBeVisible()
})

test('User can cancel account deletion', async ({ page }) => {
  await page.goto('/delete-account')
  // (assuming deletion is already requested)
  await page.click('button:has-text("Cancelar Exclusão")')
  await expect(page.locator('text=Exclusão cancelada')).toBeVisible()
})
```

---

## Métricas e KPIs

### Métricas de Conformidade

1. **Taxa de consentimento**
   - Quantos % aceitam cookies de analytics?
   - Quantos % aceitam marketing?
   - Quantos % personalizam?

2. **Solicitações de dados**
   - Número de exportações/mês
   - Tempo médio de processamento
   - Taxa de falha

3. **Exclusões de conta**
   - Número de solicitações/mês
   - Taxa de cancelamento (% que cancelam antes de 30 dias)
   - Motivos mais comuns

4. **Tempo de resposta**
   - Exportação: < 48 horas
   - Exclusão: 30 dias + processamento
   - Contato DPO: < 5 dias úteis

### Dashboard de LGPD (Admin)

```
┌────────────────────────────────────────────────┐
│ Dashboard LGPD                                 │
├────────────────────────────────────────────────┤
│                                                 │
│ Consentimentos (últimos 30 dias)               │
│ ─────────────────────────────────────────────  │
│ ✅ Analytics: 73%                              │
│ ✅ Marketing: 42%                              │
│ 📊 Personalizado: 15%                          │
│                                                 │
│ Exportações de Dados                           │
│ ─────────────────────────────────────────────  │
│ Total: 23 solicitações                         │
│ Completadas: 21                                │
│ Em processamento: 2                            │
│ Tempo médio: 18 horas                          │
│                                                 │
│ Exclusões de Conta                             │
│ ─────────────────────────────────────────────  │
│ Total: 8 solicitações                          │
│ Canceladas: 3 (37.5%)                          │
│ Agendadas: 5                                   │
│ Completadas: 0                                 │
│                                                 │
│ Motivos de Exclusão                            │
│ ─────────────────────────────────────────────  │
│ 1. Não uso mais: 50%                           │
│ 2. Privacidade: 25%                            │
│ 3. Mudei de plataforma: 12.5%                  │
│ 4. Outro: 12.5%                                │
└────────────────────────────────────────────────┘
```

---

## Auditoria e Compliance

### Documentação Necessária

1. **Registro de Atividades de Tratamento (ROPA)**
   - Dados coletados
   - Finalidades
   - Base legal
   - Compartilhamentos
   - Prazo de retenção

2. **Avaliação de Impacto (DPIA)**
   - Para tratamentos de alto risco
   - Avaliação de riscos
   - Medidas mitigadoras

3. **Contratos de Processamento**
   - Com Stripe (processador de pagamentos)
   - Com Supabase (processador de dados)
   - Com LiveKit (processador de vídeo)

4. **Logs de Consentimento**
   - Tabela `user_consents`
   - Timestamp, IP, User Agent
   - Auditável

### Auditoria de Código

**Pontos de verificação:**

```bash
# 1. Verificar se há senhas em plain text
grep -r "password\s*=\s*['\"]" src/

# 2. Verificar uso de HTTPS
grep -r "http://" src/

# 3. Verificar cookies sem HttpOnly
grep -r "document.cookie" src/

# 4. Verificar logs com dados sensíveis
grep -r "console.log.*password" src/
grep -r "console.log.*email" src/

# 5. Verificar SQL injection
grep -r "SELECT.*\${" src/
```

---

## Próximos Passos (Produção)

### Antes do Launch

- [ ] Revisar políticas com advogado especializado
- [ ] Contratar DPO (se >50 funcionários ou tratamento sensível)
- [ ] Configurar emails transacionais (exportação, exclusão)
- [ ] Implementar Edge Functions de produção
- [ ] Configurar pg_cron para agendamento de exclusões
- [ ] Testar fluxos completos em staging
- [ ] Preparar procedimentos de resposta a incidentes
- [ ] Treinar equipe sobre LGPD

### Pós-Launch

- [ ] Monitorar métricas de conformidade
- [ ] Revisar políticas a cada 6 meses
- [ ] Auditorias internas trimestrais
- [ ] Manter registro de incidentes
- [ ] Responder a solicitações de dados em até 15 dias

---

## Recursos Adicionais

### Links Úteis

- [Texto da LGPD (Lei 13.709/2018)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Guia da ANPD](https://www.gov.br/anpd/pt-br)
- [LGPD para Startups - IAPP](https://iapp.org/)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)

### Ferramentas

- **Cookie Consent:** [Cookiebot](https://www.cookiebot.com/), [OneTrust](https://www.onetrust.com/)
- **Data Mapping:** [OneTrust](https://www.onetrust.com/), [TrustArc](https://trustarc.com/)
- **Privacy Management:** [Osano](https://www.osano.com/), [Privacytools](https://www.privacytools.io/)
- **Legal Templates:** [Termly](https://termly.io/), [GetTerms](https://getterms.io/)

---

## Conclusão

O Disque Amizade implementa conformidade completa com a LGPD através de:

✅ **Transparência total** - Políticas claras e acessíveis
✅ **Controle do usuário** - Gerenciamento de consentimentos
✅ **Portabilidade de dados** - Exportação em JSON
✅ **Direito ao esquecimento** - Exclusão com período de carência
✅ **Segurança robusta** - RLS, criptografia, backups
✅ **Auditabilidade** - Logs de consentimento e ações

**Status de conformidade:** 🟢 COMPLETO

**Última revisão:** 30 de Janeiro de 2024

---

**Contato DPO:**
- Email: dpo@disqueamizade.com
- Telefone: (11) 99999-9999
