# Plano V4 — Fundação

**Data:** 2026-09-02
**Base:** análise do site e do produto no commit `5b328c5`
**Equipe assumida:** 1 pessoa + AI, ~5 dias úteis por semana
**Horizonte:** 12 semanas em 5 fases

---

## Objetivo

Transformar o Disque Amizade de "blog de 480 artigos preso dentro de um app que exige login" em "o bate-papo brasileiro com vídeo que funciona, sem cadastro, e que o Google e o WhatsApp conseguem mostrar".

Uma única prioridade nº 1: **uma sala principal, aberta a convidado, em modo espectador, rodando em LiveKit no modelo palco.** Tudo o mais se apoia nisso.

## Princípios

1. Nada simulado. Sem bots, contadores inflados, depoimentos inventados ou respostas prontas.
2. Primeira conversa real em menos de 60 segundos a partir da home.
3. Vídeo tem de aguentar 20 pessoas numa sala em 4G.
4. Segurança antes de crescimento: moderação executada no servidor, não no cliente.
5. Uma promessa só: "bate-papo brasileiro com vídeo, sem cadastro". Nostalgia do 145 é gancho de marca, não a promessa.
6. Consolidar antes de expandir: uma sala cheia vale mais que trinta vazias; 150 artigos fortes valem mais que 480 fracos.

## Métricas norte

| Métrica | Como medir | Meta em 12 semanas |
|---|---|---|
| % de visitantes que veem outra pessoa real em até 60 s | evento `room_first_remote_seen` | > 30% |
| % de sessões com ≥ 1 mensagem recebida de humano | evento `chat_msg_received_human` | > 40% |
| Retenção de 5 min na sala | evento `room_5min` | > 35% |
| Retorno no dia seguinte (D1) | usuário/convidado com cookie | > 15% |
| LCP mobile da home | Search Console / PageSpeed | < 2,5 s |
| Impressões do site no Google | Search Console | +100% sobre a semana 1 |
| Denúncias por 100 sessões | tabela `reports` | acompanhar, sem meta ainda |

Nenhuma dessas existe hoje. A Fase 0 cria todas.

---

## Fase 0 — Medir e parar de mentir (semana 1)

Objetivo: ter dados reais e remover tudo que engana o usuário. Nada aqui depende de decisão de produto.

| # | O que muda | Onde | Esforço | Pronto quando |
|---|---|---|---|---|
| 0.1 | Instalar analytics com 6 eventos: `home_view`, `cta_enter_click`, `room_joined`, `room_first_remote_seen`, `chat_msg_received_human`, `room_5min` | `index.html`, `src/pages/RoomPage.tsx`, novo `src/services/analytics.ts` | 1 d | eventos aparecem no painel (GA4 ou Plausible) |
| 0.2 | Microsoft Clarity para gravação de sessão | `index.html` | 0,5 h | gravações chegando |
| 0.3 | Verificar Search Console e enviar sitemap | Search Console | 0,5 h | relatório de cobertura visível |
| 0.4 | Remover depoimentos fixos da home | `src/pages/HomePage.tsx` (`testimonials`) | 0,5 h | seção some ou mostra só dados reais |
| 0.5 | Desligar `inflated_counters` e `bots_presence` e apagar o código que os usa | `database/admin-schema.sql` (`cold_start`), `src/hooks/useSupabaseData.ts` (`useStats`), `src/pages/RoomPage.tsx` (tiles simulados, aceite de 1:1 por bot, respostas prontas), `src/hooks/useStage.ts` (`BOT_STAGE_NAMES`) | 1 d | grep por `sim-`, `bot-`, `inflated` não retorna nada em `src/` |
| 0.6 | Contador aleatório "X pessoas online" nos artigos vira contagem real ou some | `src/components/blog/BlogRoomCTA.tsx`, `src/pages/blog/BlogPostPage.tsx` | 1 h | nenhum `Math.random` gera número mostrado ao usuário |
| 0.7 | DM privada de verdade: canal por par de usuários (`dm:<idA>-<idB>` ordenado) em vez de broadcast com prefixo `[DM:]` | `src/services/supabase/roomChat.ts`, `src/pages/RoomPage.tsx` | 1 d | um terceiro na sala, com console aberto, não vê a DM |
| 0.8 | Corrigir sitemap: tirar `/contato`, adicionar `/sobre`; rota desconhecida responde 404 real em vez de redirecionar para a home | `public/sitemap.xml`, `scripts/regenerate-sitemap.py`, `src/App.tsx`, `public/404.html` | 2 h | Search Console sem soft 404 |
| 0.9 | Atualizar rodapé (© 2026) e remover links "Termos"/"Privacidade" com `href="#"` na tela de login | `src/components/common/Footer.tsx`, `src/pages/AuthPage.tsx` | 0,5 h | links funcionam |

Critério de saída da fase: painel com os 6 eventos preenchendo; zero simulação no código.

---

## Fase 1 — A sala que funciona (semanas 1 a 3)

Objetivo: uma sala onde 20 pessoas conseguem se ver, no celular, sem cadastro. Esta é a prioridade nº 1.

| # | O que muda | Onde | Esforço | Pronto quando |
|---|---|---|---|---|
| 1.1 | **Trocar a malha P2P por LiveKit (SFU).** `RoomPage` passa a usar `useLiveKit` + edge function `livekit-token`. `webrtcRoom` fica só na roleta até 1.7 | `src/pages/RoomPage.tsx`, `src/hooks/useLiveKit.ts`, `supabase/functions/livekit-token`, `.env` (`VITE_LIVEKIT_URL`) | 3 d | 8 câmeras ligadas ao mesmo tempo, cada uma enviando um único fluxo; teste em 4G no celular |
| 1.2 | **Modelo palco.** Até 8 câmeras publicando; os demais assistem e conversam. Fila "pedir câmera" com auto-promoção quando abre vaga. `useStage` vira estado sincronizado (Supabase broadcast + tabela `room_stage`), não local | `src/hooks/useStage.ts`, `src/components/rooms/Stage.tsx`, nova migration `room_stage` | 2 d | dois navegadores veem a mesma fila e o mesmo palco |
| 1.3 | **Modo espectador.** Entrar na sala vê vídeo e chat sem ligar câmera. Botão único "Ligar minha câmera" dentro da sala. Remover a condição `!stream` para conectar | `src/pages/RoomPage.tsx` (efeito que chama `webrtcRoom.join` / futuro `connectToRoom`) | 1 d | usuário que nega permissão de câmera vê os vídeos dos outros |
| 1.4 | **Convidado com vídeo.** Convidado recebe token LiveKit com identidade `guest-<id>` e apelido escolhido na entrada; limites: 1 sala por vez, sem DM, sem criar sala | `src/store/authStore.ts` (`signInAsGuest`), `supabase/functions/livekit-token`, `src/components/auth/ProtectedRoute.tsx` | 1 d | convidado liga câmera e é visto |
| 1.5 | **Sala principal única.** "Geral Brasil" é destino padrão de todo CTA. As outras salas ficam ocultas na listagem até a principal passar de 20 pessoas por 10 min. Desligar auto-escala (`#2`, `#3`) por enquanto | `src/pages/RoomsPage.tsx`, `src/pages/HomePage.tsx`, `supabase/migrations/20240130_smart_rooms_system.sql` (função de auto-scale) | 1 d | listagem mostra 1 sala quando há < 20 pessoas |
| 1.6 | **Cortar a sala ao essencial.** Fica: vídeo, chat, máscaras, DM, denunciar, bloquear, compartilhar. Sai para trás de flag `VITE_FEATURE_EXTRAS`: Jukebox, YouTube, push-to-talk, 1:1 dentro da sala, camarote, "mutar todos" por rei. `RoomPage.tsx` sai de 1.969 linhas para < 800 dividido em `RoomVideoGrid`, `RoomChat`, `RoomControls` | `src/pages/RoomPage.tsx`, `src/components/rooms/*` | 2 d | build passa, sala funciona sem os extras |
| 1.7 | **Roleta em LiveKit** com sala de 2 (`roulette-<a>-<b>`), filtros de cidade e faixa etária aplicados no pareamento, sem repetir a mesma pessoa por 24 h (tabela `roulette_history`), denúncia dentro do match, convidado permitido | `src/pages/RoulettePage.tsx`, `src/services/supabase/matchmaking.ts`, nova migration `roulette_history` | 2 d | dois usuários com filtro "São Paulo" se encontram; um de "Recife" não entra |
| 1.8 | **Mobile em formato de live.** Vídeo em tela cheia, chat sobreposto semitransparente, controles embaixo. Remover o `hidden md:flex` que esconde o vídeo quando o chat abre. `MobileNav` some dentro da sala | `src/pages/RoomPage.tsx`, `src/components/common/MobileNav.tsx` | 1,5 d | no celular, vídeo e chat visíveis ao mesmo tempo |
| 1.9 | **Estado vazio honesto.** Quando só há uma pessoa: "Você é a primeira pessoa aqui" + botão "Chamar alguém pelo WhatsApp" com link da sala + "Próximo horário movimentado: 21h" | `src/pages/RoomPage.tsx` | 0,5 d | aparece só quando `remoteParticipants.length === 0` |
| 1.10 | **Arauto com volume.** Anúncio de entrada só por texto por padrão; voz opcional e uma vez por sessão; sem chamada ao Gemini para convidado | `src/hooks/useHostBot.ts`, `src/hooks/useTTS.ts` | 0,5 d | entrar duas vezes não repete voz |

Critério de saída: teste com 10 pessoas reais (amigos, grupo de WhatsApp) numa sala, no celular, por 20 minutos, sem queda. Eventos `room_first_remote_seen` e `room_5min` registrando.

Teste formal:
- Hipótese: com espectador + convidado + sala única, mais de 30% dos visitantes veem outra pessoa em 60 s.
- Período: 2 semanas após deploy. Abandonar se < 15%: o problema é tráfego, não fricção, e a Fase 2 sobe de prioridade.

---

## Fase 2 — Ser encontrado e entrar em um clique (semanas 3 a 5)

Objetivo: o Google indexa páginas transacionais, o WhatsApp mostra a prévia certa, e a home leva direto para a sala.

| # | O que muda | Onde | Esforço | Pronto quando |
|---|---|---|---|---|
| 2.1 | **CTA único na home: "Entrar agora, sem cadastro".** Um clique cria sessão de convidado, confirma 18+ no mesmo passo e abre a sala principal. "Criar conta" vira link secundário | `src/pages/HomePage.tsx`, `src/components/common/AgeVerificationModal.tsx`, `src/store/authStore.ts` | 1 d | do clique à sala em 1 tela |
| 2.2 | **Pré-render de tudo que é público.** Script de build gera `dist/blog/<slug>/index.html` e `dist/sala/<slug>/index.html` com `<title>`, description, OG, canonical e JSON-LD reais, e o app hidrata por cima. Ajustar rewrite da Vercel para servir o estático antes do fallback | `generate_blog.js` → novo `scripts/prerender.mjs`, `vite.config.ts`, `vercel.json`, `package.json` (`build`) | 3 d | `curl` de um artigo devolve título e OG do artigo; prévia certa no WhatsApp |
| 2.3 | **Páginas públicas de sala** (`/sala/geral`, `/sala/sao-paulo`, `/sala/paquera`, `/sala/30-mais`, `/sala/nordeste` e as 30 oficiais): H1, descrição, FAQ com schema, contagem real de pessoas, prévia dos tiles borrada, CTA "Entrar". Indexáveis sem login. Substituem a rota protegida `/rooms` como destino de SEO | nova `src/pages/SalaPublicaPage.tsx`, `src/App.tsx`, `public/sitemap.xml` | 2 d | 30 URLs `/sala/*` no sitemap e indexáveis |
| 2.4 | **Performance.** `React.lazy` por rota; MediaPipe, face-api e LiveKit só carregam quando a rota precisa; `manualChunks` para vendor. Imagens da home e das features em WebP/AVIF, hero de 1,9 MB → ≤ 150 kB. Remover Phosphor (unpkg) e usar só Lucide. Fontes: Bricolage + Inter em 2 pesos cada | `src/App.tsx`, `vite.config.ts`, `index.html`, `public/*.png`, `public/features/*.png` | 2 d | JS inicial < 250 kB gzip; LCP mobile < 2,5 s no PageSpeed |
| 2.5 | **Uma mensagem só.** Title: "Disque Amizade — Bate-papo com vídeo, sem cadastro". H1 na mesma linha. Nostalgia do 145 fica como badge. Home perde Marketplace, Ostentação, Creator e Fichas. Header cai de 9 links para 4: Entrar, Salas, Blog, Sobre | `index.html`, `src/pages/HomePage.tsx`, `src/components/common/Header.tsx`, `src/pages/AboutPage.tsx` | 1 d | uma promessa em title, H1 e Sobre |
| 2.6 | **Compartilhar no WhatsApp** de dentro da sala com link `/sala/<slug>` e OG por sala (depende de 2.2) | `src/pages/RoomPage.tsx` (`handleShareRoom`) | 0,5 d | link colado no WhatsApp mostra nome e imagem da sala |
| 2.7 | **Imagens do blog** de PNG (88 MB) para WebP redimensionado (meta: < 15 MB) | `public/blog-images/*`, script em `scripts/` | 0,5 d | `dist` < 40 MB |
| 2.8 | Manifest PWA real (nome, ícones, `display: standalone`) | `public/manifest.webmanifest`, `index.html` | 0,5 h | "Adicionar à tela inicial" funciona no Android |

Critério de saída: Search Console mostrando impressões para `/sala/*`; PageSpeed mobile verde na home; prévia correta de artigo e sala no WhatsApp.

---

## Fase 3 — Segurança de verdade (semanas 5 a 7)

Objetivo: vídeo anônimo com moderação executada no servidor. Sem isso, o crescimento da Fase 2 vira problema.

| # | O que muda | Onde | Esforço | Pronto quando |
|---|---|---|---|---|
| 3.1 | **Expulsar e banir no servidor.** Edge function `moderate-user` que remove o participante da sala LiveKit (API `RemoveParticipant`), grava em `bans` e nega token futuro. O broadcast `ban-user` do cliente é removido | nova `supabase/functions/moderate-user`, `supabase/functions/livekit-token` (checa `bans`), `src/pages/RoomPage.tsx` | 2 d | banido não consegue novo token por 24 h |
| 3.2 | **Denúncia com efeito.** 2 denúncias de usuários distintos em 10 min ocultam a câmera do denunciado para todos e notificam o admin por e-mail. Denúncia guarda `room_id` e últimos 20 s de chat | `supabase/migrations` (trigger em `reports`), `api/send-email.ts`, `src/pages/RoomPage.tsx` | 1,5 d | teste com 2 contas gera ocultação automática |
| 3.3 | **Bloquear pessoa** persistido em `blocked_users`; bloqueado não aparece no grid nem no chat, e não é pareado na roleta | nova migration `blocked_users`, `src/pages/RoomPage.tsx`, `src/services/supabase/matchmaking.ts` | 1 d | bloqueio sobrevive a recarregar a página |
| 3.4 | **Filtro de chat no servidor.** Mensagens passam por edge function com lista de palavras, bloqueio de links e rate limit (5 por 3 s) antes de ir para o canal. RLS de `chat_messages` impede insert direto | nova `supabase/functions/send-chat`, `src/services/supabase/roomChat.ts`, `supabase/migrations/002_rls_policies.sql` | 1,5 d | link enviado não chega aos outros; 6ª mensagem em 3 s é recusada |
| 3.5 | **Detector de nudez no cliente.** Amostra 1 quadro por segundo da própria câmera com modelo NSFW (ex.: nsfwjs) no pipeline que já roda MediaPipe; acima do limiar, borra a câmera publicada e registra evento; 3 eventos em 5 min = câmera desligada e denúncia automática | `src/hooks/useVideoFilter.ts`, `src/hooks/useCompositeStream.ts`, novo `src/hooks/useNsfwGuard.ts` | 2 d | teste com imagem de referência dispara o borrão |
| 3.6 | **Verificação 18+ com peso.** Manter o modal, mas registrar aceite com data e IP na sessão do usuário e mostrar link para denunciar menor. Dark Room continua desligado | `src/components/common/AgeVerificationModal.tsx`, `supabase/migrations` | 0,5 d | aceite gravado |
| 3.7 | **Painel de moderação mínimo** em `/admin`: fila de denúncias, ver contexto, banir, encerrar sala | `src/pages/AdminPage.tsx` | 1,5 d | Juliano resolve uma denúncia em < 1 min |

Critério de saída: uma denúncia real passa por ocultação automática, revisão no painel e ban no servidor sem tocar em código.

---

## Fase 4 — Motivo para voltar (semanas 7 a 10)

Objetivo: transformar visita em hábito. Só começa depois de ver `room_5min` acima de 35%.

| # | O que muda | Onde | Esforço | Pronto quando |
|---|---|---|---|---|
| 4.1 | **Perfil no banco.** Bio, cidade, interesses e máscara favorita saem do `localStorage` e vão para `profiles`. Convidado que cria conta herda o apelido | `src/components/profile/BioEditor.tsx`, `src/hooks/useHostBot.ts`, `api/update-profile.ts` | 1 d | bio aparece em outro navegador |
| 4.2 | **Amigos e "fulano entrou".** Adicionar amigo dentro da sala; e-mail (e push quando houver PWA) quando um amigo entra numa sala. Um aviso por amigo por dia | nova migration `friendships`, `api/send-email.ts`, `supabase/functions` (trigger em `room_participants`) | 2 d | e-mail chega em < 1 min |
| 4.3 | **Programa diário às 21h.** Um horário fixo com host humano (Juliano ou voluntário) na sala principal; contagem regressiva na home e nas páginas `/sala/*`; Arauto abre o programa | `src/pages/HomePage.tsx`, `src/pages/SalaPublicaPage.tsx`, `src/hooks/useHostBot.ts` | 1 d + operação diária | 3 programas consecutivos com ≥ 10 pessoas |
| 4.4 | **Máscaras por progressão.** 3 máscaras liberadas para todos (inclusive convidado); demais desbloqueiam por tempo na sala (30 min, 2 h, 10 h). Compra vira atalho, não porta | `src/config/plans.config.ts`, `src/components/camera/CameraMasks.tsx`, `profiles.time_online_minutes` | 1 d | convidado usa máscara no primeiro minuto |
| 4.5 | **Retomar sala ao voltar.** Cookie de convidado de 30 dias com apelido; ao voltar, cai direto na última sala | `src/store/authStore.ts` | 0,5 d | D1 medível para convidado |
| 4.6 | **Onboarding de 10 segundos** na primeira entrada: escolher apelido, escolher máscara, entrar. Sem tour | `src/pages/RoomPage.tsx` ou novo `src/components/rooms/FirstEntry.tsx` | 1 d | 3 toques do link à sala |

Critério de saída: D1 de convidado acima de 15%; programa das 21h com público recorrente.

---

## Fase 5 — Conteúdo que rende (semanas 9 a 12)

Objetivo: transformar 480 artigos em ativo, não em risco, e usar as máscaras como topo de funil.

| # | O que muda | Onde | Esforço | Pronto quando |
|---|---|---|---|---|
| 5.1 | **Congelar publicação** de novos artigos até o fim da consolidação | `generate_blog.js`, `scripts/append-articles.py` | 0 | nenhum post novo por 4 semanas |
| 5.2 | **Consolidar categorias** de 70 para 8 (`chat`, `video`, `dicas`, `seguranca`, `comparativo`, `cidades`, `relacionamento`, `bem-estar`) | `public/blog-posts/index.json`, `src/pages/blog/BlogPage.tsx` | 0,5 d | filtro do blog mostra 8 categorias |
| 5.3 | **Fundir duplicados.** Agrupar por tema (ex.: 6 posts "alternativa bate-papo uol" viram 1), manter o melhor, redirecionar os outros com 301 em `vercel.json`. Meta: ~150 artigos | `public/blog-posts/index.json`, `vercel.json` (`redirects`), `public/sitemap.xml` | 3 d | sitemap com ~150 URLs de blog; 301 funcionando |
| 5.4 | **Autor real.** Página `/sobre/juliano` com foto e história; `author` nos posts e no JSON-LD `Person` | `src/pages/AboutPage.tsx`, `public/blog-posts/index.json`, `scripts/prerender.mjs` | 0,5 d | JSON-LD `Article.author` é `Person` |
| 5.5 | **Reescrever os 20 posts com mais impressões** no Search Console, com dados reais do produto (quantas pessoas, horários de pico, máscaras) | Search Console + `public/blog-posts/index.json` | 3 d | CTR médio dos 20 sobe |
| 5.6 | **Landing pages, não posts,** para "alternativa bate-papo uol", "omegle brasil" e "chat sem cadastro": comparação real, CTA direto para `/sala/geral` | novas rotas em `src/App.tsx`, `scripts/prerender.mjs` | 1,5 d | 3 páginas indexadas |
| 5.7 | **Máscaras em vídeo curto.** 10 vídeos de 15 s (Jaspion, He-Man, Cheetara, Madonna em chamada real) para TikTok e Reels, com link para `/sala/geral` e UTM | produção fora do código | 2 d | visitas com `utm_source=tiktok` no painel |
| 5.8 | **Sitemap com prioridade real**: home e `/sala/*` em 1.0, landing pages 0.9, blog 0.6, `lastmod` verdadeiro | `scripts/regenerate-sitemap.py` | 0,5 d | sitemap regenerado no build |

Critério de saída: impressões dobradas sobre a semana 1 com menos URLs; tráfego social medível.

---

## Backlog congelado (não fazer nas 12 semanas)

| Item | Por que atrai | Por que distrai | Reconsiderar quando |
|---|---|---|---|
| Marketplace e Creators | receita | precisa de comunidade que não existe | > 500 usuários ativos por semana |
| Fichas, camarotes pagos, Ostentação | receita | monetizar sala vazia não rende e polui a home | `room_5min` > 35% por 4 semanas |
| Dark Room 18+ | volume de busca | moderação ainda não existe (Fase 3) | Fase 3 concluída e 30 dias sem incidente |
| Jukebox, YouTube, push-to-talk | diversão | estado local, não sincronizado; aumenta bug e peso | após 1.6, se usuários pedirem |
| XP, badges, ranking | retenção | retenção vem de gente, não de pontos | Fase 4 concluída |
| App nas lojas | alcance | PWA cobre Android; iOS pode esperar | D1 > 20% |
| Mais artigos de blog | tráfego | risco de penalidade por escala; sem conversão | Fase 5 concluída e CTR subindo |
| Google Ads | tráfego rápido | sem tracking e sem entrada em 1 clique, paga por cliques que morrem no login | Fases 0 e 2 concluídas |
| Novas máscaras | conteúdo | já há 15; o problema é distribuição | 5.7 rodando |
| Redesign do design system | estética | o visual é competente; o problema é fricção e peso | nunca por iniciativa própria |

---

## Cronograma

```
Semana  1  ████ Fase 0 · medir e limpar
Semana  1-3 ████████████ Fase 1 · a sala que funciona  ← prioridade nº 1
Semana  3-5 ████████████ Fase 2 · ser encontrado, entrar em 1 clique
Semana  5-7 ████████████ Fase 3 · segurança no servidor
Semana  7-10 ████████████████ Fase 4 · motivo para voltar
Semana  9-12 ████████████████ Fase 5 · conteúdo que rende
```

Esforço total estimado: ~55 dias úteis de desenvolvimento + operação diária do programa das 21h a partir da semana 7.

## Portas de decisão

| Ao fim de | Pergunta | Se sim | Se não |
|---|---|---|---|
| Fase 1 | 30% dos visitantes veem outra pessoa em 60 s? | seguir para Fase 2 | Fase 2 antes de polir a sala: o gargalo é tráfego |
| Fase 2 | `/sala/*` tem impressões e LCP < 2,5 s? | Fase 3 | revisar pré-render antes de seguir |
| Fase 3 | denúncia resolvida sem tocar em código? | Fase 4 | não abrir Dark Room nem Ads |
| Fase 4 | D1 > 15%? | Fase 5 e considerar monetização | repensar o programa das 21h |

## Dados que faltam e como coletar

- Tráfego atual, origem e taxa de cadastro: Search Console + analytics da Fase 0.
- Quantos usuários reais existem hoje: `select count(*) from profiles` e `room_participants` por dia.
- Custo atual de TURN (Metered) por mês: painel da Metered; deve cair com LiveKit.
- Minutos de LiveKit no free tier (10 mil/mês): acompanhar a partir da Fase 1; 20 pessoas × 1 h = 1.200 minutos.

## Ordem de execução recomendada para começar hoje

1. 0.5 e 0.7 (simulações e DM) — meio dia, risco zero, tira o passivo.
2. 0.1 e 0.2 (eventos e Clarity) — meio dia, começa a medir antes de mudar.
3. 1.3 e 1.4 (espectador e convidado com vídeo) — 2 dias, ainda na malha atual, já libera a primeira conversa.
4. 1.1 e 1.2 (LiveKit e palco) — 5 dias, a fundação.
5. 1.5 e 1.6 (sala única e corte) — 3 dias.
6. Teste com 10 pessoas reais. Só então Fase 2.
