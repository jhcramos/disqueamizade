export type Place = { x: number; z: number };
export const seats = [
  { x: -2.7, z: .65, angle: Math.PI / 2, name: 'Sofá · perto do som' },
  { x: -2.7, z: 1.55, angle: Math.PI / 2, name: 'Sofá · perto da entrada' },
  { x: 1.7, z: .7, angle: -Math.PI / 2, name: 'Poltrona verde' },
  { x: 1.7, z: 1.7, angle: -Math.PI / 2, name: 'Poltrona caramelo' },
];
export const phones = [{x:-3.8,z:-2.3},{x:.1,z:-2.9},{x:3.7,z:-1.2},{x:-3.65,z:2.65}];
export const obstacles = [
  {x:-3.55,z:-2.85,w:2.2,d:1.25}, {x:-1.7,z:-3.15,w:1,d:1},
  {x:2.8,z:-3.0,w:2.8,d:1.3}, {x:-2.7,z:1.1,w:1.05,d:2.1},
  {x:1.7,z:.7,w:.8,d:.8}, {x:1.7,z:1.7,w:.8,d:.8},
  {x:-.55,z:1.2,w:1.25,d:.9},
  ...[[-4.25,-.9],[-4.1,3.15],[4,-2.3],[4,2.7],[-.85,-3.4]].map(([x,z])=>({x,z,w:.65,d:.65})),
  ...phones.map(p=>({...p,w:.65,d:.65})),
];
export function walkable(p:Place) {
  return Math.abs(p.x)<4.45 && p.z>-3.45 && p.z<3.45 &&
    !obstacles.some(o=>Math.abs(p.x-o.x)<o.w/2+.2 && Math.abs(p.z-o.z)<o.d/2+.2);
}
export function route(from:Place,to:Place):Place[] {
  if(!walkable(to)) return [];
  const step=.25, key=(p:Place)=>`${Math.round(p.x/step)},${Math.round(p.z/step)}`;
  const origin={x:Math.round(from.x/step)*step,z:Math.round(from.z/step)*step};
  const queue=[origin], seen=new Set([key(origin)]), previous=new Map<string,Place>();
  for(let i=0;i<queue.length;i++) {
    const p=queue[i];
    if(Math.hypot(p.x-to.x,p.z-to.z)<.3) {
      const path=[to]; let cursor=p;
      while(key(cursor)!==key(origin)){path.unshift(cursor);cursor=previous.get(key(cursor))!;}
      return path;
    }
    for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]) {
      const n={x:p.x+dx,z:p.z+dz}, id=key(n);
      if(!seen.has(id)&&walkable(n)){seen.add(id);previous.set(id,p);queue.push(n);}
    }
  }
  return [];
}
