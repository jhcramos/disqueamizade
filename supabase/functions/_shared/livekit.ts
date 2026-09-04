import { ChatError } from './chat.ts'
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const pair = new RegExp(`^(${uuid})-(${uuid})$`)
export function validateVideoRoom(body: unknown, userId: string): { roomId: string; privateRoom: boolean } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ChatError('invalid_request', 400)
  const input = body as Record<string, unknown>
  if (Object.keys(input).some(key => !['roomId', 'participantName'].includes(key)) ||
    typeof input.roomId !== 'string' || !input.roomId || input.roomId.length > 120) throw new ChatError('invalid_request', 400)
  if (input.participantName !== userId) throw new ChatError('forbidden', 403)
  const match = input.roomId.match(pair)
  if (match && (match[1] >= match[2] || (userId !== match[1] && userId !== match[2]))) throw new ChatError('forbidden', 403)
  return { roomId: input.roomId, privateRoom: !!match }
}
