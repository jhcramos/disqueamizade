import {HOUSE_AREAS,areaAt,areaById,planPoint,POOL,WALLS,FIXTURES,type Place,type RoomId} from './areas.ts';
export type {Place,RoomId} from './areas.ts';
export type Furniture=Place&{angle:number;name:string;count:number;color:string;stool?:boolean;spot?:string;area?:string;scale:number};
export const roomNames:Record<RoomId,string>={garage:'Garagem',living:'Sala de estar',bar:'Jogos e café'};
export const roomOffsets:Record<RoomId,Place>={garage:areaById('garage'),living:areaById('living'),bar:areaById('dining')};
export const roomIds:RoomId[]=['garage','living','bar'];
export type HousePhone=Place&{room:RoomId;index:number};
const local=(room:RoomId,x:number,y:number)=>{const p=planPoint(x,y);return{x:p.x-roomOffsets[room].x,z:p.z-roomOffsets[room].z};};
function seat(room:RoomId,x:number,y:number,angle:number,name:string,count=1,color='#78917a',spot?:string,stool=false):Furniture{return{...local(room,x,y),angle,name,count,color,spot,stool,scale:.78};}
export const barTables=[local('bar',608,603),local('bar',487,604)];
export const furniture:Record<RoomId,Furniture[]>={
 garage:[
  seat('garage',819,650,Math.PI/2,'Sofá do som',3,'#b77d55'),
  seat('garage',1008,622,-Math.PI/2,'Poltrona verde'),
  seat('garage',1008,650,-Math.PI/2,'Poltrona caramelo',1,'#b08350'),
  seat('garage',919,726,Math.PI,'Banco da garagem',3,'#987451'),
  seat('garage',732,638,Math.PI,'Sofá do cinema',3,'#5b746b','garage-cinema'),
  seat('garage',687,594,Math.PI/2,'Poltrona do cinema',1,'#b4926f','garage-cinema'),
 ],
 living:[
  seat('living',405,364,Math.PI/2,'Sofá terracota',3,'#b97861'),
  seat('living',533,364,-Math.PI/2,'Sofá verde',3,'#768063'),
  seat('living',442,303,0,'Poltrona de leitura',1,'#ba9b67'),
  seat('living',487,303,0,'Poltrona da janela',1,'#ba9b67'),
  seat('living',278,346,Math.PI/2,'Banco do alfresco',2,'#79927a','living-alfresco'),
  seat('living',365,346,-Math.PI/2,'Cadeiras do alfresco',2,'#baa282','living-alfresco'),
  seat('living',264,220,Math.PI/2,'Cadeiras da piscina',2,'#ede2ce','living-pool'),
  seat('living',339,220,-Math.PI/2,'Banco do deck',2,'#c6a57b','living-pool'),
  seat('living',574,340,Math.PI/2,'Sofá · escuta',2,'#a3aa92','living-escuta'),
  seat('living',646,340,-Math.PI/2,'Poltronas · escuta',2,'#a3aa92','living-escuta'),
  seat('living',800,340,Math.PI/2,'Sofá · cores',2,'#b78890','living-cores'),
  seat('living',875,340,-Math.PI/2,'Poltronas · cores',2,'#b78890','living-cores'),
  seat('living',966,368,Math.PI/2,'Sofá · encontros',2,'#bd967d','living-encontros'),
  seat('living',1063,368,-Math.PI/2,'Poltronas · encontros',2,'#bd967d','living-encontros'),
 ],
 bar:[
  ...[322,360,399].map((x,i)=>seat('bar',x,550,0,`Balcão · banco ${i+1}`,1,'#56715c',undefined,true)),
  ...barTables.flatMap((p,t)=>[
   {x:p.x-.68,z:p.z,angle:Math.PI/2},{x:p.x+.68,z:p.z,angle:-Math.PI/2},
   {x:p.x,z:p.z-.68,angle:0},{x:p.x,z:p.z+.68,angle:Math.PI},
  ].map((p,i)=>({...p,name:`${t===1?'Jantar · pôquer':'Quarto 4 · jogos'} · lugar ${i+1}`,count:1,color:'#7c6345',stool:true,scale:.78}))),
 ],
};
export function seatsFor(room:RoomId){return furniture[room].flatMap((f,group)=>Array.from({length:f.count},(_,i)=>{
 const offset=(i-(f.count-1)/2)*.8*f.scale;
 return{x:f.x+Math.cos(f.angle)*offset,z:f.z-Math.sin(f.angle)*offset,angle:f.angle,name:f.count>1?`${f.name} · lugar ${i+1}`:f.name,group,spot:f.spot,height:(f.stool?.76:.665)*f.scale,approach:(f.stool?-.6:.88)*f.scale};
}));}
export const seats=seatsFor('garage');
const phonePoints:Record<RoomId,number[][]>={garage:[[844,581],[970,544],[992,711],[775,585]],living:[[405,452],[528,464],[838,373],[1010,431]],bar:[[270,532],[434,570],[632,645],[442,694]]};
export const phonesFor=(room:RoomId)=>phonePoints[room].map(([x,y])=>local(room,x,y));
export const phones=phonesFor('garage');
const plantPoints:Record<RoomId,number[][]>={garage:[[1017,536],[822,724]],living:[[399,495],[540,292],[566,293],[792,293],[1071,340],[272,491]],bar:[[539,646],[566,650]]};
export const plantsFor=(room:RoomId)=>plantPoints[room].map(([x,y])=>{const p=local(room,x,y);return[p.x,p.z];});
export const plants=plantsFor('garage');
export function obstaclesFor(room:RoomId){return[
 ...FIXTURES.filter(f=>f.room===room).map(f=>({...f,x:f.x-roomOffsets[room].x,z:f.z-roomOffsets[room].z})),
 ...(room==='bar'?barTables.map((p,i)=>({...p,w:i===1?.94:.77,d:i===1?.95:.77})):[]),
 ...furniture[room].map(f=>{const w=(f.stool?.42:f.count*.8+.2)*f.scale,d=(f.stool?.42:.9)*f.scale;return{...f,w:Math.abs(Math.cos(f.angle))*w+Math.abs(Math.sin(f.angle))*d,d:Math.abs(Math.sin(f.angle))*w+Math.abs(Math.cos(f.angle))*d};}),
 ...plantsFor(room).map(([x,z])=>({x,z,w:.5,d:.5})),...phonesFor(room).map(p=>({...p,w:.65,d:.65})),
];}
export const obstacles=obstaclesFor('garage');
export function approachSeat(s:ReturnType<typeof seatsFor>[number]):Place{return{x:s.x+Math.sin(s.angle)*s.approach,z:s.z+Math.cos(s.angle)*s.approach};}
export function seatedOrigin(height:number,hipY:number){return height+.08-hipY;}
export function walkable(p:Place,room:RoomId='garage'){const world=worldPoint(p,room);return roomAt(world)===room&&houseWalkable(world);}
export function route(from:Place,to:Place,room:RoomId='garage'):Place[]{
  if(!walkable(to,room))return[];
  const step=.2,key=(p:Place)=>`${Math.round(p.x/step)},${Math.round(p.z/step)}`;
  const origin={x:Math.round(from.x/step)*step,z:Math.round(from.z/step)*step};
  const queue=[origin],seen=new Set([key(origin)]),previous=new Map<string,Place>();
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    if(Math.hypot(p.x-to.x,p.z-to.z)<.25&&[.25,.5,.75].every(t=>walkable({x:p.x+(to.x-p.x)*t,z:p.z+(to.z-p.z)*t},room))){
      const path=[to];let cursor=p;while(key(cursor)!==key(origin)){path.unshift(cursor);cursor=previous.get(key(cursor))!;}return path;
    }
    for(const[dx,dz]of[[step,0],[-step,0],[0,step],[0,-step]]){
      const n={x:p.x+dx,z:p.z+dz},id=key(n);if(!seen.has(id)&&walkable(n,room)){seen.add(id);previous.set(id,p);queue.push(n);}
    }
  }return[];
}
export function worldPoint(p:Place,room:RoomId):Place{return{x:p.x+roomOffsets[room].x,z:p.z+roomOffsets[room].z};}
export function roomAt(p:Place):RoomId|undefined{return areaAt(p)?.room;}
export function nearbyPhone(p:Place):HousePhone|null{
  const room=roomAt(p);if(!room)return null;
  const candidates=phonesFor(room).map((phone,index)=>({...worldPoint(phone,room),room,index}));
  return candidates.filter(phone=>Math.hypot(phone.x-p.x,phone.z-p.z)<=1.15).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0]??null;
}
/** Small swept steps prevent keyboard/touch movement from tunnelling through furniture. */
export function moveInHouse(from:Place,dx:number,dz:number):Place{
  const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.05));let p={...from};
  for(let i=0;i<count;i++){
    const next={x:p.x+dx/count,z:p.z+dz/count};if(houseWalkable(next)){p=next;continue;}
    const x={x:next.x,z:p.z};if(houseWalkable(x))p=x;
    const z={x:p.x,z:next.z};if(houseWalkable(z))p=z;
  }return p;
}
export function routeToPhone(from:Place,room:RoomId,index:number):Place[]{
  const phone=phonesFor(room)[index];if(!phone)return[];
  const center=worldPoint(phone,room);
  const candidates=Array.from({length:12},(_,i)=>({x:center.x+Math.sin(i*Math.PI/6)*.85,z:center.z+Math.cos(i*Math.PI/6)*.85})).filter(houseWalkable).sort((a,b)=>Math.hypot(a.x-from.x,a.z-from.z)-Math.hypot(b.x-from.x,b.z-from.z));
  for(const goal of candidates){const path=houseRoute(from,goal);if(path.length)return path;}return[];
}
const houseObstacles=roomIds.flatMap(room=>obstaclesFor(room).map(o=>({...o,...worldPoint(o,room)})));
function onFloor(p:Place){return HOUSE_AREAS.some(a=>Math.abs(p.x-a.x)<=a.w/2+.001&&Math.abs(p.z-a.z)<=a.d/2+.001);}
export function houseWalkable(p:Place){
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return false;
  if(![[0,0],[.18,0],[-.18,0],[0,.18],[0,-.18]].every(([x,z])=>onFloor({x:p.x+x,z:p.z+z})))return false;
  return ![...houseObstacles,...WALLS,POOL].some(o=>Math.abs(p.x-o.x)<o.w/2+.13&&Math.abs(p.z-o.z)<o.d/2+.13);
}
export function houseRoute(from:Place,to:Place,people:Place[]=[]):Place[]{
  const clear=(p:Place)=>houseWalkable(p)&&people.every(q=>Math.hypot(q.x-p.x,q.z-p.z)>=.54);
  if(!clear(to))return[];
  const step=.2,key=(p:Place)=>`${Math.round(p.x/step)},${Math.round(p.z/step)}`;
  const origin={x:Math.round(from.x/step)*step,z:Math.round(from.z/step)*step};
  const queue=[origin],seen=new Set([key(origin)]),previous=new Map<string,Place>();
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    if(Math.hypot(p.x-to.x,p.z-to.z)<.25&&[.25,.5,.75].every(t=>clear({x:p.x+(to.x-p.x)*t,z:p.z+(to.z-p.z)*t}))){
      const path=[to];let cursor=p;while(key(cursor)!==key(origin)){path.unshift(cursor);cursor=previous.get(key(cursor))!;}return path;
    }
    for(const[dx,dz]of[[step,0],[-step,0],[0,step],[0,-step]]){const n={x:p.x+dx,z:p.z+dz},id=key(n);if(!seen.has(id)&&clear(n)){seen.add(id);previous.set(id,p);queue.push(n);}}
  }return[];
}
