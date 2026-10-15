import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {emptyNetwork,exchangeNetwork} from '../server/houseNetwork.ts';import {toShared} from '../src/garage3d/coordinates.ts';
const MAIN='disque-house-3d-v1',VEHICLES='disque-vehicles-v1';
const packet=(channel,data)=>({id:randomUUID(),channel,data});
const person=id=>packet(MAIN,{event:'person',data:{id,name:'Teste',avatar:0,position:toShared({x:-8,z:-39.2},'garage'),room:'garage',busy:false}});
const cmd=(action,input)=>packet(VEHICLES,{type:'command',action,car:'orange',input});
const body=(id,messages=[])=>({id,messages,channels:[MAIN,VEHICLES]});
test('independent authenticated sessions share driver/passenger and cannot steer each others vehicle',()=>{
 const s=emptyNetwork(),a=randomUUID(),b=randomUUID();exchangeNetwork(s,'session-a',body(a,[person(a),cmd('drive')]),1000);
 const result=exchangeNetwork(s,'session-b',body(b,[person(b),cmd('ride')]),1000);
 assert.equal(result.vehicles.cars[0].driver.id,a);assert.equal(result.vehicles.cars[0].passenger.id,b);
 exchangeNetwork(s,'session-b',body(b,[cmd('input',{throttle:1,steer:1})]),1500);assert.equal(s.vehicles.cars[0].input.throttle,0);
 exchangeNetwork(s,'session-a',body(a,[cmd('input',{throttle:1,steer:0})]),1500);
 const fresh=exchangeNetwork(s,'session-b',body(b),1900);assert.ok(fresh.vehicles.cars[0].x<-8);assert.equal(fresh.roster[0].room,'garage');
 assert.throws(()=>exchangeNetwork(s,'session-b',body(a,[cmd('leave')]),2200),/identity/);
 const exit=cmd('leave');exchangeNetwork(s,'session-a',body(a,[exit]),2200);exchangeNetwork(s,'session-a',body(a,[exit]),2600);assert.equal(s.vehicles.cars[0].driver,null);assert.equal(s.vehicles.cars[0].passenger.id,b);
});
