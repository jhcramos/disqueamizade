import {START} from '../src/garage/model.ts';
import {BALL_START,CUSHION_START} from '../src/garage/play.ts';
import test from 'node:test';
import {HOUSE_AREAS,POOL,planPoint,areaById,WALLS,OPENINGS} from '../src/garage3d/areas.ts';
import {toShared,validShared} from '../src/garage3d/coordinates.ts';
import assert from 'node:assert/strict';
import {seatsFor,phones,walkable,route,obstaclesFor,approachSeat,seatedOrigin,houseRoute,houseWalkable,worldPoint,roomIds,nearbyPhone,routeToPhone,moveInHouse} from '../src/garage3d/layout.ts';
test('3D furniture blocks walking while all seats have reachable approaches',()=>{
  assert.equal(phones.length,4);
  for(const [room,count] of [['garage',12],['living',28],['bar',11]]){
    assert.equal(seatsFor(room).length,count);
    for(const o of obstaclesFor(room))assert.equal(walkable(o,room),false);
    for(const s of seatsFor(room)){
      const target=approachSeat(s);
      const path=houseRoute(areaById('garage').arrival,worldPoint(target,room));assert.ok(path.length,s.name);
      assert.deepEqual(path.at(-1),worldPoint(target,room));for(const p of path)assert.ok(houseWalkable(p));
    }
  }
});
test('seat height accounts for the avatar hip and cushion clearance at different scales',()=>{
  for(const hip of [.42,.54,.7])for(const room of ['garage','living','bar'])for(const s of seatsFor(room)){
    assert.ok(seatedOrigin(s.height,hip)+hip>s.height+.07);
  }
});
test('walking remains within the garage and rejects furniture targets',()=>{
  for(const to of [{x:100,z:0},{x:0,z:-100},obstaclesFor('garage')[0],{x:NaN,z:0}])assert.deepEqual(route({x:0,z:2.8},to),[]);
});
test('the connected house reaches all 51 seats through real doorways',()=>{
  let origin=areaById('garage').arrival;
  for(const room of roomIds)for(const s of seatsFor(room)){
    const goal=worldPoint(approachSeat(s),room),path=houseRoute(origin,goal);
    assert.ok(path.length,`${room}: ${s.name}`);assert.deepEqual(path.at(-1),goal);
    let previous=origin;
    for(const p of path){
      for(const t of [.25,.5,.75,1])assert.ok(houseWalkable({x:previous.x+(p.x-previous.x)*t,z:previous.z+(p.z-previous.z)*t}),`blocked segment ${room}`);
      previous=p;
    }
    origin=goal;
  }
});
test('house walls, swimming water and exterior boundaries remain blocked',()=>{
  for(const p of [POOL,...WALLS,{x:53,z:0},{x:-53,z:-10},{x:NaN,z:0}]){
    assert.equal(houseWalkable(p),false);assert.deepEqual(houseRoute(areaById('garage').arrival,p),[]);
  }
  for(const a of HOUSE_AREAS){assert.ok(houseWalkable(a.arrival),a.id);assert.ok(houseRoute(areaById('garage').arrival,a.arrival).length,a.id);assert.ok(validShared(toShared(a.arrival,a.room),a.room),a.id);}
});
test('all twelve phones can be approached and only nearby phones offer a call',()=>{
  assert.equal(nearbyPhone(planPoint(905,650)),null);
  for(const room of roomIds)for(let i=0;i<phones.length;i++){
    const path=routeToPhone(areaById('garage').arrival,room,i);assert.ok(path.length);
    assert.equal(nearbyPhone(path.at(-1))?.index,i);assert.equal(nearbyPhone(path.at(-1))?.room,room);
  }
  assert.equal(nearbyPhone({x:30,z:0}),null);
});
test('first person movement stops at partitions and crosses their actual doors',()=>{
  const origin=planPoint(789,560),blocked=moveInHouse(origin,.8,0);
  assert.ok(blocked.x<planPoint(798,560).x);assert.ok(houseWalkable(blocked));
  const crossing=moveInHouse(planPoint(730,510),0,.7);assert.ok(crossing.z>planPoint(730,519).z);assert.ok(houseWalkable(crossing));
});
test('the integrated route detours around another person with body clearance',()=>{
  const from=planPoint(857,671),to=planPoint(957,671),people=[planPoint(907,671)];
  const path=houseRoute(from,to,people);assert.ok(path.length);assert.deepEqual(path.at(-1),to);
  for(const p of path)assert.ok(Math.hypot(p.x-people[0].x,p.z-people[0].z)>=.52);
});

test('floor plan preserves original room positions, recesses, fixtures and exact pool size',()=>{
 assert.equal(POOL.w,7);assert.equal(POOL.d,2);
 const at=id=>areaById(id);
 assert.ok(at('quiet').x<at('bath').x&&at('bath').x<at('pride').x&&at('pride').x<at('dating').x);
 assert.ok(at('games').x<at('media').x&&at('media').x<at('garage').x);
 assert.ok(at('kitchen').z<at('laundry').z&&at('pantry').z>at('dining').z);
 assert.ok(at('court').outdoor&&at('porch').outdoor&&at('alfresco').outdoor);
 assert.ok(at('alfresco').x<at('living').x&&POOL.z<at('living').z);
 assert.ok(Math.abs(at('garage').w-236*22.020/841)<1e-8);
 const door=OPENINGS.find(o=>o.kind==='garage');assert.equal(door.axis,'z');assert.ok(door.x>at('garage').x);
});

test('the public entry and play props start on valid floor, never inside a moved furnishing',()=>{
 assert.ok(validShared(START,'garage'));
 for(const room of ['garage','living'])for(const p of [BALL_START,CUSHION_START])assert.ok(validShared(p,room),room);
});
