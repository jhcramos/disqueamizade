/** Pure request and moderation rules shared by the edge function and tests. */
export const MAX_BODY_BYTES = 4096
export const MAX_TEXT_LENGTH = 500
export const DEFAULT_BAD_WORDS = ['puta', 'merda', 'caralho', 'porra', 'buceta', 'viado', 'arrombado', 'fdp', 'piroca']
export type ChatInput = { roomSlug: string; text: string; type: 'text' | 'emoji' }
export class ChatError extends Error {
  code: string
  status: number
  constructor(code: string, status: number) { super(code); this.code = code; this.status = status }
}
export function normalizeForModeration(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}|\p{Cf}/gu, '').toLowerCase()
}
export function parseChatInput(body: unknown): ChatInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ChatError('invalid_request', 400)
  const row = body as Record<string, unknown>
  if (Object.keys(row).some(k => !['roomSlug', 'text', 'type'].includes(k)) ||
      typeof row.roomSlug !== 'string' || !row.roomSlug || row.roomSlug.length > 120 ||
      row.roomSlug !== row.roomSlug.trim() || typeof row.text !== 'string' ||
      row.text.length > MAX_TEXT_LENGTH || !row.text.trim() ||
      (row.type !== undefined && row.type !== 'text' && row.type !== 'emoji')) {
    throw new ChatError('invalid_request', 400)
  }
  return { roomSlug: row.roomSlug, text: row.text, type: row.type === 'emoji' ? 'emoji' : 'text' }
}
export function configuredWords(value: unknown): string[] {
  if (value === null || value === undefined) return DEFAULT_BAD_WORDS
  if (!Array.isArray(value) || value.length > 500 || value.some(v => typeof v !== 'string' || !v.trim() || v.length > 80)) {
    throw new ChatError('unavailable', 503)
  }
  return [...new Set([...DEFAULT_BAD_WORDS, ...value.map(v => normalizeForModeration(v.trim()))])]
}
export function moderateText(text: string, words = DEFAULT_BAD_WORDS): string {
  const clean = text.normalize('NFKC').replace(/\p{Cf}/gu, '').trim()
  if (!clean || clean.length > MAX_TEXT_LENGTH) throw new ChatError('invalid_request', 400)
  const normalized = normalizeForModeration(clean)
  // Covers schemes, www, email/domain names, punycode and obfuscation with invisible characters.
  if (/(?:https?\s*:|www\s*\.|\b[a-z0-9-]+\.[a-z]{2,63}\b)/i.test(normalized)) {
    throw new ChatError('blocked_content', 400)
  }
  // Mask base words and inflections while retaining ordinary Portuguese accents.
  // Multiword custom entries are rejected rather than accidentally left unfiltered.
  for (const word of words) {
    if (/[^a-z0-9]/.test(word) && normalized.includes(word)) throw new ChatError('blocked_content', 400)
  }
  return clean.replace(/[\p{L}\p{M}\p{N}]+/gu, token => {
    const folded = normalizeForModeration(token)
    return words.some(word => folded.startsWith(word)) ? token[0] + '*'.repeat(Math.max(1, token.length - 1)) : token
  })
}
export function safeUsername(value: unknown, words = DEFAULT_BAD_WORDS): string {
  if (typeof value !== 'string') return 'Convidado'
  const clean = value.normalize('NFKC').replace(/[\p{Cf}\p{Cc}]/gu, '').trim().slice(0, 50)
  try { return moderateText(clean || 'Convidado', words) } catch { return 'Convidado' }
}
export async function readChatBody(req: Request): Promise<unknown> {
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ChatError('invalid_request', 400)
  const reader = req.body?.getReader()
  if (!reader) throw new ChatError('invalid_request', 400)
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > MAX_BODY_BYTES) { await reader.cancel(); throw new ChatError('invalid_request', 400) }
      chunks.push(value)
    }
    const all = new Uint8Array(bytes)
    let offset = 0
    for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(all))
  } catch (error) {
    if (error instanceof ChatError) throw error
    throw new ChatError('invalid_request', 400)
  } finally { reader.releaseLock() }
}
