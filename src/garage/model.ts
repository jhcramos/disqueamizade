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
// Foot positions traced against each rendered room, excluding furniture and walls.
export const FLOORS: Record<RoomId, Point[]> = {
  garage: [
    [0.14, 0.55],
    [0.25, 0.49],
    [0.3, 0.43],
    [0.43, 0.36],
    [0.44, 0.31],
    [0.5, 0.31],
    [0.55, 0.28],
    [0.8, 0.44],
    [0.86, 0.48],
    [0.82, 0.62],
    [0.82, 0.67],
    [0.75, 0.69],
    [0.76, 0.81],
    [0.89, 0.94],
    [0.45, 0.97],
    [0.24, 0.77],
    [0.22, 0.7],
    [0.23, 0.6],
  ].map(([x, y]) => ({ x, y })),
  living: [
    [0.14, 0.53],
    [0.28, 0.46],
    [0.46, 0.36],
    [0.5, 0.3],
    [0.55, 0.28],
    [0.64, 0.34],
    [0.65, 0.43],
    [0.87, 0.57],
    [0.87, 0.63],
    [0.79, 0.66],
    [0.75, 0.7],
    [0.76, 0.81],
    [0.9, 0.95],
    [0.45, 0.97],
    [0.14, 0.66],
  ].map(([x, y]) => ({ x, y })),
};
export const FLOOR = FLOORS.garage;
export function inside(p: Point, room: RoomId = "garage") {
  const FLOOR = FLOORS[room];
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
    !inside(p.position, p.room === "living" ? "living" : "garage")
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
  room: RoomId = "garage",
): Point {
  const next = step(a, b, dt);
  if (!clearPath(a, next, [], room)) return a;
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
  room: RoomId = "garage",
): Point | null {
  if (
    inside(preferred, room) &&
    people.every((p) => distance(p, preferred) >= PERSONAL_SPACE + 0.012)
  )
    return preferred;
  const candidates: Point[] = [];
  for (let y = 0.32; y <= 0.96; y += 0.04)
    for (let x = 0.15; x <= 0.9; x += 0.04) {
      const p = { x, y };
      if (
        inside(p, room) &&
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

export function clearPath(
  a: Point,
  b: Point,
  obstacles: Point[],
  room: RoomId = "garage",
  gap = PERSONAL_SPACE,
): boolean {
  const n = Math.max(1, Math.ceil(distance(a, b) / 0.006));
  for (let i = 0; i <= n; i++)
    if (
      !inside(
        { x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n },
        room,
      )
    )
      return false;
  const vx = b.x - a.x,
    vy = (b.y - a.y) * 0.8,
    len = vx * vx + vy * vy;
  return obstacles.every((p) => {
    const t = len
      ? Math.max(
          0,
          Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * 0.8 * vy) / len),
        )
      : 0;
    return distance({ x: a.x + vx * t, y: a.y + (vy * t) / 0.8 }, p) >= gap;
  });
}
// Small A* grid, only planned on a new destination or a blocked route.
export function planRoute(
  a: Point,
  goal: Point,
  obstacles: Point[],
  room: RoomId = "garage",
): Point[] {
  if (!inside(goal, room)) return [];
  const gap = PERSONAL_SPACE + 0.006;
  if (clearPath(a, goal, obstacles, room, gap)) return [goal];
  const grid = 0.025,
    width = 41;
  const nodes = new Map<number, Point>();
  for (let y = 0; y < width; y++)
    for (let x = 0; x < width; x++) {
      const p = { x: x * grid, y: y * grid };
      if (inside(p, room) && obstacles.every((o) => distance(p, o) >= gap))
        nodes.set(y * width + x, p);
    }
  const start = -1,
    open = new Set<number>([start]),
    score = new Map([[start, 0]]),
    previous = new Map<number, number>();
  nodes.set(start, a);
  for (let visits = 0; open.size && visits < 1700; visits++) {
    let best = start,
      minimum = Infinity;
    for (const id of open) {
      const f = score.get(id)! + distance(nodes.get(id)!, goal);
      if (f < minimum) {
        best = id;
        minimum = f;
      }
    }
    open.delete(best);
    const p = nodes.get(best)!;
    if (clearPath(p, goal, obstacles, room, gap)) {
      const path = [goal];
      let id = best;
      while (id !== start) {
        path.unshift(nodes.get(id)!);
        id = previous.get(id)!;
      }
      return path;
    }
    const candidates =
      best === start
        ? [...nodes.keys()].filter(
            (id) => id !== start && distance(a, nodes.get(id)!) < 0.055,
          )
        : [-42, -41, -40, -1, 1, 40, 41, 42].map((delta) => best + delta);
    for (const id of candidates) {
      const next = nodes.get(id);
      if (
        !next ||
        distance(p, next) > 0.056 ||
        !clearPath(p, next, obstacles, room, gap)
      )
        continue;
      const cost = score.get(best)! + distance(p, next);
      if (cost < (score.get(id) ?? Infinity)) {
        score.set(id, cost);
        previous.set(id, best);
        open.add(id);
      }
    }
  }
  return [];
}
