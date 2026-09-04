# Parte B — execução e dependências

## B.1 — remoção da simulação

Removidos gerador de presença, três flags, toggles e métrica aleatória do Admin.
O cache e a leitura de cold_start passam a aceitar somente lobby_mode, evitando
reintroduzir propriedades antigas ao salvar. Nenhum offset é somado aos números
do banco; falta de contagem resulta em 0.

A migration remove as três propriedades JSON de admin_settings.value, se essa
tabela já existir. O seed também não as recria. A migration ainda não foi aplicada
em ambiente remoto. Os contadores vêm das tabelas existentes; esta alteração não
comprova sincronização dessas tabelas com participantes LiveKit em produção.

Validação local: npm run build passou (TypeScript, Vite, 498 páginas de prerender).
Busca `rg -i "bots_presence|inflated|simulated|auto_chat" src` sem ocorrências.

## B.2 — bloqueado pela confirmação do banco e autenticação

A alteração não foi publicada nem declarada concluída. O conector Supabase desta
sessão só lista Urbix Agents, outro projeto. É necessário conectar o projeto
Supabase do Disque Amizade para ler o schema, políticas e configuração de Auth.

A auditoria identificou divergências que tornam insegura uma troca mecânica:

- roomChat usa broadcast público antes do insert; qualquer cliente adulterado
  pode evitar o servidor. Leitura de mensagens precisa vir de registros aprovados,
  removendo listener e envio de broadcast/chat (presença é separada).
- Migrações versionadas usam UUID de sala e de perfil, UUID para mensagem e
  message_type. O cliente envia slug, guest-*, msg-*, username e type.
- Convidados são sessões locais, sem JWT Supabase. Sessão anônima real deve ser
  habilitada e integrada preservando apelido, restauração e saída.
- Chat da roleta usa roulette-<par>, sem correspondente garantido na tabela rooms.
  Sua leitura precisa ser restrita aos participantes; não tornar conversas 1:1 públicas.
- A edge livekit-token aceita identidade arbitrária. É necessário associá-la à
  sessão validada ao integrar a autenticação de convidados.
- Limite 5 mensagens/3 segundos precisa ser atômico no banco, por usuário, com
  função de escrita exclusiva da service role. Um array em memória por worker
  não garante limite diante de requisições concorrentes.
- Revogar INSERT direto e conferir todas as políticas existentes. Uma política
  permissiva com false não anula políticas permissivas anteriores.
- RoomPage e RouletteCall devem aguardar confirmação, exibir falha real e
  deduplicar eco; hoje inserem mensagem otimista não aprovada.
- src/rooms/dm.ts também usa broadcast público. Não chamar todo o chat de seguro
  sem tratar separadamente esse transporte.

Critérios a verificar no projeto correto: convidados e contas enviam/recebem;
links/palavrões de cliente adulterado não chegam; sexta mensagem em 3 segundos
recusada inclusive sob concorrência; INSERT direto negado; não participante não
lê chat 1:1; falha do servidor não publica mensagem por fallback.

## Itens condicionais

- B.3: falta Project ID do Microsoft Clarity e validação de gravação no painel.
- B.4: executado em branch separada, com relatório próprio.
- B.5: política do proprietário registrada no guia: nudez somente nas futuras
  salas adultas, com configuração confiável e acesso adulto. Detector opcional
  não implementado nem declarado ativo; salas adultas não foram criadas.
- B.6–B.8: o guia condiciona a execução à métrica room_5min. Evidência não fornecida.
  B.6 já grava alguns campos remotamente; revisar lacunas antes de duplicar trabalho.
  B.7 também requer serviço de e-mail e validação de entrega real.
- B.9: aguarda Search Console e curadoria humana; nenhum artigo foi fundido/apagado.
