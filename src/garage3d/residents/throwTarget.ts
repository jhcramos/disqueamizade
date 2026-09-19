import {houseWalkable,houseRoute,type Place} from '../layout.ts';
/** Prefer a long clear throw, never across furniture/walls or onto a visitor. */
export function findThrowTarget(from:Place,dog:Place,people:Place[]){
 for(const range of [5,4,3,2,1.2])for(let i=0;i<24;i++){
  const a=i*Math.PI/12,goal={x:from.x+Math.cos(a)*range,z:from.z+Math.sin(a)*range};
  const steps=Math.ceil(range/.15);
  if(!Array.from({length:steps},(_,n)=>{const t=(n+1)/steps;return {x:from.x+(goal.x-from.x)*t,z:from.z+(goal.z-from.z)*t};}).every(houseWalkable))continue;
  if(people.some(p=>Math.hypot(p.x-goal.x,p.z-goal.z)<.7))continue;
  const path=houseRoute(dog,goal,people);if(path.length)return {goal,path,range};
 }
 return null;
}
