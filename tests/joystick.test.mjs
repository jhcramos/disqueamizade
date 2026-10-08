import test from 'node:test';
import assert from 'node:assert/strict';
import {createJoystick, walkVector} from '../src/garage3d/joystick.ts';
test('dead zone and range limit keep tiny touches still and diagonals at walking speed',()=>{
 const j=createJoystick();j.start(1,0,0);assert.deepEqual(j.move(1,2,2),{x:0,y:0});
 const v=j.move(1,100,-100);assert.ok(Math.abs(Math.hypot(v.x,v.y)-1)<1e-9);
});
test('looking with another finger cannot take over or release movement',()=>{
 const j=createJoystick();j.start(1,0,0);j.move(1,0,-40);assert.equal(j.start(2,100,100),false);j.move(2,20,30);j.end(2);assert.ok(j.value().y<0);j.end(1);assert.deepEqual(j.value(),{x:0,y:0});
});
test('cancel stops movement and ignores stale pointer events',()=>{
 const j=createJoystick();j.start(7,0,0);j.move(7,40,0);j.cancel();j.move(7,40,0);assert.deepEqual(j.value(),{x:0,y:0});
});
test('forward follows gaze while right strafes without changing gaze',()=>{
 assert.deepEqual(walkVector(0,{x:0,y:-1}),{x:0,z:1});
 assert.ok(Math.abs(walkVector(Math.PI/2,{x:0,y:-1}).x-1)<1e-9);
 assert.deepEqual(walkVector(0,{x:1,y:0}),{x:-1,z:0});
 assert.ok(Math.hypot(...Object.values(walkVector(0,{x:1,y:-1})))<=1.000001);
});
