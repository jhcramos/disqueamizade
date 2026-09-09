import type { Point } from "./model.ts";
export type BarSeat = {
  id: string;
  name: string;
  point: Point;
  seatY: number;
  rotation: number;
};
export const BAR_SEATS: BarSeat[] = [
  {
    id: "counter-1",
    name: "Balcão · banco 1",
    point: { x: 0.341, y: 0.442 },
    seatY: 0.334,
    rotation: -2.5,
  },
  {
    id: "counter-2",
    name: "Balcão · banco 2",
    point: { x: 0.405, y: 0.403 },
    seatY: 0.295,
    rotation: -2.5,
  },
  {
    id: "counter-3",
    name: "Balcão · banco 3",
    point: { x: 0.46, y: 0.365 },
    seatY: 0.262,
    rotation: -2.5,
  },
  ...[
    [
      [0.61, 0.466, 0.407],
      [0.726, 0.477, 0.42],
      [0.603, 0.553, 0.486],
      [0.723, 0.567, 0.5],
    ],
    [
      [0.263, 0.607, 0.551],
      [0.401, 0.625, 0.566],
      [0.252, 0.717, 0.647],
      [0.374, 0.731, 0.657],
    ],
    [
      [0.616, 0.704, 0.643],
      [0.753, 0.725, 0.661],
      [0.615, 0.828, 0.756],
      [0.752, 0.838, 0.764],
    ],
  ].flatMap((rows, t) =>
    rows.map(([x, y, seatY], i) => ({
      id: `table-${t + 1}-${i + 1}`,
      name: `Mesa ${t + 1} · lugar ${i + 1}`,
      point: { x, y },
      seatY,
      rotation: i % 2 ? -1.2 : 1.2,
    })),
  ),
];
export function normalizeSeat(raw: unknown, room: unknown) {
  return room === "bar" &&
    typeof raw === "string" &&
    BAR_SEATS.some((s) => s.id === raw)
    ? raw
    : undefined;
}
export function seatWinner(
  people: { id: string; seat?: string }[],
  seat: string,
) {
  return people
    .filter((p) => p.seat === seat)
    .map((p) => p.id)
    .sort()[0];
}
