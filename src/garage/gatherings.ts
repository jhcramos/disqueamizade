import type { Point, RoomId } from './model';
import { HOUSE_SEATS, BAR_SEATS } from './seats.ts';
const spotPoint=(id:string)=>HOUSE_SEATS.find(s=>s.spot===id)!.point;

export type Gathering = { spot: string; open: boolean; count: number };
export type ConversationSpot = { id: string; name: string; point: Point; question: string };
export const CONVERSATION_SPOTS: Record<RoomId, ConversationSpot[]> = {
  garage: [
    { id: 'garage-music', name: 'Roda do som', point: spotPoint('garage-music'), question: 'Qual música faria você levantar para dançar?' },
    { id: 'garage-chairs', name: 'Papo nas cadeiras', point: spotPoint('garage-chairs'), question: 'Qual foi a festa mais divertida que você já viveu?' },
  ],
  living: [
    { id: 'living-sofa', name: 'Roda do sofá', point: spotPoint('living-sofa'), question: 'Que pequena coisa deixa seu dia melhor?' },
    { id: 'living-coffee', name: 'Cantinho do café', point: spotPoint('living-coffee'), question: 'Qual história sua merece uma segunda xícara de café?' },
  ],
  bar: [1, 2, 3].map((n) => ({ id: `bar-table-${n}`, name: `Mesa ${n}`, point: BAR_SEATS[3+(n-1)*4].point, question: ['Qual seria a trilha sonora desta mesa?', 'Qual viagem você faria de novo?', 'Qual descoberta recente você indicaria para a gente?'][n - 1] })),
};
export function normalizeGathering(raw: unknown, room: RoomId): Gathering | undefined {
  if (!raw || typeof raw !== 'object') return;
  const value = raw as Gathering;
  if (!CONVERSATION_SPOTS[room].some(spot => spot.id === value.spot) || typeof value.open !== 'boolean' || !Number.isInteger(value.count) || value.count < 1 || value.count > 4) return;
  return { spot: value.spot, open: value.open, count: value.count };
}
