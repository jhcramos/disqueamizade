import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {emptyNetwork,exchangeNetwork} from '../server/houseNetwork.ts';
import {parseWirePose,packPose,unpackPose,POSE_TTL} from '../src/garage3d/motion/wire.ts';
const A=randomUUID(),B=randomUUID(),MAIN='disque-house-3d-v1',MOTION='disque-avatar-motion-v1:garage';
const pose=[-1,-1,1,1,.1];
let stamp=0;const packet=(data,channel=MOTION)=>({id:randomUUID(),channel,data:data.type==='pose'?{captured:++stamp,...data}:data});
const person=(id,room='garage',busy=false)=>packet({event:'person',data:{id,name:'Teste',avatar:0,position:{x:.5,y:.85},room,busy}},MAIN);
const body=(id,messages=[],room='garage')=>({id,cursor:0,messages,channels:[MAIN,`disque-avatar-motion-v1:${room}`]});
test('wire accepts only finite bounded angles, never raw camera data',()=>{
 assert.deepEqual(packPose(unpackPose(pose)),pose);
 for(const value of [[1,2,3],[-99,0,0,0,0],[NaN,0,0,0,0],{image:'pixels'},[0,0,0,Infinity,0],[0,0,0,0,.9]])assert.equal(parseWirePose(value),null);
});
test('motion reaches peers in the room, binds sender, expires, clears and cannot revive old samples',()=>{
 const s=emptyNetwork();exchangeNetwork(s,'a',body(A,[person(A)]),10000);exchangeNetwork(s,'b',body(B,[person(B)]),10000);
 const p=packet({type:'pose',from:B,pose,captured:1});
 exchangeNetwork(s,'a',body(A,[p]),11000);
 const receive=exchangeNetwork(s,'b',body(B),11500);assert.deepEqual(receive.motions[0],{id:A,pose,age:500,room:'garage'});
 assert.equal(s.packets.some(m=>m.id===p.id),false,'samples are ephemeral snapshots, not chat history');
 exchangeNetwork(s,'a',body(A,[person(A)]),11600);
 exchangeNetwork(s,'a',body(A,[p]),12000);assert.equal(exchangeNetwork(s,'b',body(B),12500).motions[0].age,1500,'a retry must not refresh an old capture');
 assert.deepEqual(exchangeNetwork(s,'b',body(B),11000+POSE_TTL+1).motions,[]);
 exchangeNetwork(s,'a',body(A,[packet({type:'pose',pose})]),16000);
 exchangeNetwork(s,'a',body(A,[packet({type:'pose',pose:null})]),17000);assert.deepEqual(exchangeNetwork(s,'b',body(B),17500).motions,[]);
 exchangeNetwork(s,'a',body(A,[packet({type:'pose',pose})]),18000);
 assert.deepEqual(exchangeNetwork(s,'b',body(B,[person(B,'living')],'living'),19000).motions,[]);
 exchangeNetwork(s,'a',body(A,[person(A,'garage',true)]),20000);
 assert.deepEqual(exchangeNetwork(s,'b',body(B,[person(B)]),21000).motions,[]);
});
