# Presença e Convites Privados Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir presença real e permitir convites privados de mensagem, áudio e vídeo conforme preferências explícitas por sessão.

**Architecture:** Supabase Presence distribui o estado visual lento da sala. Uma Edge Function autenticada grava preferências efêmeras e gerencia convites persistidos; RLS limita leitura aos dois participantes. O LiveKit continua como fonte da câmera pública e só emite token privado quando existe convite aceito.

**Tech Stack:** React 19, TypeScript, Supabase Auth/Realtime/Postgres/Edge Functions, LiveKit, Node test runner, PGlite.

---

### Task 1: Contratos e banco seguro

**Files:**
- Create: `supabase/functions/_shared/private-contact.ts`
- Modify: `supabase/functions/_shared/livekit.ts`
- Modify: `supabase/functions/_shared/livekit.test.ts`
- Modify: `supabase/migrations/20260906230111_private_contacts.sql`
- Create: `supabase/tests/private-contacts-security.mjs`

- [ ] **Step 1: Escrever testes que falham**

Testar `parsePrivateContactInput`, ordenação do par, modalidades válidas, rejeição de campos extras e autorização de sala privada apenas para convite aceito. No PGlite, testar RLS, ausência de escrita direta e leitura restrita aos participantes.

- [ ] **Step 2: Confirmar vermelho**

Run: `node --test supabase/functions/_shared/private-contact.test.ts supabase/functions/_shared/livekit.test.ts`

Expected: FAIL porque o contrato e a autorização ainda não existem.

- [ ] **Step 3: Implementar contratos e migração**

Criar `room_contact_preferences(room_slug,user_id,accepts_message,accepts_audio,accepts_video,expires_at)` e `private_invites(id,room_slug,from_user,to_user,mode,status,expires_at,created_at,updated_at)`. Habilitar RLS, revogar escrita de clientes, conceder SELECT autenticado somente para participantes e adicionar `private_invites` à publicação Realtime de forma idempotente.

- [ ] **Step 4: Confirmar verde**

Run: `node --test supabase/functions/_shared/private-contact.test.ts supabase/functions/_shared/livekit.test.ts`

Expected: PASS.

### Task 2: Edge Function de preferências e convites

**Files:**
- Create: `supabase/functions/private-contact/index.ts`
- Modify: `supabase/functions/livekit-token/index.ts`
- Modify: `supabase/functions/send-chat/index.ts`
- Create: `supabase/functions/_shared/private-contact.test.ts`

- [ ] **Step 1: Testar validação das ações**

Cobrir `set_preferences`, `invite`, `respond` e `end`; mensagem ativa por padrão; áudio/vídeo desativados; convite de 30 segundos; somente destinatário responde; modalidade desativada retorna `not_available`.

- [ ] **Step 2: Confirmar vermelho**

Run: `npm run test:chat`

Expected: FAIL nos novos casos.

- [ ] **Step 3: Implementar a função autenticada**

Usar `auth.getUser(jwt)`, ignorar qualquer identidade do corpo, validar sala pública gratuita, aplicar limite por remetente e gravar via service role. `livekit-token` consulta convite aceito de áudio/vídeo; `send-chat` consulta convite de mensagem aceito antes de DM.

- [ ] **Step 4: Confirmar verde**

Run: `npm run test:chat`

Expected: todos os testes passam.

### Task 3: Presença e cliente de convites

**Files:**
- Modify: `src/services/supabase/roomChat.ts`
- Create: `src/rooms/privateContact.ts`
- Modify: `tests/chat-client.test.mjs`

- [ ] **Step 1: Testar payload e atualização**

Verificar normalização das preferências recebidas, deduplicação por `userId`, padrão mensagem ligada, `updatePresence()` sem recriar o canal e assinatura filtrada dos convites do usuário.

- [ ] **Step 2: Confirmar vermelho**

Run: `node --test tests/chat-client.test.mjs`

Expected: FAIL porque as APIs não existem.

- [ ] **Step 3: Implementar cliente mínimo**

Exportar `ContactPreferences`, `RoomPresence` e `DEFAULT_CONTACT_PREFERENCES`. Manter o último payload no `ChatConversation`. Criar `PrivateContactClient` para invocar a Edge Function, carregar convites ativos e assinar INSERT/UPDATE de `private_invites` filtrados por usuário.

- [ ] **Step 4: Confirmar verde**

Run: `node --test tests/chat-client.test.mjs`

Expected: PASS.

### Task 4: Painel Na sala e prompts

**Files:**
- Create: `src/rooms/PeoplePanel.tsx`
- Create: `src/rooms/PrivateInvitePrompt.tsx`
- Modify: `src/rooms/RoomPage.tsx`
- Create: `tests/private-contact-ui.test.mjs`

- [ ] **Step 1: Escrever regressões de interface**

Verificar abas `Chat`/`Na sala`, opções independentes, rótulos acessíveis, câmera pública derivada do LiveKit e ausência de ação para modalidade desabilitada.

- [ ] **Step 2: Confirmar vermelho**

Run: `node --test tests/private-contact-ui.test.mjs`

Expected: FAIL porque os componentes não existem.

- [ ] **Step 3: Implementar UI responsiva**

Adicionar abas ao painel atual, lista ordenada com o próprio usuário primeiro, indicadores `Câmera ligada`, `Mensagem`, `Áudio`, `Vídeo`, editor **Como podem falar comigo hoje?**, fluxo **Chamar** e prompt de aceite/recusa com expiração.

- [ ] **Step 4: Confirmar verde**

Run: `node --test tests/private-contact-ui.test.mjs && npm run build`

Expected: PASS e build concluído.

### Task 5: Conversa privada de áudio e vídeo

**Files:**
- Create: `src/rooms/PrivateCall.tsx`
- Modify: `src/rooms/RoomPage.tsx`
- Modify: `src/rooms/livekit.ts`
- Modify: `tests/camera-privacy.test.mjs`

- [ ] **Step 1: Testar transição segura**

Garantir que a sala pública desmonta antes da privada, vídeo não publica sem prévia confirmada, microfone começa desligado e token usa o par UUID ordenado.

- [ ] **Step 2: Confirmar vermelho**

Run: `node --test tests/camera-privacy.test.mjs`

Expected: FAIL nos novos casos.

- [ ] **Step 3: Implementar chamada**

Após convite aceito, buscar token privado, desmontar a sala geral e montar `PrivateCall`. Áudio mostra botão explícito para ativar microfone. Vídeo abre a prévia privada e publica somente após confirmação. Encerrar marca o convite e remonta a sala geral.

- [ ] **Step 4: Verificação completa**

Run: `node --test tests/*.test.mjs supabase/functions/_shared/*.test.ts && npm run build`

Expected: zero falhas e build concluído.

### Task 6: Banco, funções e publicação

**Files:**
- Modify: `docs/parte-b-status.md`

- [ ] **Step 1: Revisar segurança**

Executar scanner de segredos, revisar grants/RLS, aplicar a migração e rodar advisors de segurança e performance.

- [ ] **Step 2: Publicar backend**

Aplicar `private_contacts`, implantar `private-contact`, `send-chat` e `livekit-token` com JWT obrigatório e consultar as versões publicadas.

- [ ] **Step 3: Publicar frontend**

Commitar, enviar ao remoto autorizado, aguardar Vercel `Ready` e validar o domínio principal em duas sessões autenticadas sem câmera.
