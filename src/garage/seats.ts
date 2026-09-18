import type { Point, RoomId } from "./model.ts";
import { seatsFor, approachSeat } from "../garage3d/layout.ts";
export type BarSeat={id:string;name:string;point:Point;seatY:number;rotation:number;worldIndex:number};
const shared=(p:{x:number;z:number})=>({x:(p.x+5)/10,y:(p.z+4)/8});
export const BAR_SEATS:BarSeat[]=seatsFor('bar').map((s,i)=>({id:i<3?`counter-${i+1}`:`table-${Math.floor((i-3)/4)+1}-${(i-3)%4+1}`,name:s.name,point:shared(approachSeat(s)),seatY:shared(s).y,rotation:s.angle,worldIndex:i}));
export const HOUSE_SEATS=(['garage','living'] as RoomId[]).flatMap(room=>seatsFor(room).map((s,i)=>{
  const first=room==='garage'?i<4:i<3||i===6;
  const group=room==='garage'?(first?'garage-music':'garage-chairs'):(first?'living-sofa':'living-coffee');
  const number=room==='garage'?i%4+1:first?(i===6?4:i+1):(i===7?4:i-2);
  return{id:`${group}-${number}`,room,spot:group,name:s.name,point:shared(approachSeat(s)),seatY:shared(s).y,rotation:s.angle,worldIndex:i};
}));
export function seatsForRoom(room:RoomId){return room==='bar'?BAR_SEATS:HOUSE_SEATS.filter(s=>s.room===room);}
export function normalizeSeat(raw:unknown,room:unknown){return (room==='bar'||room==='garage'||room==='living')&&typeof raw==='string'&&seatsForRoom(room).some(s=>s.id===raw)?raw:undefined;}
export function seatWinner(people:{id:string;seat?:string}[],seat:string){return people.filter(p=>p.seat===seat).map(p=>p.id).sort()[0];}
