export type Point = { x: number; y: number };
export type RoomId = "garage" | "living";
export const ROOMS = {
  garage: {
    name: "Garagem",
    image: "garage-background.webp",
    label: "FESTA DE GARAGEM · ANOS 80",
    topic: "Qual música marcou a sua vida?",
  },
  living: {
    name: "Sala de estar",
    image: "living-background.webp",
    label: "SALA DE ESTAR · PAPO SEM PRESSA",
    topic: "Que lembrança faz você se sentir em casa?",
  },
};
export type Person = {
  room?: RoomId;
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
    room: p.room === "living" ? "living" : "garage",
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

// Ground-space personal radius, shared by walking, arrival and interpolation.
export const PERSONAL_SPACE = 0.105;
export function sameRoom(a: Person, b: Person) {
  return (a.room || "garage") === (b.room || "garage");
}
export function safeStep(
  a: Point,
  b: Point,
  dt: number,
  obstacles: Point[],
): Point {
  const next = step(a, b, dt);
  if (!inside(next)) return a;
  const vx = next.x - a.x,
    vy = (next.y - a.y) * 0.8;
  const length2 = vx * vx + vy * vy;
  if (!length2) return a;
  for (const p of obstacles) {
    const before = distance(a, p);
    // Overlapping arrivals may separate, but cannot move through each other.
    if (before < PERSONAL_SPACE - 0.00001) {
      if ((a.x - p.x) * vx + (a.y - p.y) * 0.8 * vy <= 0) return a;
      continue;
    }
    const t = Math.max(
      0,
      Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * 0.8 * vy) / length2),
    );
    if (
      distance({ x: a.x + vx * t, y: a.y + (vy * t) / 0.8 }, p) < PERSONAL_SPACE
    )
      return a;
  }
  return next;
}
export function freeSpawn(
  people: Point[],
  preferred: Point = START,
): Point | null {
  if (
    inside(preferred) &&
    people.every((p) => distance(p, preferred) >= PERSONAL_SPACE + 0.012)
  )
    return preferred;
  const candidates: Point[] = [];
  for (let y = 0.48; y <= 0.85; y += 0.055)
    for (let x = 0.34; x <= 0.77; x += 0.055) {
      const p = { x, y };
      if (
        inside(p) &&
        people.every((other) => distance(p, other) >= PERSONAL_SPACE + 0.012)
      )
        candidates.push(p);
    }
  return (
    candidates.sort(
      (a, b) => distance(a, preferred) - distance(b, preferred),
    )[0] || null
  );
}
