import { ChatError } from './chat.ts'

export type ContactMode = 'message' | 'audio' | 'video'
export type ContactPreferences = Record<ContactMode, boolean>

export const DEFAULT_CONTACT_PREFERENCES: ContactPreferences = {
  message: true,
  audio: false,
  video: false,
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const uuidSource = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
const privateRoomPattern = new RegExp(`^(${uuidSource})-(${uuidSource})$`, 'i')
const roomPattern = /^[a-z0-9][a-z0-9-]{0,119}$/

type Input =
  | { action: 'set_preferences'; roomSlug: string; preferences: ContactPreferences }
  | { action: 'invite'; roomSlug: string; toUser: string; mode: ContactMode }
  | { action: 'respond'; inviteId: string; response: 'accept' | 'decline' }
  | { action: 'end'; inviteId: string }

const fail = () => { throw new ChatError('invalid_request', 400) }
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail()
  return value as Record<string, unknown>
}
const exactKeys = (value: Record<string, unknown>, allowed: string[]) => {
  if (Object.keys(value).some(key => !allowed.includes(key))) fail()
}
const room = (value: unknown) => typeof value === 'string' && roomPattern.test(value) ? value : fail()
const uuid = (value: unknown) => typeof value === 'string' && uuidPattern.test(value) ? value.toLowerCase() : fail()

export function parsePrivateContactInput(body: unknown): Input {
  const input = object(body)
  if (input.action === 'set_preferences') {
    exactKeys(input, ['action', 'roomSlug', 'preferences'])
    const preferences = object(input.preferences)
    exactKeys(preferences, ['message', 'audio', 'video'])
    if (typeof preferences.message !== 'boolean' || typeof preferences.audio !== 'boolean' || typeof preferences.video !== 'boolean') fail()
    return { action: 'set_preferences', roomSlug: room(input.roomSlug), preferences: preferences as ContactPreferences }
  }
  if (input.action === 'invite') {
    exactKeys(input, ['action', 'roomSlug', 'toUser', 'mode'])
    if (!['message', 'audio', 'video'].includes(String(input.mode))) fail()
    return { action: 'invite', roomSlug: room(input.roomSlug), toUser: uuid(input.toUser), mode: input.mode as ContactMode }
  }
  if (input.action === 'respond') {
    exactKeys(input, ['action', 'inviteId', 'response'])
    if (input.response !== 'accept' && input.response !== 'decline') fail()
    return { action: 'respond', inviteId: uuid(input.inviteId), response: input.response }
  }
  if (input.action === 'end') {
    exactKeys(input, ['action', 'inviteId'])
    return { action: 'end', inviteId: uuid(input.inviteId) }
  }
  return fail()
}

export function privateRoomId(first: string, second: string): string {
  const a = uuid(first)
  const b = uuid(second)
  if (a === b) return fail()
  return [a, b].sort().join('-')
}

export function privateRoomMembers(roomId: string): [string, string] | null {
  const match = roomId.match(privateRoomPattern)
  if (!match) return null
  const members = [match[1].toLowerCase(), match[2].toLowerCase()] as [string, string]
  return members[0] < members[1] ? members : null
}

type AcceptedInvite = {
  from_user: string
  to_user: string
  mode: string
  status: string
  expires_at: string
}

export function acceptedModeForPair(
  invites: AcceptedInvite[] | null | undefined,
  members: [string, string],
  allowedModes: ContactMode[],
  now = new Date(),
): ContactMode | null {
  for (const invite of invites || []) {
    if (invite.status !== 'accepted' || !allowedModes.includes(invite.mode as ContactMode)) continue
    if (Date.parse(invite.expires_at) <= now.getTime()) continue
    try {
      if (privateRoomId(invite.from_user, invite.to_user) === privateRoomId(...members)) return invite.mode as ContactMode
    } catch { /* malformed database row */ }
  }
  return null
}

export function validateAcceptedCall(invite: AcceptedInvite | null | undefined, userId: string, roomId: string, now = new Date()): boolean {
  if (!invite || invite.status !== 'accepted' || (invite.mode !== 'audio' && invite.mode !== 'video')) return false
  if (Date.parse(invite.expires_at) <= now.getTime()) return false
  if (userId !== invite.from_user && userId !== invite.to_user) return false
  try { return privateRoomId(invite.from_user, invite.to_user) === roomId } catch { return false }
}
