import test from 'node:test';import assert from 'node:assert/strict';
import {createCameraGestures} from '../src/garage3d/cameraGestures.ts';
import {createHostProximity} from '../src/garage3d/residents/proximity.ts';
test('tap, drag, cancellation and release after a pinch have distinct meanings',()=>{
 const g=createCameraGestures();g.down(1,{x:10,y:10});assert.equal(g.move(1,{x:12,y:12}),null);assert.equal(g.up(1,{x:12,y:12}),true);
 g.down(1,{x:10,y:10});assert.ok(g.move(1,{x:30,y:20}));assert.equal(g.up(1,{x:30,y:20}),false);
 g.down(1,{x:0,y:0});g.down(2,{x:100,y:0});const zoom=g.move(2,{x:150,y:0});assert.equal(zoom.ratio,1.5);assert.equal(g.up(2,{x:150,y:0}),false);g.move(1,{x:5,y:0});assert.equal(g.up(1,{x:5,y:0}),false);assert.equal(g.count,0);
 g.down(1,{x:0,y:0});g.cancel();assert.equal(g.up(1,{x:0,y:0}),false);assert.equal(g.count,0);
});
test('host greeting requires dwell, uses hysteresis and respects space, room and dismissal',()=>{
 const p=createHostProximity(),me={x:-5,z:2},dora={id:'dora',position:{x:-4,z:2}},teo={id:'teo',position:{x:8,z:2}};
 assert.equal(p.update(me,[dora,teo],0),null);assert.equal(p.update(me,[dora,teo],450),'dora');
 dora.position.x=-2.9;assert.equal(p.update(me,[dora,teo],600),'dora','small boundary movement does not flash prompt');
 dora.position.x=-1;assert.equal(p.update(me,[dora,teo],650),'dora','Give a stationary visitor time to read even if the host takes a few steps');p.dismiss(600);assert.equal(p.update(me,[dora],700),null);dora.position.x=-4;assert.equal(p.update(me,[dora],1000),null);
 assert.equal(p.update(me,[dora],46000),null);assert.equal(p.update(me,[dora],46500),'dora');assert.equal(p.update(me,[dora],46600,false),null);
 const wall=createHostProximity();assert.equal(wall.update({x:-.2,z:2},[{id:'dora',position:{x:.2,z:2}}],0),null);assert.equal(wall.update({x:-.2,z:2},[{id:'dora',position:{x:.2,z:2}}],500),null,'no greeting through a room boundary');
});
