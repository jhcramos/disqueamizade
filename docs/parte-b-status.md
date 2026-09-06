# Parte B — execução e dependências

## B.1 — remoção da simulação

Removidos gerador de presença, três flags, toggles e métrica aleatória do Admin.
O cache e a leitura de cold_start passam a aceitar somente lobby_mode, evitando
reintroduzir propriedades antigas ao salvar. Nenhum offset é somado aos números
do banco; falta de contagem resulta em 0.

A migration remove as três propriedades JSON de admin_settings.value, se essa
tabela já existir. O seed também não as recria. A migration foi aplicada no projeto remoto em 04/09/2026. Os contadores vêm das tabelas existentes; esta alteração não
comprova sincronização dessas tabelas com participantes LiveKit em produção.

Validação local: npm run build passou (TypeScript, Vite, 498 páginas de prerender).
Busca `rg -i "bots_presence|inflated|simulated|auto_chat" src` sem ocorrências.

## B.2 — publicado e verificado em 04/09/2026

O projeto Supabase correto foi confirmado: DisqueAmizade. Na auditoria, o schema remoto não
possuía chat_messages; a migration criou a tabela sem alterar mensagens legadas.

- Convidados usam Supabase Auth anônimo, com UUID/JWT real; cache antigo migra só
  o apelido. Saída encerra a sessão remota. A biblioteca Supabase foi atualizada e
  seu shim de tipos obsoleto removido.
- Sala, DM e roleta enviam apenas pela edge send-chat e recebem linhas aprovadas
  por Postgres Changes. Não há broadcast de conteúdo, insert direto ou mensagem
  otimista. Histórico/eco usam o mesmo id para deduplicação.
- O banco restringe leitura de DM/roleta ao par e escrita à service role. O limite
  global 5/3s usa lock transacional por remetente, incluindo conexões concorrentes.
- A edge valida JWT, corpo, tamanho, links/palavrões, apelido e banimento. Falhas
  não liberam envio por outro caminho. O cliente mostra o erro e preserva o texto.
- LiveKit também passa a validar JWT, identidade, banimento e acesso à sala/par.
  Essa atualização deve ser coordenada com o frontend; clientes antigos usam
  identidades locais e deixam de obter tokens após a troca.
- Revisão do schema identificou que o perfil permitia alterar privilégios próprios.
  Uma migration adicional protege esses campos antes de habilitar convidados.

Anonymous Sign-Ins foi habilitado com autorização do proprietário. As três
migrations foram aplicadas, send-chat v1 e livekit-token v2 estão ativas, e o
frontend foi publicado na Vercel. O JWT é validado por auth.getUser nas funções;
a opção verify_jwt do gateway legado está desativada por compatibilidade.

Validação local: 13 testes e build com 498 páginas passaram. Banco isolado testou
RLS, privilégios e seis conexões simultâneas. Em produção, duas sessões anônimas e
uma conta temporária confirmaram entrega por Realtime, isolamento da DM, filtro,
negação de INSERT/RPC direto e autoelevação, e limite concorrente 5 aceitas/1 negada.
O token de vídeo foi emitido para o UUID autenticado; identidade adulterada, chave
anon sem usuário e sala inexistente foram recusadas. As quatro contas temporárias
foram removidas e suas mensagens excluídas por cascade. Não houve captura de câmera
ou microfone nem envio de mensagens a usuários reais.

Ver docs/publicacao-2026-09-04.md para a referência da publicação.

## Presença e convites privados — publicado em 07/09/2026

A sala agora exibe todos os participantes conectados na aba **Na sala**, mesmo
quando não publicam câmera nem escrevem no chat. O ícone verde indica câmera
publicada naquele momento; os ícones de mensagem, áudio e vídeo indicam somente
as modalidades de convite aceitas pela pessoa naquela sessão.

- Mensagem começa habilitada; áudio e vídeo começam desabilitados. Alterações são
  efêmeras, gravadas pelo servidor e refletidas por Supabase Presence.
- Cada contato exige convite com aceite explícito. Convites pendentes expiram em
  30 segundos e uma conversa aceita vale por até 45 minutos.
- Mensagens privadas são negadas em `send-chat` sem convite de mensagem aceito.
  Tokens LiveKit privados exigem o ID do convite aceito e limitam as fontes a
  microfone no áudio, ou câmera e microfone no vídeo.
- A sala geral é desmontada durante chamadas privadas. O microfone começa
  desligado; o vídeo abre a prévia privada e só publica após confirmação.
- As novas tabelas negam escrita direta a clientes. RLS permite que apenas os
  dois participantes leiam o convite, e a Edge Function deriva a identidade do
  JWT validado com `auth.getUser`.

A migration `20260906230111_private_contacts.sql` foi aplicada no projeto
DisqueAmizade. `private-contact` v2, `send-chat` v2 e `livekit-token` v3 ficaram
ativas. O lint remoto do banco não encontrou erros. Em produção, duas sessões
anônimas de teste confirmaram preferências, recusa de INSERT direto e de aceite
pelo remetente, mensagem privada autorizada e grants distintos para áudio e
vídeo. A validação local passou em 38 testes, PGlite com RLS e build de produção
com 498 páginas estáticas.

## Itens condicionais

- B.3: adiado para priorizar o chat; integração não ativada.
- B.4: executado em branch separada, com relatório próprio.
- B.5: política do proprietário registrada no guia: nudez somente nas futuras
  salas adultas, com configuração confiável e acesso adulto. Detector opcional
  não implementado nem declarado ativo; salas adultas não foram criadas.
- B.6–B.8: o guia condiciona a execução à métrica room_5min. Evidência não fornecida.
  B.6 já grava alguns campos remotamente; revisar lacunas antes de duplicar trabalho.
  B.7 também requer serviço de e-mail e validação de entrega real.
- B.9: aguarda Search Console e curadoria humana; nenhum artigo foi fundido/apagado.
