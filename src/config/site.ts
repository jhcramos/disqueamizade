// ═══════════════════════════════════════════════════════════════════════════
// Domínio canônico do site.
//
// Links de convite/compartilhamento devem SEMPRE apontar para o domínio público
// de produção — nunca para `window.location.origin`, que em deployments de
// preview do Vercel é uma URL protegida por login (o amigo cairia na tela de
// autenticação do Vercel ao abrir o link).
// ═══════════════════════════════════════════════════════════════════════════

export const SITE_URL = 'https://disqueamizade.com.br'

/** Monta uma URL absoluta no domínio de produção a partir de um caminho. */
export const siteUrl = (path = ''): string =>
  SITE_URL + (path.startsWith('/') ? path : '/' + path)
