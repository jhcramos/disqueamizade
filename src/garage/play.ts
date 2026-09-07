import {
  inside,
  distance,
  clearPath,
  type Point,
  type RoomId,
} from "./model.ts";
export type PlayKind = "lights" | "screen" | "ball" | "cushion" | "perform";
export type PlayAction = {
  id: string;
  actor: string;
  name: string;
  at: number;
  room: RoomId;
  kind: PlayKind;
  on: boolean;
  from: Point;
  to: Point;
};
export type PlayState = Partial<Record<PlayKind, PlayAction>>;
export const BALL_START = { x: 0.58, y: 0.7 };
export const CUSHION_START = { x: 0.64, y: 0.61 };
export function parsePlay(
  raw: unknown,
  room: RoomId,
  now = Date.now(),
): PlayAction | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as PlayAction;
  if (
    p.room !== room ||
    !["lights", "screen", "ball", "cushion", "perform"].includes(p.kind) ||
    typeof p.id !== "string" ||
    p.id.length > 100 ||
    typeof p.actor !== "string" ||
    p.actor.length > 80 ||
    typeof p.name !== "string" ||
    typeof p.on !== "boolean" ||
    !Number.isFinite(p.at) ||
    p.at > now + 2000 ||
    p.at < now - 86400000 ||
    !p.from ||
    !p.to ||
    !inside(p.from, room) ||
    !inside(p.to, room)
  )
    return null;
  return { ...p, name: p.name.slice(0, 24) };
}
export function mergePlay(state: PlayState, action: PlayAction): PlayState {
  const previous = state[action.kind];
  if (
    previous &&
    (previous.at > action.at ||
      (previous.at === action.at && previous.id >= action.id))
  )
    return state;
  return { ...state, [action.kind]: action };
}
export function playPosition(
  action: PlayAction | undefined,
  fallback: Point,
  now = Date.now(),
): Point {
  if (!action) return fallback;
  const t = Math.max(0, Math.min(1, (now - action.at) / 1100)),
    ease = 1 - (1 - t) ** 3;
  return {
    x: action.from.x + (action.to.x - action.from.x) * ease,
    y: action.from.y + (action.to.y - action.from.y) * ease,
  };
}
export function throwTarget(from: Point, actor: Point, room: RoomId): Point {
  const dx = from.x - actor.x,
    dy = from.y - actor.y,
    angle = distance(from, actor) > 0.01 ? Math.atan2(dy, dx) : -0.5;
  for (const offset of [0, 0.6, -0.6, 1.2, -1.2, Math.PI])
    for (const reach of [0.24, 0.16, 0.08]) {
      const to = {
        x: from.x + Math.cos(angle + offset) * reach,
        y: from.y + Math.sin(angle + offset) * reach,
      };
      if (clearPath(from, to, [], room)) return to;
    }
  return from;
}
