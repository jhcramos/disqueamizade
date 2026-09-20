# Novo Bate-papo — implementação

A Casa permanece em `/garagem`, com a experiência de avatares preservada.
O catálogo em `/rooms` e o chat em `/comunidade/:slug` seguem o desenho aprovado
(principal + miniaturas). `/room/:roomId` também abre o novo chat, por slug ou UUID.
As seis salas oficiais ativas e gratuitas foram copiadas com os mesmos IDs/slugs;
as tabelas e o histórico do chat legado permanecem intactos.

## Entrega

- Catálogo com busca, temas, favoritos, ordenação e páginas de 12 salas; entrada 18+ com destaque equivalente à seção geral. Nenhuma atividade simulada em produção.
- Uma sala gratuita por conta com e-mail confirmado, pública ou por convite, com apelido, descrição, regras e moderação. Cobrança continua fora desta fase.
- Chat público, resposta citando mensagem, atalhos que preenchem o rascunho, emoji, favoritos e lista de participantes.
- Conversas diretas, salas reservadas por convite e vídeo reservado são fluxos distintos. As abas e o compositor indicam o destinatário.
- Convites recebidos aparecem abaixo das câmeras e na caixa de convites. Aceitar, recusar, cancelar e encerrar são persistidos; pendentes expiram em 5 minutos; reservados aceitos duram 2 horas; conversas diretas duram 30 dias.
- Bloqueio entre participantes é persistente e impede novas mensagens/convites nas duas direções; encerra chamadas existentes. Banimento da sala também encerra chamadas.
- Denúncias privadas enviam somente a mensagem escolhida à moderação. Moderadores não recebem o restante da conversa privada.
- LiveKit: uma câmera principal em alta qualidade, até quatro miniaturas na página em baixa qualidade, demais não assinadas; visibilidade da página e dos elementos controla assinatura. Áudio recebido é opcional e segue a câmera selecionada. Ampliar aumenta o painel.
- Câmera e microfone desligados ao conectar. A câmera passa por prévia local e confirmação de transmissão. Trocar de conversa desconecta a sessão de vídeo anterior.
- Administradores existentes foram adicionados como moderadores das salas oficiais. Novas atribuições devem ser provisionadas pelo servidor, nunca por metadados do usuário.

## Backend publicado

Projeto confirmado: `uquztttljpswheiikbkw`.

- `20260920124107_community_rooms.sql` (primeira entrega).
- `20260920141803_community_social.sql` (reservados, bloqueios, favoritos, denúncias privadas, autorização de mídia).
- `20260920141813_community_official_rooms.sql` (salas oficiais existentes).
- Edge `community-rooms`, versão 2.

As versões locais foram alinhadas ao registro remoto depois da aplicação. Não reaplicar.
`SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET` ficam no servidor.
`LIVEKIT_URL` já está configurada no projeto e é devolvida junto do token de vídeo.
Tokens de entrada têm validade de 60 segundos; autorização de sala/convite ocorre no servidor.
Câmera/microfone são as únicas fontes de publicação permitidas; dados de chat não passam pelo LiveKit.

`verify_jwt=false` é intencional: cada pedido passa por `auth.getUser(jwt)`.
As tabelas da comunidade têm RLS sem políticas de navegador e permissões revogadas
para `anon`/`authenticated`. Somente a Edge autenticada chama a RPC com o ator extraído do JWT.
A fila de revogações de mídia é processada nas mutações e nas consultas de estado;
falhas do serviço ficam na fila para nova tentativa. A expiração é conferida na
emissão de tokens e nas consultas de estado, não por um agendador independente.

## Verificação

- `npm run build`: TypeScript, Vite e 499 páginas pré-renderizadas.
- `npm run test:community`: 18 testes incluindo isolamento, bloqueio, resposta ao convite, expiração, banimento, favoritos, denúncias e importação de salas oficiais.
- `npm run test:chat`: 22 testes legados; flag de TypeScript incluída para Node 22.14.
- `npm run test:camera`: 13 testes existentes de privacidade da câmera.
- `npx deno check --no-lock supabase/functions/community-rooms/index.ts`.
- Navegador: paginação, seção adulta, entrada, mensagem rápida, reservado e troca de câmera; layout de 390×844 com participantes em painel.
- Seis vídeos sintéticos em servidor LiveKit local: principal 1280×720 e miniaturas 320×180 confirmados nos elementos de vídeo. Não foi ligada a câmera/microfone físicos do usuário.
- Projeto real: catálogo de seis salas, autenticação de visitante, autorização de entrada e emissão de token com fontes limitadas. Nenhuma mensagem de teste enviada a pessoas reais.

### Reproduzir verificação local

`node scripts/community-preview.mjs` abre em `http://127.0.0.1:5176/rooms`.
Usa PostgreSQL PGlite e identidades fictícias; não escreve no Supabase.
Para vídeo, iniciar o [servidor LiveKit local](https://docs.livekit.io/transport/self-hosting/local/)
com `--dev --bind 127.0.0.1 --node-ip 127.0.0.1`, e executar o script com `--video`.
Abrir `/scripts/community-cameras.html` e iniciar as seis transmissões sintéticas.
`/scripts/community-mobile.html` incorpora o chat em uma tela de 390×844.
Esses arquivos de teste não são entradas do build de produção.

## Limites e publicação

Frontend preparado na PR #6, baseado em `feat/garage-proximity-prototype`. A atualização
não é automaticamente publicação no domínio principal. A prévia Vercel da PR permite revisão.

A consulta de mensagens/presença continua a cada 3 segundos, com as últimas 50 mensagens.
Paginação do catálogo é feita no navegador; não houve teste de carga com centenas de usuários
simultâneos. A autodeclaração 18+ não é verificação documental. Bloqueios valem para a identidade
autenticada; visitantes podem criar outra sessão. Não há edição/exclusão de sala nem expurgo
programado de mensagens nesta fase. Validação de câmera física, 4G e sessão prolongada em
aparelhos reais continua recomendada antes da divulgação ampla.

Advisors: as tabelas novas aparecem como “RLS sem política” por serem acessíveis apenas
pelo servidor ([explicação](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)).
Alertas de funções legadas e configuração de senhas não foram modificados por esta entrega.
