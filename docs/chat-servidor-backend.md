# Chat moderado no servidor — contrato do backend

A função `send-chat` recebe POST JSON `{ roomSlug, text, type? }` e um JWT de usuário
válido em `Authorization: Bearer …`. Contas anônimas do Supabase funcionam como
usuários autenticados; uma chave anon ou identidade local `guest-*` não basta.
Identidade e apelido são derivados no servidor. Campos adicionais são recusados.

Limites: corpo até 4096 bytes, texto até 500 unidades UTF-16, tipo text/emoji.
Normalização remove caracteres invisíveis e detecta equivalentes Unicode/acentos;
links são recusados e palavrões da lista base/configuração são mascarados.
Falhas ao carregar perfil/configuração ou gravar no banco não publicam mensagem.
Esta lista determinística não substitui denúncia nem cobre toda obfuscação possível.

Sucesso HTTP 200: `{ message: { id, room_slug, user_id, username, content, type,
participant_ids, created_at } }`. IDs são UUID, datas ISO. Erros retornam apenas
`{ error }`: invalid_request (400), blocked_content (400), unauthorized (401),
forbidden/banned (403), rate_limited (429), unavailable (503). Método não POST/OPTIONS
retorna invalid_request (405). Mensagens de erro internas não são expostas.

Salas públicas precisam existir, estar ativas, ter type publica e ficha_cost zero.
Conversas privadas usam `dm-<uuidA>-<uuidB>` ou `roulette-<uuidA>-<uuidB>`, com UUIDs
minúsculos, distintos e em ordem lexical. O remetente deve ser um dos dois.
O banco deriva participant_ids; o cliente não pode defini-los. Essa validação
restringe leitura ao par, mas não exige amizade nem comprova matchmaking prévio.

Só a service role executa send_chat_message ou grava chat_messages. authenticated
tem somente SELECT: salas públicas ativas/gratuitas ou conversas das quais participa.
A aplicação deve consumir INSERT por Postgres Changes; nunca aceitar mensagens
por broadcast público nem publicar fallback em caso de erro. A migration inclui
chat_messages na publicação supabase_realtime sem duplicar a associação.

A RPC adquire advisory transaction lock por remetente e usa clock_timestamp após
o lock. Conta registros dos últimos 3 segundos globalmente, incluindo DM/roleta;
no máximo cinco escritas passam. Uma segunda instância edge não reinicia o limite.
Requisições inválidas/bloqueadas não criam registros. Exclusão administrativa de
mensagens recentes altera o orçamento; clientes não têm permissão de exclusão.

## Aplicação

Migration criada pela CLI: 20260904054854_moderated_chat.sql. Destina-se ao schema
verificado do projeto: chat_messages ainda ausente, rooms com slug/is_active/type/
ficha_cost e user_bans com user_id/expires_at. Se chat_messages já existir, a
migration aborta para revisão, evitando destruir dados de um bootstrap histórico.
Não executar toda a sequência de migrations antigas cegamente sobre produção.

Ordem de implantação coordenada: revisar/aplicar migration no projeto correto;
habilitar e validar autenticação anônima; publicar send-chat; publicar clientes
que usem JWT real e mensagens persistidas. Validar convidados, conta, DM e roleta
com sessões independentes antes de declarar conclusão em produção. Nenhuma
migration ou função foi aplicada/publicada por esta implementação local.

## Verificação local

- `node --test supabase/functions/_shared/chat.test.ts`: 6 testes passam.
- `npx --yes deno check --lock=supabase/functions/send-chat/deno.lock supabase/functions/send-chat/index.ts`: passa.
- Instalar @electric-sql/pglite@0.3.14 em pasta temporária; definir
  CHAT_PGLITE_MODULE para seu dist/index.js e executar
  `node supabase/tests/chat-security.mjs`: grants, RLS, escrita direta, RPC, salas,
  pares privados, bans, limite, janela expirada e guard de schema passam.
- `supabase/tests/chat-concurrency.mjs`, em PostgreSQL 17 isolado por Docker:
  seis conexões independentes disputam o lock do mesmo remetente; cinco mensagens
  são gravadas e uma recebe rate_limited. Após expirar a janela, a próxima passa.
  O teste exige container descartável com nome disque-chat-test-* e variável
  CHAT_POSTGRES_CONTAINER. Usa socket /tmp, banco postgres, usuário postgres;
  cria schema mínimo sintético. Não apontar para banco real.

O container usado na verificação foi criado sem rede/portas publicadas e removido
após os testes. Dados dos testes são inteiramente fictícios.

## Integração do cliente e vídeo

`node --test tests/chat-client.test.mjs supabase/functions/_shared/*.test.ts`
valida migração de apelido sem aceitar o id antigo, restauração/saída de convidados,
contas existentes, deduplicação, falhas sem fallback, encerramento/reentrada de
canais, filtros e identidade/membro do par de vídeo. O SDK espera a confirmação de
Postgres Changes antes do histórico; a remoção de canal é aguardada na reentrada.

`livekit-token` agora exige JWT de usuário; usa auth.getUser, não confia no id do
corpo e verifica banimento e sala ativa/gratuita ou par que contém o solicitante.
O token é vinculado a auth.user.id; não aceita identidade guest-* fabricada.
Não implantar essa versão sem coordenar frontend e Anonymous Sign-Ins.

A presença e o matchmaking continuam sendo sinalização pública e não comprovam
identidade por si sós. O controle de leitura/escrita do chat independe dessa
sinalização. A validação do par não comprova consentimento prévio ou amizade.

## Proteção de privilégios no perfil

A migration 20260904060328_guard_privileged_profile_fields.sql impede clientes
anon/authenticated de se tornarem administradores/VIP/elite, alterarem saldos ou
hidden_until. Escritas do backend com service_role permanecem permitidas. Inserção
inicial aceita saldo0 ou50 para compatibilidade com o cadastro já publicado;
is_creator continua sendo atributo autodeclarado do perfil legado.

`CHAT_PGLITE_MODULE=/caminho/pglite/dist/index.js node supabase/tests/profile-security.mjs`
exercita edições comuns, tentativas de autoelevação, defaults iniciais e escrita
confiável. Não aponta para dados reais.
