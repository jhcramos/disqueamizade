import test from 'node:test';
import assert from 'node:assert/strict';
import {seatsFor,phones,walkable,route,obstaclesFor,approachSeat,seatedOrigin,houseRoute,houseWalkable,worldPoint,roomIds} from '../src/garage3d/layout.ts';
test('3D furniture blocks walking while all seats have reachable approaches',()=>{
  assert.equal(phones.length,4);
  for(const [room,count] of [['garage',8],['living',8],['bar',15]]){
    assert.equal(seatsFor(room).length,count);
    for(const o of obstaclesFor(room))assert.equal(walkable(o,room),false);
    for(const s of seatsFor(room)){
      const target=approachSeat(s);
      const path=route({x:0,z:2.8},target,room);assert.ok(path.length,s.name);
      assert.deepEqual(path.at(-1),target);for(const p of path)assert.ok(walkable(p,room));
    }
  }
});
test('seat height accounts for the avatar hip and cushion clearance at different scales',()=>{
  for(const hip of [.42,.54,.7])for(const room of ['garage','living','bar'])for(const s of seatsFor(room)){
    assert.ok(seatedOrigin(s.height,hip)+hip>s.height+.07);
  }
});
test('walking remains within the garage and rejects furniture targets',()=>{
  for(const to of [{x:9,z:0},{x:0,z:-4},{x:-.55,z:1.2},{x:NaN,z:0}])assert.deepEqual(route({x:0,z:2.8},to),[]);
});
test('the connected house reaches all 31 seats through real doorways',()=>{
  let origin={x:-5,z:2.8};
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
test('house walls and the empty courtyard remain blocked',()=>{
  for(const p of [{x:3,z:-8},{x:-8,z:-4},{x:0,z:0},{x:10,z:0},{x:-5,z:-12},{x:NaN,z:0}]){
    assert.equal(houseWalkable(p),false);assert.deepEqual(houseRoute({x:-5,z:2.8},p),[]);
  }
  assert.ok(houseWalkable({x:-5,z:-4}));assert.ok(houseWalkable({x:0,z:2.8}));
});
