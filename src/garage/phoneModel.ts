import type { RoomId } from './model';

// Wall/table anchors, outside the main walking area.
const ANCHORS: Record<RoomId, number[][]> = {
  garage: [[.26,.30],[.58,.22],[.84,.40],[.17,.61]],
  living: [[.26,.30],[.61,.24],[.83,.46],[.20,.65]],
  bar: [[.22,.31],[.46,.23],[.74,.30],[.87,.53]],
};
export const HOUSE_PHONES = Object.fromEntries(Object.entries(ANCHORS).map(([room, points]) =>
  [room, points.map(([x,y], i) => ({ id: `${room}-${i+1}`, x, y }))]
)) as Record<RoomId, { id: string; x: number; y: number }[]>;
export type PhoneRing = { id: string; phone: string; expires: string };
export type PhoneCall = { id: string; source: string; target: string; status: 'ringing'|'accepted'; expires: string; peer: string|null; roomId: string|null; inviteId: string|null };
export type PhoneState = { mine?: PhoneCall|null; rings?: PhoneRing[]; notice?: 'empty' };
