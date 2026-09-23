import type {Place} from './areas.ts';
function simplify(path:Place[]){return path.filter((p,i)=>{if(i===0||i===path.length-1)return true;const a=path[i-1],b=path[i+1],dx=p.x-a.x,dz=p.z-a.z,ex=b.x-p.x,ez=b.z-p.z;return Math.abs(dx*ez-dz*ex)>1e-7||dx*ex+dz*ez<=0;});}
type Node=Place&{key:string;cost:number;rank:number};
/** A* keeps trips across the block bounded without flooding every room first. */
export function findWalkingRoute(from:Place,to:Place,clear:(p:Place)=>boolean):Place[]{
 if(!Number.isFinite(from.x)||!Number.isFinite(from.z)||!clear(to))return[];
 const step=.2,key=(p:Place)=>`${Math.round(p.x/step)},${Math.round(p.z/step)}`;
 const segment=(a:Place,b:Place)=>{const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.06));for(let i=1;i<=n;i++)if(!clear({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n}))return false;return true;};
 if(segment(from,to))return[to];
 const origin={x:Math.round(from.x/step)*step,z:Math.round(from.z/step)*step};
 const heap:Node[]=[],best=new Map<string,number>(),previous=new Map<string,Place>();
 const estimate=(p:Place)=>Math.hypot(p.x-to.x,p.z-to.z);
 const push=(node:Node)=>{let i=heap.length;heap.push(node);while(i>0){const parent=(i-1)>>1;if(heap[parent].rank<=node.rank)break;heap[i]=heap[parent];i=parent;}heap[i]=node;};
 const pop=()=>{const first=heap[0],last=heap.pop()!;if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].rank<heap[child].rank)child++;if(last.rank<=heap[child].rank)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first;};
 for(const dx of [-step,0,step])for(const dz of [-step,0,step]){const seed={x:origin.x+dx,z:origin.z+dz};if(!clear(seed)||!segment(from,seed))continue;const cost=Math.hypot(seed.x-from.x,seed.z-from.z),id=key(seed);best.set(id,cost);push({...seed,key:id,cost,rank:cost+estimate(seed)});}
 const passable=new Map<string,boolean>();let expanded=0;
 while(heap.length&&expanded++<270000){
  const p=pop();if(p.cost!==best.get(p.key))continue;
  if(Math.hypot(p.x-to.x,p.z-to.z)<.26&&segment(p,to)){
   const path:Place[]=[to];let cursor:Place=p;while(previous.has(key(cursor))){path.unshift({x:cursor.x,z:cursor.z});cursor=previous.get(key(cursor))!;}path.unshift({x:cursor.x,z:cursor.z});return simplify(path);
  }
  for(const[dx,dz]of[[step,0],[-step,0],[0,step],[0,-step]]){
   const n={x:p.x+dx,z:p.z+dz},id=key(n),cost=p.cost+step;
   if(cost>=(best.get(id)??Infinity)-1e-8)continue;
   let valid=passable.get(id);if(valid===undefined){valid=clear(n);passable.set(id,valid);}if(!valid||!segment(p,n))continue;
   best.set(id,cost);previous.set(id,p);push({...n,key:id,cost,rank:cost+estimate(n)});
  }
 }
 return[];
}
