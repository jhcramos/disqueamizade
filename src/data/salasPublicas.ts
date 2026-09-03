// ═══════════════════════════════════════════════════════════════════════════
// Salas públicas — definições para as páginas /sala/:slug (Plano V4, item 2.3)
//
// Cada entrada vira uma página indexável, com H1, descrição e FAQ (schema).
// O `slug` deve bater com o slug real da sala no banco (rooms.slug) para o
// botão "Entrar" cair na sala certa e para puxar a contagem real de pessoas.
// ═══════════════════════════════════════════════════════════════════════════

export interface SalaPublica {
  slug: string
  nome: string
  h1: string
  descricao: string
  intro: string
  faq: { q: string; a: string }[]
}

const FAQ_BASE: { q: string; a: string }[] = [
  { q: 'Preciso me cadastrar para entrar?', a: 'Não. Você entra como convidado direto pelo navegador, escolhe um apelido e já começa a conversar. Criar conta é opcional.' },
  { q: 'É grátis?', a: 'Sim. Entrar nas salas, conversar por texto e ligar a câmera é grátis. Há recursos extras opcionais, mas o essencial não custa nada.' },
  { q: 'Funciona no celular?', a: 'Sim. Funciona no navegador do celular e do computador, sem instalar aplicativo.' },
  { q: 'Preciso ligar a câmera?', a: 'Não. Você pode entrar só para assistir e conversar por texto, e ligar a câmera quando quiser.' },
  { q: 'É seguro e anônimo?', a: 'Você conversa com um apelido e pode usar máscaras virtuais para manter o anonimato. Há ferramentas para denunciar e bloquear. É uma plataforma para maiores de 18 anos.' },
]

export const SALAS_PUBLICAS: SalaPublica[] = [
  {
    slug: 'geral-brasil',
    nome: 'Geral Brasil',
    h1: 'Bate-papo Geral do Brasil com vídeo',
    descricao: 'Sala principal do Disque Amizade: bate-papo ao vivo com vídeo e gente de todo o Brasil, sem cadastro.',
    intro: 'A sala Geral Brasil é o ponto de encontro do Disque Amizade. É onde a conversa começa: gente de todos os estados, vídeo ao vivo, chat por texto e máscaras virtuais para quem prefere anonimato. Entra pelo navegador, escolhe um apelido e já está na conversa.',
    faq: FAQ_BASE,
  },
  {
    slug: 'sao-paulo',
    nome: 'São Paulo',
    h1: 'Chat online de São Paulo com vídeo',
    descricao: 'Converse com paulistanos e gente de São Paulo ao vivo, com vídeo e sem cadastro.',
    intro: 'A sala de São Paulo reúne quem é da capital, do interior e de toda a região para conversar ao vivo. Encontre gente da sua cidade, faça amizades e converse por vídeo ou texto — sem baixar nada e sem cadastro.',
    faq: FAQ_BASE,
  },
  {
    slug: 'rio-de-janeiro',
    nome: 'Rio de Janeiro',
    h1: 'Chat online do Rio de Janeiro com vídeo',
    descricao: 'Bate-papo ao vivo com cariocas e gente do Rio de Janeiro, com vídeo e sem cadastro.',
    intro: 'A sala do Rio de Janeiro é o point dos cariocas no Disque Amizade. Converse ao vivo com gente da cidade e do estado, por vídeo ou texto, com máscaras e sem cadastro.',
    faq: FAQ_BASE,
  },
  {
    slug: 'belo-horizonte',
    nome: 'Belo Horizonte',
    h1: 'Chat online de Belo Horizonte com vídeo',
    descricao: 'Bate-papo ao vivo com mineiros e gente de Belo Horizonte, com vídeo e sem cadastro.',
    intro: 'A sala de Belo Horizonte reúne o mineirinho de todo canto para conversar ao vivo. Amizade, prosa boa e paquera com gente de BH e região, por vídeo ou texto, sem cadastro.',
    faq: FAQ_BASE,
  },
  {
    slug: 'paquera',
    nome: 'Paquera',
    h1: 'Sala de paquera online com vídeo',
    descricao: 'Paquere e conheça gente nova ao vivo, com vídeo e sem cadastro. Só para maiores de 18.',
    intro: 'A sala de Paquera é para quem quer conhecer gente nova de um jeito leve e ao vivo. Converse por vídeo ou texto, use máscaras se preferir manter o mistério, e paquere com respeito. Só para maiores de 18 anos.',
    faq: FAQ_BASE,
  },
  {
    slug: '30-mais',
    nome: '30+',
    h1: 'Chat para maiores de 30 com vídeo',
    descricao: 'Bate-papo ao vivo para pessoas com mais de 30 anos, com vídeo e sem cadastro.',
    intro: 'A sala 30+ reúne gente com mais maturidade para conversas de verdade. Amizade, papo e paquera para quem já passou dos 30, ao vivo, por vídeo ou texto, sem cadastro.',
    faq: FAQ_BASE,
  },
  {
    slug: 'nordeste',
    nome: 'Nordeste',
    h1: 'Chat online do Nordeste com vídeo',
    descricao: 'Converse com gente de todo o Nordeste ao vivo, com vídeo e sem cadastro.',
    intro: 'A sala do Nordeste junta o axé da Bahia, o frevo de Pernambuco, o sol do Ceará e toda a energia da região num só lugar. Converse ao vivo com nordestinos por vídeo ou texto, sem cadastro.',
    faq: FAQ_BASE,
  },
]

const BY_SLUG = new Map(SALAS_PUBLICAS.map((s) => [s.slug, s]))

/** Devolve a definição da sala ou uma genérica para slugs desconhecidos. */
export function getSalaPublica(slug: string): SalaPublica {
  const found = BY_SLUG.get(slug)
  if (found) return found
  const nome = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return {
    slug,
    nome,
    h1: `Sala ${nome} — bate-papo com vídeo`,
    descricao: `Bate-papo ao vivo na sala ${nome}, com vídeo e sem cadastro no Disque Amizade.`,
    intro: `A sala ${nome} é um espaço para conversar ao vivo com gente nova, por vídeo ou texto, com máscaras virtuais e sem cadastro. Entra pelo navegador e começa na hora.`,
    faq: FAQ_BASE,
  }
}
