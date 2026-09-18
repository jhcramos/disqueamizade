import test from 'node:test';
import assert from 'node:assert/strict';
import {seats,phones,walkable,route,obstacles} from '../src/garage3d/layout.ts';
test('3D furniture blocks walking while all seats have reachable approaches',()=>{
  assert.equal(phones.length,4);
  for(const o of obstacles)assert.equal(walkable(o),false);
  for(const s of seats){
    const target={x:s.x+Math.sin(s.angle)*.95,z:s.z};
    const path=route({x:0,z:2.8},target);assert.ok(path.length,s.name);
    assert.deepEqual(path.at(-1),target);for(const p of path)assert.ok(walkable(p));
  }
});
test('walking remains within the garage and rejects furniture targets',()=>{
  for(const to of [{x:9,z:0},{x:0,z:-4},{x:-.55,z:1.2},{x:NaN,z:0}])assert.deepEqual(route({x:0,z:2.8},to),[]);
});
