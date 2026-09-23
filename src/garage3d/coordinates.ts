import { roomOffsets, houseWalkable, roomAt, type Place, type RoomId } from './layout.ts';
export type SharedPoint={x:number;y:number};
// Presence keeps normalized coordinates; distance in the social layer is world distance / 10.
export function toWorld(p:SharedPoint,room:RoomId):Place{return{x:p.x*10-5+roomOffsets[room].x,z:p.y*8-4+roomOffsets[room].z};}
export function toShared(p:Place,room:RoomId):SharedPoint{return{x:(p.x-roomOffsets[room].x+5)/10,y:(p.z-roomOffsets[room].z+4)/8};}
export function validShared(p:SharedPoint,room:RoomId){return Number.isFinite(p.x)&&Number.isFinite(p.y)&&roomAt(toWorld(p,room))===room&&houseWalkable(toWorld(p,room));}
