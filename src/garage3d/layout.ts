export type Place = { x: number; z: number };
export type RoomId = 'garage'|'living'|'bar';
export type Furniture = Place & { angle:number; name:string; count:number; color:string; stool?:boolean };
export const roomNames:Record<RoomId,string>={garage:'Garagem',living:'Sala de estar',bar:'Bar Vinyl'};
export const roomOffsets:Record<RoomId,Place>={garage:{x:-5,z:-8},living:{x:-5,z:0},bar:{x:5,z:0}};
export const roomIds:RoomId[]=['garage','living','bar'];
export type HousePhone=Place&{room:RoomId;index:number};
export const furniture:Record<RoomId,Furniture[]>={
  garage:[
    {x:-2.8,z:.65,angle:Math.PI/2,name:'Sofá do som',count:3,color:'#b77d55'},
    {x:1.7,z:.1,angle:-Math.PI/2,name:'Poltrona verde',count:1,color:'#647557'},
    {x:1.7,z:1.15,angle:-Math.PI/2,name:'Poltrona caramelo',count:1,color:'#b08350'},
    {x:.0,z:-1.55,angle:0,name:'Banco da garagem',count:3,color:'#987451'},
  ],
  living:[
    {x:-2.8,z:.65,angle:Math.PI/2,name:'Sofá terracota',count:3,color:'#b97861'},
    {x:2.25,z:.65,angle:-Math.PI/2,name:'Sofá verde',count:3,color:'#768063'},
    {x:-.85,z:-1.7,angle:0,name:'Poltrona de leitura',count:1,color:'#ba9b67'},
    {x:.3,z:-1.7,angle:0,name:'Poltrona da janela',count:1,color:'#ba9b67'},
  ],
  bar:[
    ...[-2.55,-1.35,-.15].map((x,i)=>({x,z:-1.85,angle:Math.PI,name:`Balcão · banco ${i+1}`,count:1,color:'#56715c',stool:true})),
    ...[[-2.45,.85],[.35,.85],[3.1,.85]].flatMap(([x,z],t)=>[
      {x:x-.7,z,angle:Math.PI/2},{x:x+.7,z,angle:-Math.PI/2},
      {x,z:z-.7,angle:0},{x,z:z+.7,angle:Math.PI},
    ].map((p,i)=>({...p,name:`Mesa ${t+1} · lugar ${i+1}`,count:1,color:'#7c6345',stool:true}))),
  ],
};
export function seatsFor(room:RoomId){return furniture[room].flatMap((f,group)=>Array.from({length:f.count},(_,i)=>{
  const offset=(i-(f.count-1)/2)*.8;
  return {x:f.x+Math.cos(f.angle)*offset,z:f.z-Math.sin(f.angle)*offset,angle:f.angle,
    name:f.count>1?`${f.name} · lugar ${i+1}`:f.name,group,height:f.stool?.76:.665,approach:f.stool?-.6:.88};
}));}
export const seats=seatsFor('garage');
export const phones=[{x:-3.8,z:-2.3},{x:1.05,z:-2.9},{x:3.95,z:-1.7},{x:-3.65,z:2.9}];
export const plants=[[-4.25,-.9],[-4.1,3.6],[4,-3.1],[4,3.1]];
export const barTables=[{x:-2.45,z:.85},{x:.35,z:.85},{x:3.1,z:.85}];
export function obstaclesFor(room:RoomId){return [
  ...(room==='bar'?[{x:-1.5,z:-2.8,w:4,d:1},...barTables.map(p=>({...p,w:.9,d:.9}))]:[
    {x:-3.55,z:-2.85,w:2.2,d:1.25},{x:-1.7,z:-3.15,w:1,d:1},
    {x:2.8,z:-3,w:2.8,d:1.3},{x:-.55,z:.85,w:1.25,d:.9},
  ]),
  ...furniture[room].map(f=>{const w=f.stool?.42:f.count*.8+.2,d=f.stool?.42:.9;return{...f,w:Math.abs(Math.cos(f.angle))*w+Math.abs(Math.sin(f.angle))*d,d:Math.abs(Math.sin(f.angle))*w+Math.abs(Math.cos(f.angle))*d};}),
  ...plants.map(([x,z])=>({x,z,w:.65,d:.65})),...phones.map(p=>({...p,w:.65,d:.65})),
];}
export const obstacles=obstaclesFor('garage');
export function approachSeat(s:ReturnType<typeof seatsFor>[number]):Place{return{x:s.x+Math.sin(s.angle)*s.approach,z:s.z+Math.cos(s.angle)*s.approach};}
export function seatedOrigin(height:number,hipY:number){return height+.08-hipY;}
export function walkable(p:Place,room:RoomId='garage'){
  return Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<4.6&&p.z>-3.5&&p.z<3.6&&
    !obstaclesFor(room).some(o=>Math.abs(p.x-o.x)<o.w/2+.13&&Math.abs(p.z-o.z)<o.d/2+.13);
}
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
export function roomAt(p:Place):RoomId|undefined{return roomIds.find(id=>Math.abs(p.x-roomOffsets[id].x)<5&&Math.abs(p.z-roomOffsets[id].z)<4);}
export function nearbyPhone(p:Place):HousePhone|null{
  const room=roomAt(p);if(!room)return null;
  const candidates=phones.map((phone,index)=>({...worldPoint(phone,room),room,index}));
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
  const phone=phones[index];if(!phone)return[];
  const center=worldPoint(phone,room);
  const candidates=Array.from({length:12},(_,i)=>({x:center.x+Math.sin(i*Math.PI/6)*.85,z:center.z+Math.cos(i*Math.PI/6)*.85})).filter(houseWalkable).sort((a,b)=>Math.hypot(a.x-from.x,a.z-from.z)-Math.hypot(b.x-from.x,b.z-from.z));
  for(const goal of candidates){const path=houseRoute(from,goal);if(path.length)return path;}return[];
}
const houseObstacles=roomIds.flatMap(room=>obstaclesFor(room).map(o=>({...o,...worldPoint(o,room)})));
function onFloor(p:Place){return roomIds.some(room=>Math.abs(p.x-roomOffsets[room].x)<5&&Math.abs(p.z-roomOffsets[room].z)<4);}
export function houseWalkable(p:Place){
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return false;
  // Slight overlap at the shared edges forms one floor, not three disconnected rectangles.
  const inHouse=(q:Place)=>onFloor(q)||(Math.abs(q.z+4)<.001&&q.x>-10&&q.x<0)||(Math.abs(q.x)<.001&&q.z>-4&&q.z<4);
  if(![[0,0],[.18,0],[-.18,0],[0,.18],[0,-.18]].every(([x,z])=>inHouse({x:p.x+x,z:p.z+z})))return false;
  if(Math.abs(p.z+4)<.25&&p.x<0&&Math.abs(p.x+5)>.78)return false;
  if(Math.abs(p.x)<.25&&p.z>-4&&(p.z<2.15||p.z>3.45))return false;
  return !houseObstacles.some(o=>Math.abs(p.x-o.x)<o.w/2+.13&&Math.abs(p.z-o.z)<o.d/2+.13);
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
