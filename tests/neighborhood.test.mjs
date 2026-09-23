import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {NEIGHBORHOOD_LOTS,NEIGHBORHOOD_OBSTACLES,NEIGHBORHOOD_BOUNDS} from '../src/garage3d/neighborhood.ts';
import {houseWalkable,houseRoute,roomAt,moveInHouse} from '../src/garage3d/layout.ts';
import {areaById,POOL,WALLS} from '../src/garage3d/areas.ts';
import {toShared,validShared} from '../src/garage3d/coordinates.ts';
import {createLife,parseLife,applyCommand,tickLife,ITEMS,BED} from '../src/garage3d/residents/model.ts';
import {parsePerson} from '../src/garage/model.ts';
import {emptyNetwork,exchangeNetwork} from '../server/houseNetwork.ts';

test('six non-overlapping equal-size plots preserve the measured house footprint',()=>{
 assert.equal(NEIGHBORHOOD_LOTS.length,6);
 for(const a of NEIGHBORHOOD_LOTS){assert.equal(a.w,28);assert.equal(a.d,22);assert.ok(Math.abs(a.z)-a.d/2>10);for(const b of NEIGHBORHOOD_LOTS)if(a!==b)assert.ok(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.z-b.z)>=(a.d+b.d)/2);}
});
test('all plot entrances are reached from the house and can return without crossing a wall',()=>{
 for(const lot of NEIGHBORHOOD_LOTS){
  for(const [from,to]of[[areaById('garage').arrival,lot.arrival],[lot.arrival,areaById('living').arrival]]){
   const start=performance.now(),path=houseRoute(from,to);assert.ok(path.length,lot.id);assert.deepEqual(path.at(-1),to);assert.ok(performance.now()-start<3000,'route must stay responsive');let before=from;
   for(const p of path){const count=Math.max(1,Math.ceil(Math.hypot(p.x-before.x,p.z-before.z)/.05));for(let i=1;i<=count;i++)assert.ok(houseWalkable({x:before.x+(p.x-before.x)*i/count,z:before.z+(p.z-before.z)*i/count}),lot.id);before=p;}
  }
 }
});
test('avatar can complete a loop on perimeter sidewalks, streets and connecting paths',()=>{
 const points=[{x:44.8,z:38},{x:44.8,z:-38},{x:-44.8,z:-38},{x:-44.8,z:38},{x:44.8,z:38},{x:49,z:13.7},{x:0,z:43}];
 for(let i=1;i<points.length;i++){assert.ok(houseWalkable(points[i]));assert.ok(houseRoute(points[i-1],points[i]).length);}
 assert.ok(moveInHouse({x:20,z:13.7},1,0).x>20.9);
});
test('outside movement rejects water, furniture, signs, trees and world boundaries',()=>{
 for(const p of [POOL,...WALLS,...NEIGHBORHOOD_OBSTACLES,{x:NEIGHBORHOOD_BOUNDS.maxX+1,z:0},{x:0,z:NEIGHBORHOOD_BOUNDS.minZ-1},{x:NaN,z:0}])assert.equal(houseWalkable(p),false);
 assert.deepEqual(houseRoute(areaById('garage').arrival,{x:100,z:100}),[]);
});
test('outdoor avatars retain validated presence across independent sessions',()=>{
 const state=emptyNetwork(),a=randomUUID(),b=randomUUID(),position=toShared(NEIGHBORHOOD_LOTS[5].arrival,'garage');assert.ok(validShared(position,'garage'));assert.equal(roomAt(NEIGHBORHOOD_LOTS[5].arrival),'garage');
 const person={id:a,name:'Vizinha',avatar:0,room:'garage',position,busy:false};assert.ok(parsePerson(person));
 const body={id:a,cursor:0,channels:['disque-house-3d-v1'],messages:[{id:randomUUID(),channel:'disque-house-3d-v1',data:{event:'person',data:person}}]};
 exchangeNetwork(state,'owner-a',body,10000);const response=exchangeNetwork(state,'owner-b',{id:b,cursor:0,channels:body.channels,messages:[]},11000);assert.equal(response.roster[0].id,a);assert.deepEqual(response.roster[0].position,position);
});

test('carried objects and Layla bed stay valid outdoors, including her long follow route',()=>{
 for(const kind of ['coffee','toy','bed']){
  const state=createLife(0),visitor={id:'carrier',name:'Visitante',position:{...(kind==='bed'?BED:ITEMS[kind].position)}};
  applyCommand(state,{id:'pick',visitor,action:kind==='bed'?'moveBed':'pick',target:kind},1000,[visitor]);
  visitor.position={...NEIGHBORHOOD_LOTS[0].arrival};tickLife(state,.1,[visitor],1100);
  assert.ok(parseLife(state),`${kind} stays valid outside`);
  if(kind==='bed'){applyCommand(state,{id:'place',visitor,action:'placeBed',target:'bed'},4000,[visitor]);assert.ok(parseLife(state));assert.deepEqual(state.bed.home,visitor.position);}
  for(const resident of state.residents){assert.ok(resident.path.length<=400);assert.ok(resident.path.every(houseWalkable));}
  visitor.position={x:999,z:0};tickLife(state,.1,[visitor],4200);if(kind==='bed')state.bed.position={...visitor.position};assert.equal(parseLife(state),null,'outside the world remains rejected');
 }
});
