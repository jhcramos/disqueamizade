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

## B.2 — implementação preparada; ativação remota pendente

O projeto Supabase correto foi confirmado: DisqueAmizade. O schema remoto não
possui chat_messages; a nova migration cria a tabela sem alterar mensagens legadas.

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

O painel confirmou que Anonymous Sign-Ins está desabilitado. Nenhuma configuração,
função ou migration desta etapa foi aplicada em produção. A ativação exige aplicar
as migrations revisadas, habilitar a opção e publicar as duas edges e o frontend
coordenadamente. O preview anterior permanece disponível; não aponta para código
que depende de infraestrutura ainda desabilitada.

Validação local: testes de identidade/fluxo assíncrono, entrega aprovada e falhas;
testes de moderação; RLS e limite em banco isolado. Seis conexões simultâneas em
PostgreSQL 17 admitiram cinco mensagens e recusaram uma. Build gera 498 páginas.
Falta teste integrado remoto com duas sessões e verificação do site após ativação.
Ver docs/chat-servidor-backend.md para contratos e comandos de verificação.

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
