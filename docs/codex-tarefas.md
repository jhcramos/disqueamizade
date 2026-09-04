# Tarefas para o Codex — limpeza do projeto antigo + ações pendentes

> Base: branch `claude/disque-amizade-site-analysis-1f88kk` (produção atual).
> Repositório: `jhcramos/disqueamizade`.
>
> **Regras gerais (valem para tudo abaixo):**
> - Trabalhe em uma branch nova a partir da `main` e abra 1 PR por parte (Parte A e Parte B podem ser 2 PRs).
> - Depois de cada remoção, rode `npm run build` (que é `tsc && vite build && prerender`) e garanta **verde**. `tsc` acusa qualquer import quebrado.
> - Nunca remova nada da **lista "MANTER"** abaixo.
> - Não altere comportamento das telas mantidas. Isto é limpeza, não redesign.
> - Ao remover uma página, remova também: a rota em `src/App.tsx`, o `lazy(import(...))` no topo do `App.tsx`, e qualquer link no `Header`/`Footer`/`HomePage`.

---

## MANTER (produto atual — não mexer na função)

Rotas/telas do produto de hoje:
- `/` HomePage · `/rooms` RoomsPage · `/room/:roomId` (`src/rooms/RoomPage.tsx`)
- `/roulette` RoulettePage (+ `src/rooms/RouletteCall.tsx`, `src/rooms/*`)
- `/sala/:slug` SalaPublicaPage · `/filtros` VideoFiltersPage (máscaras)
- `/blog`, `/blog/:slug`, `/sobre` AboutPage
- `/auth`, `/reset-password`, `/profile/:userId` ProfilePage
- `/termos`, `/privacidade`, `/lgpd`, `/diretrizes` (LegalPage)
- `/admin` AdminPage · `*` NotFoundPage
- Infra de sala: `src/rooms/*`, `src/vision/*`, `src/masks/*`, `src/hooks/useCamera|useVideoFilter|useCompositeStream`, `src/services/{analytics,moderation,supabase}`, `src/config/site.ts`.

---

# PARTE A — Auditoria e remoção do projeto antigo

O produto hoje é "bate-papo com vídeo, sem cadastro". Sobrou muita coisa da fase
antiga (marketplace, creators, fichas/ostentação, camarote, balada, jukebox,
dark room, páginas de protótipo). Remover tudo isso.

### A.1 — Páginas órfãs (0 referências no código) → deletar arquivo
Confirmado que ninguém importa nem roteia:
- `src/pages/ComponentsShowcase.tsx`
- `src/pages/DarkRoomPage.tsx`
- `src/pages/HomePageV3.tsx`
- `src/pages/PistaPage.tsx`
- `src/pages/RoletaPage.tsx`  (roleta antiga; a atual é `src/pages/RoulettePage.tsx` — NÃO confundir)
- `src/pages/SecretCabinsPage.tsx`

**Pronto quando:** arquivos deletados, `tsc` verde.

### A.2 — Páginas do projeto antigo que AINDA estão roteadas → deletar página + rota
Em `src/App.tsx`, remover o `lazy(...)` e a `<Route>` de cada uma, e apagar o arquivo:
- `MarketplacePage` (`/marketplace`)
- `PricingPage` (`/pricing`)  → **e remover o link `/pricing` do Header** (`src/components/common/Header.tsx`, ~linha 93)
- `HobbiesPage` (`/hobbies`)
- `CamarotePage` (`/camarote/:camaroteId`)
- `InfluencerDashboardPage` (`/creator`)
- `CreatorProfilePage` (`/creator/:id`)
- `DesignSystemPage` (`/design`)

**Atenção:** `ProtectedRoute` é usado por essas rotas; ao remover as rotas ele pode
ficar sem uso — se `grep` mostrar 0 usos de `ProtectedRoute` depois, remover também
(`src/components/auth/ProtectedRoute.tsx`); se ainda houver uso, manter.

**Pronto quando:** nenhuma dessas rotas existe, Header sem link para elas, build verde.

### A.3 — Pastas de componentes do projeto antigo → deletar a pasta inteira
Depois de A.1/A.2, estas ficam órfãs (verificado):
- `src/components/balada/`   (só era usada por RoletaPage/CamarotePage)
- `src/components/fichas/`   (OstentacaoBadge — ver A.4)
- `src/components/games/`    (SpeedDating; 0 rotas)
- `src/components/gifts/`
- `src/components/creators/`
- `src/components/featured/`
- `src/components/design-system/`  (PhaseIndicator; só CamarotePage usava)

**Antes de apagar cada pasta**, rode `grep -rn "components/<pasta>/" src` e confirme
que só sobra referência de arquivos que também estão sendo removidos.

### A.4 — Limpeza de Header / Home / dados mock
- `src/components/common/Header.tsx`: remover `import { OstentacaoBadge }` e qualquer
  uso dele; remover link `/pricing`. O Header deve ficar com: Salas, Roleta 1:1, Blog, Sobre.
- `src/pages/HomePage.tsx`: remover `import { getPopularHobbies } from '../data/mockHobbies'`
  e a seção que usa isso. Conferir que a Home não referencia marketplace/creator/ostentação/fichas.
- `src/data/`: apagar arquivos mock do projeto antigo que ficarem sem import
  (ex.: `mockHobbies`, `mockExclusiveContent`, e outros `mock*` que o `grep` mostrar com 0 usos).
  Método: para cada arquivo em `src/data/`, `grep -rn "data/<arquivo-sem-ext>" src`; 0 usos → apagar.
  **Não apagar** `src/data/salasPublicas.ts` (é do produto atual).

### A.5 — Serviços/deps do projeto antigo
- Conferir `src/services/stripe/` — se, após remover Pricing/Marketplace, não houver mais
  import de stripe em `src` (`grep -rn "services/stripe\|@stripe\|stripe" src`), remover a pasta.
- `package.json`: remover dependências sem nenhum uso em `src` (confirmado 0 refs hoje):
  `peerjs`, `simple-peer`, `framer-motion`, `howler`, `tone`, `react-youtube`,
  e o(s) pacote(s) `@stripe/*` se A.5 confirmar que stripe saiu.
  Depois: `npm install` para atualizar o lockfile, e build verde.
  **Não remover:** `@mediapipe/tasks-vision`, `@livekit/*`, `livekit-client`,
  `@supabase/supabase-js`, `lucide-react`, `react`, `react-dom`, `react-router-dom`, `zustand`, `sharp`.

### A.6 — Verificação final da Parte A
- `npm run build` verde; `grep -riE "marketplace|ostenta|fichas|camarote|creator|jukebox|dark ?room|balada" src` só retorna, no máximo, ocorrências inertes (comentário/tradução) — idealmente nada.
- Abrir o site e clicar em todos os itens do Header e do Footer: nenhum link morto (404).
- `dist/` continua gerando as 498 páginas do prerender.

---

# PARTE B — Ações pendentes do Plano V4

### B.1 — (item 0.5) Apagar a simulação de vez  ⚠️ prioridade (integridade)
Hoje os toggles "Bots de Presença" e "Contadores Inflados" ainda existem e o código
de simulação continua presente (apenas desligado por padrão).
- `src/hooks/useSupabaseData.ts`: remover os campos `bots_presence`, `inflated_counters`,
  `auto_chat` e todo o ramo de código que gera presença/contagem "simulada"
  (ex.: `const simulated = coldStart.bots_presence ...`). A contagem exibida deve vir
  só de dados reais (participantes reais); na falta, mostrar 0 / estado honesto.
- `src/pages/AdminPage.tsx`: remover os toggles "Bots de Presença" e "Contadores Inflados"
  e os campos correspondentes do objeto de estado.
- Banco: se houver colunas `bots_presence`/`inflated_counters` em `cold_start`/config,
  criar migration para removê-las (ou deixar de lê-las). Documentar no PR.
- **Pronto quando:** `grep -riE "bots_presence|inflated|simulated|auto_chat" src` = 0.

### B.2 — (item 3.4) Filtro de chat no servidor + RLS  ⚠️ prioridade (segurança)
Hoje o filtro (`filterMessage` em `src/services/moderation.ts`) roda só no cliente e o
`roomChat.ts` faz `insert` direto em `chat_messages` (dá para burlar).
- Criar edge function `supabase/functions/send-chat/index.ts`: recebe `{roomSlug, text}`,
  valida sessão, aplica lista de palavras + bloqueio de links + rate limit (ex.: 5 msg / 3 s),
  e só então insere em `chat_messages` com a service role.
- `src/services/supabase/roomChat.ts`: trocar o `insert` direto por chamada à function.
- RLS: em `supabase/migrations/`, política que **proíbe INSERT direto** de cliente em
  `chat_messages` (só service role insere). Manter SELECT/realtime para leitura.
- Manter `filterMessage` no cliente como UX (feedback imediato), mas a verdade é o servidor.
- **Pronto quando:** com o cliente adulterado, uma mensagem com link/palavrão não chega
  aos outros; a 6ª mensagem em 3 s é recusada.

### B.3 — (item 0.2) Microsoft Clarity
- `index.html`: adicionar o snippet do Clarity com o Project ID (pedir ao dono).
- **Pronto quando:** gravações aparecem no painel do Clarity.

### B.4 — (item 2.7) Imagens do blog para WebP (~88 MB em PNG)
- Script (usar `sharp`, já no projeto) que converte `public/blog-images/*.png` para `.webp`
  redimensionado (largura máx ~1200px, qualidade ~80), e atualiza as referências
  (nos posts/`index.json`/prerender) de `.png` para `.webp`.
- **Pronto quando:** `dist/` abaixo de ~40 MB; imagens do blog carregam em WebP.

### B.5 — (item 3.5) Detector de nudez no cliente (opcional, atrás de flag)
- **Decisão do proprietário:** nudez permitida somente nas futuras salas adultas.
  Salas atuais e roleta continuam sem exceção. Uma futura exceção deve depender
  de configuração da sala validada no servidor e acesso restrito a adultos;
  apelido, slug, parâmetro de URL ou toggle local não podem liberar nudez.
  O detector opcional não cria nem ativa salas adultas.
- `src/hooks/useNsfwGuard.ts` novo: 1 quadro/s da câmera local passa por `nsfwjs`
  (carregado sob demanda); acima do limiar, borra o stream publicado; 3 eventos em 5 min
  desligam a câmera e abrem denúncia automática. Integrar no pipeline de `useStageCamera`.
- Deixar atrás de `VITE_FEATURE_NSFW` (dependência pesada; validar performance no celular).
- **Pronto quando:** imagem de referência dispara o borrão; flag desligada = zero custo.

### B.6 — (item 4.1) Perfil no banco
- Migrar bio/cidade/interesses/máscara favorita do `localStorage` para a tabela `profiles`.
- Tela de edição + leitura em `ProfilePage`. Convidado que cria conta herda o apelido.
- **Pronto quando:** bio aparece em outro navegador logado.

### B.7 — (item 4.2) Amigos + "fulano entrou"
- Migration `friendships`; adicionar amigo dentro da sala; e-mail (e push quando houver PWA)
  quando um amigo entra, no máximo 1 aviso por amigo por dia.
- **Pronto quando:** e-mail chega em < 1 min do amigo entrar.

### B.8 — (item 4.6) Onboarding de 10 s
- `src/components/rooms/FirstEntry.tsx` novo: apelido → máscara → entrar, na primeira visita.
  Sem tour. 3 toques do link à sala.
- **Pronto quando:** primeira entrada resolve em 3 toques.

### B.9 — (Fase 5) Conteúdo — precisa de curadoria humana (NÃO fazer mecanicamente)
Fazer só com dados do Search Console e decisão do dono. Resumo do que envolve:
- Congelar novos posts; consolidar 70→8 categorias; fundir duplicados (480→~150) com 301;
  autor real (JSON-LD `Person`); reescrever os 20 posts de maior impressão; landing pages
  ("alternativa bate-papo uol", "omegle brasil", "chat sem cadastro"); prioridade real no sitemap.
- **Não** apagar/fundir artigos em massa sem revisão — risco de SEO.

---

## Ordem sugerida
1. **Parte A** inteira (1 PR) — limpeza, baixo risco, deixa o repo enxuto.
2. **B.1 + B.2** (1 PR) — integridade e segurança, são as mais importantes.
3. B.3, B.4 (rápidas).
4. B.6, B.7, B.8 (retenção) quando a métrica `room_5min` justificar.
5. B.5 e B.9 por último / sob decisão do dono.
