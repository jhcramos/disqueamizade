# Salas da comunidade — primeira entrega

A Casa continua em `/garagem`, com sua experiência de avatares. O Bate-papo fica
em `/rooms`; salas criadas pelos usuários têm endereço `/comunidade/:slug`.
As salas de vídeo existentes continuam em `/room/:roomId`.

## Incluído

- Uma sala gratuita por conta com e-mail confirmado no Supabase Auth; convidados podem entrar.
- Tema, descrição, regras, acesso público ou por convite. A sala permanece no catálogo mesmo vazia.
- Área adulta separada na interface e confirmação explícita ao criar/entrar. Essa confirmação é autodeclaração, não verificação documental de idade.
- Apelido, texto, atalhos editáveis, últimas 50 mensagens e presença com expiração de 45 segundos.
- Dono, moderadores, bloqueio/desbloqueio, denúncias à moderação da sala e renovação do convite.
- Convites ficam no fragmento da URL. Renovar invalida novas entradas pelo link antigo; membros já aceitos continuam membros.
- Links da Casa e Bate-papo na home e artigos, preservando os destinos originais dos links dos artigos.
- Eventos `community_room_created`, `room_joined` com `experience=community` e `community_first_message` (uma vez por montagem da sala). Nenhum texto, apelido ou tema enviado nesses eventos. Dependem do provedor de analytics já configurado.

## Integração e publicação

O usuário confirmou o projeto `uquztttljpswheiikbkw`. A migration
`20260920124107_community_rooms.sql` foi aplicada e a função `community-rooms`
foi publicada (versão 1). O catálogo real foi carregado como visitante pela
prévia local. Pedidos sem JWT retornam 401, GET retorna 405 e OPTIONS retorna 200.

A interface está na branch `codex/salas-comunidade`, baseada em
`feat/garage-proximity-prototype` para preservar a Casa. Ainda não foi publicada
no domínio. Antes de publicar, validar criação e moderação com duas contas
confirmadas em uma homologação. Os testes completos de criação, mensagens e
moderação foram executados em PostgreSQL local; a verificação no projeto real
cobriu schema, permissões, sessão de visitante e leitura do catálogo.

Configuração:

- A função usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente no servidor.
- `verify_jwt=false` é intencional: cada JWT é validado com `auth.getUser`,
  sem depender do formato legado de assinatura do gateway.
- Login anônimo está funcionando no projeto. Para exigir confirmação real
  de e-mail, conferir se confirmações estão habilitadas no Auth; o config
  local atual tem confirmações desativadas.
- Não aplicar novamente a migration já registrada. O nome local foi alinhado
  à versão registrada pelo Supabase.
- O schema legado foi conferido. `service_role` recebeu leitura apenas das
  colunas `id`, `is_anonymous` e `email_confirmed_at` de `auth.users`;
  acesso a senhas não foi concedido.

As quatro tabelas novas têm RLS e nenhuma permissão direta para `anon` ou
`authenticated`. A função SQL só pode ser executada por `service_role`; o ator
vem exclusivamente do JWT verificado, nunca do corpo do pedido.

## Validação local

- `npm run build`: TypeScript, Vite e pré-renderização.
- `npm run test:community`: executa a migration real em PostgreSQL via PGlite;
  cobre privacidade, papéis, convites, limites, denúncias e bloqueios. PGlite usa
  uma conexão e não substitui teste de carga/concorrência no Supabase.
- No Node 22.14, testes legados precisam da flag:
  `node --experimental-strip-types --test tests/chat-client.test.mjs supabase/functions/_shared/*.test.ts`.
- `npm run test:camera`.
- Navegação local e bloqueio de criação sem conta verificados no navegador.
  O catálogo conectado foi validado; o fluxo de dono com conta confirmada permanece pendente.

## Limites desta entrega

Salas da comunidade usam texto e consultas a cada 3 segundos. Vídeo, áudio,
mensagens privadas e cobrança nas salas da comunidade ainda não foram integrados.
Não há editor/exclusão de sala nesta primeira versão. Silenciar mensagens é local
à visita. Denúncias aparecem para dono/moderadores; triagem administrativa central
ainda precisa de interface. Banimento vale para a identidade autenticada: visitantes
podem obter outra identidade ao limpar a sessão. Planejar controles de abuso antes
de abrir criação e divulgação em escala.

Mensagens são persistidas, mas apenas as últimas 50 aparecem. Definir e implementar
uma política de retenção/expurgo antes de ampliar o uso. Não foi incluído plano pago:
a criação básica permanece gratuita enquanto validamos uso e retorno.
