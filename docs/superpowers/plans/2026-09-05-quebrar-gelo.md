# Quebrar o gelo — plano de implementação

**Objetivo:** adicionar Quem aqui? e Eu também! às salas coletivas públicas gratuitas, com adesão voluntária e sem interromper vídeo/chat.

**Arquitetura:** painel React nas salas existentes; Edge Function autentica e modera; função Postgres transacional controla fases e entrega somente dados autorizados. Tabelas privadas para clientes, RLS ativada, acesso exclusivo pelo servidor. Atualização por consulta periódica enquanto a sala está conectada, suspensa em abas ocultas.

**Stack:** React, TypeScript, Supabase Auth/Edge/Postgres existentes; nenhuma nova dependência de execução.

## Experiência e regras

- Disponível em todas as salas públicas gratuitas atuais; fora de roleta, mensagens privadas e futuras salas adultas/pagas.
- Botão discreto Quebrar o gelo, painel fechado por padrão. Sem início automático, popup, som ou ativação de câmera/microfone.
- Uma rodada por sala. 60 segundos para responder (até 160 caracteres), 45 para palpites privados no navegador e 120 para revelação/reação. Pode fechar o painel a qualquer momento.
- São necessárias duas respostas para revelar. Com menos, as respostas ficam ocultas e a rodada termina sem exposição.
- Apelidos são revelados somente na fase final; aviso antes do envio. Participação opcional, retirada da resposta durante coleta.
- Perguntas leves curadas. Autoria embaralhada por UUID aleatório; sem pontuação, ranking ou promessa de anonimato após revelação.
- Eu também! é permitido depois da revelação, uma vez por pessoa/resposta e sem autorreação.
- Intervalo de cinco minutos após o término até uma nova rodada. Relógio e limites no servidor, inclusive em requisições simultâneas.
- Uma pessoa pode propor a rodada; sem duas respostas não há jogo. Isso evita confundir contadores aproximados de presença com autorização.
- Respostas não viram mensagens de chat nem são gravadas em analytics. Rodadas antigas são removidas ao abrir a próxima na sala; fase encerrada não entrega respostas.

## Tarefas e critérios de pronto

- [x] Servidor: migration room_icebreakers cria rounds/answers/reactions; icebreaker_action valida sala pública, banimento, ação, prazos, unicidade e cooldown com advisory lock. Não aceita roundId antigo. Estado na coleta expõe somente quantidade e a própria resposta; palpites mostram textos e lista embaralhada de candidatos sem vínculo; revelação mostra autores/reação.
- [x] Edge: supabase/functions/icebreaker/index.ts valida JWT com auth.getUser, limita corpo, aplica moderação existente e chama RPC restrita a service_role. Catálogo e parser em _shared/icebreaker.ts. Nunca usa identidade enviada pelo cliente.
- [x] Interface: src/rooms/icebreakers/IcebreakerPanel.tsx, api.ts e types.ts. Integrar em RoomPage.tsx. Tratar falha de rede, cliques duplicados, desconexão, troca de sala, retirada, zero/uma resposta, cooldown, acessibilidade e mobile. Filtrar respostas de bloqueados após revelação.
- [x] Verificação: testes parser/catálogo; SQL transacional com usuários sintéticos para sigilo, RLS, prazos, rodada obsoleta, reação duplicada, banimento e sala indevida. Testes chat/câmera e build. Sem câmera real ou mensagens a usuários.
- [ ] Publicação: scan de segredos, commit/push na origem autorizada; aplicar migration e Edge, verificar API, publicar frontend e conferir artefato remoto. Registrar resultados reais abaixo.

## Próxima etapa, fora deste incremento

Amizades e reencontro por interesse mútuo. Medir com consentimento se a brincadeira ajuda a conversar e reencontrar pessoas; pesquisas existentes não validam automaticamente este jogo.

## Verificação realizada

- SQL executado em Postgres local via PGlite: fases, sigilo, permissões reais de service_role, retirada, cooldown, ID obsoleto, reação duplicada e exclusão em cascata passaram.
- API publicada: duas sessões anônimas temporárias; início simultâneo aceitou uma rodada; moderação de links, ocultação/revelação de autoria e reação idempotente passaram. SELECT direto e RPC de clientes negados, sala inexistente negada, ausência de JWT negada. Rodada e usuários de teste removidos.
- UI isolada com componente real e API simulada: início voluntário, envio, retirada, escolha de palpite, revelação e reação conferidos no navegador. Sem câmera ou microfone; fixture disponível apenas no desenvolvimento em `/dev/icebreaker-preview.html`.
- 16 testes do comando test:chat (inclui 3 novos testes de catálogo/entrada) e 11 de câmera passaram.
- Migration local alinhada com o registro remoto `20260905060426_room_icebreakers.sql`; Edge icebreaker v1 ativa.
- Consulta SQL transacional pelo conector remoto não executada porque a ferramenta opera em transação somente leitura. Cobertura funcional remota feita pela API autenticada, sem mudar essa restrição.
- Advisor: tabelas novas têm RLS e nenhuma política de cliente intencionalmente, com privilégios revogados. Acesso exclusivamente pelo servidor. Aviso informativo explicado em https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy . Avisos existentes de auto_hide_on_reports e proteção de senhas ficam fora deste incremento.
- Limites do piloto: até 24 respostas por rodada; atualizações a cada 5s com painel aberto/15s fechado e suspensas em aba oculta. Sem dados de respostas em analytics. Retenção física da última rodada até a próxima na mesma sala; após encerramento a API deixa de entregar respostas. Revisar custo de consultas e retenção com o uso real.
