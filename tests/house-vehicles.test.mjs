import test from 'node:test';import assert from 'node:assert/strict';
import {createVehicles,vehicleCommand,tickVehicles,driveVehicle,roadPoint,CHECKPOINTS} from '../src/garage3d/vehicles/model.ts';
const visitor=(id='a')=>({id,name:id,x:-8,z:-43});
test('one driver and one passenger; passenger cannot drive; seats cannot be stolen',()=>{
 const s=createVehicles(1000);assert.equal(vehicleCommand(s,visitor(),'drive','orange',1000),'Pronto.');
 assert.match(vehicleCommand(s,visitor('b'),'drive','orange',1000),/ocupado/);
 assert.equal(vehicleCommand(s,visitor('b'),'ride','orange',1000),'Pronto.');assert.match(vehicleCommand(s,visitor('c'),'ride','orange',1000),/ocupado/);
 vehicleCommand(s,visitor('b'),'input','orange',1100,{throttle:1,steer:1});assert.equal(s.cars[0].input.throttle,0);
 vehicleCommand(s,visitor(),'input','orange',1100,{throttle:1,steer:0});assert.equal(s.cars[0].input.throttle,1);
});
test('entry requires being close and outside another car',()=>{
 const s=createVehicles(1000);assert.match(vehicleCommand(s,{...visitor(),x:40},'drive','orange',1000),/perto/);
 vehicleCommand(s,visitor(),'drive','orange',1000);assert.match(vehicleCommand(s,{...visitor(),x:-3},'drive','blue',1000),/saia/i);
});
test('driver departure stops car and preserves passenger until they leave',()=>{
 const s=createVehicles(1000);vehicleCommand(s,visitor(),'drive','orange',1000);vehicleCommand(s,visitor('b'),'ride','orange',1000);
 s.cars[0].speed=4;vehicleCommand(s,visitor(),'leave','orange',1100);assert.equal(s.cars[0].speed,0);assert.equal(s.cars[0].driver,null);assert.equal(s.cars[0].passenger.id,'b');
 vehicleCommand(s,visitor('b'),'leave','orange',1200);assert.equal(s.cars[0].passenger,null);
});
test('stale input stops and disconnected occupants are released',()=>{
 const s=createVehicles(1000);vehicleCommand(s,visitor(),'drive','orange',1000);vehicleCommand(s,visitor(),'input','orange',1000,{throttle:1,steer:0});
 tickVehicles(s,3000,new Set(['a']));assert.equal(s.cars[0].speed,0);tickVehicles(s,25000,new Set());assert.equal(s.cars[0].driver,null);
});
test('driving stays on exterior roads and does not cross buildings',()=>{
 assert.equal(roadPoint({x:0,z:0}),false);const c=createVehicles(0).cars[0];c.yaw=0;c.input={throttle:1,steer:0,at:0};for(let i=0;i<100;i++)driveVehicle(c,.05,[]);assert.ok(roadPoint(c));assert.ok(c.z<-40);
});
test('race needs two drivers, countdown locks movement, checkpoints must be ordered',()=>{
 const s=createVehicles(1000);vehicleCommand(s,visitor(),'drive','orange',1000);assert.match(vehicleCommand(s,visitor(),'start','orange',1000),/dois/);
 vehicleCommand(s,{...visitor('b'),x:-3},'drive','blue',1000);vehicleCommand(s,visitor(),'ready','orange',1000);vehicleCommand(s,visitor('b'),'ready','blue',1000);
 assert.equal(vehicleCommand(s,visitor(),'start','orange',1000),'Pronto.');assert.equal(s.race.starts,4000);
 tickVehicles(s,2000,new Set(['a','b']));assert.equal(s.cars[0].speed,0);
 const c=s.cars[0];Object.assign(c,CHECKPOINTS[2]);tickVehicles(s,4100,new Set(['a','b']));assert.equal(s.race.entries[0].next,0);
 for(let i=0;i<CHECKPOINTS.length;i++){Object.assign(c,CHECKPOINTS[i]);tickVehicles(s,4200+i*100,new Set(['a','b']));}
 assert.ok(s.race.entries[0].finished);assert.equal(s.race.entries[1].finished,undefined);
});
test('car collision and pedestrians stop the vehicle',()=>{
 const c=createVehicles(0).cars[0];c.input={throttle:1,steer:0,at:0};const initial=c.x;
 for(let i=0;i<100;i++)driveVehicle(c,.05,[{x:initial-3,z:c.z}]);assert.ok(c.x>initial-.6);
 const d=createVehicles(0).cars[0];d.input={throttle:1,steer:0,at:0};for(let i=0;i<100;i++)driveVehicle(d,.05,[],[{x:initial-2,z:d.z}]);assert.ok(d.x>initial-.7);
});
