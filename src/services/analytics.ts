// ═══════════════════════════════════════════════════════════════════════════
// Analytics — eventos mínimos do funil (Plano V4, item 0.1)
//
// Provider: Plausible (script carregado só se VITE_PLAUSIBLE_DOMAIN existir)
// ou GA4 (se VITE_GA_ID existir). Sem nenhum dos dois, os eventos vão para
// console.debug em dev e são descartados em produção.
// ═══════════════════════════════════════════════════════════════════════════

export type AnalyticsEvent =
  | 'home_view'
  | 'cta_enter_click'
  | 'room_joined'
  | 'room_first_remote_seen'
  | 'chat_msg_received_human'
  | 'room_5min'
  | 'camera_on'
  | 'roulette_matched'
  | 'report_sent'

type Props = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Props }) => void
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined
const GA_ID = import.meta.env.VITE_GA_ID as string | undefined

let loaded = false

/** Injeta o script do provider uma vez. Idempotente. */
export function initAnalytics() {
  if (loaded || typeof document === 'undefined') return
  loaded = true

  if (PLAUSIBLE_DOMAIN) {
    const s = document.createElement('script')
    s.defer = true
    s.dataset.domain = PLAUSIBLE_DOMAIN
    s.src = 'https://plausible.io/js/script.tagged-events.js'
    document.head.appendChild(s)
    window.plausible = window.plausible || function (...args: unknown[]) {
      ;((window.plausible as unknown as { q?: unknown[] }).q = (window.plausible as unknown as { q?: unknown[] }).q || []).push(args)
    }
    return
  }

  if (GA_ID) {
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
    document.head.appendChild(s)
    window.dataLayer = window.dataLayer || []
    window.gtag = function (...args: unknown[]) { window.dataLayer!.push(args) }
    window.gtag('js', new Date())
    window.gtag('config', GA_ID, { anonymize_ip: true })
  }
}

/** Dispara um evento nomeado. Nunca lança. */
export function track(event: AnalyticsEvent, props?: Props) {
  try {
    if (PLAUSIBLE_DOMAIN && window.plausible) {
      window.plausible(event, props ? { props } : undefined)
      return
    }
    if (GA_ID && window.gtag) {
      window.gtag('event', event, props || {})
      return
    }
    if (import.meta.env.DEV) console.debug('[analytics]', event, props || '')
  } catch { /* nunca quebrar a UI por causa de analytics */ }
}

/**
 * Marca o momento de entrada numa sala e devolve um cancelador.
 * Dispara `room_5min` se o usuário ainda estiver na sala após 5 minutos.
 */
export function startRoomSession(roomId: string) {
  track('room_joined', { room: roomId })
  const t = setTimeout(() => track('room_5min', { room: roomId }), 5 * 60 * 1000)
  return () => clearTimeout(t)
}
