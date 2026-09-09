# Revista da Casa Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar a coleção e os artigos como “Revista da Casa”, substituindo imagens genéricas por capas editoriais temáticas e garantindo links e CTAs válidos para `/garagem`.

**Architecture:** As páginas continuam lendo `/blog-posts/index.json`, mas delegam tema visual, relações e componentes de apresentação a módulos pequenos em `src/components/blog`. A capa combina um dos cenários próprios do produto com categoria e título; relações são calculadas a partir de slugs explícitos, categoria, tags e título. Um validador de build impede artigos, imagens ou links internos inválidos de chegarem à produção.

**Tech Stack:** React 19, TypeScript, React Router, CSS responsivo, Node test runner, Playwright, Vite.

---

## Estrutura de arquivos

- Criar `src/components/blog/blogEditorial.ts`: taxonomia, rótulos, cores, cenas e seleção de tema.
- Criar `src/components/blog/blogRelations.ts`: validação, pontuação e normalização de links.
- Criar `src/components/blog/EditorialCover.tsx`: capa reutilizável e resiliente.
- Criar `src/components/blog/BlogCard.tsx`: cartão editorial da coleção e relacionados.
- Criar `src/components/blog/HouseCta.tsx`: CTA compacto e CTA final.
- Criar `src/pages/blog/blog-magazine.css`: identidade visual completa da coleção e do artigo.
- Modificar `src/components/blog/BlogHeader.tsx`: cabeçalho alinhado à home.
- Modificar `src/pages/blog/BlogPage.tsx`: capa da revista, filtros, grade e paginação compacta.
- Modificar `src/pages/blog/BlogPostPage.tsx`: leitura editorial, relações e CTAs.
- Modificar `scripts/repair-blog-assets.mjs`: validar conteúdo e deixar de reescrever capas antigas.
- Modificar `scripts/prerender.mjs`: metadados sociais usando cenas temáticas.
- Modificar `tests/blog-assets.test.mjs`: validar corpos, links e cenas.
- Criar `tests/blog-magazine-browser.mjs`: verificar coleção e artigo em desktop e celular.

### Task 1: Taxonomia editorial e capas

**Files:**
- Create: `src/components/blog/blogEditorial.ts`
- Create: `src/components/blog/EditorialCover.tsx`
- Create: `src/pages/blog/blog-magazine.css`
- Test: `tests/blog-magazine-browser.mjs`

- [ ] **Step 1: Escrever o teste de capa que inicialmente falha**

```js
await page.goto(`${base}/blog`)
await page.locator('[data-editorial-cover]').first().waitFor()
assert.equal(await page.locator('img[src^="/blog-images/"]').count(), 0)
assert.ok(await page.locator('[data-cover-theme]').count() >= 12)
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `PLAYWRIGHT_MODULE=/Users/janainamdeoliveira/node_modules/playwright/index.mjs node tests/blog-magazine-browser.mjs`

Expected: FAIL porque `[data-editorial-cover]` ainda não existe.

- [ ] **Step 3: Implementar a taxonomia temática**

```ts
import type { BlogPost } from '@/pages/blog/BlogPage'

export const BLOG_THEMES = {
  amizade: { label: 'Amizade', scene: '/garage/living-background.webp', ink: '#3f293b', paper: '#e8d3b6' },
  conversa: { label: 'Conversa', scene: '/garage/whole-house.webp', ink: '#342d26', paper: '#d8c6a5' },
  video: { label: 'Vídeo', scene: '/garage/avatar-camera-helmets.webp', ink: '#f8efe2', paper: '#294432' },
  seguranca: { label: 'Segurança', scene: '/garage/avatar-camera-helmets.webp', ink: '#f8efe2', paper: '#27483b' },
  cidades: { label: 'Pelo Brasil', scene: '/garage/whole-house.webp', ink: '#3f293b', paper: '#d7c6ad' },
  relacionamento: { label: 'Relacionamentos', scene: '/garage/bar-background.webp', ink: '#fff7e9', paper: '#803c2a' },
  cultura: { label: 'Cultura & hobbies', scene: '/garage/garage-background.webp', ink: '#fff7e9', paper: '#a64b2e' },
  bemEstar: { label: 'Bem-estar', scene: '/garage/living-background.webp', ink: '#294432', paper: '#c9d5bc' },
} as const

export function resolveBlogTheme(post: BlogPost) {
  const haystack = `${post.category} ${post.title} ${post.tags.join(' ')}`.toLowerCase()
  if (/seguran|privacidade|golpe|proteger|anonim/.test(haystack)) return BLOG_THEMES.seguranca
  if (/vídeo|video|câmera|camera/.test(haystack)) return BLOG_THEMES.video
  if (/cidade|brasil|são paulo|rio de janeiro|nordeste/.test(haystack)) return BLOG_THEMES.cidades
  if (/namoro|paquera|casal|relacionamento|amor/.test(haystack)) return BLOG_THEMES.relacionamento
  if (/música|musica|filme|game|futebol|festa|hobby/.test(haystack)) return BLOG_THEMES.cultura
  if (/solidão|solidao|ansiedade|timidez|bem-estar|idosos/.test(haystack)) return BLOG_THEMES.bemEstar
  if (/amizade|amigos|amiga|amigo/.test(haystack)) return BLOG_THEMES.amizade
  return BLOG_THEMES.conversa
}
```

- [ ] **Step 4: Criar a capa resiliente**

```tsx
export function EditorialCover({ post, size = 'card' }: { post: BlogPost; size?: 'hero' | 'card' | 'article' }) {
  const theme = resolveBlogTheme(post)
  const [failed, setFailed] = useState(false)
  return <div data-editorial-cover data-cover-theme={theme.label} className={`mag-cover mag-cover--${size}`}
    style={{ '--cover-paper': theme.paper, '--cover-ink': theme.ink } as CSSProperties}>
    {!failed && <img src={theme.scene} alt="" aria-hidden="true" onError={() => setFailed(true)} />}
    <div className="mag-cover__wash" />
    <div className="mag-cover__copy"><span>{theme.label}</span><strong>{post.title}</strong></div>
  </div>
}
```

- [ ] **Step 5: Adicionar estilos base de revista e capa**

```css
.blog-magazine { --paper:#f7f1e7; --ink:#41283d; --terracotta:#b94c2a; --forest:#294432; background:var(--paper); color:var(--ink); min-height:100vh; }
.mag-cover { position:relative; isolation:isolate; overflow:hidden; background:var(--cover-paper); color:var(--cover-ink); border-radius:18px; }
.mag-cover img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.58; }
.mag-cover__wash { position:absolute; inset:0; background:linear-gradient(0deg,var(--cover-paper) 0%,transparent 78%); z-index:1; }
.mag-cover__copy { position:absolute; inset:auto 24px 22px; z-index:2; display:grid; gap:8px; }
.mag-cover__copy span { font-size:11px; letter-spacing:.14em; text-transform:uppercase; }
.mag-cover__copy strong { max-width:18ch; font:500 clamp(22px,3vw,46px)/1.04 Georgia,serif; }
```

- [ ] **Step 6: Executar compilação e teste da capa**

Run: `npm run build && PLAYWRIGHT_MODULE=/Users/janainamdeoliveira/node_modules/playwright/index.mjs node tests/blog-magazine-browser.mjs`

Expected: build PASS; teste alcança a próxima asserção ainda não implementada.

- [ ] **Step 7: Commit**

```bash
git add src/components/blog/blogEditorial.ts src/components/blog/EditorialCover.tsx src/pages/blog/blog-magazine.css tests/blog-magazine-browser.mjs
git commit -m "Build Revista da Casa editorial cover system"
```

### Task 2: Relações e rotas internas

**Files:**
- Create: `src/components/blog/blogRelations.ts`
- Modify: `src/pages/blog/BlogPostPage.tsx`
- Modify: `tests/blog-magazine-browser.mjs`

- [ ] **Step 1: Acrescentar teste de links relacionados**

```js
const index = await (await page.request.get(`${base}/blog-posts/index.json`)).json()
const valid = new Set(index.map(post => `/blog/${post.slug}`))
await page.locator('[data-related-posts]').waitFor()
const links = await page.locator('[data-related-posts] a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))
assert.ok(links.length > 0 && links.length <= 4)
assert.equal(new Set(links).size, links.length)
for (const href of links) assert.ok(valid.has(href), href)
```

- [ ] **Step 2: Executar e confirmar a falha**

Run: `PLAYWRIGHT_MODULE=/Users/janainamdeoliveira/node_modules/playwright/index.mjs node tests/blog-magazine-browser.mjs`

Expected: FAIL porque `data-related-posts` ainda não existe.

- [ ] **Step 3: Implementar seleção determinística**

```ts
export function getRelatedPosts(current: BlogPost, posts: BlogPost[], limit = 4): BlogPost[] {
  const valid = new Map(posts.map(post => [post.slug, post]))
  const explicit = (current.relatedSlugs ?? []).map(slug => valid.get(slug)).filter((post): post is BlogPost => !!post && post.slug !== current.slug)
  const words = new Set(current.title.toLowerCase().split(/\W+/).filter(word => word.length > 4))
  const scored = posts.filter(post => post.slug !== current.slug && !explicit.some(item => item.slug === post.slug)).map(post => {
    const tagMatches = post.tags.filter(tag => current.tags.includes(tag)).length
    const wordMatches = post.title.toLowerCase().split(/\W+/).filter(word => words.has(word)).length
    return { post, score: Number(post.category === current.category) * 4 + tagMatches * 2 + wordMatches }
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
  return [...explicit, ...scored.map(item => item.post)].filter((post, index, all) => all.findIndex(item => item.slug === post.slug) === index).slice(0, limit)
}
```

- [ ] **Step 4: Implementar normalização de links do corpo**

```ts
export function normalizeArticleLinks(html: string, validSlugs: Set<string>): string {
  return html.replace(/href=(["'])([^"']+)\1/gi, (match, quote, href) => {
    const url = new URL(href, 'https://disqueamizade.com.br')
    if (!['disqueamizade.com.br', 'www.disqueamizade.com.br'].includes(url.hostname)) return match
    if (/^\/(rooms?|salas|auth|profile)(\/|$)/.test(url.pathname)) return `href=${quote}/garagem${quote}`
    const article = url.pathname.match(/^\/blog\/([^/]+)$/)
    if (article && !validSlugs.has(article[1])) return `href=${quote}/blog${quote}`
    return `href=${quote}${url.pathname}${url.search}${quote}`
  })
}
```

- [ ] **Step 5: Usar as funções em `BlogPostPage`**

```tsx
const [validSlugs, setValidSlugs] = useState<Set<string>>(new Set())
// Dentro do carregamento do índice:
setValidSlugs(new Set(data.map(item => item.slug)))
setRelated(found ? getRelatedPosts(found, data) : [])
// Dentro de processedContent:
let html = normalizeArticleLinks(post.content, validSlugs)
```

- [ ] **Step 6: Executar testes e commit**

Run: `npm run build && PLAYWRIGHT_MODULE=/Users/janainamdeoliveira/node_modules/playwright/index.mjs node tests/blog-magazine-browser.mjs`

Expected: links relacionados entre 1 e 4, únicos e existentes.

```bash
git add src/components/blog/blogRelations.ts src/pages/blog/BlogPostPage.tsx tests/blog-magazine-browser.mjs
git commit -m "Make blog relations contextual and route-safe"
```

### Task 3: Coleção “Revista da Casa”

**Files:**
- Create: `src/components/blog/BlogCard.tsx`
- Modify: `src/components/blog/BlogHeader.tsx`
- Modify: `src/pages/blog/BlogPage.tsx`
- Modify: `src/pages/blog/blog-magazine.css`
- Modify: `tests/blog-magazine-browser.mjs`

- [ ] **Step 1: Escrever teste da coleção**

```js
await page.goto(`${base}/blog`)
await page.getByRole('heading', { name: 'Revista da Casa', exact: true }).waitFor()
await page.getByRole('region', { name: 'Matéria de capa' }).waitFor()
assert.equal(await page.getByRole('heading', { name: 'Mais lidos' }).count(), 0)
assert.ok(await page.locator('[data-blog-card]').count() >= 11)
assert.ok(await page.getByRole('link', { name: /Entrar na casa/ }).count() >= 1)
```

- [ ] **Step 2: Executar e confirmar a falha**

Run: `PLAYWRIGHT_MODULE=/Users/janainamdeoliveira/node_modules/playwright/index.mjs node tests/blog-magazine-browser.mjs`

Expected: FAIL no título “Revista da Casa”.

- [ ] **Step 3: Criar cartão editorial**

```tsx
export function BlogCard({ post }: { post: BlogPost }) {
  return <Link data-blog-card to={`/blog/${post.slug}`} className="mag-card">
    <EditorialCover post={post} />
    <div className="mag-card__body">
      <span>{resolveBlogTheme(post).label} · {post.readTime} min</span>
      <h2>{post.title}</h2>
      <p>{post.excerpt}</p>
      <strong>Ler matéria <ArrowUpRight size={15} /></strong>
    </div>
  </Link>
}
```

- [ ] **Step 4: Reescrever a composição de `BlogPage`**

```tsx
const formattedDate = new Date(post.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

<div className="blog-magazine">
  <BlogHeader />
  <main className="mag-index">
    <header className="mag-index__masthead"><p>Conversas para levar com você</p><h1>Revista da Casa</h1></header>
    <section aria-label="Matéria de capa" className="mag-feature">
      <EditorialCover post={paginated[0]} size="hero" />
      <div><span>Edição de hoje</span><h2>{paginated[0].title}</h2><p>{paginated[0].excerpt}</p><Link to={`/blog/${paginated[0].slug}`}>Ler matéria</Link></div>
    </section>
    <aside className="mag-picks" aria-label="Escolhas da casa">{paginated.slice(1, 4).map(post => <BlogCard key={post.slug} post={post} />)}</aside>
    <section className="mag-library">{paginated.slice(1).map(post => <BlogCard key={post.slug} post={post} />)}</section>
  </main>
</div>
```

- [ ] **Step 5: Implementar paginação compacta**

```ts
const pageItems = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])].filter(page => page >= 1 && page <= totalPages)
```

Renderizar “Anterior”, `pageItems`, separadores quando houver salto e “Próxima”.

- [ ] **Step 6: Estilizar desktop e celular**

```css
.mag-index { width:min(1180px,calc(100% - 40px)); margin:auto; padding:56px 0 80px; }
.mag-index__masthead h1 { font:500 clamp(54px,8vw,118px)/.9 Georgia,serif; letter-spacing:-.07em; }
.mag-feature { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(280px,.7fr); gap:32px; padding:30px 0; border-block:1px solid #d7c8b5; }
.mag-library { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:32px 20px; }
@media (max-width:700px) { .mag-feature,.mag-library { grid-template-columns:1fr; } .mag-index { width:min(100% - 28px,1180px); padding-top:32px; } }
```

- [ ] **Step 7: Executar teste e commit**

Run: `npm run build && PLAYWRIGHT_MODULE=/Users/janainamdeoliveira/node_modules/playwright/index.mjs node tests/blog-magazine-browser.mjs`

Expected: coleção editorial presente e sem rolagem horizontal em 390 px.

```bash
git add src/components/blog/BlogCard.tsx src/components/blog/BlogHeader.tsx src/pages/blog/BlogPage.tsx src/pages/blog/blog-magazine.css tests/blog-magazine-browser.mjs
git commit -m "Redesign blog collection as Revista da Casa"
```

### Task 4: Artigo editorial e CTAs da casa

**Files:**
- Create: `src/components/blog/HouseCta.tsx`
- Modify: `src/pages/blog/BlogPostPage.tsx`
- Modify: `src/pages/blog/blog-magazine.css`
- Modify: `tests/blog-magazine-browser.mjs`

- [ ] **Step 1: Escrever teste do artigo e CTAs**

```js
await page.locator('a[href^="/blog/"]').first().click()
await page.locator('[data-magazine-article]').waitFor()
assert.ok(await page.locator('[data-house-cta]').count() >= 3)
const ctaHrefs = await page.locator('[data-house-cta] a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))
assert.deepEqual([...new Set(ctaHrefs)], ['/garagem'])
assert.equal(await page.locator('img[src^="/blog-images/"]').count(), 0)
assert.ok((await page.locator('.mag-article__body').boundingBox()).width <= 760)
```

- [ ] **Step 2: Executar e confirmar a falha**

Run: `PLAYWRIGHT_MODULE=/Users/janainamdeoliveira/node_modules/playwright/index.mjs node tests/blog-magazine-browser.mjs`

Expected: FAIL porque `data-magazine-article` ainda não existe.

- [ ] **Step 3: Criar CTA reutilizável**

```tsx
export function HouseCta({ variant = 'compact' }: { variant?: 'compact' | 'final' }) {
  return <aside data-house-cta className={`mag-house-cta mag-house-cta--${variant}`}>
    <div><span>A casa está aberta</span><h2>{variant === 'final' ? 'Escolha onde a conversa começa.' : 'Deu vontade de conversar?'}</h2></div>
    {variant === 'final' && <ul><li>Garagem · música</li><li>Sala de estar · papo leve</li><li>Bar Vinyl · 18+</li></ul>}
    <Link to="/garagem">Entrar na casa <ArrowUpRight size={18} /></Link>
    <small>Câmera desligada ao entrar</small>
  </aside>
}
```

- [ ] **Step 4: Inserir somente dois CTAs no corpo processado**

```ts
function injectHouseCtas(html: string) {
  const paragraphs = [...html.matchAll(/<\/p>/gi)]
  const positions = [paragraphs[1]?.index, paragraphs[Math.floor(paragraphs.length / 2)]?.index].filter((value): value is number => value !== undefined)
  let offset = 0
  for (const [index, position] of positions.entries()) {
    const insertion = `<div data-blog-house-cta="${index}"></div>`
    html = html.slice(0, position + 4 + offset) + insertion + html.slice(position + 4 + offset)
    offset += insertion.length
  }
  return html
}
```

Separar o HTML nos marcadores e intercalar CTAs React, sem criar raízes React adicionais:

```tsx
const contentChunks = processedContent.html.split(/<div data-blog-house-cta="\d+"><\/div>/)

<div className="mag-article__body-copy">
  {contentChunks.map((chunk, index) => <Fragment key={index}>
    <div dangerouslySetInnerHTML={{ __html: chunk }} />
    {index < contentChunks.length - 1 && <HouseCta />}
  </Fragment>)}
</div>
```

- [ ] **Step 5: Reescrever o layout do artigo**

```tsx
<div className="blog-magazine">
  <BlogHeader />
  <main data-magazine-article className="mag-article">
    <header className="mag-article__header">
      <nav aria-label="Navegação estrutural"><Link to="/">Início</Link><span>/</span><Link to="/blog">Revista da Casa</Link></nav>
      <p>{resolveBlogTheme(post).label} · {post.readTime} min de leitura</p>
      <h1>{post.title}</h1>
      <p className="mag-article__standfirst">{post.excerpt}</p>
      <div className="mag-article__byline"><span>{post.author}</span><time dateTime={post.date}>{formattedDate}</time><button onClick={handleCopyLink}>Copiar link</button></div>
    </header>
    <EditorialCover post={post} size="article" />
    <div className="mag-article__layout">
      <article ref={articleRef} className="mag-article__body">
        <details className="mag-toc-mobile"><summary>Nesta matéria</summary>{toc.map(item => <a key={item.id} href={`#${item.id}`}>{item.text}</a>)}</details>
        <div className="mag-article__body-copy">{contentChunks.map((chunk, index) => <Fragment key={index}><div dangerouslySetInnerHTML={{ __html: chunk }} />{index < contentChunks.length - 1 && <HouseCta />}</Fragment>)}</div>
        <div className="mag-tags">{post.tags.map(tag => <Link key={tag} to={`/blog?q=${encodeURIComponent(tag)}`}>{tag}</Link>)}</div>
        <section data-related-posts><h2>Continue pela casa</h2>{related.map(item => <BlogCard key={item.slug} post={item} />)}</section>
      </article>
      <aside className="mag-article__rail"><nav aria-label="Índice da matéria">{toc.map(item => <a key={item.id} href={`#${item.id}`}>{item.text}</a>)}</nav><button onClick={shareWhatsApp}>WhatsApp</button><button onClick={handleCopyLink}>Copiar link</button></aside>
    </div>
    <HouseCta variant="final" />
  </main>
</div>
```

- [ ] **Step 6: Aplicar tipografia de leitura e estados**

```css
.mag-article__body { width:min(100%,720px); font:18px/1.78 Georgia,serif; }
.mag-article__body h2 { margin:2.4em 0 .7em; font-size:clamp(28px,4vw,40px); line-height:1.1; }
.mag-article__body a { color:#a33f25; text-decoration-thickness:1px; text-underline-offset:3px; }
.mag-house-cta { margin:40px 0; padding:28px; border-radius:18px; background:#294432; color:#fff8eb; }
.mag-house-cta--final { width:min(1180px,calc(100% - 40px)); margin:72px auto; }
```

- [ ] **Step 7: Executar teste e commit**

Run: `npm run build && PLAYWRIGHT_MODULE=/Users/janainamdeoliveira/node_modules/playwright/index.mjs node tests/blog-magazine-browser.mjs`

Expected: artigo claro, três CTAs para `/garagem`, links válidos e largura de leitura até 760 px.

```bash
git add src/components/blog/HouseCta.tsx src/pages/blog/BlogPostPage.tsx src/pages/blog/blog-magazine.css tests/blog-magazine-browser.mjs
git commit -m "Redesign blog articles around readable house invitations"
```

### Task 5: Validação de conteúdo e metadados

**Files:**
- Modify: `scripts/repair-blog-assets.mjs`
- Modify: `scripts/prerender.mjs`
- Modify: `tests/blog-assets.test.mjs`

- [ ] **Step 1: Escrever validações que inicialmente falham**

```js
test('every post resolves to an editorial scene and valid related slugs', () => {
  const posts = JSON.parse(readFileSync(resolve(root, 'public/blog-posts/index.json'), 'utf8'))
  const slugs = new Set(posts.map(post => post.slug))
  for (const post of posts) {
    assert.ok(post.content?.length > 100, post.slug)
    for (const related of post.relatedSlugs ?? []) assert.ok(slugs.has(related), `${post.slug} -> ${related}`)
  }
})

test('legacy product routes are absent from published article bodies', () => {
  const posts = JSON.parse(readFileSync(resolve(root, 'public/blog-posts/index.json'), 'utf8'))
  for (const post of posts) assert.doesNotMatch(post.content, /href=["']\/(?:rooms?|salas|auth|profile)(?:\/|["'])/)
})
```

- [ ] **Step 2: Executar e registrar as falhas reais**

Run: `node --test tests/blog-assets.test.mjs`

Expected: possíveis slugs relacionados inválidos ou rotas antigas são listados pelo artigo de origem.

- [ ] **Step 3: Normalizar o índice no script de preparação**

```js
const validSlugs = new Set(posts.map(post => post.slug))
for (const post of posts) {
  post.relatedSlugs = [...new Set(post.relatedSlugs ?? [])].filter(slug => slug !== post.slug && validSlugs.has(slug)).slice(0, 8)
  post.content = post.content.replace(/href=(["'])\/(?:rooms?|salas|auth|profile)(?:\/[^"']*)?\1/gi, `href=$1/garagem$1`)
}
writeFileSync(indexPath, `${JSON.stringify(posts, null, 2)}\n`)
```

- [ ] **Step 4: Atualizar metadados pré-renderizados**

No `scripts/prerender.mjs`, adicionar o mesmo resolvedor determinístico de tema usado pela interface e emitir a cena absoluta:

```js
function resolveEditorialScene(post) {
  const text = `${post.category} ${post.title} ${(post.tags || []).join(' ')}`.toLowerCase()
  if (/seguran|privacidade|golpe|proteger|anonim|vídeo|video|câmera|camera/.test(text)) return '/garage/avatar-camera-helmets.webp'
  if (/namoro|paquera|casal|relacionamento|amor/.test(text)) return '/garage/bar-background.webp'
  if (/música|musica|filme|game|futebol|festa|hobby/.test(text)) return '/garage/garage-background.webp'
  if (/amizade|amigos|solidão|solidao|ansiedade|timidez|idosos/.test(text)) return '/garage/living-background.webp'
  return '/garage/whole-house.webp'
}

const socialImage = abs(resolveEditorialScene(p))
const html = renderPage({
  title: `${p.title} | Revista da Casa`,
  description: p.excerpt || '',
  url,
  image: socialImage,
  type: 'article',
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.excerpt || '',
    image: socialImage,
    datePublished: p.date,
    dateModified: p.lastModified || p.date,
    author: { '@type': 'Organization', name: 'Disque Amizade', url: SITE },
    publisher: { '@type': 'Organization', name: 'Disque Amizade', url: SITE },
    mainEntityOfPage: url,
  },
})
```

- [ ] **Step 5: Executar validações, build e commit**

Run: `node --test tests/blog-assets.test.mjs && npm run build`

Expected: todos os testes PASS e 499 páginas estáticas geradas.

```bash
git add scripts/repair-blog-assets.mjs scripts/prerender.mjs tests/blog-assets.test.mjs public/blog-posts/index.json
git commit -m "Validate Revista da Casa content and social metadata"
```

### Task 6: Verificação integral e publicação

**Files:**
- Modify: `tests/blog-magazine-browser.mjs`
- Modify: `tests/blog-images-browser.mjs`

- [ ] **Step 1: Consolidar o teste responsivo**

```js
for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  await page.setViewportSize(viewport)
  await page.goto(`${base}/blog`)
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.getByPlaceholder('Buscar matérias…').fill('segurança')
  assert.ok(await page.locator('[data-blog-card]').count() > 0)
  await page.locator('[data-blog-card]').first().click()
  await page.locator('[data-magazine-article]').waitFor()
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
}
```

- [ ] **Step 2: Executar toda a verificação local**

Run: `node --test tests/blog-assets.test.mjs && npm run build && PLAYWRIGHT_MODULE=/Users/janainamdeoliveira/node_modules/playwright/index.mjs node tests/blog-magazine-browser.mjs`

Expected: todas as verificações PASS; build gera 499 páginas.

- [ ] **Step 3: Fazer varredura de segredos e commit final de QA**

```bash
/opt/homebrew/bin/gitleaks dir src scripts tests public/blog-posts --redact --no-banner
git add tests/blog-magazine-browser.mjs tests/blog-images-browser.mjs
git commit -m "Verify Revista da Casa across desktop and mobile"
```

- [ ] **Step 4: Enviar a branch e publicar**

```bash
git push origin feat/garage-proximity-prototype
/opt/homebrew/bin/vercel deploy --prod --yes --archive=tgz --scope jhcramos-projects
```

Expected: branch enviada e domínio `https://disqueamizade.com.br` associado ao novo deploy.

- [ ] **Step 5: Verificar produção**

Run: `CHECK_URL=https://disqueamizade.com.br PLAYWRIGHT_MODULE=/Users/janainamdeoliveira/node_modules/playwright/index.mjs node tests/blog-magazine-browser.mjs`

Expected: coleção, artigo, capas, links, CTAs e responsividade PASS no domínio público.
