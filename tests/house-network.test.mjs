import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {emptyNetwork,exchangeNetwork} from '../server/houseNetwork.ts';
const MAIN='disque-house-3d-v1',A=randomUUID(),B=randomUUID(),C=randomUUID();
const body=(id,messages=[],cursor=0)=>({id,cursor,channels:[MAIN,'disque-room-chat-v1:garage','disque-social-v1:garage'],messages});
const packet=(data,channel=MAIN)=>({id:randomUUID(),channel,data});
const person=id=>packet({event:'person',from:'forged',data:{id,name:id===A?'Ana':'Visitante',avatar:0,position:{x:.5,y:.85},room:'garage',busy:false}});
test('separate sessions see avatars; private messages never reach a third visitor',()=>{
 const s=emptyNetwork();exchangeNetwork(s,'owner-a',body(A,[person(A)]),10000);const b=exchangeNetwork(s,'owner-b',body(B,[person(B)]),10000);assert.equal(b.roster[0].id,A);
 exchangeNetwork(s,'owner-c',body(C,[person(C)]),10000);
 const direct=packet({type:'invite',from:'forged',to:B,id:'invite'},'disque-social-v1:garage');exchangeNetwork(s,'owner-a',body(A,[direct]),11000);
 const reply=exchangeNetwork(s,'owner-b',body(B,[],b.cursor),11000);assert.ok(reply.packets.some(p=>p.id===direct.id&&p.data.from===A));
 const third=exchangeNetwork(s,'owner-c',body(C),11000);assert.ok(!third.packets.some(p=>p.id===direct.id));assert.ok(!JSON.stringify(third).includes('owner-a'));
 assert.throws(()=>exchangeNetwork(s,'intruder',body(A,[person(A)]),12000),/identity/);
});
test('retries deduplicate, movements replace presence and expired visitors disappear',()=>{
 const s=emptyNetwork(),p=person(A);exchangeNetwork(s,'owner-a',body(A,[p]),10000);exchangeNetwork(s,'owner-a',body(A,[p]),11000);assert.equal(s.packets.length,1);
 const move=person(A);move.data.data.position.x=.6;exchangeNetwork(s,'owner-a',body(A,[move]),12000);const result=exchangeNetwork(s,'owner-b',body(B,[person(B)]),12000);assert.equal(result.roster[0].position.x,.6);
 assert.equal(exchangeNetwork(s,'owner-b',body(B),110000).roster.length,0);
});
test('private group signaling needs a recipient and rejects forged from',()=>{
 const s=emptyNetwork();exchangeNetwork(s,'owner-a',body(A,[person(A)]),10000);exchangeNetwork(s,'owner-b',body(B,[person(B)]),10000);
 const leak=packet({event:'offer',data:{sdp:'private'}});exchangeNetwork(s,'owner-a',body(A,[leak]),11000);assert.ok(!s.packets.some(p=>p.id===leak.id));
});
test('leaving removes presence and a late in-flight update cannot resurrect it',()=>{
 const s=emptyNetwork();exchangeNetwork(s,'owner-a',body(A,[person(A)]),10000);
 exchangeNetwork(s,'owner-a',{...body(A),depart:true},11000);
 assert.throws(()=>exchangeNetwork(s,'owner-a',body(A,[person(A)]),12000),/departed/);
 assert.equal(exchangeNetwork(s,'owner-b',body(B,[person(B)]),12000).roster.length,0);
});
