export type Point = { x: number; y: number };
export type Person = {
  id: string;
  name: string;
  avatar: number;
  position: Point;
  busy: boolean;
};
export const AVATARS = [
  "female-a",
  "female-b",
  "female-c",
  "female-d",
  "female-e",
  "male-a",
  "male-b",
  "male-c",
  "male-d",
  "male-e",
];
export const START: Point = { x: 0.48, y: 0.76 };
export const DEMO: Person = {
  id: "demo-bia",
  name: "Bia",
  avatar: 2,
  position: { x: 0.65, y: 0.57 },
  busy: false,
};
export const FLOOR: Point[] = [
  { x: 0.29, y: 0.6 },
  { x: 0.56, y: 0.4 },
  { x: 0.8, y: 0.55 },
  { x: 0.77, y: 0.8 },
  { x: 0.5, y: 0.9 },
];
export function inside(p: Point) {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  let result = false;
  for (let i = 0, j = FLOOR.length - 1; i < FLOOR.length; j = i++) {
    const a = FLOOR[i],
      b = FLOOR[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      result = !result;
  }
  return result;
}
export function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, (a.y - b.y) * 0.8);
}
export function nearby(a: Point, b: Point) {
  return distance(a, b) < 0.185;
}
export function step(a: Point, b: Point, dt: number): Point {
  const d = distance(a, b),
    amount = Math.min(1, (Math.max(0, dt) * 0.16) / (d || 1));
  return { x: a.x + (b.x - a.x) * amount, y: a.y + (b.y - a.y) * amount };
}
export function parsePerson(raw: unknown): Person | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Person;
  if (
    typeof p.id !== "string" ||
    p.id.length > 80 ||
    typeof p.name !== "string" ||
    !p.position ||
    !inside(p.position)
  )
    return null;
  return {
    id: p.id,
    name: p.name.slice(0, 24),
    avatar:
      Number.isInteger(p.avatar) && p.avatar >= 0 && p.avatar < 10
        ? p.avatar
        : 0,
    position: p.position,
    busy: p.busy === true,
  };
}
