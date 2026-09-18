import test from 'node:test';
import assert from 'node:assert/strict';
import {seatsFor,phones,walkable,route,obstaclesFor,approachSeat,seatedOrigin} from '../src/garage3d/layout.ts';
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
