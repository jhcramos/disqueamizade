# Deploy e validação — Fases 1 a 3

Guia para colocar no ar o vídeo (LiveKit) e a moderação de servidor (Supabase)
que estão neste PR. Feito para copiar e colar. Tempo estimado: 30–45 min.

> Nota: este runbook precisa ser executado por você — o assistente não tem
> acesso ao seu projeto Supabase nem à sua conta LiveKit/Vercel.

---

## Visão geral do que precisa existir

| Peça | Onde | Para quê |
|---|---|---|
| Projeto LiveKit Cloud | livekit.io | servidor de vídeo (SFU) |
| `VITE_LIVEKIT_URL` | Vercel (env) | o navegador saber a URL do LiveKit |
| Edge functions | Supabase | token, denúncia, moderação |
| Secrets das functions | Supabase | credenciais LiveKit + service role |
| Migration `004` | Supabase | tabelas de moderação |
| `profiles.is_admin = true` | Supabase | acessar o `/admin` |

---

## 1. LiveKit Cloud (5 min)

1. Crie conta em https://cloud.livekit.io (free tier: 10 mil min/mês).
2. Crie um projeto. Anote na aba **Settings → Keys**:
   - **WebSocket URL** — formato `wss://SEU-PROJETO.livekit.cloud`
   - **API Key** — começa com `API...`
   - **API Secret**

## 2. Variáveis no Vercel (5 min)

No projeto `disqueamizade` na Vercel → **Settings → Environment Variables**,
confirme/adicione (para Production e Preview):

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co        # provavelmente já existe
VITE_SUPABASE_ANON_KEY=eyJ...                            # provavelmente já existe
VITE_LIVEKIT_URL=wss://SEU-PROJETO.livekit.cloud         # NOVO
# opcional (analytics da Fase 0):
# VITE_PLAUSIBLE_DOMAIN=disqueamizade.com.br    (ou)   VITE_GA_ID=G-XXXX
```

Depois **redeploy** (a Vercel refaz o build com as novas envs).

> Só `VITE_LIVEKIT_URL` vai para o navegador. A API Key/Secret do LiveKit
> NUNCA vão no cliente — ficam só nas edge functions (passo 4).

## 3. Migration de moderação (2 min)

No Supabase → **SQL Editor**, cole e rode o conteúdo de
`supabase/migrations/004_moderation_v4.sql` (deste repo). Ele é idempotente
(usa `IF NOT EXISTS`), então rodar de novo não quebra.

Se já tiver o Supabase CLI ligado ao projeto:

```bash
supabase db push        # aplica as migrations pendentes
```

## 4. Secrets das edge functions (3 min)

No Supabase, pegue em **Settings → API**:
- **Project URL** (`https://SEU-PROJETO.supabase.co`)
- **service_role key** (secreta — nunca exponha no cliente)

Defina os secrets (Supabase CLI):

```bash
supabase secrets set \
  SUPABASE_URL="https://SEU-PROJETO.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY" \
  LIVEKIT_URL="wss://SEU-PROJETO.livekit.cloud" \
  LIVEKIT_API_KEY="APIxxxx" \
  LIVEKIT_API_SECRET="xxxx"
```

## 5. Deploy das edge functions (3 min)

```bash
supabase functions deploy livekit-token
supabase functions deploy report-user
supabase functions deploy moderate-user
```

- `livekit-token` — emite o token de vídeo e nega quem está banido.
- `report-user` — grava denúncia (conta até de convidado).
- `moderate-user` — expulsa+bane no servidor (só admin).

## 6. Vire admin (1 min)

No SQL Editor, com o seu usuário já cadastrado:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'SEU_EMAIL');
```

Agora `/admin` abre para você (fila de denúncias, bans, palavras proibidas).

---

## 7. Checklist de validação ao vivo

Faça em **duas abas anônimas diferentes** (ou dois aparelhos) para simular
duas pessoas. Use `?` = confira.

### Fase 1 — sala
- [ ] Abrir a home → **"Entrar agora, sem cadastro"** cai na sala em 1 clique.
- [ ] Entrou como **espectador** (vê a sala sem ligar a câmera).
- [ ] **"Ligar minha câmera"** publica seu vídeo; a outra aba te vê.
- [ ] **Máscara** aplicada aparece igual na outra aba (stream composto).
- [ ] 8ª câmera: as demais assistem (modelo palco). Banda estável no celular 4G.
- [ ] **Estado vazio**: sozinho, aparece "primeira pessoa aqui" + WhatsApp.
- [ ] **DM**: mande uma DM; abra o console (F12) numa 3ª aba na mesma sala e
      confirme que a DM NÃO aparece nos eventos do canal público.

### Fase 1 — roleta
- [ ] `/roulette` entra convidado e pareia duas abas.
- [ ] Com **filtro "São Paulo"** dos dois lados, pareiam; com cidades
      diferentes, não pareiam.
- [ ] **"Próximo"** troca de pessoa e não repete a mesma na sequência.

### Fase 2 — SEO/perf
- [ ] `curl -s https://SEU-DOMINIO/blog/UM-SLUG | grep -i '<title>'` mostra o
      título do artigo (não o genérico) — prova do pré-render.
- [ ] Colar um link `/sala/geral-brasil` no WhatsApp mostra título+descrição.
- [ ] PageSpeed mobile da home: LCP < 2,5s; o vídeo não baixa na home.

### Fase 3 — moderação
- [ ] Clicar **Denunciar** numa aba → em `/admin` a denúncia aparece na fila.
- [ ] Mandar no chat um link (`http://...`) → a mensagem é barrada.
- [ ] Palavrão da lista → aparece mascarado (`p***`).
- [ ] No `/admin`, **banir** um usuário de teste → ele não consegue novo token
      (recarregar a sala dá "Vídeo indisponível/banned").
- [ ] (Trigger) 2 denúncias de contas diferentes contra o mesmo usuário em
      10 min → `profiles.hidden_until` fica preenchido para ele.

---

## Problemas comuns

- **"Vídeo indisponível"** na sala → `VITE_LIVEKIT_URL` não chegou ao build
  (faltou redeploy na Vercel) ou a function `livekit-token` não está no ar.
- **Denúncia não aparece no /admin** → `report-user` sem deploy, ou os secrets
  `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` não foram setados.
- **Ban não impede o retorno** → `livekit-token` sem os secrets do Supabase
  (a checagem de ban degrada e emite o token mesmo assim).
- **`/admin` redireciona pra home** → seu `profiles.is_admin` não é `true`.

---

## Ainda pendente (follow-up, fora deste PR)

- Detector de nudez no cliente (nsfwjs) — dependência pesada, testar ao vivo.
- RLS mais rígida da DM (hoje canal por par, melhor que o anterior mas não
  autenticado no transporte).
- Converter as 88 MB de `public/blog-images` para WebP.
