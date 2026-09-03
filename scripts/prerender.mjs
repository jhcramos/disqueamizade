// ═══════════════════════════════════════════════════════════════════════════
// Pré-render pós-build (Plano V4, item 2.2)
//
// O app é uma SPA: o HTML entregue é uma div vazia e o <head> por página é
// injetado por JavaScript. WhatsApp, Facebook e o Googlebot (no primeiro
// acesso) não executam JS, então perdiam título, descrição e imagem de cada
// artigo/sala. Este script gera, para cada rota pública, um HTML estático com
// o <head> correto (title, description, OG, canonical, JSON-LD) reusando o
// dist/index.html como casca — o app hidrata por cima normalmente.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const SITE = 'https://disqueamizade.com.br'

const template = readFileSync(join(DIST, 'index.html'), 'utf-8')

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const abs = (u = '') => (u.startsWith('http') ? u : SITE + (u.startsWith('/') ? u : '/' + u))

/**
 * Injeta o <head> por página: remove do template as tags genéricas que variam
 * por página e insere as específicas antes de </head>.
 */
function renderPage({ title, description, url, image, type = 'website', jsonld }) {
  let html = template

  // Remove tags genéricas do template para não duplicar/conflitar
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="title"[^>]*>/g, '')
    .replace(/<meta name="description"[^>]*>/g, '')
    .replace(/<meta property="og:title"[^>]*>/g, '')
    .replace(/<meta property="og:description"[^>]*>/g, '')
    .replace(/<meta property="og:url"[^>]*>/g, '')
    .replace(/<meta property="og:type"[^>]*>/g, '')
    .replace(/<meta property="og:image"[^>]*>/g, '')
    .replace(/<meta name="twitter:title"[^>]*>/g, '')
    .replace(/<meta name="twitter:description"[^>]*>/g, '')
    .replace(/<meta name="twitter:image"[^>]*>/g, '')
    .replace(/<meta name="twitter:url"[^>]*>/g, '')
    .replace(/<link rel="canonical"[^>]*>/g, '')

  const img = abs(image || '/og-image.png')
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="title" content="${esc(title)}" />`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
    jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : '',
  ].filter(Boolean).join('\n    ')

  return html.replace('</head>', `    ${head}\n  </head>`)
}

function writePage(routePath, html) {
  const dir = join(DIST, routePath)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}

let count = 0

// ─── Blog ───
const indexPath = join(ROOT, 'public', 'blog-posts', 'index.json')
if (existsSync(indexPath)) {
  const posts = JSON.parse(readFileSync(indexPath, 'utf-8'))
  for (const p of posts) {
    if (!p.slug) continue
    const url = `${SITE}/blog/${p.slug}`
    const html = renderPage({
      title: `${p.title} | Disque Amizade`,
      description: p.excerpt || '',
      url,
      image: p.coverImage || p.image,
      type: 'article',
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: p.title,
        description: p.excerpt || '',
        image: p.coverImage ? abs(p.coverImage) : undefined,
        datePublished: p.date,
        dateModified: p.lastModified || p.date,
        author: { '@type': 'Organization', name: 'Disque Amizade', url: SITE },
        publisher: { '@type': 'Organization', name: 'Disque Amizade', url: SITE },
        mainEntityOfPage: url,
      },
    })
    writePage(`blog/${p.slug}`, html)
    count++
  }
}

// ─── Salas públicas ───
// Mantido em sincronia com src/data/salasPublicas.ts (título/descrição).
const salas = [
  { slug: 'geral-brasil', h1: 'Bate-papo Geral do Brasil com vídeo', descricao: 'Sala principal do Disque Amizade: bate-papo ao vivo com vídeo e gente de todo o Brasil, sem cadastro.' },
  { slug: 'sao-paulo', h1: 'Chat online de São Paulo com vídeo', descricao: 'Converse com paulistanos e gente de São Paulo ao vivo, com vídeo e sem cadastro.' },
  { slug: 'rio-de-janeiro', h1: 'Chat online do Rio de Janeiro com vídeo', descricao: 'Bate-papo ao vivo com cariocas e gente do Rio de Janeiro, com vídeo e sem cadastro.' },
  { slug: 'paquera', h1: 'Sala de paquera online com vídeo', descricao: 'Paquere e conheça gente nova ao vivo, com vídeo e sem cadastro. Só para maiores de 18.' },
  { slug: '30-mais', h1: 'Chat para maiores de 30 com vídeo', descricao: 'Bate-papo ao vivo para pessoas com mais de 30 anos, com vídeo e sem cadastro.' },
  { slug: 'nordeste', h1: 'Chat online do Nordeste com vídeo', descricao: 'Converse com gente de todo o Nordeste ao vivo, com vídeo e sem cadastro.' },
]
const FAQ = [
  ['Preciso me cadastrar para entrar?', 'Não. Você entra como convidado direto pelo navegador, escolhe um apelido e já começa a conversar.'],
  ['É grátis?', 'Sim. Entrar nas salas, conversar por texto e ligar a câmera é grátis.'],
  ['Funciona no celular?', 'Sim. Funciona no navegador do celular e do computador, sem instalar aplicativo.'],
  ['É seguro e anônimo?', 'Você conversa com um apelido e pode usar máscaras virtuais. Há ferramentas para denunciar e bloquear. É para maiores de 18 anos.'],
]
for (const s of salas) {
  const url = `${SITE}/sala/${s.slug}`
  const html = renderPage({
    title: `${s.h1} | Disque Amizade`,
    description: s.descricao,
    url,
    jsonld: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', name: s.h1, description: s.descricao, url },
        { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      ],
    },
  })
  writePage(`sala/${s.slug}`, html)
  count++
}

console.log(`[prerender] ${count} páginas estáticas geradas (blog + salas).`)
