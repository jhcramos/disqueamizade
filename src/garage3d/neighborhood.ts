import type {Place,Rect} from './areas.ts';

/** Virtual parcels within Disque Amizade, never real-world property. */
export const LAND_PRICE=999;
export const HOUSE_PRICE=2500;
export const NEIGHBORHOOD_BOUNDS={minX:-52,maxX:52,minZ:-46,maxZ:46};
export const NEIGHBORHOOD_LOTS=['Jardim','Ipê','Sol','Varanda','Encontro','Horizonte'].map((name,i)=>{
 const x=(i%3-1)*30,z=i<3?-27:27,front=i<3?1:-1;
 return{id:String(i+1),name,x,z,w:28,d:22,sign:{x:x+7,z:z+front*10},arrival:{x:x+7,z:z+front*12.3}};
});
export const lotById=(id:string|null|undefined)=>NEIGHBORHOOD_LOTS.find(l=>l.id===id);
export const NEIGHBORHOOD_TREES:Place[]=[{x:-39,z:-6},{x:-21,z:6},{x:21,z:-6},{x:39,z:6},...[-39,-21,21,39].flatMap(x=>[{x,z:-39.7},{x,z:39.7}])];
export const NEIGHBORHOOD_BENCHES:Rect[]=[{x:-30,z:-5,w:2.5,d:.65},{x:30,z:5,w:2.5,d:.65}];
export const NEIGHBORHOOD_OBSTACLES:Rect[]=[...NEIGHBORHOOD_TREES.map(p=>({...p,w:.55,d:.55})),...NEIGHBORHOOD_BENCHES,...NEIGHBORHOOD_LOTS.map(l=>({...l.sign,w:2.4,d:.26}))];
export function inNeighborhood(p:Place){return Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=NEIGHBORHOOD_BOUNDS.minX&&p.x<=NEIGHBORHOOD_BOUNDS.maxX&&p.z>=NEIGHBORHOOD_BOUNDS.minZ&&p.z<=NEIGHBORHOOD_BOUNDS.maxZ;}
