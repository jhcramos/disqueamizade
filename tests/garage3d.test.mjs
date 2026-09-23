import test from 'node:test';
import {HOUSE_AREAS,POOL} from '../src/garage3d/areas.ts';
import {toShared,validShared} from '../src/garage3d/coordinates.ts';
import assert from 'node:assert/strict';
import {seatsFor,phones,walkable,route,obstaclesFor,approachSeat,seatedOrigin,houseRoute,houseWalkable,worldPoint,roomIds,nearbyPhone,routeToPhone,moveInHouse} from '../src/garage3d/layout.ts';
test('3D furniture blocks walking while all seats have reachable approaches',()=>{
  assert.equal(phones.length,4);
  for(const [room,count] of [['garage',12],['living',28],['bar',15]]){
    assert.equal(seatsFor(room).length,count);
    for(const o of obstaclesFor(room))assert.equal(walkable(o,room),false);
    for(const s of seatsFor(room)){
      const target=approachSeat(s);
      const path=houseRoute({x:7,z:6.8},worldPoint(target,room));assert.ok(path.length,s.name);
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
  for(const to of [{x:30,z:0},{x:0,z:-14},{x:-.55,z:1.2},{x:NaN,z:0}])assert.deepEqual(route({x:0,z:2.8},to),[]);
});
test('the connected house reaches all 55 seats through real doorways',()=>{
  let origin={x:7,z:6.8};
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
  for(const p of [POOL,{x:3,z:-8},{x:2,z:2},{x:13,z:0},{x:-17,z:-10},{x:NaN,z:0}]){
    assert.equal(houseWalkable(p),false);assert.deepEqual(houseRoute({x:7,z:6.8},p),[]);
  }
  for(const a of HOUSE_AREAS){assert.ok(houseWalkable(a.arrival),a.id);assert.ok(houseRoute({x:7,z:6.8},a.arrival).length,a.id);assert.ok(validShared(toShared(a.arrival,a.room),a.room),a.id);}
});
test('all twelve phones can be approached and only nearby phones offer a call',()=>{
  assert.equal(nearbyPhone({x:7,z:6.8}),null);
  for(const room of roomIds)for(let i=0;i<phones.length;i++){
    const path=routeToPhone({x:7,z:6.8},room,i);assert.ok(path.length);
    assert.equal(nearbyPhone(path.at(-1))?.index,i);assert.equal(nearbyPhone(path.at(-1))?.room,room);
  }
  assert.equal(nearbyPhone({x:30,z:0}),null);
});
test('first person movement stops at shared walls and crosses only their openings',()=>{
  const blocked=moveInHouse({x:1.5,z:2},2,0);assert.ok(blocked.x<2);
  const crossing=moveInHouse({x:1.5,z:6.5},2,0);assert.ok(crossing.x>2);assert.ok(houseWalkable(crossing));
  const outside=moveInHouse({x:9,z:6.5},8,0);assert.ok(outside.x<11.82);assert.ok(houseWalkable(outside));
});
test('the integrated route detours around another person with body clearance',()=>{
  const from={x:5,z:6.8},to={x:9,z:6.8},people=[{x:7,z:6.8}];
  const path=houseRoute(from,to,people);assert.ok(path.length);assert.deepEqual(path.at(-1),to);
  for(const p of path)assert.ok(Math.hypot(p.x-people[0].x,p.z-people[0].z)>=.52);
});
